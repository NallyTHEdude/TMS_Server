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
