import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Middleware to verify JWT token and protect routes
 */
export const verifyJWT = asyncHandler(async (req, res, next) => {
    let token;

    // 1. Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        throw new ApiError(401, 'You are not logged in! Please log in to get access.');
    }

    try {
        // 2. Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'super-secret-default-key-for-cvru-online-must-change'
        );

        // 3. Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            throw new ApiError(401, 'The user belonging to this token does no longer exist.');
        }

        // Grant access to protected route and attach user to request object
        req.user = currentUser;
        next();
    } catch (error) {
        throw new ApiError(401, 'Invalid or expired token. Please log in again.');
    }
});

/**
 * Middleware to restrict access to specific roles
 * @param  {...string} roles - Array of allowed roles (e.g., 'admin', 'faculty')
 */
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new ApiError(403, 'You do not have permission to perform this action.')
            );
        }
        next();
    };
};
