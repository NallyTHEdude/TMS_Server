import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
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

const getUserDetails = asyncHandler(async (req, res) => {
    const user = req.user;
    if (!user) {
        throw new ApiError(404, 'user not found');
    }
    res.status(200).json(
        new ApiResponse(200, { user }, 'User details fetched successfully'),
    );
});

const updateUserDetails = asyncHandler(async (req, res) => {
    let { username, fullName, email } = req.body;
    if (!fullName?.trim()) {
        throw new ApiError(400, 'Full name is required');
    }
    if (!email?.trim()) {
        throw new ApiError(400, 'Email is required');
    }
    if (!username?.trim()) {
        throw new ApiError(400, 'Username is required');
    }

    username = username.toLowerCase();
    email = email.toLowerCase();

    const existingUser = await User.findOne({
        _id: { $ne: req.user._id },
        $or: [{ email: email.trim() }, { username: username.trim() }],
    });
    // if user with the same email or username already exists
    if (existingUser) {
        if (existingUser.email === email.trim()) {
            throw new ApiError(400, 'Email already exists');
        }
        if (existingUser.username.toLowerCase() === username.trim()) {
            throw new ApiError(
                400,
                'Username is taken, select another username',
            );
        }
    }

    // update isEmailVerified,emailVerificationToken and emmailVerificationExpiry if email is changed
    const emailChanged = email.trim() !== req.user.email;
    const updatedData = {
        $set: {
            username: username.trim(),
            fullName: fullName.trim(),
            email: email.trim(),
            isEmailVerified: emailChanged ? false : req.user.isEmailVerified,
        },
    };
    if (emailChanged) {
        updatedData.$unset = {
            emailVerificationToken: '',
            emailVerificationExpiry: '',
        };

        await sendEmail({
            email: req.user.email,
            subject: 'Email Change Notification',
            mailgenContent: emailChangedMailGenContent(
                req.user.username,
                `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${req.user.refreshToken}`,
                email.trim(),
            ),
        });
    }
    const user = await User.findByIdAndUpdate(req.user._id, updatedData, {
        new: true,
        runValidators: true,
    }).select(
        '-password -refreshToken -forgotPasswordToken -forgotPasswordTokenExpiry -emailVerificationToken -emailVerificationExpiry',
    );
    if (!user) {
        throw new ApiError(404, 'user not found');
    }

    res.status(200).json(
        new ApiResponse(200, { user }, 'User details updated successfully'),
    );
});

const deleteUserAccount = asyncHandler(async (req, res) => {
    const { password } = req.body;
    if (!password?.trim()) {
        throw new ApiError(400, 'Password is required to delete your account');
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
        throw new ApiError(404, 'User does not exist in database');
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid password');
    }

    const userEmail = user.email;
    const userName = user.username;

    await User.findByIdAndDelete(req.user._id);

    await sendEmail({
        email: userEmail,
        subject: 'Account Deletion Successful',
        mailgenContent: accountDeletionMailGenContent(userName),
    });

    // clear cookies
    const options = {
        httpOnly: true,
        secure: true,
    };

    res.status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(200, null, 'User account deleted successfully'));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req?.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar file is required');
    }

    const currentUser = await User.findById(req.user._id);

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar) {
        throw new ApiError(500, 'Something went wrong while uploading avatar');
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                'avatar.url': avatar.url, // Nested field update
                'avatar.localPath': avatar.public_id, // Nested field update
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
            console.log('Failed to delete old avatar:', err);
        }
    }

    res.status(200).json(
        new ApiResponse(200, { user }, 'User avatar updated successfully'),
    );
});

export {
    getUserDetails,
    updateUserDetails,
    deleteUserAccount,
    updateUserAvatar,
};
