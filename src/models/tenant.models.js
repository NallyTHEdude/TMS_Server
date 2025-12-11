import mongoose, { Schema } from 'mongoose';
import {
    TenantPaymentStatusEnum,
    AvailableTenantPaymentStatus,
    TenantStatusEnum,
    AvailableTenantStatus,
    KycStatusEnum,
    AvailableKycStatus,
} from '../utils/constants.js';

const tenantSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        propertyId: {
            type: Schema.Types.ObjectId,
            ref: 'Property',
            default: null,
            index: true,
        },

        rentStartDate: {
            type: Date,
            // required: true
        },

        rentEndDate: {
            type: Date,
            default: null,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        paymentStatus: {
            type: String,
            enum: AvailableTenantPaymentStatus,
            default: TenantPaymentStatusEnum.DUE,
        },

        accountStatus: {
            type: String,
            enum: AvailableTenantStatus,
            default: TenantStatusEnum.ACTIVE,
        },

        kycStatus: {
            type: String,
            enum: AvailableKycStatus,
            default: KycStatusEnum.PENDING,
        },

        kycDocUrl: {
            type: String,
            default: null,
        },

        kycDocPublicId: {
            type: String,
            default: null,
        },
    },
    { timestamps: true },
);

// Virtual: populate user details for dashboard
tenantSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true,
});

// Virtual: populate property details
tenantSchema.virtual('property', {
    ref: 'Property',
    localField: 'propertyId',
    foreignField: '_id',
    justOne: true,
});

tenantSchema.set('toJSON', { virtuals: true });
tenantSchema.set('toObject', { virtuals: true });

const Tenant = mongoose.model('Tenant', tenantSchema);
export { Tenant };
