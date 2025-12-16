import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { Property } from '../models/property.models.js';
import { Tenant } from '../models/tenant.models.js';
import {
    AvailablePropertyStatus,
    AvailablePropertyTypes,
    AvailableIssueTypes,
} from '../utils/constants.js';

const getAllActiveTenantsOfProperty = asyncHandler(async (req, res) => {
    const propertyId = req.params.propertyId;
    const landlordId = req.user._id;

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
        throw new ApiError(404, 'No active tenants found for this property');
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tenants,
                'Active tenants for this property fetched successfully',
            ),
        );
});

const filterProperties = asyncHandler(async (req, res) => {
    const {
        state,
        city,
        status,
        name,
        type,
        issue,
        tenantName,
        minPriceRange,
        maxPriceRange,
    } = req.query;

    const pipeline = [];
    const propertyMatch = {};

    // ---------- STATE (case-insensitive) ----------
    if (state) {
        propertyMatch.state = { $regex: state, $options: 'i' };
    }

    // ---------- CITY (case-insensitive) ----------
    if (city) {
        propertyMatch.city = { $regex: city, $options: 'i' };
    }

    // ---------- STATUS (enum-safe) ----------
    if (status && AvailablePropertyStatus.includes(status)) {
        propertyMatch.status = status;
    }

    // ---------- PROPERTY NAME (case-insensitive) ----------
    if (name) {
        propertyMatch.name = { $regex: name, $options: 'i' };
    }

    // ---------- PROPERTY TYPE (enum-safe) ----------
    if (type && AvailablePropertyTypes.includes(type)) {
        propertyMatch.type = type;
    }

    // ---------- ISSUES (enum-safe) ----------
    if (issue && AvailableIssueTypes.includes(issue)) {
        propertyMatch.issues = issue;
    }

    // ---------- RENT RANGE ----------
    if (minPriceRange || maxPriceRange) {
        propertyMatch.rentAmount = {};
        if (minPriceRange)
            propertyMatch.rentAmount.$gte = Number(minPriceRange);
        if (maxPriceRange)
            propertyMatch.rentAmount.$lte = Number(maxPriceRange);
    }

    // ---------- APPLY PROPERTY FILTERS ----------
    pipeline.push({ $match: propertyMatch });

    // ---------- TENANT NAME FILTER ----------
    if (tenantName) {
        pipeline.push(
            {
                $lookup: {
                    from: 'tenants',
                    localField: '_id',
                    foreignField: 'propertyId',
                    as: 'tenant',
                },
            },
            { $unwind: '$tenant' },
            {
                $lookup: {
                    from: 'users',
                    localField: 'tenant.userId',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            { $unwind: '$user' },
            {
                $match: {
                    'user.name': { $regex: tenantName, $options: 'i' },
                },
            },
        );
    }

    const properties = await Property.aggregate(pipeline);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                count: properties.length,
                properties,
            },
            'Properties filtered successfully',
        ),
    );
});

export { getAllActiveTenantsOfProperty, filterProperties };
