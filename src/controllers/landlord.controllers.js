import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { Property } from '../models/property.models.js';
import { Tenant } from '../models/tenant.models.js';

const getAllActiveTenantsOfProperty = asyncHandler(async (req, res) => {
    const propertyId = req.params.propertyId;
    const landlordId = req.user._id;

    const tenants = await Tenant.find({
        propertyId,
        // isActive: true
    })
    .populate({
        path: "user",
        select: "fullName username email avatar"
    })
    .select("-__v -updatedAt");

    if (!tenants.length) {
        throw new ApiError(404, "No active tenants found for this property");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            tenants,
            "Active tenants for this property fetched successfully"
        )
    );
});




export {
    getAllActiveTenantsOfProperty 
};
