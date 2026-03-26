import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { tenantService } from '../services/tenant.service.js';

const applyKYCVerification = asyncHandler(async (req, res) => {
    const result = await tenantService.applyKYCVerification({
        userId: req.user._id,
        kycDocLocalPath: req?.file?.path,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { kycStatus: result.kycStatus },
                result.message,
            ),
        );
});

const getTenantDetails = asyncHandler(async (req, res) => {
    const result = await tenantService.getTenantDetails({
        currentUser: req.user,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, result.data, result.message));
});

const assignTenantToProperty = asyncHandler(async (req, res) => {
    const { propertyId, rentStartDate } = req.body;

    const tenant = await tenantService.assignTenantToProperty({
        landlordId: req.user._id,
        tenantUserId: req.params.userId,
        propertyId,
        rentStartDate,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tenant,
                'Tenant assigned to property successfully',
            ),
        );
});

const getAllTenantsOfProperty = asyncHandler(async (req, res) => {
    const tenants = await tenantService.getAllTenantsOfProperty({
        propertyId: req.params.propertyId,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tenants,
                "Property's tenants fetched successfully",
            ),
        );
});

const removeTenantFromProperty = asyncHandler(async (req, res) => {
    const tenant = await tenantService.removeTenantFromProperty({
        tenantId: req.params.tenantId,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { tenant },
                'Tenant removed from property successfully',
            ),
        );
});

const getTenantKYCStatus = asyncHandler(async (req, res) => {
    const kycStatus = await tenantService.getTenantKYCStatus({
        tenantId: req.params.tenantId,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { kycStatus },
                'Tenant KYC status fetched successfully',
            ),
        );
});

export {
    assignTenantToProperty,
    getAllTenantsOfProperty,
    getTenantKYCStatus,
    applyKYCVerification,
    removeTenantFromProperty,
    getTenantDetails,
};
