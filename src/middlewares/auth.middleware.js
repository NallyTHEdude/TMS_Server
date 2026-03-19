import { User } from '../models/user.models.js';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { config } from '../config/index.js';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

const verifyJWT = asyncHandler(async (req, res, next) => {
    const accessToken =
        req.cookies?.accessToken ||
        req.header('Authorization')?.replace('Bearer ', '');
    if (!accessToken) {
        throw new ApiError(401, 'Access token is missing');
    }

    try {
        const decodedToken = jwt.verify(
            accessToken,
            config.ACCESS_TOKEN_SECRET,
        );
        const user = await User.findById(decodedToken?._id).select(
            '-password -refreshToken -emailVerificationToken -emailVerificationExpiry',
        );

        if (!user) {
            throw new ApiError(401, 'Invalid access token');
        }
        req.user = user;
        next();
    } catch (err) {
        logger.error(`Error verifying access token: ${err}`);
        throw new ApiError(401, 'Invalid access token');
    }
});

export default verifyJWT;
