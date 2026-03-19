import { ApiError } from '../utils/api-error.js';
import { Property } from '../models/property.models.js';
import { Tenant } from '../models/tenant.models.js';
import {
    AvailablePropertyStatus,
    AvailablePropertyTypes,
    AvailableIssueTypes,
} from '../utils/constants.js';
import { logger } from '../utils/logger.js';

const getActiveTenantsByProperty = async (propertyId)=>{
    const tenants = await Tenant.find({
        propertyId,
        // isActive: true
    })
        .populate({
            path: 'user',
            select: 'fullName username email avatar',
        })
        .select('-__v -updatedAt');

    if (!tenants.length) {
        logger.error(`No tenants found for property with id: ${propertyId}`);
        throw new ApiError(404, 'No active tenants found for this property');
    }

    return tenants;
}

const filterProperties = async (filters) => {
    validateFilters(filters);
    const pipeline = buildPropertyPipeline(filters);
    const properties = await Property.aggregate(pipeline);
    return properties;
}


// helper functions
const validateFilters = (filters) => {
    const {
        state, city, status, name, type, issue,
        tenantName, minPriceRange, maxPriceRange,
    } = filters;

    if(status && !AvailablePropertyStatus.includes(status)) {
        logger.error(`Invalid Status filter, status is: ${status}`);
        throw new ApiError(400, `Invalid status filter for property`);
    }
    if(type && !AvailablePropertyTypes.includes(type)) {
        logger.error(`Invalid \'type\' filter, type is: ${type}`);
        throw new ApiError(400, `Invalid type filter for property`);
    }
    if(issue && !AvailableIssueTypes.includes(issue)) {
        logger.error(`Invalid \'issue\' filter, issue is: ${issue}`);
        throw new ApiError(400, `Invalid issue filter for property`);
    }
}

const buildPropertyPipeline = (filters) => {
    const {
        state, city, status, name, type, issue,
        tenantName, minPriceRange, maxPriceRange,
    } = filters;

    const pipeline = [];
    const propertyMatch = {};

    if (state) propertyMatch.state = { $regex: state, $options: 'i' };
    if (city) propertyMatch.city = { $regex: city, $options: 'i' };

    if (status){

        propertyMatch.status = status;
    }
    if (name) propertyMatch.name = { $regex: name, $options: 'i' };
    if (type) propertyMatch.type = type;
    if (issue) propertyMatch.issues = issue;

    if (minPriceRange || maxPriceRange) {
        const min = minPriceRange ? Number(minPriceRange) : null;
        const max = maxPriceRange ? Number(maxPriceRange) : null;

        if(min !== null && max !== null && min >= max) {
            throw new ApiError(400, 'minPriceRange cannot be greater or equal to maxPriceRange');
        }
        propertyMatch.rentAmount = {};
        if (min!=null) propertyMatch.rentAmount.$gte = min;
        if (max!=null) propertyMatch.rentAmount.$lte = max;
    }

    pipeline.push({ $match: propertyMatch });

    if (tenantName) {
        pipeline.push(
            { $lookup: { from: 'tenants', localField: '_id', foreignField: 'propertyId', as: 'tenant' } },
            { $unwind: '$tenant' },
            { $lookup: { from: 'users', localField: 'tenant.userId', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            {
                $match: {
                    $or: [
                        { 'user.fullName': { $regex: tenantName, $options: 'i' } },
                        { 'user.username': { $regex: tenantName, $options: 'i' } },
                    ],
                },
            }
        );
    }

    return pipeline;
};


export const landlordService = {
    getActiveTenantsByProperty,
    filterProperties,
}