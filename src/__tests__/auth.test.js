import { jest } from '@jest/globals';

jest.mock('../models/user.models.js', () => ({
	User: {
		findOne: jest.fn(),
		create: jest.fn(),
		findById: jest.fn(),
		findByIdAndUpdate: jest.fn(),
	},
}));

jest.mock('../models/tenant.models.js', () => ({
	Tenant: {
		create: jest.fn(),
		findOne: jest.fn(),
	},
}));

jest.mock('../utils/mail.js', () => ({
	sendEmail: jest.fn(),
	emailVerificationMailGenContent: jest.fn(() => ({ body: 'verify-mail' })),
	loginVerificationMailGenContent: jest.fn(() => ({ body: 'login-mail' })),
	forgotPasswordMailGenContent: jest.fn(() => ({ body: 'forgot-mail' })),
}));

jest.mock('../config/index.js', () => ({
	config: {
		REFRESH_TOKEN_SECRET: 'refresh-secret',
		RESET_PASSWORD_REDIRECT_URL: 'https://app/reset-password',
	},
}));

jest.mock('jsonwebtoken', () => ({
	verify: jest.fn(),
}));

jest.mock('../utils/logger.js', () => ({
	logger: {
		error: jest.fn(),
	},
}));

import { describe, beforeEach, it, expect } from '@jest/globals';
import { authService } from '../services/auth.service.js';
import { User } from '../models/user.models.js';
import { Tenant } from '../models/tenant.models.js';
import { sendEmail } from '../utils/mail.js';
import jwt from 'jsonwebtoken';
import { UserRolesEnum } from '../constants/user.constants.js';

describe('authService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('registerUser', () => {
		it('creates a tenant user and tenant profile when role is tenant', async () => {
			const createdUserDocument = {
				_id: 'u1',
				email: 'test@example.com',
				username: 'tenantUser',
				role: UserRolesEnum.TENANT,
				generateTemporaryToken: jest.fn(() => ({
					unHashedToken: 'plain-token',
					hashedToken: 'hashed-token',
					tokenExpiry: Date.now() + 1000,
				})),
				save: jest.fn().mockResolvedValue(),
			};

			const selectedUser = { _id: 'u1', email: 'test@example.com' };
			const tenant = { _id: 't1', userId: 'u1' };

			User.findOne.mockResolvedValue(null);
			User.create.mockResolvedValue(createdUserDocument);
			User.findById.mockReturnValue({
				select: jest.fn().mockResolvedValue(selectedUser),
			});
			Tenant.create.mockResolvedValue(tenant);

			const result = await authService.registerUser({
				username: 'tenantUser',
				email: 'test@example.com',
				password: 'StrongPass#123',
				role: UserRolesEnum.TENANT,
				protocol: 'http',
				host: 'localhost:4000',
			});

			expect(User.create).toHaveBeenCalled();
			expect(Tenant.create).toHaveBeenCalledWith({ userId: 'u1' });
			expect(sendEmail).toHaveBeenCalled();
			expect(result).toEqual({ createdUser: selectedUser, tenant });
		});

		it('throws when user already exists', async () => {
			User.findOne.mockResolvedValue({ _id: 'existing-user' });

			await expect(
				authService.registerUser({
					username: 'tenantUser',
					email: 'test@example.com',
					password: 'StrongPass#123',
					role: UserRolesEnum.TENANT,
					protocol: 'http',
					host: 'localhost:4000',
				}),
			).rejects.toMatchObject({ statusCode: 409 });

			expect(User.create).not.toHaveBeenCalled();
		});
	});

	describe('login', () => {
		it('returns tokens, user and tenant details on successful login', async () => {
			const user = {
				_id: 'u1',
				email: 'test@example.com',
				username: 'tenantUser',
				comparePassword: jest.fn().mockResolvedValue(true),
			};
			const tokenGeneratorUser = {
				_id: 'u1',
				generateAccessToken: jest.fn(() => 'access-token'),
				generateRefreshToken: jest.fn(() => 'refresh-token'),
				save: jest.fn().mockResolvedValue(),
			};

			const loggedInUser = { _id: 'u1', role: UserRolesEnum.TENANT };
			const tenant = { _id: 't1', userId: 'u1' };

			User.findOne.mockResolvedValue(user);
			User.findById
				.mockResolvedValueOnce(tokenGeneratorUser)
				.mockReturnValueOnce({
					select: jest.fn().mockResolvedValue(loggedInUser),
				});
			Tenant.findOne.mockResolvedValue(tenant);

			const result = await authService.login({
				email: 'test@example.com',
				password: 'StrongPass#123',
				protocol: 'http',
				host: 'localhost:4000',
			});

			expect(result).toMatchObject({
				accessToken: 'access-token',
				refreshToken: 'refresh-token',
				loggedInUser,
				tenant,
			});
			expect(sendEmail).toHaveBeenCalled();
		});

		it('throws when password is invalid', async () => {
			User.findOne.mockResolvedValue({
				comparePassword: jest.fn().mockResolvedValue(false),
			});

			await expect(
				authService.login({
					email: 'test@example.com',
					password: 'wrong-password',
					protocol: 'http',
					host: 'localhost:4000',
				}),
			).rejects.toMatchObject({ statusCode: 400 });
		});
	});

	describe('logoutUser', () => {
		it('clears refresh token in persistence layer', async () => {
			User.findByIdAndUpdate.mockResolvedValue({ _id: 'u1' });

			const result = await authService.logoutUser({ userId: 'u1' });

			expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
				'u1',
				{ $set: { refreshToken: '' } },
				{ new: true },
			);
			expect(result).toHaveProperty('cookieOptions');
		});

		it('still returns cookie options even when update returns null', async () => {
			User.findByIdAndUpdate.mockResolvedValue(null);

			const result = await authService.logoutUser({ userId: 'missing' });

			expect(result).toHaveProperty('cookieOptions');
		});
	});

	describe('verifyEmail', () => {
		it('marks user email as verified for a valid token', async () => {
			const user = {
				save: jest.fn().mockResolvedValue(),
			};
			User.findOne.mockResolvedValue(user);

			const result = await authService.verifyEmail({
				verificationToken: 'plain-token',
			});

			expect(user.isEmailVerified).toBe(true);
			expect(user.save).toHaveBeenCalledWith({ validateBeforeSave: false });
			expect(result).toEqual({ isEmailVerified: true });
		});

		it('throws when verification token is missing', async () => {
			await expect(
				authService.verifyEmail({ verificationToken: '' }),
			).rejects.toMatchObject({ statusCode: 400 });
		});
	});

	describe('resendEmailVerification', () => {
		it('regenerates verification token and sends verification email', async () => {
			const user = {
				_id: 'u1',
				email: 'test@example.com',
				username: 'tenantUser',
				isEmailVerified: false,
				generateTemporaryToken: jest.fn(() => ({
					unHashedToken: 'plain-token',
					hashedToken: 'hashed-token',
					tokenExpiry: Date.now() + 1000,
				})),
				save: jest.fn().mockResolvedValue(),
			};

			User.findById.mockResolvedValue(user);

			await authService.resendEmailVerification({
				userId: 'u1',
				protocol: 'http',
				host: 'localhost:4000',
			});

			expect(user.save).toHaveBeenCalledWith({ validateBeforeSave: false });
			expect(sendEmail).toHaveBeenCalled();
		});

		it('throws when email is already verified', async () => {
			User.findById.mockResolvedValue({
				_id: 'u1',
				isEmailVerified: true,
			});

			await expect(
				authService.resendEmailVerification({
					userId: 'u1',
					protocol: 'http',
					host: 'localhost:4000',
				}),
			).rejects.toMatchObject({ statusCode: 400 });
		});
	});

	describe('refreshAccessToken', () => {
		it('returns a new access token and refresh token for valid refresh token', async () => {
			const persistedUser = {
				_id: 'u1',
				refreshToken: 'incoming-refresh-token',
				save: jest.fn().mockResolvedValue(),
			};
			const tokenGeneratorUser = {
				_id: 'u1',
				generateAccessToken: jest.fn(() => 'new-access-token'),
				generateRefreshToken: jest.fn(() => 'new-refresh-token'),
				save: jest.fn().mockResolvedValue(),
			};

			jwt.verify.mockReturnValue({ _id: 'u1' });
			User.findById
				.mockResolvedValueOnce(persistedUser)
				.mockResolvedValueOnce(tokenGeneratorUser);

			const result = await authService.refreshAccessToken({
				incomingRefreshToken: 'incoming-refresh-token',
			});

			expect(result).toMatchObject({
				accessToken: 'new-access-token',
				newRefreshToken: 'new-refresh-token',
			});
			expect(persistedUser.save).toHaveBeenCalled();
		});

		it('throws when refresh token is not provided', async () => {
			await expect(
				authService.refreshAccessToken({ incomingRefreshToken: '' }),
			).rejects.toMatchObject({ statusCode: 401 });
		});
	});

	describe('forgotPasswordRequest', () => {
		it('stores reset token and sends forgot password email', async () => {
			const user = {
				email: 'test@example.com',
				username: 'tenantUser',
				generateTemporaryToken: jest.fn(() => ({
					unHashedToken: 'plain-token',
					hashedToken: 'hashed-token',
					tokenExpiry: Date.now() + 1000,
				})),
				save: jest.fn().mockResolvedValue(),
			};

			User.findOne.mockResolvedValue(user);

			await authService.forgotPasswordRequest({ email: 'test@example.com' });

			expect(user.save).toHaveBeenCalledWith({ validateBeforeSave: false });
			expect(sendEmail).toHaveBeenCalled();
		});

		it('throws when email does not match any user', async () => {
			User.findOne.mockResolvedValue(null);

			await expect(
				authService.forgotPasswordRequest({ email: 'missing@example.com' }),
			).rejects.toMatchObject({ statusCode: 404 });
		});
	});

	describe('resetPassword', () => {
		it('resets password and clears token fields when token is valid', async () => {
			const user = {
				save: jest.fn().mockResolvedValue(),
			};
			User.findOne.mockResolvedValue(user);

			await authService.resetPassword({
				resetToken: 'plain-token',
				newPassword: 'NewStrongPass#123',
			});

			expect(user.password).toBe('NewStrongPass#123');
			expect(user.refreshToken).toBe('');
			expect(user.save).toHaveBeenCalledWith({ validateBeforeSave: false });
		});

		it('throws when reset token is invalid or expired', async () => {
			User.findOne.mockResolvedValue(null);

			await expect(
				authService.resetPassword({
					resetToken: 'invalid-token',
					newPassword: 'NewStrongPass#123',
				}),
			).rejects.toMatchObject({ statusCode: 489 });
		});
	});

	describe('changeCurrentPassword', () => {
		it('updates user password when old password matches', async () => {
			const user = {
				comparePassword: jest.fn().mockResolvedValue(true),
				save: jest.fn().mockResolvedValue(),
			};
			User.findById.mockResolvedValue(user);

			await authService.changeCurrentPassword({
				userId: 'u1',
				oldPassword: 'OldPass#123',
				newPassword: 'NewPass#123',
			});

			expect(user.password).toBe('NewPass#123');
			expect(user.save).toHaveBeenCalledWith({ validateBeforeSave: false });
		});

		it('throws when old password does not match', async () => {
			User.findById.mockResolvedValue({
				comparePassword: jest.fn().mockResolvedValue(false),
			});

			await expect(
				authService.changeCurrentPassword({
					userId: 'u1',
					oldPassword: 'WrongOldPass#123',
					newPassword: 'NewPass#123',
				}),
			).rejects.toMatchObject({ statusCode: 400 });
		});
	});
});