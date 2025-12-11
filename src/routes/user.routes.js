import { Router } from 'express';
import {
    getUserDetails,
    updateUserDetails,
    deleteUserAccount,
    updateUserAvatar,
} from '../controllers/user.controllers.js';
import {
    userDeleteAccountValidator,
    userUpdateValidator,
} from '../validators/user.validators.js';
import verifyJWT from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

// user routes
router.route('/profile').get(verifyJWT, getUserDetails);
router
    .route('/update-details')
    .put(verifyJWT, userUpdateValidator(), updateUserDetails);
router
    .route('/delete-account')
    .delete(verifyJWT, userDeleteAccountValidator(), deleteUserAccount);
router
    .route('/update-avatar')
    .post(verifyJWT, upload.single('avatar'), updateUserAvatar);

export default router;
