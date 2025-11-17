import { Router } from 'express';
import verifyJWT from '../middlewares/auth.middleware.js';
import { requireTenantRole, requireLandlordRole } from '../middlewares/property.middleware.js';
import { upload } from "../middlewares/multer.middleware.js";
import{
    assignTenantToProperty,
    getAllTenantsOfProperty,
    getTenantKYCStatus,
    applyKYCVerification,
    removeTenantFromProperty,
    getTenantDetails
} from '../controllers/tenant.controllers.js';

const router = Router();

router.route('/assign-property/:userId').post(verifyJWT, requireLandlordRole, assignTenantToProperty);
router.route('/property/:propertyId').get(verifyJWT, requireTenantRole, getAllTenantsOfProperty);
router.route('/kyc-status/:tenantId').get(verifyJWT, requireTenantRole, getTenantKYCStatus);
router.route('/kyc-verify').post(verifyJWT, requireTenantRole, upload.single('kycDoc'), applyKYCVerification);
router.route('/remove/:tenantId').post(verifyJWT, requireLandlordRole,removeTenantFromProperty);
router.route('/profile').get(verifyJWT, requireTenantRole, getTenantDetails);

export default router;