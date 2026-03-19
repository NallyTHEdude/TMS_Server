import { ApiError } from '../utils/api-error.js';
import { logger } from '../utils/logger.js';
import {
    sendEmail,
    emailChangedMailGenContent,
    accountDeletionMailGenContent,
} from '../utils/mail.js';
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from '../utils/cloudinary.js';
import { User } from '../models/user.models.js';

const USER_SAFE_FIELDS =
    '-password -refreshToken -forgotPasswordToken -forgotPasswordTokenExpiry -emailVerificationToken -emailVerificationExpiry';


const getUserDetails = async ({ currentUser }) => {
    if (!currentUser) {
        logger.error(`User not found in getUserDetails service, provided currentUser: ${currentUser}`);
        throw new ApiError(404, 'user not found');
    }

    return currentUser;
};

const updateUserDetails = async ({
    currentUserId,
    currentEmail,
    currentUsername,
    currentRefreshToken,
    currentIsEmailVerified,
    fullName,
    username,
    email,
    protocol,
    host,
}) => {
    validateUserDetailsPayload({ fullName, username, email });

    const normalizedData = normalizeUserDetails({ fullName, username, email });

    await ensureUniqueUsernameAndEmail({
        currentUserId,
        username: normalizedData.username,
        email: normalizedData.email,
    });

    const { updatedData, emailChanged } = buildUpdatedUserData({
        currentEmail,
        currentIsEmailVerified,
        fullName: normalizedData.fullName,
        username: normalizedData.username,
        email: normalizedData.email,
    });

    if (emailChanged) {
        await sendEmailChangeNotification({
            currentEmail,
            currentUsername,
            currentRefreshToken,
            protocol,
            host,
            newEmail: normalizedData.email,
        });
    }

    const user = await User.findByIdAndUpdate(currentUserId, updatedData, {
        new: true,
        runValidators: true,
    }).select(USER_SAFE_FIELDS);

    if (!user) {
        logger.error(`User not found in updateUserDetails service, provided currentUserId: ${currentUserId}`);
        throw new ApiError(404, 'user not found');
    }

    return user;
};

const deleteUserAccount = async ({ currentUserId, password }) => {
    validateDeleteAccountPayload({ password });

    const user = await User.findById(currentUserId).select('+password');
    if (!user) {
        logger.error(`User not found in deleteUserAccount service, provided currentUserId: ${currentUserId}`);
        throw new ApiError(404, 'User does not exist in database');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        logger.error(`Invalid password provided for account deletion, userId: ${currentUserId}`);
        throw new ApiError(401, 'Invalid password');
    }

    const userEmail = user.email;
    const userName = user.username;

    await User.findByIdAndDelete(currentUserId);

    await sendEmail({
        email: userEmail,
        subject: 'Account Deletion Successful',
        mailgenContent: accountDeletionMailGenContent(userName),
    });
};

const updateUserAvatar = async ({ currentUserId, avatarLocalPath }) => {
    validateAvatarPath({ avatarLocalPath });

    const currentUser = await User.findById(currentUserId);

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar) {
        logger.error(`Failed to upload avatar to Cloudinary for userId: ${currentUserId}, avatarLocalPath: ${avatarLocalPath}`);
        throw new ApiError(500, 'Something went wrong while uploading avatar');
    }

    const user = await User.findByIdAndUpdate(
        currentUserId,
        {
            $set: {
                'avatar.url': avatar.url,
                'avatar.localPath': avatar.public_id,
            },
        },
        { new: true },
    ).select('-password -refreshToken');

    // Delete old avatar from Cloudinary (if exists and not default placeholder)
    if (
        currentUser.avatar?.localPath &&
        !currentUser.avatar.url.includes('placehold.co')
    ) {
        try {
            await deleteFromCloudinary(currentUser.avatar.localPath);
        } catch (err) {
            logger.error('Failed to delete old avatar ', err);
        }
    }

    return user;
};


// helper functions
const validateUserDetailsPayload = ({ fullName, username, email }) => {
    if (!fullName?.trim()) {
        logger.error(`Full name is required for updating user details, provided fullName: ${fullName}`);
        throw new ApiError(400, 'Full name is required');
    }
    if (!email?.trim()) {
        logger.error(`Email is required for updating user details, provided email: ${email}`);
        throw new ApiError(400, 'Email is required');
    }
    if (!username?.trim()) {
        logger.error(`Username is required for updating user details, provided username: ${username}`);
        throw new ApiError(400, 'Username is required');
    }
};

const normalizeUserDetails = ({ fullName, username, email }) => ({
    fullName: fullName.trim(),
    username: username.toLowerCase().trim(),
    email: email.toLowerCase().trim(),
});

const ensureUniqueUsernameAndEmail = async ({ currentUserId, username, email }) => {
    const existingUser = await User.findOne({
        _id: { $ne: currentUserId },
        $or: [{ email }, { username }],
    });

    // if user with the same email or username already exists
    if (existingUser) {
        if (existingUser.email === email) {
            logger.error(`Email already exists for another user, provided email: ${email}`);
            throw new ApiError(400, 'Email already exists');
        }
        if (existingUser.username.toLowerCase() === username) {
            logger.error(`Username already exists for another user, provided username: ${username}`);
            throw new ApiError(400, 'Username is taken, select another username');
        }
    }
};

const buildUpdatedUserData = ({
    currentEmail,
    currentIsEmailVerified,
    fullName,
    username,
    email,
}) => {
    // update isEmailVerified,emailVerificationToken and emmailVerificationExpiry if email is changed
    const emailChanged = email !== currentEmail;
    const updatedData = {
        $set: {
            username,
            fullName,
            email,
            isEmailVerified: emailChanged ? false : currentIsEmailVerified,
        },
    };

    if (emailChanged) {
        updatedData.$unset = {
            emailVerificationToken: '',
            emailVerificationExpiry: '',
        };
    }

    return { updatedData, emailChanged };
};

const sendEmailChangeNotification = async ({
    currentEmail,
    currentUsername,
    currentRefreshToken,
    protocol,
    host,
    newEmail,
}) => {
    await sendEmail({
        email: currentEmail,
        subject: 'Email Change Notification',
        mailgenContent: emailChangedMailGenContent(
            currentUsername,
            `${protocol}://${host}/api/v1/auth/reset-password/${currentRefreshToken}`,
            newEmail,
        ),
    });
};

const validateDeleteAccountPayload = ({ password }) => {
    if (!password?.trim()) {
        logger.error(`password empty for user account deletion`);
        throw new ApiError(400, 'Password is required to delete your account');
    }
};

const validateAvatarPath = ({ avatarLocalPath }) => {
    if (!avatarLocalPath) {
        logger.error(`Avatar file path is missing for user avatar update`);
        throw new ApiError(400, 'Avatar file is required');
    }
};

export const userService = {
    getUserDetails,
    updateUserDetails,
    deleteUserAccount,
    updateUserAvatar,
};