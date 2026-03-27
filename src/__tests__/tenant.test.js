import { jest } from '@jest/globals';

jest.mock('../models/property.models.js', () => ({
	Property: {
		findOne: jest.fn(),
		findById: jest.fn(),
	},
}));

jest.mock('../models/tenant.models.js', () => ({
	Tenant: {
		findOneAndUpdate: jest.fn(),
		findOne: jest.fn(),
		findById: jest.fn(),
		countDocuments: jest.fn(),
	},
}));

jest.mock('../utils/cloudinary.js', () => ({
	uploadOnCloudinary: jest.fn(),
	deleteFromCloudinary: jest.fn(),
}));

jest.mock('../utils/redis.js', () => ({
	getDataFromRedis: jest.fn(),
	setDataToRedis: jest.fn(),
	deleteDataFromRedis: jest.fn(),
}));

jest.mock('../utils/logger.js', () => ({
	logger: {
		error: jest.fn(),
	},
}));

import { describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { tenantService } from '../services/tenant.service.js';
import { Property } from '../models/property.models.js';
import { Tenant } from '../models/tenant.models.js';
import {
	uploadOnCloudinary,
	deleteFromCloudinary,
} from '../utils/cloudinary.js';
import {
	getDataFromRedis,
	setDataToRedis,
	deleteDataFromRedis,
} from '../utils/redis.js';

describe('tenantService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(global.Math, 'random').mockReturnValue(0);
	});

	afterEach(() => {
		global.Math.random.mockRestore();
	});

	describe('applyKYCVerification', () => {
		it('uploads KYC doc, verifies and stores verified status', async () => {
			const tenant = {
				kycStatus: 'pending',
				save: jest.fn().mockResolvedValue(),
			};

			uploadOnCloudinary.mockResolvedValue({
				url: 'https://cdn/doc.jpg',
				public_id: 'kyc-public-id',
			});
			Tenant.findOneAndUpdate.mockResolvedValue(tenant);

			const result = await tenantService.applyKYCVerification({
				userId: 'u1',
				kycDocLocalPath: '/tmp/kyc.png',
			});

			expect(uploadOnCloudinary).toHaveBeenCalledWith('/tmp/kyc.png');
			expect(tenant.save).toHaveBeenCalled();
			expect(result).toMatchObject({
				kycStatus: 'verified',
				message: 'KYC verified successfully',
			});
			expect(deleteDataFromRedis).toHaveBeenCalledTimes(1);
		});

		it('throws when KYC file path is missing', async () => {
			await expect(
				tenantService.applyKYCVerification({
					userId: 'u1',
					kycDocLocalPath: '',
				}),
			).rejects.toMatchObject({ statusCode: 400 });

			expect(uploadOnCloudinary).not.toHaveBeenCalled();
		});
	});

	describe('getTenantDetails', () => {
		it('returns cached tenant details when cache hit occurs', async () => {
			const cached = { data: { tenantId: 't1' }, message: 'cached' };
			getDataFromRedis.mockResolvedValue(cached);

			const result = await tenantService.getTenantDetails({
				currentUser: { _id: 'u1' },
			});

			expect(result).toBe(cached);
			expect(Tenant.findOne).not.toHaveBeenCalled();
		});

		it('returns profile-missing response when tenant profile does not exist', async () => {
			getDataFromRedis.mockResolvedValue(null);

			const select = jest.fn().mockResolvedValue(null);
			const populateProperty = jest.fn(() => ({ select }));
			const populateUser = jest.fn(() => ({ populate: populateProperty }));
			Tenant.findOne.mockReturnValue({ populate: populateUser });

			const currentUser = {
				_id: 'u1',
				fullName: 'John Doe',
				username: 'johndoe',
				email: 'john@example.com',
				avatar: { url: 'avatar-url' },
				role: 'tenant',
			};

			const result = await tenantService.getTenantDetails({ currentUser });

			expect(result.data.tenantId).toBeNull();
			expect(result.data.message).toBe('Tenant profile does not exist yet');
			expect(setDataToRedis).toHaveBeenCalledTimes(1);
		});
	});

	describe('assignTenantToProperty', () => {
		it('assigns tenant to property and marks property occupied', async () => {
			const property = {
				_id: 'p1',
				status: 'vacant',
				save: jest.fn().mockResolvedValue(),
			};
			const tenant = {
				_id: 't1',
				userId: 'u2',
				isActive: false,
				propertyId: null,
				save: jest.fn().mockResolvedValue(),
			};

			Property.findOne.mockResolvedValue(property);
			Tenant.findOne.mockResolvedValue(tenant);

			const result = await tenantService.assignTenantToProperty({
				landlordId: 'l1',
				tenantUserId: 'u2',
				propertyId: 'p1',
				rentStartDate: '2026-01-01',
			});

			expect(tenant.save).toHaveBeenCalled();
			expect(property.save).toHaveBeenCalled();
			expect(deleteDataFromRedis).toHaveBeenCalledTimes(2);
			expect(result).toBe(tenant);
		});

		it('throws when tenant is already assigned to a property', async () => {
			Property.findOne.mockResolvedValue({ _id: 'p1' });
			Tenant.findOne.mockResolvedValue({
				_id: 't1',
				isActive: true,
				propertyId: 'p1',
			});

			await expect(
				tenantService.assignTenantToProperty({
					landlordId: 'l1',
					tenantUserId: 'u2',
					propertyId: 'p1',
					rentStartDate: '2026-01-01',
				}),
			).rejects.toMatchObject({ statusCode: 400 });
		});
	});

	describe('getAllTenantsOfProperty', () => {
		it('returns cached tenant list for property', async () => {
			const cached = [{ _id: 't1' }];
			getDataFromRedis.mockResolvedValue(cached);

			const result = await tenantService.getAllTenantsOfProperty({
				propertyId: 'p1',
			});

			expect(result).toBe(cached);
			expect(Property.findOne).not.toHaveBeenCalled();
		});

		it('throws when property does not exist in persistence layer', async () => {
			getDataFromRedis.mockResolvedValue(null);
			Property.findOne.mockReturnValue({
				populate: jest.fn().mockResolvedValue(null),
			});

			await expect(
				tenantService.getAllTenantsOfProperty({ propertyId: 'missing' }),
			).rejects.toMatchObject({ statusCode: 404 });
		});
	});

	describe('removeTenantFromProperty', () => {
		it('evicts tenant and sets property vacant when last active tenant leaves', async () => {
			const tenant = {
				_id: 't1',
				userId: 'u2',
				propertyId: 'p1',
				save: jest.fn().mockResolvedValue(),
			};
			const property = {
				_id: 'p1',
				status: 'occupied',
				save: jest.fn().mockResolvedValue(),
			};

			Tenant.findById.mockResolvedValue(tenant);
			Property.findById.mockResolvedValue(property);
			Tenant.countDocuments.mockResolvedValue(1);

			const result = await tenantService.removeTenantFromProperty({
				tenantId: 't1',
			});

			expect(property.save).toHaveBeenCalled();
			expect(tenant.save).toHaveBeenCalled();
			expect(deleteDataFromRedis).toHaveBeenCalledTimes(2);
			expect(result).toBe(tenant);
		});

		it('throws when tenant does not exist', async () => {
			Tenant.findById.mockResolvedValue(null);

			await expect(
				tenantService.removeTenantFromProperty({ tenantId: 'missing' }),
			).rejects.toMatchObject({ statusCode: 404 });
		});
	});

	describe('getTenantKYCStatus', () => {
		it('returns current KYC status when tenant exists', async () => {
			Tenant.findById.mockResolvedValue({
				_id: 't1',
				kycStatus: 'verified',
			});

			const result = await tenantService.getTenantKYCStatus({ tenantId: 't1' });

			expect(result).toBe('verified');
		});

		it('throws when tenant is missing', async () => {
			Tenant.findById.mockResolvedValue(null);

			await expect(
				tenantService.getTenantKYCStatus({ tenantId: 'missing' }),
			).rejects.toMatchObject({ statusCode: 404 });
		});
	});
});