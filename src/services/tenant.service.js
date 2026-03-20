import { ApiError } from '../utils/api-error.js';
import { Property } from '../models/property.models.js';
import { Tenant } from '../models/tenant.models.js';
import {
	uploadOnCloudinary,
	deleteFromCloudinary,
} from '../utils/cloudinary.js';
import {
	KycStatusEnum,
	TenantStatusEnum,
} from '../utils/constants/tenant.constants.js';
import { PropertyStatusEnum } from '../utils/constants/property.constants.js';
import { logger } from '../utils/logger.js';

const TENANT_DETAILS_USER_FIELDS = 'fullName username email avatar role';
const TENANT_DETAILS_PROPERTY_FIELDS =
	'name description country state city pincode address type rentAmount depositAmount status';


const applyKYCVerification = async ({ userId, kycDocLocalPath }) => {
	ensureKycFilePresent(kycDocLocalPath);

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

	ensureTenantExists(tenant);

	const isKYCVerified = await dummyKYCVerification(kycImage.url);

	if (!isKYCVerified) {
		await deleteFromCloudinary(kycImage.public_id);
	}

	tenant.kycStatus = isKYCVerified
		? KycStatusEnum.VERIFIED
		: KycStatusEnum.REJECTED;

	await tenant.save();

	return {
		kycStatus: tenant.kycStatus,
		message: isKYCVerified
			? 'KYC verified successfully'
			: 'KYC verification failed',
	};
};

const getTenantDetails = async ({ currentUser }) => {
	const tenant = await Tenant.findOne({ userId: currentUser._id })
		.populate({
			path: 'user',
			select: TENANT_DETAILS_USER_FIELDS,
		})
		.populate({
			path: 'property',
			select: TENANT_DETAILS_PROPERTY_FIELDS,
		})
		.select('-__v -updatedAt');

	// CASE 1: No tenant document exists for this user
	if (!tenant) {
		return buildTenantDetailsWhenProfileMissing(currentUser);
	}

	// CASE 2: Tenant exists but is inactive (evicted or not assigned)
	if (!tenant.isActive || !tenant.property) {
		return buildTenantDetailsWhenNotAssigned(tenant);
	}

	// CASE 3: Tenant exists + active + assigned to property
	return buildTenantDetailsWhenAssigned(tenant);
};

const assignTenantToProperty = async ({
	landlordId,
	tenantUserId,
	propertyId,
	rentStartDate,
}) => {
	// 1. Validate property belongs to landlord
	const property = await Property.findOne({
		_id: propertyId,
		landlordId,
	});
	ensurePropertyOwnedByLandlord(property);

	// 2. Find tenant document created at registration
	const tenant = await Tenant.findOne({ userId: tenantUserId });
	ensureTenantProfileExistsForUser(tenant);

	// 3. Prevent assigning multiple properties
	ensureTenantNotAlreadyAssigned(tenant);

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

	return tenant;
};

const getAllTenantsOfProperty = async ({ propertyId }) => {
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

	ensurePropertyExists(property);

	return property.tenants;
};

const removeTenantFromProperty = async ({ tenantId }) => {
	const tenant = await Tenant.findById(tenantId);
	ensureTenantExists(tenant, tenantId);

	const property = await Property.findById(tenant.propertyId);

	// count active tenants for this property
	const activeTenantCount = await Tenant.countDocuments({
		propertyId: property._id,
		isActive: true,
	});

	// if this is the last active tenant -> make property VACANT
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

	return tenant;
};

const getTenantKYCStatus = async ({ tenantId }) => {
	const tenant = await Tenant.findById(tenantId);
	ensureTenantExists(tenant, tenantId);

	return tenant.kycStatus;
};


// helper runctions
// Dummy KYC Verification Function
const dummyKYCVerification = async (kycDocUrl="kycdoc") => {
	// Simulate KYC verification process
	const boolean = [true, false];
	const randomIndex = Math.floor(Math.random() * boolean.length);

	// Simulate async delay
	await new Promise((resolve) => setTimeout(resolve, 1000));

	return boolean[randomIndex];
};

const ensureKycFilePresent = (kycDocLocalPath) => {
	if (!kycDocLocalPath) {
        logger.error(`KYC file is required for KYC verification, provided kycDocLocalPath: ${kycDocLocalPath}`);
		throw new ApiError(400, 'KYC file is required');
	}
};

const ensurePropertyOwnedByLandlord = (property) => {
	if (!property) {
        logger.error(`Property not found or does not belong to landlord, propertyId: ${property?._id}`);
		throw new ApiError(
			404,
			'Property not found or does not belong to the landlord',
		);
	}
};

const ensureTenantProfileExistsForUser = (tenant) => {
	if (!tenant) {
        logger.error(`Tenant profile not found for user, userId: ${tenant?.userId}`);
		throw new ApiError(
			404,
			'Tenant profile not found (user is not a tenant)',
		);
	}
};

const ensureTenantExists = (tenant, tenantId = null) => {
	if (!tenant) {
		logger.error(
			`Tenant not found at tenantService, tenantId: ${tenantId ?? tenant?._id}`,
		);
		throw new ApiError(404, 'Tenant not found');
	}
};

const ensurePropertyExists = (property) => {
	if (!property) {
        logger.error(`Property not found at tenantService.ensurePropertyExists, propertyId: ${property?._id}`);
		throw new ApiError(404, 'Property not found ');
	}
};

const ensureTenantNotAlreadyAssigned = (tenant) => {
	if (tenant.isActive && tenant.propertyId) {
        logger.error(`Tenant is already assigned to a property, tenantId: ${tenant._id}, propertyId: ${tenant.propertyId}`);
		throw new ApiError(400, 'Tenant is already assigned to a property');
	}
};

const buildTenantDetailsWhenProfileMissing = (currentUser) => ({
	data: {
		user: {
			fullName: currentUser.fullName,
			username: currentUser.username,
			email: currentUser.email,
			avatar: currentUser.avatar,
			role: currentUser.role,
		},
		tenantId: null,
		tenant: null,
		message: 'Tenant profile does not exist yet',
	},
	message: 'Tenant profile fetched',
});

const buildTenantDetailsWhenNotAssigned = (tenant) => ({
	data: {
		user: tenant.user,
		tenantId: tenant._id,
		tenant: {
			isActive: tenant.isActive,
			accountStatus: tenant.accountStatus,
			rentEndDate: tenant.rentEndDate,
			property: null,
		},
		message: 'You are not currently assigned to any property',
	},
	message: 'Tenant profile fetched',
});

const buildTenantDetailsWhenAssigned = (tenant) => ({
	data: {
		tenantId: tenant._id,
		...tenant.toObject(),
	},
	message: 'Tenant details fetched successfully',
});

export const tenantService = {
	applyKYCVerification,
	getTenantDetails,
	assignTenantToProperty,
	getAllTenantsOfProperty,
	removeTenantFromProperty,
	getTenantKYCStatus,
};
