import { Router } from 'express';
import verifyJWT from '../middlewares/auth.middleware.js';
import { propertyDataValidator } from '../validators/property.validator.js';
import { requireLandlordRole } from '../middlewares/property.middleware.js';
import { getAllProperties } from '../controllers/property.controllers.js';
import { getAllActiveTenantsOfProperty } from '../controllers/landlord.controllers.js';

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
    .route('/tenants/:propertyId')
    .get(verifyJWT, requireLandlordRole, getAllActiveTenantsOfProperty);

export default router;
