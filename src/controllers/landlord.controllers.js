import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { Property } from '../models/property.models.js';

const getTenantsOfProperty = asyncHandler(async (req, res, next) => {
    const propertyId = req.params.propertyId;
    const landlordId = req.user._id;
    const property = await Property.findOne({
        _id: propertyId,
        landlordId,
    }).populate({
        path: 'tenants',
        select: '-__v -createdAt -updatedAt',
    });

    if (!property) {
        throw new ApiError(
            404,
            'Property not found or does not belong to the landlord',
        );
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                property.tenants,
                'Property tenants fetched successfully',
            ),
        );
});

export {
    getTenantsOfProperty 
};
