import { ApiError } from '../utils/api-error.js';
import { Property } from '../models/property.models.js';
import { logger } from '../utils/logger.js';
import { deleteDataFromRedis, getDataFromRedis, setDataToRedis } from '../utils/redis.js';
import { CacheEntities, CacheIdentifiers , CacheTTL} from '../constants/cache.constants.js';
const PROPERTY_SAFE_FIELDS = '-updatedAt -__v';


const addProperty = async ({
	landlordId,
	name,
	description,
	country,
	state,
	city,
	pincode,
	address,
	type,
	rentAmount,
}) => {
	// NO checks because middleware already does that
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
		landlordId,
	});

	
	// invalidate / delete cache
	const cachePropertyKey = `${CacheEntities.PROPERTY}:${CacheIdentifiers.GET_ALL_PROPERTIES(landlordId)}`;
	await deleteDataFromRedis(cachePropertyKey);

	return newProperty;
};

const getAllProperties = async ({ landlordId }) => {
	// check in cache first
	const cachePropertyKey = `${CacheEntities.PROPERTY}:${CacheIdentifiers.GET_ALL_PROPERTIES(landlordId)}`;
	const propertiesFromCache = await getDataFromRedis(cachePropertyKey);
	if(propertiesFromCache !== null) {
		return propertiesFromCache;
	}

	// if not found in cache, fetch from database
	const properties = await Property.find({
		landlordId,
	}).select(PROPERTY_SAFE_FIELDS);

	await setDataToRedis(cachePropertyKey, properties, CacheTTL.PROPERTY_TTL);

	return properties;
};

const getOneProperty = async ({ landlordId, propertyId }) => {
	// check in cache first
	const cachePropertyKey = `${CacheEntities.PROPERTY}:${CacheIdentifiers.GET_ONE_PROPERTY(propertyId)}`;
	const propertyFromCache = await getDataFromRedis(cachePropertyKey);
	if(propertyFromCache !== null) {
		return propertyFromCache;
	}
	// if not found in cache, fetch from database
	const property = await Property.findOne({
		_id: propertyId,
		landlordId,
	}).select(PROPERTY_SAFE_FIELDS);

	ensurePropertyExists(property);
	await setDataToRedis(cachePropertyKey, property, CacheTTL.PROPERTY_TTL);

	return property;
};

const updateProperty = async ({ landlordId, propertyId, body }) => {
	const updates = buildPropertyUpdates(body);

	const property = await Property.findOneAndUpdate(
		{ _id: propertyId, landlordId },
		updates,
		{ new: true },
	).select(PROPERTY_SAFE_FIELDS);

	ensurePropertyExists(property);

	const cachePropertyKey = `${CacheEntities.PROPERTY}:${CacheIdentifiers.GET_ONE_PROPERTY(propertyId)}`;
	await deleteDataFromRedis(cachePropertyKey);
	const cacheAllPropertiesKey = `${CacheEntities.PROPERTY}:${CacheIdentifiers.GET_ALL_PROPERTIES(landlordId)}`;
	await deleteDataFromRedis(cacheAllPropertiesKey);

	return property;
};

const addIssuesToProperty = async ({ tenantId, propertyId, issuesPayload }) => {
	const property = await Property.findById(propertyId);
	ensurePropertyExists(property);

	const issues = normalizeIssuesPayload(issuesPayload);
	const formattedIssues = formatIssues({ issues, tenantId });
	
	const landlordId = property.landlordId.toString();

	property.issues.push(...formattedIssues);
	await property.save();

	const cachePropertyKey = `${CacheEntities.PROPERTY}:${CacheIdentifiers.GET_ONE_PROPERTY(propertyId)}`;
	await deleteDataFromRedis(cachePropertyKey);
	const cacheAllPropertiesKey = `${CacheEntities.PROPERTY}:${CacheIdentifiers.GET_ALL_PROPERTIES(landlordId)}`;
	await deleteDataFromRedis(cacheAllPropertiesKey);

	return property;
};

const deleteProperty = async ({ landlordId, propertyId, confirmation }) => {
	const property = await Property.findOne({
		_id: propertyId,
		landlordId,
	});
	ensurePropertyExists(property);

	validateDeleteConfirmation({
		confirmation,
		propertyName: property.name,
	});

	await property.deleteOne();

	const cachePropertyKey = `${CacheEntities.PROPERTY}:${CacheIdentifiers.GET_ONE_PROPERTY(propertyId)}`;
	await deleteDataFromRedis(cachePropertyKey);
	const cacheAllPropertiesKey = `${CacheEntities.PROPERTY}:${CacheIdentifiers.GET_ALL_PROPERTIES(landlordId)}`;
	await deleteDataFromRedis(cacheAllPropertiesKey);

	return property;
};


// helper functions
const getAllowedPropertyUpdateFields = () => [
	'name',
	'description',
	'country',
	'state',
	'city',
	'pincode',
	'address',
	'type',
	'rentAmount',
	'depositAmount',
];

const buildPropertyUpdates = (body) => {
	const updates = {};
	const allowedFields = getAllowedPropertyUpdateFields();

	for (const field of allowedFields) {
		if (body[field] !== undefined) {
			updates[field] = body[field];
		}
	}

	return updates;
};

const ensurePropertyExists = (property) => {
	if (!property) {
        logger.error(`Property not found ${property}`);
		throw new ApiError(404, 'Property does not exist');
	}
};

const normalizeIssuesPayload = (issuesPayload) => {
	if (!Array.isArray(issuesPayload)) {
		return [issuesPayload];
	}

	return issuesPayload;
};

const formatIssues = ({ issues, tenantId }) => {
	const allowedFields = ['type', 'description', 'priority'];

	return issues.map((issue) => {
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
};

const validateDeleteConfirmation = ({ confirmation, propertyName }) => {
	if (confirmation.trim() !== `I confirm to delete ${propertyName}`) {
        logger.error(`Delete confirmation failed for property: ${propertyName}, with confirmation: ${confirmation}`);
		throw new ApiError(
			400,
			'Property not deleted as confirmation was not provided',
		);
	}
};

export const propertyService = {
	addProperty,
	getAllProperties,
	getOneProperty,
	updateProperty,
	addIssuesToProperty,
	deleteProperty,
};
