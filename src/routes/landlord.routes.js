import { Router } from 'express';
import verifyJWT from '../middlewares/auth.middleware.js';
import {
    propertyDataValidator,
    filterPropertiesValidator,
} from '../validators/property.validator.js';
import { requireLandlordRole } from '../middlewares/property.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import { getAllProperties } from '../controllers/property.controllers.js';
import {
    getAllActiveTenantsOfProperty,
    filterProperties,
} from '../controllers/landlord.controllers.js';

const router = Router();

router
    .route('/properties')
    .get(
        verifyJWT,
        requireLandlordRole,
        propertyDataValidator(),
        getAllProperties,
    );

router
    .route('/properties/filter')
    .get(
        verifyJWT,
        requireLandlordRole,
        filterPropertiesValidator(),
        validate,
        filterProperties,
    );

router
    .route('/tenants/:propertyId')
    .get(verifyJWT, requireLandlordRole, getAllActiveTenantsOfProperty);

export default router;
