import mongoose, { Schema } from "mongoose";
import { AvailablePropertyStatus, PropertyStatusEnum, AvailablePropertyTypes,PropertyTypesEnum} from '../utils/constants.js'; 


const propertySchema = new Schema(
    {
        status: {
            type: String,
            enum: AvailablePropertyStatus,
            default: PropertyStatusEnum.VACANT,
            required: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: null,
            trim: true
        },

        issues: {
            type: [String],
            default: []
        },

        country: {
            type: String,
            required: true,
            trim: true
        },

        state: {
            type: String,
            required: true,
            trim: true
        },

        city: {
            type: String,
            required: true,
            trim: true
        },

        pincode: {
            type: String,
            required: true,
            trim: true
        },

        address: {
            type: String,
            required: true,
            trim: true
        },

        landlordId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        type: {
            type: String,
            enum: AvailablePropertyTypes,
            default: PropertyTypesEnum.FLAT,
            required: true
        },

        rentAmount: {
            type: Number,
            required: true
        },

        depositAmount: {
            type: Number,
            required: true
        }
    },{ timestamps: true }
);

// Virtuals: tenants and payments linked to the property
propertySchema.virtual("tenants", {
    ref: "Tenant",
    localField: "_id",
    foreignField: "propertyId"
});

propertySchema.virtual("payments", {
    ref: "Payment",
    localField: "_id",
    foreignField: "propertyId"
});


// METHODS AND HOOKS
propertySchema.pre("save", async function (next) {
    const Tenant = mongoose.model("Tenant");
    const tenantCount = await Tenant.countDocuments({ propertyId: this._id });
    this.status = tenantCount > 0 ? PropertyStatusEnum.OCCUPIED : PropertyStatusEnum.VACANT;
    next();
});


const Property = mongoose.model('Property', propertySchema);

export {Property};
