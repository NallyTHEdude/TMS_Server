import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import {UserRolesEnum} from '../utils/constants.js';

export const requireLandlordRole = asyncHandler(async (req, res, next) => {
    if (req.user.role !== UserRolesEnum.LANDLORD && req.user.role !== UserRolesEnum.ADMIN) {
        throw new ApiError(403, 'Access denied: Landlord or admin role required');
    }
    next();
});

export const requireTenantRole = asyncHandler(async (req, res, next) => {
    if (req.user.role !== UserRolesEnum.TENANT) {
        throw new ApiError(403, 'Access denied: Tenant role required');
    }
    next();
});

