import express from 'express';
import {
    getAllPermissions,
    getAllRoles,
    createRole,
    updateRole,
    deleteRole,
    assignUserRole,
    revokeUserRole,
    searchUsersForAssignment,
    getAllStaff,
    getRoleMembers,
    registerStaffMember,
    getUserPermissionProfile,
    revokeUserSpecificPermission,
    restoreUserSpecificPermission,
    grantUserDirectPermission,
    updateUserPermissionOverrides,
} from '../controllers/rbacController.js';
import { verifyJWT, checkPermission } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Require login for all RBAC routes
router.use(verifyJWT);

// Permissions Catalog (View only requires roles.view or roles.manage)
router.get('/permissions', checkPermission('roles.view', 'roles.manage'), getAllPermissions);

// Roles List
router.get('/roles', checkPermission('roles.view', 'roles.manage'), getAllRoles);

// Staff Directory (Excludes applicants & regular students)
router.get('/staff', checkPermission('roles.view', 'roles.manage'), getAllStaff);

// Members of a specific role
router.get('/roles/:roleSlug/members', checkPermission('roles.view', 'roles.manage'), getRoleMembers);

// Fast User Search for Assignment Modal
router.get('/search-users', checkPermission('roles.manage'), searchUsersForAssignment);

// Internal Staff Member Registration (Super Admin & Authorized Authority Only)
router.post('/staff/register', checkPermission('roles.manage'), registerStaffMember);

// Roles CRUD (Requires roles.manage)
router.post('/roles', checkPermission('roles.manage'), createRole);
router.put('/roles/:id', checkPermission('roles.manage'), updateRole);
router.delete('/roles/:id', checkPermission('roles.manage'), deleteRole);

// User Assignment & Full Revocation (Requires roles.manage)
router.post('/users/:userId/assign-role', checkPermission('roles.manage'), assignUserRole);
router.post('/users/:userId/revoke-role', checkPermission('roles.manage'), revokeUserRole);

// Granular Individual User Permissions Management (View & Manage)
router.get('/users/:userId/permissions', checkPermission('roles.view', 'roles.manage'), getUserPermissionProfile);
router.put('/users/:userId/permissions', checkPermission('roles.manage'), updateUserPermissionOverrides);
router.post('/users/:userId/revoke-permission', checkPermission('roles.manage'), revokeUserSpecificPermission);
router.post('/users/:userId/restore-permission', checkPermission('roles.manage'), restoreUserSpecificPermission);
router.post('/users/:userId/grant-permission', checkPermission('roles.manage'), grantUserDirectPermission);

export default router;
