import { User } from '../models/user.models.js';
import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
    sendEmail,
    emailVerificationMailGenContent,
    loginVerificationMailGenContent,
    forgotPasswordMailGenContent,
} from '../utils/mail.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { AvailableUserRoles } from '../utils/constants.js';

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, 'Failed to generate tokens');
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, role } = req.body;

    if(!role){
        throw new ApiError(400, 'User role is required');
    }

    const normalizedRole = role.toLowerCase();

    if(!AvailableUserRoles.includes(normalizedRole)){
        throw new ApiError(400, 'Invalid user role');
    }


    const existingUser = await User.findOne({
        $or: [{ email }, { username }],
    });
    
    // if user already exists, throw error
    if (existingUser) {
        throw new ApiError(
            409,
            'User with email or username already exists',
        );
    }
    

    // if user does not exist, create new user
    const user = await User.create({
        email,
        password,
        username,
        role: normalizedRole,
        isEmailVerified: false,
    });

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
            `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${unHashedToken}`,
        ),
    });

    const createdUser = await User.findById(user._id).select(
        '-password -refreshToken -emailVerificationToken -emailVerificationExpiry',
    );
    if (!createdUser) {
        throw new ApiError(500, 'User registration failed');
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201, 
                { user: createdUser },
                'User registered successfully'
            )
        );
});

const login = asyncHandler(async (req, res) => {
    const { email, password, username } = req.body;
    if (!email) {
        throw new ApiError(400, 'Email is required to login');
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(400, 'User does not exist');
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        throw new ApiError(400, 'Invalid Password');
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id,
    );

    const loggedInUser = await User.findById(user._id).select(
        '-password -refreshToken -emailVerificationToken -emailVerificationExpiry',
    );
    if (!loggedInUser) {
        throw new ApiError(500, 'User registration failed');
    }

    const options = {
        httpOnly: true,
        secure: true,
    };

    await sendEmail({
        email: user.email,
        subject: 'Login verification mail',
        mailgenContent: loginVerificationMailGenContent(
            user.username,
            `${req.protocol}://${req.get('host')}/api/v1/auth/logout`,
        ),
    });

    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                'User logged in successfully',
            ),
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: '',
            },
        },
        {
            new: true,
        },
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(200, {}, 'User logged out successfully'));
});

const verifyEmail = asyncHandler(async (req, res) => {
    const { verificationToken } = req.params;
    if (!verificationToken) {
        throw new ApiError(400, 'Email verification token is missing');
    }

    let hashedToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(400, 'Token is invalid or expired');
    }

    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;

    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                isEmailVerified: true,
            },
            'Email verified successfully',
        ),
    );
});

const resendEmailVerification = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, 'User does not exist');
    }

    if (user.isEmailVerified) {
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
            `${req.protocol}://${req.get('host')}/api/v1/users/verify-email/${unHashedToken}`,
        ),
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                'Email verification link resent successfully',
            ),
        );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, 'Unautorized Access');
    }

    try {
        const decodedRefreshToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        );
        const user = await User.findById(decodedRefreshToken._id);
        if (!user) {
            throw new ApiError(401, 'Invalid refresh token');
        }

        if (user.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, 'Refresh token expired');
        }

        const options = {
            httpOnly: true,
            secure: true,
        };

        const { accessToken, refreshToken: newRefreshToken } =
            await generateAccessAndRefreshTokens(user._id);

        user.refreshToken = newRefreshToken;
        await user.save();

        return res
            .status(200)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    'Access token refreshed successfully',
                ),
            );
    } catch (error) {
        throw new ApiError(401, 'Invalid refresh token');
    }
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
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
            `${process.env.RESET_PASSWORD_REDIRECT_URL}/${unHashedToken}`,
        ),
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                'Password Reset mail has been sent on your mail id',
            ),
        );
});

const resetPassword = asyncHandler(async (req, res) => {
    const { resetToken } = req.params;
    const { newPassword } = req.body;

    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    const user = await User.findOne({
        forgotPasswordToken: hashedToken,
        forgotPasswordTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(489, 'Token is invalid or expired');
    }

    user.forgotPasswordTokenExpiry = undefined;
    user.forgotPasswordToken = undefined;
    user.refreshToken = ''

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    // await sendEmail({
    //     email: user.email,
    //     subject: 'Password Reset Request',
    //     mailgenContent: forgotPasswordMailGenContent(
    //         user.username,
    //         `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${resetToken}`,
    //     ),
    // });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Password reset successfully'));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);
    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
        throw new ApiError(400, 'Invalid Old Password');
    }
    user.password = newPassword;
    user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Password changed successfully'));
});

export {
    registerUser,
    login,
    logoutUser,
    getCurrentUser,
    verifyEmail,
    resendEmailVerification,
    refreshAccessToken,
    forgotPasswordRequest,
    resetPassword,
    changeCurrentPassword,
};
