import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { Property } from '../models/property.models.js';
import {
    AvailablePropertyTypes, PropertyTypesEnum,
    AvailableIssueTypes, IssueTypesEnum,
    AvailableUserRoles, UserRolesEnum
} from '../utils/constants.js'


const addProperty = asyncHandler(async (req, res) => {
    // NO checks because middleware already does that
    const {name, description, country, state, city, pincode , address, type, rentAmount} =  req.body;
    const newProperty = await Property.create({
        name,
        description,
        country,
        state,
        city,
        pincode,
        address,
        type,
        rentAmount,
        landlordId: req.user._id
    });
    return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    newProperty,
                    'Property added successfully'
                )
            );
});

const getAllProperties = asyncHandler(async (req, res) => {
    const landlordId = req.user._id;
    const properties = await Property.find(
        { 
            landlordId
        }
    ).select(
        '-landlordId -updatedAt -__v'
    );
    return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    properties,
                    'Properties fetched successfully'
                )
            );

});

const getOneProperty = asyncHandler(async (req, res) => {
    const landlordId = req.user._id;
    const propertyId = req.params.propertyId;

   const property = await Property.findOne(
        {
            _id: propertyId,
            landlordId: landlordId
        }
    ).select(
        ' -landlordId -updatedAt -__v'
    );
    if(!property){
        throw new ApiError(404, 'Property does not exist');
    }
    return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    property,
                    'Property fetched successfully'
                )
            );
    
});

const updateProperty = asyncHandler(async (req, res) => {
    const landlordId = req.user._id;
    const propertyId = req.params.propertyId;

    const allowedFields = [
        "name",
        "description",
        "country",
        "state",
        "city",
        "pincode",
        "address",
        "type",
        "rentAmount",
        "depositAmount"
    ];

    const updates = {};
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    }

    const property = await Property.findOneAndUpdate(
        { _id: propertyId, landlordId },
        updates,
        { new: true }
    ).select("-landlordId -updatedAt -__v");

    if (!property) {
        throw new ApiError(404, "Property does not exist");
    }

    return res.status(200).json(
        new ApiResponse(200, property, "Property updated successfully")
    );
});


const addIssuesToProperty = asyncHandler(async (req, res) => {
    const tenantId = req.user._id;
    const propertyId = req.params.propertyId;

    const property = await Property.findById(propertyId);
    if (!property) {
        throw new ApiError(404, "Property does not exist");
    }

    let issues = req.body;

    if (!Array.isArray(issues)) {
        issues = [issues];
    }

    const allowedFields = ["type", "description", "priority"];

    const formattedIssues = issues.map(issue => {
        const cleanIssue = {};
        for (const key of allowedFields) {
            if (issue[key] !== undefined) {
                cleanIssue[key] = issue[key];
            }
        }

        cleanIssue.reportedBy = tenantId;
        cleanIssue.createdAt = Date.now();
        cleanIssue.isResolved = false;

        return cleanIssue;
    });

    property.issues.push(...formattedIssues);
    await property.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            property,
            "Issues added to property successfully"
        )
    );
});

const deleteProperty = asyncHandler(async (req, res) => {
    const landlordId = req.user._id;
    const propertyId = req.params.propertyId;
    const confirmation = req.body.confirmation;
    
    const property = await Property.findOne(
        {
            _id: propertyId,
            landlordId: landlordId
        }
    );
    if(!property){
        throw new ApiError(404, 'Property does not exist');
    }
    if(confirmation.trim() !== `I confirm to delete ${property.name}`){
        throw new ApiError(400, 'Property not deleted as confirmation was not provided');
    }
    await property.deleteOne();
    return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    property,
                    'Property deleted successfully'
                )
            );
});

export {
    addProperty,
    getAllProperties,
    getOneProperty,
    updateProperty,
    addIssuesToProperty,
    deleteProperty
}
