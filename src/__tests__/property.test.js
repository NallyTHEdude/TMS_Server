import { jest } from '@jest/globals';

jest.mock('../models/property.models.js', () => ({
	Property: {
		create: jest.fn(),
		find: jest.fn(),
		findOne: jest.fn(),
		findOneAndUpdate: jest.fn(),
		findById: jest.fn(),
	},
}));

jest.mock('../utils/redis.js', () => ({
	deleteDataFromRedis: jest.fn(),
	getDataFromRedis: jest.fn(),
	setDataToRedis: jest.fn(),
}));

jest.mock('../utils/logger.js', () => ({
	logger: {
		error: jest.fn(),
	},
}));

import { describe, beforeEach, it, expect } from '@jest/globals';
import { propertyService } from '../services/property.service.js';
import { Property } from '../models/property.models.js';
import {
	deleteDataFromRedis,
	getDataFromRedis,
	setDataToRedis,
} from '../utils/redis.js';

describe('propertyService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('addProperty', () => {
		it('creates a property and invalidates landlord property cache', async () => {
			const newProperty = { _id: 'p1', landlordId: 'l1' };
			Property.create.mockResolvedValue(newProperty);

			const result = await propertyService.addProperty({
				landlordId: 'l1',
				name: 'Sky Heights',
				description: '2BHK',
				country: 'India',
				state: 'Maharashtra',
				city: 'Pune',
				pincode: '411001',
				address: 'MG Road',
				type: 'apartment',
				rentAmount: 35000,
			});

			expect(Property.create).toHaveBeenCalled();
			expect(deleteDataFromRedis).toHaveBeenCalledTimes(1);
			expect(result).toEqual(newProperty);
		});

		it('propagates persistence errors from create', async () => {
			Property.create.mockRejectedValue(new Error('db failure'));

			await expect(
				propertyService.addProperty({
					landlordId: 'l1',
					name: 'Sky Heights',
					description: '2BHK',
					country: 'India',
					state: 'Maharashtra',
					city: 'Pune',
					pincode: '411001',
					address: 'MG Road',
					type: 'apartment',
					rentAmount: 35000,
				}),
			).rejects.toThrow('db failure');
		});
	});

	describe('getAllProperties', () => {
		it('returns cache payload when present', async () => {
			const cached = [{ _id: 'p1' }];
			getDataFromRedis.mockResolvedValue(cached);

			const result = await propertyService.getAllProperties({
				landlordId: 'l1',
			});

			expect(result).toBe(cached);
			expect(Property.find).not.toHaveBeenCalled();
		});

		it('reads from database and fills cache on cache miss', async () => {
			const rows = [{ _id: 'p1' }, { _id: 'p2' }];
			getDataFromRedis.mockResolvedValue(null);
			Property.find.mockReturnValue({
				select: jest.fn().mockResolvedValue(rows),
			});

			const result = await propertyService.getAllProperties({
				landlordId: 'l1',
			});

			expect(result).toEqual(rows);
			expect(setDataToRedis).toHaveBeenCalledTimes(1);
		});
	});

	describe('getOneProperty', () => {
		it('returns cached property when cache entry exists', async () => {
			const cachedProperty = { _id: 'p1', name: 'Sky Heights' };
			getDataFromRedis.mockResolvedValue(cachedProperty);

			const result = await propertyService.getOneProperty({
				landlordId: 'l1',
				propertyId: 'p1',
			});

			expect(result).toBe(cachedProperty);
			expect(Property.findOne).not.toHaveBeenCalled();
		});

		it('throws when property does not exist for landlord', async () => {
			getDataFromRedis.mockResolvedValue(null);
			Property.findOne.mockReturnValue({
				select: jest.fn().mockResolvedValue(null),
			});

			await expect(
				propertyService.getOneProperty({
					landlordId: 'l1',
					propertyId: 'missing',
				}),
			).rejects.toMatchObject({ statusCode: 404 });
		});
	});

	describe('updateProperty', () => {
		it('updates only allowed fields and invalidates caches', async () => {
			const updated = { _id: 'p1', name: 'New Name' };
			Property.findOneAndUpdate.mockReturnValue({
				select: jest.fn().mockResolvedValue(updated),
			});

			const result = await propertyService.updateProperty({
				landlordId: 'l1',
				propertyId: 'p1',
				body: {
					name: 'New Name',
					unsupportedField: 'ignored',
				},
			});

			expect(Property.findOneAndUpdate).toHaveBeenCalledWith(
				{ _id: 'p1', landlordId: 'l1' },
				{ name: 'New Name' },
				{ new: true },
			);
			expect(deleteDataFromRedis).toHaveBeenCalledTimes(2);
			expect(result).toEqual(updated);
		});

		it('throws when target property cannot be found', async () => {
			Property.findOneAndUpdate.mockReturnValue({
				select: jest.fn().mockResolvedValue(null),
			});

			await expect(
				propertyService.updateProperty({
					landlordId: 'l1',
					propertyId: 'missing',
					body: { name: 'name' },
				}),
			).rejects.toMatchObject({ statusCode: 404 });
		});
	});

	describe('addIssuesToProperty', () => {
		it('adds normalized issues and clears related caches', async () => {
			const property = {
				_id: 'p1',
				landlordId: { toString: () => 'l1' },
				issues: [],
				save: jest.fn().mockResolvedValue(),
			};
			Property.findById.mockResolvedValue(property);

			const result = await propertyService.addIssuesToProperty({
				tenantId: 't1',
				propertyId: 'p1',
				issuesPayload: {
					type: 'electrical',
					description: 'Fan not working',
					priority: 'high',
					ignored: 'field',
				},
			});

			expect(property.issues).toHaveLength(1);
			expect(property.issues[0]).toMatchObject({
				type: 'electrical',
				description: 'Fan not working',
				priority: 'high',
				reportedBy: 't1',
				isResolved: false,
			});
			expect(deleteDataFromRedis).toHaveBeenCalledTimes(2);
			expect(result).toBe(property);
		});

		it('throws when property does not exist', async () => {
			Property.findById.mockResolvedValue(null);

			await expect(
				propertyService.addIssuesToProperty({
					tenantId: 't1',
					propertyId: 'missing',
					issuesPayload: [],
				}),
			).rejects.toMatchObject({ statusCode: 404 });
		});
	});

	describe('deleteProperty', () => {
		it('deletes property when confirmation phrase is correct', async () => {
			const property = {
				_id: 'p1',
				name: 'Sky Heights',
				deleteOne: jest.fn().mockResolvedValue(),
			};
			Property.findOne.mockResolvedValue(property);

			const result = await propertyService.deleteProperty({
				landlordId: 'l1',
				propertyId: 'p1',
				confirmation: 'I confirm to delete Sky Heights',
			});

			expect(property.deleteOne).toHaveBeenCalled();
			expect(deleteDataFromRedis).toHaveBeenCalledTimes(2);
			expect(result).toBe(property);
		});

		it('throws when confirmation phrase does not match', async () => {
			Property.findOne.mockResolvedValue({
				_id: 'p1',
				name: 'Sky Heights',
			});

			await expect(
				propertyService.deleteProperty({
					landlordId: 'l1',
					propertyId: 'p1',
					confirmation: 'delete it',
				}),
			).rejects.toMatchObject({ statusCode: 400 });
		});
	});
});