import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { propertyService } from '../services/property.service.js';

const addProperty = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        country,
        state,
        city,
        pincode,
        address,
        type,
        rentAmount,
    } = req.body;

    const newProperty = await propertyService.addProperty({
        landlordId: req.user._id,
        name,
        description,
        country,
        state,
        city,
        pincode,
        address,
        type,
        rentAmount,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, newProperty, 'Property added successfully'));
});

const getAllProperties = asyncHandler(async (req, res) => {
    const properties = await propertyService.getAllProperties({
        landlordId: req.user._id,
    });
    return res
        .status(200)
        .json(
            new ApiResponse(200, properties, 'Properties fetched successfully'),
        );
});

const getOneProperty = asyncHandler(async (req, res) => {
    const property = await propertyService.getOneProperty({
        landlordId: req.user._id,
        propertyId: req.params.propertyId,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, property, 'Property fetched successfully'));
});

const updateProperty = asyncHandler(async (req, res) => {
    const property = await propertyService.updateProperty({
        landlordId: req.user._id,
        propertyId: req.params.propertyId,
        body: req.body,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, property, 'Property updated successfully'));
});

const addIssuesToProperty = asyncHandler(async (req, res) => {
    const property = await propertyService.addIssuesToProperty({
        tenantId: req.user._id,
        propertyId: req.params.propertyId,
        issuesPayload: req.body,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                property,
                'Issues added to property successfully',
            ),
        );
});

const deleteProperty = asyncHandler(async (req, res) => {
    const property = await propertyService.deleteProperty({
        landlordId: req.user._id,
        propertyId: req.params.propertyId,
        confirmation: req.body.confirmation,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, property, 'Property deleted successfully'));
});

export {
    addProperty,
    getAllProperties,
    getOneProperty,
    updateProperty,
    addIssuesToProperty,
    deleteProperty,
};
