import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {propertyDataValidator, issuesDataValidator} from "../validators/property.validator.js";
import {
    addProperty,
    getAllProperties,
    getOneProperty,
    updateProperty,
    addIssuesToProperty,
    deleteProperty
} from "../controllers/property.controllers.js";


const router = Router();

router.route("/add").post(propertyDataValidator(), verifyJWT, addProperty);
router.route("/all").get(verifyJWT, getAllProperties);
router.route("/:propertyId").get(verifyJWT, getOneProperty);
router.route("/:propertyId/update").put(propertyDataValidator(), verifyJWT, updateProperty);
router.route("/:propertyId/add-issues").post(issuesDataValidator(), verifyJWT, addIssuesToProperty);
router.route("/:propertyId/delete").delete(verifyJWT, deleteProperty);

export default router;