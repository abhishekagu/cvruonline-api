import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Computes effective permissions for a user:
 * Effective Permissions = (Role Permissions ∪ Direct Permissions) \ Revoked Permissions
 * Super Admin gets ['*']
 */
export const computeUserPermissions = async (user) => {
    if (!user) return [];

    if (user.role === 'superadmin') {
        return ['*'];
    }

    let rolePermissions = [];

    // If user has a roleRef, populate it
    if (user.roleRef) {
        const roleDoc = await Role.findById(user.roleRef);
        if (roleDoc && Array.isArray(roleDoc.permissions)) {
            rolePermissions = roleDoc.permissions;
        }
    } else if (user.role) {
        // Fallback by role slug
        const roleDoc = await Role.findOne({ slug: user.role });
        if (roleDoc && Array.isArray(roleDoc.permissions)) {
            rolePermissions = roleDoc.permissions;
        }
    }

    const direct = user.directPermissions || [];
    const revoked = new Set(user.revokedPermissions || []);

    // Combine role permissions + direct permissions, and exclude revoked
    const combined = new Set([...rolePermissions, ...direct]);
    return Array.from(combined).filter((perm) => !revoked.has(perm));
};

/**
 * Middleware to verify JWT token and attach user + effective permissions to req
 */
export const verifyJWT = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        throw new ApiError(401, 'You are not logged in! Please log in to get access.');
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'super-secret-default-key-for-cvru-online-must-change'
        );

        const currentUser = await User.findById(decoded.id).populate('roleRef');
        if (!currentUser) {
            throw new ApiError(401, 'The user belonging to this token does no longer exist.');
        }

        // Attach user
        req.user = currentUser;

        // Compute and attach permissions
        const permissions = await computeUserPermissions(currentUser);
        req.user.permissions = permissions;
        req.user.isSuperAdmin = currentUser.role === 'superadmin' || permissions.includes('*');

        next();
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(401, 'Invalid or expired token. Please log in again.');
    }
});

/**
 * Middleware to restrict access to specific roles.
 * Super Admin always has full bypass.
 */
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (req.user?.isSuperAdmin || req.user?.role === 'superadmin' || req.user?.permissions?.includes('*')) {
            return next();
        }

        if (!roles.includes(req.user.role)) {
            return next(
                new ApiError(403, 'You do not have permission to perform this action.')
            );
        }
        next();
    };
};

/**
 * Middleware to check if the authenticated user has the required permission(s).
 * If any of the passed permissions are held by the user (or user is Super Admin), access is granted.
 * 
 * @param  {...string} requiredPermissions
 */
export const checkPermission = (...requiredPermissions) => {
    return (req, res, next) => {
        // Super Admin bypasses all checks
        if (req.user?.isSuperAdmin || req.user?.role === 'superadmin') {
            return next();
        }

        const userPerms = req.user?.permissions || [];

        // Check if wildcard or matches at least one of the required permissions
        const hasAccess =
            userPerms.includes('*') ||
            requiredPermissions.some((perm) => userPerms.includes(perm));

        if (!hasAccess) {
            return next(
                new ApiError(
                    403,
                    `Access denied. You lack the required permission: ${requiredPermissions.join(' or ')}`
                )
            );
        }

        next();
    };
};
