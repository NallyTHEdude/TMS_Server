import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { Property } from '../models/property.models.js';
import { Tenant } from '../models/tenant.models.js';
import {User} from '../models/user.models.js';
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from '../utils/cloudinary.js';
import { KycStatusEnum, TenantStatusEnum, PropertyStatusEnum, UserRolesEnum } from '../utils/constants.js';

// Dummy KYC Verification Function
const dummyKYCVerification = async (kycDocUrl) => {
    // Simulate KYC verification process
    const boolean = [true, false];
    const randomIndex = Math.floor(Math.random() * boolean.length);
    // Simulate async delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return boolean[randomIndex];
};

const applyKYCVerification = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const kycDocLocalPath = req?.file?.path;
    if (!kycDocLocalPath) {
        throw new ApiError(400, 'KYC file is required');
    }

    const kycImage = await uploadOnCloudinary(kycDocLocalPath);

    const tenant = await Tenant.findOneAndUpdate(
        { userId },
        {
            $set: {
                kycDocUrl: kycImage.url,
                kycDocPublicId: kycImage.public_id,
            },
        },
        { new: true },
    );

    if (!tenant) throw new ApiError(404, 'Tenant not found');

    const isKYCVerified = await dummyKYCVerification(kycImage.url);

    if (!isKYCVerified) {
        await deleteFromCloudinary(kycImage.public_id);
    }

    tenant.kycStatus = isKYCVerified
        ? KycStatusEnum.VERIFIED
        : KycStatusEnum.REJECTED;

    await tenant.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { kycStatus: tenant.kycStatus },
                isKYCVerified
                    ? 'KYC verified successfully'
                    : 'KYC verification failed',
            ),
        );
});

const getTenantDetails = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Fetch tenant even if inactive
    const tenant = await Tenant.findOne({ userId })
        .populate({
            path: "user",
            select: "fullName username email avatar role"
        })
        .populate({
            path: "property",
            select: "name description country state city pincode address type rentAmount depositAmount status"
        })
        .select("-__v -updatedAt");

    // CASE 1: No tenant document exists for this user
    if (!tenant) {
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    user: {
                        fullName: req.user.fullName,
                        username: req.user.username,
                        email: req.user.email,
                        avatar: req.user.avatar,
                        role: req.user.role
                    },
                    tenantId: null,
                    tenant: null,
                    message: "Tenant profile does not exist yet"
                },
                "Tenant profile fetched"
            )
        );
    }

    // CASE 2: Tenant exists but is inactive (evicted or not assigned)
    if (!tenant.isActive || !tenant.property) {
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    user: tenant.user,
                    tenantId: tenant._id,
                    tenant: {
                        isActive: tenant.isActive,
                        accountStatus: tenant.accountStatus,
                        rentEndDate: tenant.rentEndDate,
                        property: null
                    },
                    message: "You are not currently assigned to any property"
                },
                "Tenant profile fetched"
            )
        );
    }

    // CASE 3: Tenant exists + active + assigned to property
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                tenantId: tenant._id,
                ...tenant.toObject()
            },
            "Tenant details fetched successfully"
        )
    );
});



const assignTenantToProperty = asyncHandler(async (req, res) => {
    const landlordId = req.user._id;
    const tenantUserId = req.params.userId;
    const { propertyId, rentStartDate } = req.body;

    // 1. Validate property belongs to landlord
    const property = await Property.findOne({
        _id: propertyId,
        landlordId
    });

    if (!property) {
        throw new ApiError(404, "Property not found or does not belong to the landlord");
    }

    // 2. Find tenant document created at registration
    const tenant = await Tenant.findOne({ userId: tenantUserId });

    if (!tenant) {
        throw new ApiError(404, "Tenant profile not found (user is not a tenant)");
    }

    // 3. Prevent assigning multiple properties
    if (tenant.isActive && tenant.propertyId) {
        throw new ApiError(400, "Tenant is already assigned to a property");
    }

    // 4. Assign tenant to property
    tenant.propertyId = propertyId;
    tenant.isActive = true;
    tenant.accountStatus = TenantStatusEnum.ACTIVE;
    tenant.rentStartDate = rentStartDate;
    tenant.rentEndDate = null;

    await tenant.save();

    // 5. Mark property as OCCUPIED
    property.status = PropertyStatusEnum.OCCUPIED;
    await property.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            tenant,
            "Tenant assigned to property successfully"
        )
    );
});



const getAllTenantsOfProperty = asyncHandler(async (req, res) => {
    const propertyId = req.params.propertyId;

    const property = await Property.findOne({
        _id: propertyId,
    }).populate({
        path: 'tenants',
        select: '-__v -createdAt -updatedAt',
        populate: {
            path: 'user',
            select: 'fullName username email avatar',
        },
    });

    if (!property) {
        throw new ApiError(404, 'Property not found ');
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                property.tenants,
                "Property's tenants fetched successfully",
            ),
        );
});

const removeTenantFromProperty = asyncHandler(async (req, res) => {
    const tenantId = req.params.tenantId;

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
        throw new ApiError(404, 'Tenant not found');
    }

    const property = await Property.findById(tenant.propertyId);

    // count active tenants for this property
    const activeTenantCount = await Tenant.countDocuments({
        propertyId: property._id,
        isActive: true
    });

    // if this is the last active tenant → make property VACANT
    if (activeTenantCount === 1) {
        property.status = PropertyStatusEnum.VACANT;
        await property.save();
    }

    // disconnect tenant from property
    tenant.propertyId = null;
    tenant.accountStatus = TenantStatusEnum.EVICTED;
    tenant.isActive = false;
    tenant.rentEndDate = new Date();
    await tenant.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            { tenant },
            "Tenant removed from property successfully"
        )
    );
});


const getTenantKYCStatus = asyncHandler(async (req, res) => {
    const tenantId = req.params.tenantId;
    const tenant = await Tenant.findOne({ userId: tenantId });
    if (!tenant) {
        throw new ApiError(404, 'Tenant not found');
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { kycStatus: tenant.kycStatus },
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
    getTenantDetails
};
