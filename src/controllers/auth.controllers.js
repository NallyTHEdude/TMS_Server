import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { authService } from '../services/auth.service.js';

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, role } = req.body;

    const { createdUser, tenant } = await authService.registerUser({
        username,
        email,
        password,
        role,
        protocol: req.protocol,
        host: req.get('host'),
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            {
                user: createdUser,
                tenant: tenant,
            },
            'User registered successfully',
        ),
    );
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const { accessToken, refreshToken, loggedInUser, tenant, cookieOptions } =
        await authService.login({
            email,
            password,
            protocol: req.protocol,
            host: req.get('host'),
        });

    return res
        .status(200)
        .cookie('accessToken', accessToken, cookieOptions)
        .cookie('refreshToken', refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                    tenant: tenant,
                },
                'User logged in successfully',
            ),
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    const { cookieOptions } = await authService.logoutUser({
        userId: req.user._id,
    });

    return res
        .status(200)
        .clearCookie('accessToken', cookieOptions)
        .clearCookie('refreshToken', cookieOptions)
        .json(new ApiResponse(200, {}, 'User logged out successfully'));
});

const verifyEmail = asyncHandler(async (req, res) => {
    const result = await authService.verifyEmail({
        verificationToken: req.params.verificationToken,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                isEmailVerified: result.isEmailVerified,
            },
            'Email verified successfully',
        ),
    );
});

const resendEmailVerification = asyncHandler(async (req, res) => {
    await authService.resendEmailVerification({
        userId: req.user._id,
        protocol: req.protocol,
        host: req.get('host'),
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

    const { accessToken, newRefreshToken, cookieOptions } =
        await authService.refreshAccessToken({ incomingRefreshToken });

    return res
        .status(200)
        .cookie('accessToken', accessToken, cookieOptions)
        .cookie('refreshToken', newRefreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken: newRefreshToken },
                'Access token refreshed successfully',
            ),
        );
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
    const { email } = req.body;

    await authService.forgotPasswordRequest({ email });

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

    await authService.resetPassword({
        resetToken,
        newPassword,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Password reset successfully'));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    await authService.changeCurrentPassword({
        userId: req.user?._id,
        oldPassword,
        newPassword,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Password changed successfully'));
});

export {
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
