import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { userService } from '../services/user.service.js';

const getUserDetails = asyncHandler(async (req, res) => {
    const user = await userService.getUserDetails({ currentUser: req.user });

    res.status(200).json(
        new ApiResponse(200, { user }, 'User details fetched successfully'),
    );
});

const updateUserDetails = asyncHandler(async (req, res) => {
    const { username, fullName, email } = req.body;

    const user = await userService.updateUserDetails({
        currentUserId: req.user._id,
        currentEmail: req.user.email,
        currentUsername: req.user.username,
        currentRefreshToken: req.user.refreshToken,
        currentIsEmailVerified: req.user.isEmailVerified,
        fullName,
        username,
        email,
        protocol: req.protocol,
        host: req.get('host'),
    });

    res.status(200).json(
        new ApiResponse(200, { user }, 'User details updated successfully'),
    );
});

const deleteUserAccount = asyncHandler(async (req, res) => {
    await userService.deleteUserAccount({
        currentUserId: req.user._id,
        password: req.body.password,
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
    const user = await userService.updateUserAvatar({
        currentUserId: req.user._id,
        avatarLocalPath: req?.file?.path,
    });

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
