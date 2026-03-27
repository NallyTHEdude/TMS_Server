import { jest } from '@jest/globals';

jest.mock('../models/user.models.js', () => ({
	User: {
		findOne: jest.fn(),
		findByIdAndUpdate: jest.fn(),
		findById: jest.fn(),
		findByIdAndDelete: jest.fn(),
	},
}));

jest.mock('../utils/mail.js', () => ({
	sendEmail: jest.fn(),
	emailChangedMailGenContent: jest.fn(() => ({ body: 'email-changed' })),
	accountDeletionMailGenContent: jest.fn(() => ({ body: 'account-deleted' })),
}));

jest.mock('../utils/cloudinary.js', () => ({
	uploadOnCloudinary: jest.fn(),
	deleteFromCloudinary: jest.fn(),
}));

jest.mock('../utils/logger.js', () => ({
	logger: {
		error: jest.fn(),
	},
}));

import { describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { userService } from '../services/user.service.js';
import { User } from '../models/user.models.js';
import { sendEmail } from '../utils/mail.js';
import {
	uploadOnCloudinary,
	deleteFromCloudinary,
} from '../utils/cloudinary.js';

describe('userService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('getUserDetails', () => {
		it('returns current user details when current user is available', async () => {
			const currentUser = { _id: 'u1', username: 'john' };

			const result = await userService.getUserDetails({ currentUser });

			expect(result).toBe(currentUser);
		});

		it('throws when current user is missing', async () => {
			await expect(
				userService.getUserDetails({ currentUser: null }),
			).rejects.toMatchObject({ statusCode: 404 });
		});
	});

	describe('updateUserDetails', () => {
		it('updates user and sends email change notification when email changes', async () => {
			User.findOne.mockResolvedValue(null);
			User.findByIdAndUpdate.mockReturnValue({
				select: jest.fn().mockResolvedValue({ _id: 'u1', email: 'new@example.com' }),
			});

			const result = await userService.updateUserDetails({
				currentUserId: 'u1',
				currentEmail: 'old@example.com',
				currentUsername: 'john',
				currentRefreshToken: 'refresh-token',
				currentIsEmailVerified: true,
				fullName: 'John Doe',
				username: 'John',
				email: 'new@example.com',
				protocol: 'http',
				host: 'localhost:4000',
			});

			expect(User.findByIdAndUpdate).toHaveBeenCalled();
			expect(sendEmail).toHaveBeenCalledTimes(1);
			expect(result).toMatchObject({ _id: 'u1', email: 'new@example.com' });
		});

		it('throws when username or email is already in use by another user', async () => {
			User.findOne.mockResolvedValue({ _id: 'u2', email: 'used@example.com' });

			await expect(
				userService.updateUserDetails({
					currentUserId: 'u1',
					currentEmail: 'old@example.com',
					currentUsername: 'john',
					currentRefreshToken: 'refresh-token',
					currentIsEmailVerified: true,
					fullName: 'John Doe',
					username: 'John',
					email: 'used@example.com',
					protocol: 'http',
					host: 'localhost:4000',
				}),
			).rejects.toMatchObject({ statusCode: 400 });
		});
	});

	describe('deleteUserAccount', () => {
		it('deletes user account and sends account deletion mail', async () => {
			const user = {
				_id: 'u1',
				email: 'john@example.com',
				username: 'john',
				comparePassword: jest.fn().mockResolvedValue(true),
			};

			User.findById.mockReturnValue({
				select: jest.fn().mockResolvedValue(user),
			});
			User.findByIdAndDelete.mockResolvedValue({ _id: 'u1' });

			await userService.deleteUserAccount({
				currentUserId: 'u1',
				password: 'StrongPass#123',
			});

			expect(User.findByIdAndDelete).toHaveBeenCalledWith('u1');
			expect(sendEmail).toHaveBeenCalledTimes(1);
		});

		it('throws when password is invalid', async () => {
			User.findById.mockReturnValue({
				select: jest.fn().mockResolvedValue({
					comparePassword: jest.fn().mockResolvedValue(false),
				}),
			});

			await expect(
				userService.deleteUserAccount({
					currentUserId: 'u1',
					password: 'wrong-password',
				}),
			).rejects.toMatchObject({ statusCode: 401 });
		});
	});

	describe('updateUserAvatar', () => {
		it('uploads new avatar, updates user, and removes old cloud asset', async () => {
			User.findById.mockResolvedValue({
				avatar: {
					url: 'https://cdn.example.com/old-avatar.jpg',
					localPath: 'old-public-id',
				},
			});

			uploadOnCloudinary.mockResolvedValue({
				url: 'https://cdn.example.com/new-avatar.jpg',
				public_id: 'new-public-id',
			});

			User.findByIdAndUpdate.mockReturnValue({
				select: jest.fn().mockResolvedValue({
					_id: 'u1',
					avatar: {
						url: 'https://cdn.example.com/new-avatar.jpg',
						localPath: 'new-public-id',
					},
				}),
			});

			const result = await userService.updateUserAvatar({
				currentUserId: 'u1',
				avatarLocalPath: '/tmp/new-avatar.png',
			});

			expect(uploadOnCloudinary).toHaveBeenCalledWith('/tmp/new-avatar.png');
			expect(deleteFromCloudinary).toHaveBeenCalledWith('old-public-id');
			expect(result).toMatchObject({ _id: 'u1' });
		});

		it('throws when avatar file path is missing', async () => {
			await expect(
				userService.updateUserAvatar({
					currentUserId: 'u1',
					avatarLocalPath: '',
				}),
			).rejects.toMatchObject({ statusCode: 400 });

			expect(uploadOnCloudinary).not.toHaveBeenCalled();
		});
	});
});