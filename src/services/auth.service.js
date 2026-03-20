import { User } from '../models/user.models.js';
import { ApiError } from '../utils/api-error.js';
import {
    sendEmail,
    emailVerificationMailGenContent,
    loginVerificationMailGenContent,
    forgotPasswordMailGenContent,
} from '../utils/mail.js';
import { config } from '../config/index.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { UserRolesEnum, AvailableUserRoles } from '../constants/user.constants.js';
import { Tenant } from '../models/tenant.models.js';
import { logger } from '../utils/logger.js';

const USER_SAFE_FIELDS =
    '-password -refreshToken -emailVerificationToken -emailVerificationExpiry';


const registerUser = async ({ username, email, password, role, protocol, host }) => {
    const normalizedRole = validateRole(role);

    const existingUser = await User.findOne({
        $or: [{ email }, { username }],
    });

    // if user already exists, throw error
    if (existingUser) {
        logger.error(`User with email or username already exists, provided email: ${email}, provided username: ${username}`);
        throw new ApiError(409, 'User with email or username already exists');
    }

    // if user does not exist, create new user
    const user = await User.create({
        email,
        password,
        username,
        role: normalizedRole,
        isEmailVerified: false,
    });

    let tenant = null;
    // if user is tenant, create tenant record
    if (user.role === UserRolesEnum.TENANT) {
        tenant = await Tenant.create({ userId: user._id });
    }

    const { unHashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user.email,
        subject: 'Please verify your email',
        mailgenContent: emailVerificationMailGenContent(
            user.username,
            `${protocol}://${host}/api/v1/auth/verify-email/${unHashedToken}`,
        ),
    });

    const createdUser = await User.findById(user._id).select(USER_SAFE_FIELDS);
    if (!createdUser) {
        logger.error(`User created but failed to fetch user details, userId: ${user._id}`);
        throw new ApiError(500, 'User registration failed');
    }

    return { createdUser, tenant };
};

const login = async ({ email, password, protocol, host }) => {
    ensureEmailForLogin(email);

    const user = await User.findOne({ email });
    if (!user) {
        logger.error(`User not found with provided email for login, provided email: ${email}`);
        throw new ApiError(400, 'User does not exist');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        logger.error(`Invalid password provided for login, provided email: ${email}`);
        throw new ApiError(400, 'Invalid Password');
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id,
    );

    const loggedInUser = await User.findById(user._id).select(USER_SAFE_FIELDS);
    if (!loggedInUser) {
        logger.error(`User logged in but failed to fetch user details, userId: ${user._id}`);
        throw new ApiError(500, 'User registration failed');
    }

    let tenant = null;
    if (loggedInUser.role === UserRolesEnum.TENANT) {
        tenant = await Tenant.findOne({ userId: loggedInUser._id });
    }

    await sendEmail({
        email: user.email,
        subject: 'Login verification mail',
        mailgenContent: loginVerificationMailGenContent(
            user.username,
            `${protocol}://${host}/api/v1/auth/logout`,
        ),
    });

    return {
        accessToken,
        refreshToken,
        loggedInUser,
        tenant,
        cookieOptions: buildCookieOptions(),
    };
};

const logoutUser = async ({ userId }) => {
    await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                refreshToken: '',
            },
        },
        {
            new: true,
        },
    );

    return {
        cookieOptions: buildCookieOptions(),
    };
};

const verifyEmail = async ({ verificationToken }) => {
    if (!verificationToken) {
        logger.error(`Email verification token is missing for email verification`);
        throw new ApiError(400, 'Email verification token is missing');
    }

    const hashedToken = hashSha256Token(verificationToken);

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: { $gt: Date.now() },
    });

    if (!user) {
        logger.error(`Invalid or expired email verification token provided for email verification`);
        throw new ApiError(400, 'Token is invalid or expired');
    }

    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });

    return {
        isEmailVerified: true,
    };
};

const resendEmailVerification = async ({ userId, protocol, host }) => {
    const user = await User.findById(userId);
    if (!user) {
        logger.error(`User not found for resending email verification, userId: ${userId}`);
        throw new ApiError(404, 'User does not exist');
    }

    if (user.isEmailVerified) {
        logger.error(`Email is already verified for user, userId: ${userId}`);
        throw new ApiError(400, 'Email is already verified');
    }

    const { unHashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user.email,
        subject: 'Please verify your email',
        mailgenContent: emailVerificationMailGenContent(
            user.username,
            `${protocol}://${host}/api/v1/users/verify-email/${unHashedToken}`,
        ),
    });
};

const refreshAccessToken = async ({ incomingRefreshToken }) => {
    if (!incomingRefreshToken) {
        logger.error(`Refresh token is missing for refreshing access token`);
        throw new ApiError(401, 'Unautorized Access');
    }

    try {
        const decodedRefreshToken = jwt.verify(
            incomingRefreshToken,
            config.REFRESH_TOKEN_SECRET,
        );

        const user = await User.findById(decodedRefreshToken._id);
        if (!user) {
            logger.error(`User not found for provided refresh token during access token refresh`);
            throw new ApiError(401, 'Invalid refresh token');
        }

        if (user.refreshToken !== incomingRefreshToken) {
            logger.error(`Refresh token mismatch for user during access token refresh, userId: ${user._id}`);
            throw new ApiError(401, 'Refresh token expired');
        }

        const { accessToken, refreshToken: newRefreshToken } =
            await generateAccessAndRefreshTokens(user._id);

        user.refreshToken = newRefreshToken;
        await user.save();

        return {
            accessToken,
            newRefreshToken,
            cookieOptions: buildCookieOptions(),
        };
    } catch (error) {
        logger.error(`Error verifying refresh token during access token refresh, error: ${error}`);
        throw new ApiError(401, 'Invalid refresh token');
    }
};

const forgotPasswordRequest = async ({ email }) => {
    const user = await User.findOne({ email });
    if (!user) {
        logger.error(`User not found with provided email for forgot password request, provided email: ${email}`);
        throw new ApiError(404, 'User Not Found');
    }

    const { unHashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken();

    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordTokenExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    // access the link in email to get unhashed token and reset password
    await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        mailgenContent: forgotPasswordMailGenContent(
            user.username,
            `${config.RESET_PASSWORD_REDIRECT_URL}/${unHashedToken}`,
        ),
    });
};

const resetPassword = async ({ resetToken, newPassword }) => {
    const hashedToken = hashSha256Token(resetToken);

    const user = await User.findOne({
        forgotPasswordToken: hashedToken,
        forgotPasswordTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
        logger.error(`Invalid or expired token provided for password reset`);
        throw new ApiError(489, 'Token is invalid or expired');
    }

    user.forgotPasswordTokenExpiry = undefined;
    user.forgotPasswordToken = undefined;
    user.refreshToken = '';

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
};

const changeCurrentPassword = async ({ userId, oldPassword, newPassword }) => {
    const user = await User.findById(userId);
    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
        logger.error(`Invalid old password provided for changing current password, userId: ${userId}`);
        throw new ApiError(400, 'Invalid Old Password');
    }

    user.password = newPassword;
    user.save({ validateBeforeSave: false });
};


// helper functions
const validateRole = (role) => {
    if (!role) {
        logger.error(`User role is required for auth, provided role: ${role}`);
        throw new ApiError(400, 'User role is required');
    }

    const normalizedRole = role.toLowerCase();
    if (!AvailableUserRoles.includes(normalizedRole)) {
        logger.error(`Invalid user role provided for auth, provided role: ${role}`);
        throw new ApiError(400, 'Invalid user role');
    }

    return normalizedRole;
};

const ensureEmailForLogin = (email) => {
    if (!email) {
        logger.error(`Email is required for login, provided email: ${email}`);
        throw new ApiError(400, 'Email is required to login');
    }
};

const hashSha256Token = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

const buildCookieOptions = () => ({
    httpOnly: true,
    secure: true,
});

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        logger.error(`Error generating access and refresh tokens for userId: ${userId}, error: ${error}`);
        throw new ApiError(500, 'Failed to generate tokens');
    }
};

export const authService = {
    registerUser,
    login,
    logoutUser,
    verifyEmail,
    resendEmailVerification,
    refreshAccessToken,
    forgotPasswordRequest,
    resetPassword,
    changeCurrentPassword,
};
