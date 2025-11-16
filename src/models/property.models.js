import mongoose, { Schema } from 'mongoose';
import {
    AvailablePropertyStatus,
    PropertyStatusEnum,
    AvailablePropertyTypes,
    PropertyTypesEnum,
    IssueTypesEnum,
    AvailableIssueTypes,
    AvailableIssuePriority,
    IssuePriorityEnum,
} from '../utils/constants.js';

const propertySchema = new Schema(
    {
        status: {
            type: String,
            enum: AvailablePropertyStatus,
            default: PropertyStatusEnum.VACANT,
            required: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            default: null,
            trim: true,
        },

        issues: [
            {
                type: {
                    type: String,
                    enum: AvailableIssueTypes,
                    required: true,
                },

                description: {
                    type: String,
                    default: null,
                    trim: true,
                },

                reportedBy: {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },

                priority: {
                    type: String,
                    enum: AvailableIssuePriority,
                    default: IssuePriorityEnum.LOW,
                },

                createdAt: {
                    type: Date,
                    default: Date.now,
                },

                isResolved: {
                    type: Boolean,
                    default: false,
                },
            },
        ],

        country: {
            type: String,
            required: true,
            trim: true,
        },

        state: {
            type: String,
            required: true,
            trim: true,
        },

        city: {
            type: String,
            required: true,
            trim: true,
        },

        pincode: {
            type: String,
            required: true,
            trim: true,
        },

        address: {
            type: String,
            required: true,
            trim: true,
        },

        landlordId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        type: {
            type: String,
            enum: AvailablePropertyTypes,
            default: PropertyTypesEnum.FLAT,
            required: true,
        },

        rentAmount: {
            type: Number,
            required: true,
        },

        depositAmount: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true },
);
// Virtuals: tenants and payments linked to the property
propertySchema.virtual('tenants', {
    ref: 'Tenant',
    localField: '_id',
    foreignField: 'propertyId',
});

propertySchema.virtual('payments', {
    ref: 'Payment',
    localField: '_id',
    foreignField: 'propertyId',
});


// METHODS AND HOOKS
propertySchema.pre('save', async function (next) {
    if (!this.isNew) return next();
    const Tenant = mongoose.model('Tenant');
    const tenantCount = await Tenant.countDocuments({ propertyId: this._id });
    this.status = tenantCount > 0 ? PropertyStatusEnum.OCCUPIED : PropertyStatusEnum.VACANT;
    next();
});


// Add Issue
propertySchema.methods.addIssue = async function (issueData) {
    this.issues.push(issueData);
    await this.save();
    return this;
};


// Resolve Issue
propertySchema.methods.resolveIssue = async function (issueId) {
    const issue = this.issues.id(issueId);
    if (!issue) return this;
    issue.isResolved = true;
    this.markModified('issues');
    await this.save();
    return this;
};


const Property = mongoose.model('Property', propertySchema);
export { Property };
