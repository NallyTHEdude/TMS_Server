import { jest } from '@jest/globals';

jest.mock('../models/property.models.js', () => ({
	Property: {
		aggregate: jest.fn(),
	},
}));

jest.mock('../models/tenant.models.js', () => ({
	Tenant: {
		find: jest.fn(),
	},
}));

jest.mock('../utils/redis.js', () => ({
	getDataFromRedis: jest.fn(),
	setDataToRedis: jest.fn(),
}));

jest.mock('../utils/logger.js', () => ({
	logger: {
		error: jest.fn(),
	},
}));

import { describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { landlordService } from '../services/landlord.service.js';
import { Property } from '../models/property.models.js';
import { Tenant } from '../models/tenant.models.js';
import { getDataFromRedis, setDataToRedis } from '../utils/redis.js';

describe('landlordService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('getActiveTenantsByProperty', () => {
		it('returns tenants directly from cache when cache entry exists', async () => {
			const cachedTenants = [{ _id: 't1' }];
			getDataFromRedis.mockResolvedValue(cachedTenants);

			const result = await landlordService.getActiveTenantsByProperty('p1');

			expect(result).toBe(cachedTenants);
			expect(Tenant.find).not.toHaveBeenCalled();
		});

		it('throws when no tenants are found in storage', async () => {
			getDataFromRedis.mockResolvedValue(null);

			const select = jest.fn().mockResolvedValue([]);
			const populate = jest.fn(() => ({ select }));
			Tenant.find.mockReturnValue({ populate });

			await expect(
				landlordService.getActiveTenantsByProperty('p1'),
			).rejects.toMatchObject({ statusCode: 404 });
			expect(setDataToRedis).not.toHaveBeenCalled();
		});
	});

	describe('filterProperties', () => {
		it('returns aggregate results for valid filters', async () => {
			const rows = [{ _id: 'p1' }, { _id: 'p2' }];
			Property.aggregate.mockResolvedValue(rows);

			const result = await landlordService.filterProperties({
				status: 'vacant',
				city: 'Delhi',
			});

			expect(Property.aggregate).toHaveBeenCalled();
			expect(result).toEqual(rows);
		});

		it('throws for invalid status filter values', async () => {
			await expect(
				landlordService.filterProperties({ status: 'not-valid' }),
			).rejects.toMatchObject({ statusCode: 400 });

			expect(Property.aggregate).not.toHaveBeenCalled();
		});
	});
});