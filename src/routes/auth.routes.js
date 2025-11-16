import { Router } from "express";
import { registerUser, login, logoutUser, verifyEmail, refreshAccessToken, forgotPasswordRequest, resetPassword, changeCurrentPassword, resendEmailVerification } from "../controllers/auth.controllers.js";
import { validate } from "../middlewares/validator.middleware.js";
import {userRegisterValidator, userLoginValidator, userForgotPasswordValidator, userResetPasswordValidator, userChangeCurrentPasswordValidator} from "../validators/auth.validators.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

//unsecured routes
router.route('/register').post(userRegisterValidator(), validate, registerUser);
router.route('/login').post(userLoginValidator(), validate, login);
router.route('/verify-email/:verificationToken').get(verifyEmail); // route is being hit via link in email in registeration mail
router.route('/refresh-token').post(refreshAccessToken);
router.route('/forgot-password').post(userForgotPasswordValidator(), validate, forgotPasswordRequest);
router.route('/reset-password/:resetToken').post(userResetPasswordValidator(), validate, resetPassword);



//secure routes
router.route('/logout').post(verifyJWT, logoutUser);
router.route('/change-password').post(verifyJWT, userChangeCurrentPasswordValidator(), validate, changeCurrentPassword);
router.route('/resend-email-verification').post(verifyJWT,resendEmailVerification);

export default router;