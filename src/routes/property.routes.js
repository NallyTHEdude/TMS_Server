import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {propertyDataValidator, issuesDataValidator} from "../validators/property.validator.js";
import {requireLandlordRole, requireTenantRole} from "../middlewares/property.middleware.js";
import {
    addProperty,
    getAllProperties,
    getOneProperty,
    updateProperty,
    addIssuesToProperty,
    deleteProperty
} from "../controllers/property.controllers.js";


const router = Router();

router.route("/add").post(verifyJWT, requireLandlordRole, propertyDataValidator(), addProperty);
router.route("/all").get(verifyJWT, requireLandlordRole, getAllProperties);
router.route("/:propertyId").get(verifyJWT, getOneProperty);
router.route("/:propertyId/update").put(verifyJWT, requireLandlordRole, propertyDataValidator(), updateProperty);
router.route("/:propertyId/add-issues").post(verifyJWT, requireTenantRole, issuesDataValidator(), addIssuesToProperty);
router.route("/:propertyId/delete").delete(verifyJWT, requireLandlordRole, deleteProperty);

export default router;