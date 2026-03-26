import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { landlordService } from '../services/landlord.service.js';

const getAllActiveTenantsOfProperty = asyncHandler(async (req, res) => {
    const propertyId = req.params.propertyId;

    const tenants =
        await landlordService.getActiveTenantsByProperty(propertyId);

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
    const properties = await landlordService.filterProperties(req.query);

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
