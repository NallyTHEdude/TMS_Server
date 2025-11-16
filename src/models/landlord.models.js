import mongoose, { Schema } from "mongoose";
import { LandlordStatusEnum, AvailableLandlordStatus } from "../utils/constants.js";

const landlordSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        businessName: {
            type: String,
            trim: true,
            default: null
        },

        earningsToDate: {
            type: Number,
            default: 0
        },

        totalProperties: {
            type: Number,
            default: 0
        },

        status: {
            type: String,
            enum: AvailableLandlordStatus,
            default: LandlordStatusEnum.ACTIVE
        }
    },
    {
        timestamps: true
    }
);

landlordSchema.virtual("properties", {
    ref: "Property",
    localField: "_id",
    foreignField: "landlordId"
});

// Enable When Required
// landlordSchema.set("toObject", { virtuals: true });
// landlordSchema.set("toJSON", { virtuals: true });

const Landlord = mongoose.model("Landlord", landlordSchema);
export { Landlord };