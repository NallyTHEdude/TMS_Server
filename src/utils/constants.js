// USERE ENUMS
export const UserRolesEnum = {
    ADMIN: 'admin',
    LANDLORD: 'landlord',
    TENANT: 'tenant',
};
export const AvailableUserRoles = Object.values(UserRolesEnum);

// PROPERTY ENUMS
export const PropertyStatusEnum = {
    VACANT: 'vacant',
    OCCUPIED: 'occupied',
    UNDER_MAINTENANCE: 'under_maintenance',
    INACTIVE: 'inactive',
};
export const AvailablePropertyStatus = Object.values(PropertyStatusEnum);

export const PropertyTypesEnum = {
    APARTMENT: 'apartment',
    VILLA: 'villa',
    FLAT: 'flat',
    COMMERCIAL: 'commercial',
};
export const AvailablePropertyTypes = Object.values(PropertyTypesEnum);

export const IssueTypesEnum = {
    ELECTRICAL: 'electrical',
    PLUMBING: 'plumbing',
    WATER: 'water',
    STRUCTURAL: 'structural',
    APPLIANCES: 'appliances',
    PEST: 'pest',
    INTERNET: 'internet',
    PAINTING: 'painting',
    SECURITY: 'security',
    COMMON_AREA: 'common_area', // garbage , lift, parking, corridor-lights, etc
    FURNITURE: 'furniture',
    KITCHEN: 'kitchen', // chimney, sink, etc
    OTHER: 'other',
};
export const AvailableIssueTypes = Object.values(IssueTypesEnum);

export const IssuePriorityEnum = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
};
export const AvailableIssuePriority = Object.values(IssuePriorityEnum);

// LANDLORD ENUMS
export const LandlordStatusEnum = {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
};
export const AvailableLandlordStatus = Object.values(LandlordStatusEnum);

// TENANT ENUMS
export const TenantStatusEnum = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    EVICTED: 'evicted',
};
export const AvailableTenantStatus = Object.values(TenantStatusEnum);

export const KycStatusEnum = {
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
};
export const AvailableKycStatus = Object.values(KycStatusEnum);

export const TenantPaymentStatusEnum = {
    PAID: 'paid',
    DUE: 'due',
    OVERDUE: 'overdue',
};
export const AvailableTenantPaymentStatus = Object.values(
    TenantPaymentStatusEnum,
);
