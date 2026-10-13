import Permission from '../models/Permission.js';
import Role from '../models/Role.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { logWorkActivity } from '../utils/workLogger.js';
import { computeUserPermissions } from '../middlewares/authMiddleware.js';
import { syncRoutePermissions } from '../utils/routePermissionSyncer.js';

// @desc    Get all available system permissions grouped by category
// @route   GET /api/admin/rbac/permissions
// @access  Private (Admin / Roles View)
export const getAllPermissions = asyncHandler(async (req, res) => {
    // JIT auto-sync: Automatically checks code-defined routes and provisions missing permissions in MongoDB
    await syncRoutePermissions();

    const permissions = await Permission.find().sort({ category: 1, name: 1 });

    // Group permissions by category for cleaner UI rendering
    const grouped = permissions.reduce((acc, perm) => {
        const cat = perm.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(perm);
        return acc;
    }, {});

    res.status(200).json(
        new ApiResponse(200, { permissions, grouped }, 'Permissions fetched successfully')
    );
});

// @desc    Get all roles with user assignment counts
// @route   GET /api/admin/rbac/roles
// @access  Private (Admin / Roles View)
export const getAllRoles = asyncHandler(async (req, res) => {
    const roles = await Role.find().sort({ isSystem: -1, createdAt: 1 });

    // Enrich each role with the count of active assigned users
    const rolesWithCounts = await Promise.all(
        roles.map(async (role) => {
            const userCount = await User.countDocuments({
                $or: [{ role: role.slug }, { roleRef: role._id }],
            });
            const roleObj = role.toObject();
            roleObj.userCount = userCount;
            return roleObj;
        })
    );

    res.status(200).json(
        new ApiResponse(200, { roles: rolesWithCounts }, 'Roles fetched successfully')
    );
});

// @desc    Create a new custom role
// @route   POST /api/admin/rbac/roles
// @access  Private (Admin / Roles Manage)
export const createRole = asyncHandler(async (req, res) => {
    const { name, slug, description, permissions } = req.body;

    if (!name || !name.trim()) {
        throw new ApiError(400, 'Role name is required');
    }

    const generatedSlug = (slug || name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

    if (['superadmin', 'applicant'].includes(generatedSlug)) {
        throw new ApiError(400, `The role slug "${generatedSlug}" is reserved.`);
    }

    const existingRole = await Role.findOne({
        $or: [{ name: name.trim() }, { slug: generatedSlug }],
    });

    if (existingRole) {
        throw new ApiError(409, 'A role with this name or slug already exists');
    }

    const newRole = await Role.create({
        name: name.trim(),
        slug: generatedSlug,
        description: description?.trim() || '',
        permissions: Array.isArray(permissions) ? permissions : [],
        isSystem: false,
        createdBy: req.user._id,
    });

    // Log the creation
    await logWorkActivity({
        actionType: 'ROLE_CREATED',
        module: 'RBAC',
        performedBy: req.user._id,
        targetEntityId: newRole._id,
        title: `Role "${newRole.name}" created`,
        details: {
            slug: newRole.slug,
            permissionsCount: newRole.permissions.length,
            permissions: newRole.permissions,
        },
        req,
    });

    res.status(201).json(
        new ApiResponse(201, { role: newRole }, `Role "${newRole.name}" created successfully`)
    );
});

// @desc    Update role details & permissions
// @route   PUT /api/admin/rbac/roles/:id
// @access  Private (Admin / Roles Manage)
export const updateRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const role = await Role.findById(id);
    if (!role) {
        throw new ApiError(404, 'Role not found');
    }

    // Protect superadmin role definition from tampering
    if (role.slug === 'superadmin') {
        throw new ApiError(403, 'Super Admin system role permissions are immutable');
    }

    const previousState = {
        name: role.name,
        permissions: [...role.permissions],
    };

    if (name && name.trim()) role.name = name.trim();
    if (description !== undefined) role.description = description.trim();
    if (Array.isArray(permissions)) role.permissions = permissions;

    await role.save();

    // Log the update
    await logWorkActivity({
        actionType: 'ROLE_UPDATED',
        module: 'RBAC',
        performedBy: req.user._id,
        targetEntityId: role._id,
        title: `Role "${role.name}" updated`,
        details: {
            previousState,
            newState: {
                name: role.name,
                permissions: role.permissions,
            },
        },
        req,
    });

    res.status(200).json(
        new ApiResponse(200, { role }, `Role "${role.name}" updated successfully`)
    );
});

// @desc    Delete custom role
// @route   DELETE /api/admin/rbac/roles/:id
// @access  Private (Admin / Roles Manage)
export const deleteRole = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const role = await Role.findById(id);
    if (!role) {
        throw new ApiError(404, 'Role not found');
    }

    if (role.isSystem) {
        throw new ApiError(400, 'System default roles cannot be deleted');
    }

    // Check if any users currently have this role
    const assignedUsersCount = await User.countDocuments({
        $or: [{ role: role.slug }, { roleRef: role._id }],
    });

    if (assignedUsersCount > 0) {
        throw new ApiError(
            400,
            `Cannot delete role "${role.name}" because ${assignedUsersCount} active user(s) are assigned to it. Please reassign them first.`
        );
    }

    await Role.findByIdAndDelete(id);

    // Log deletion
    await logWorkActivity({
        actionType: 'ROLE_DELETED',
        module: 'RBAC',
        performedBy: req.user._id,
        targetEntityId: id,
        title: `Role "${role.name}" deleted`,
        details: { slug: role.slug },
        req,
    });

    res.status(200).json(
        new ApiResponse(200, null, `Role "${role.name}" deleted successfully`)
    );
});

// @desc    Assign role and permissions to any user
// @route   POST /api/admin/rbac/users/:userId/assign-role
// @access  Private (Admin / Roles Manage)
export const assignUserRole = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { roleId, roleSlug, directPermissions, revokedPermissions, reason } = req.body;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
        throw new ApiError(404, 'User not found');
    }

    // Lookup Role
    let role;
    if (roleId) {
        role = await Role.findById(roleId);
    } else if (roleSlug) {
        role = await Role.findOne({ slug: roleSlug });
    }

    if (!role) {
        throw new ApiError(400, 'Valid Role ID or slug is required');
    }

    // Safety checks: Only existing Super Admin can grant Super Admin role
    if (role.slug === 'superadmin' && !req.user.isSuperAdmin) {
        throw new ApiError(403, 'Only a Super Admin can promote another user to Super Admin');
    }

    // Protect primary super admin from being modified by non-superadmins
    if (targetUser.role === 'superadmin' && !req.user.isSuperAdmin) {
        throw new ApiError(403, 'Cannot modify Super Admin privileges');
    }

    const previousState = {
        role: targetUser.role,
        roleRef: targetUser.roleRef,
        directPermissions: targetUser.directPermissions || [],
        revokedPermissions: targetUser.revokedPermissions || [],
    };

    targetUser.role = role.slug;
    targetUser.roleRef = role._id;
    targetUser.directPermissions = Array.isArray(directPermissions) ? directPermissions : [];
    targetUser.revokedPermissions = Array.isArray(revokedPermissions) ? revokedPermissions : [];
    targetUser.assignedBy = req.user._id;
    targetUser.assignedAt = new Date();

    await targetUser.save();

    // Log the assignment
    await logWorkActivity({
        actionType: 'ROLE_ASSIGNED',
        module: 'RBAC',
        performedBy: req.user._id,
        targetUser: targetUser._id,
        targetEntityId: String(role._id),
        title: `Role "${role.name}" assigned to ${targetUser.firstName} ${targetUser.lastName}`,
        details: {
            targetEmail: targetUser.email,
            previousRole: previousState.role,
            newRole: role.slug,
            directPermissions: targetUser.directPermissions,
            revokedPermissions: targetUser.revokedPermissions,
            reason: reason || 'Assigned by administrator',
        },
        req,
    });

    res.status(200).json(
        new ApiResponse(
            200,
            { user: targetUser },
            `Successfully assigned role "${role.name}" to ${targetUser.firstName} ${targetUser.lastName}`
        )
    );
});

// @desc    Revoke administrative role and revert user to applicant
// @route   POST /api/admin/rbac/users/:userId/revoke-role
// @access  Private (Admin / Roles Manage)
export const revokeUserRole = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { reason } = req.body;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
        throw new ApiError(404, 'User not found');
    }

    // Safety checks: Cannot revoke Super Admin root user
    if (targetUser.role === 'superadmin' && String(targetUser._id) === String(req.user._id)) {
        throw new ApiError(400, 'You cannot revoke your own Super Admin access');
    }

    if (targetUser.role === 'superadmin' && !req.user.isSuperAdmin) {
        throw new ApiError(403, 'Only a Super Admin can revoke Super Admin privileges');
    }

    const previousRole = targetUser.role;

    targetUser.role = 'applicant';
    targetUser.roleRef = undefined;
    targetUser.directPermissions = [];
    targetUser.revokedPermissions = [];
    targetUser.assignedBy = req.user._id;
    targetUser.assignedAt = new Date();

    await targetUser.save();

    // Log revocation
    await logWorkActivity({
        actionType: 'ROLE_REVOKED',
        module: 'RBAC',
        performedBy: req.user._id,
        targetUser: targetUser._id,
        title: `Administrative role revoked from ${targetUser.firstName} ${targetUser.lastName}`,
        details: {
            targetEmail: targetUser.email,
            previousRole,
            newRole: 'applicant',
            reason: reason || 'Revoked by administrator',
        },
        req,
    });

    res.status(200).json(
        new ApiResponse(
            200,
            { user: targetUser },
            `Role revoked. ${targetUser.firstName} ${targetUser.lastName} reverted to applicant status.`
        )
    );
});

// @desc    Quick user search for Super Admin assignment
// @route   GET /api/admin/rbac/search-users
// @access  Private (Admin / Roles Manage)
export const searchUsersForAssignment = asyncHandler(async (req, res) => {
    const query = req.query.q?.trim();
    if (!query || query.length < 2) {
        return res.status(200).json(new ApiResponse(200, { users: [] }, 'Query too short'));
    }

    const searchRegex = new RegExp(query, 'i');
    const users = await User.find({
        $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex },
            { phone: searchRegex },
            { enrollmentNo: searchRegex },
        ],
    })
        .select('firstName lastName email phone role enrollmentNo')
        .limit(10);

    res.status(200).json(new ApiResponse(200, { users }, 'Users found successfully'));
});

// @desc    Get all staff & management members (excluding regular applicants/students)
// @route   GET /api/admin/rbac/staff
// @access  Private (Admin / Roles View)
export const getAllStaff = asyncHandler(async (req, res) => {
    const staff = await User.find({
        role: { $nin: ['applicant', 'student'] },
    })
        .select('firstName lastName email phone role roleRef directPermissions revokedPermissions assignedBy assignedAt createdAt')
        .populate('roleRef', 'name slug permissions')
        .populate('assignedBy', 'firstName lastName email')
        .sort('-createdAt');

    res.status(200).json(
        new ApiResponse(200, { staff }, 'Staff members fetched successfully')
    );
});

// @desc    Get members assigned to a specific role
// @route   GET /api/admin/rbac/roles/:roleSlug/members
// @access  Private (Admin / Roles View)
export const getRoleMembers = asyncHandler(async (req, res) => {
    const { roleSlug } = req.params;
    const role = await Role.findOne({ slug: roleSlug });
    const query = role
        ? { $or: [{ role: roleSlug }, { roleRef: role._id }] }
        : { role: roleSlug };

    const members = await User.find(query)
        .select('firstName lastName email phone role createdAt assignedAt assignedBy')
        .populate('assignedBy', 'firstName lastName email')
        .sort('-createdAt');

    res.status(200).json(
        new ApiResponse(200, { members, role }, 'Role members fetched successfully')
    );
});

// @desc    Register a new staff member internally (Super Admin or authorized authority only)
// @route   POST /api/admin/rbac/staff/register
// @access  Private (Admin / Roles Manage)
export const registerStaffMember = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone, password, roleSlug, roleId, directPermissions, reason } = req.body;

    if (!firstName || !lastName || !email || !phone || !password || (!roleSlug && !roleId)) {
        throw new ApiError(400, 'Please provide all required fields: first name, last name, email, phone, password, and designated role.');
    }

    if (password.length < 8) {
        throw new ApiError(400, 'Staff password must be at least 8 characters long');
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone.trim();

    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ email: cleanEmail }, { phone: cleanPhone }],
    });

    if (existingUser) {
        throw new ApiError(409, `A user with email ${cleanEmail} or phone ${cleanPhone} already exists in the system.`);
    }

    // Lookup Role
    let role;
    if (roleId) {
        role = await Role.findById(roleId);
    } else if (roleSlug) {
        role = await Role.findOne({ slug: roleSlug });
    }

    if (!role) {
        throw new ApiError(400, 'Invalid role specified for staff member');
    }

    // Only existing Super Admin can register another Super Admin
    if (role.slug === 'superadmin' && !req.user.isSuperAdmin) {
        throw new ApiError(403, 'Only a Super Admin can appoint or register another Super Admin');
    }

    // Create staff user directly with verified status
    const newStaff = await User.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        password,
        role: role.slug,
        roleRef: role._id,
        directPermissions: Array.isArray(directPermissions) ? directPermissions : [],
        assignedBy: req.user._id,
        assignedAt: new Date(),
        isVerified: true,
    });

    newStaff.password = undefined;

    // Log the internal staff registration
    await logWorkActivity({
        actionType: 'STAFF_REGISTERED',
        module: 'RBAC',
        performedBy: req.user._id,
        targetUser: newStaff._id,
        title: `Staff member "${newStaff.firstName} ${newStaff.lastName}" registered with role "${role.name}"`,
        details: {
            email: newStaff.email,
            phone: newStaff.phone,
            role: role.slug,
            reason: reason || 'Staff account created internally by administration',
        },
        req,
    });

    res.status(201).json(
        new ApiResponse(
            201,
            { user: newStaff },
            `Staff member ${newStaff.firstName} ${newStaff.lastName} registered successfully as ${role.name}`
        )
    );
});

// @desc    Get detailed permissions profile for a specific user (role + direct + revoked)
// @route   GET /api/admin/rbac/users/:userId/permissions
// @access  Private (Admin / Roles View)
export const getUserPermissionProfile = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const targetUser = await User.findById(userId)
        .select('firstName lastName email phone role roleRef directPermissions revokedPermissions assignedBy assignedAt isVerified')
        .populate('roleRef', 'name slug permissions isSystem description')
        .populate('assignedBy', 'firstName lastName email');

    if (!targetUser) {
        throw new ApiError(404, 'User not found');
    }

    let roleDoc = targetUser.roleRef;
    if (!roleDoc && targetUser.role) {
        roleDoc = await Role.findOne({ slug: targetUser.role });
    }

    const rolePermissions = roleDoc?.permissions || [];
    const directPermissions = targetUser.directPermissions || [];
    const revokedPermissions = targetUser.revokedPermissions || [];
    const effectivePermissions = await computeUserPermissions(targetUser);
    const allPermissions = await Permission.find().sort({ category: 1, name: 1 });

    res.status(200).json(
        new ApiResponse(
            200,
            {
                user: targetUser,
                role: roleDoc,
                rolePermissions,
                directPermissions,
                revokedPermissions,
                effectivePermissions,
                allPermissions,
            },
            'User permissions profile retrieved successfully'
        )
    );
});

// @desc    Revoke a specific permission from a specific user
// @route   POST /api/admin/rbac/users/:userId/revoke-permission
// @access  Private (Admin / Roles Manage)
export const revokeUserSpecificPermission = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { permissionSlug, reason } = req.body;

    if (!permissionSlug || !permissionSlug.trim()) {
        throw new ApiError(400, 'Permission slug is required to revoke');
    }

    const cleanSlug = permissionSlug.trim();

    const targetUser = await User.findById(userId);
    if (!targetUser) {
        throw new ApiError(404, 'User not found');
    }

    // Safety check: Cannot revoke permissions from root superadmin
    if (targetUser.role === 'superadmin') {
        throw new ApiError(400, 'Permissions cannot be revoked from a Super Administrator');
    }

    // Ensure permission exists in system catalog
    const permExists = await Permission.findOne({ slug: cleanSlug });
    const permName = permExists ? permExists.name : cleanSlug;

    const previousRevoked = [...(targetUser.revokedPermissions || [])];

    // Remove from directPermissions if present
    if (Array.isArray(targetUser.directPermissions)) {
        targetUser.directPermissions = targetUser.directPermissions.filter((p) => p !== cleanSlug);
    }

    // Add to revokedPermissions if not already present
    if (!targetUser.revokedPermissions) {
        targetUser.revokedPermissions = [];
    }
    if (!targetUser.revokedPermissions.includes(cleanSlug)) {
        targetUser.revokedPermissions.push(cleanSlug);
    }

    targetUser.assignedBy = req.user._id;
    targetUser.assignedAt = new Date();
    await targetUser.save();

    // Log the revocation in immutable audit trail
    await logWorkActivity({
        actionType: 'USER_PERMISSION_REVOKED',
        module: 'RBAC',
        performedBy: req.user._id,
        targetUser: targetUser._id,
        targetEntityId: cleanSlug,
        title: `Permission "${permName}" revoked from ${targetUser.firstName} ${targetUser.lastName}`,
        details: {
            targetEmail: targetUser.email,
            permissionSlug: cleanSlug,
            permissionName: permName,
            previousRevoked,
            newRevoked: targetUser.revokedPermissions,
            reason: reason || 'Permission revoked by administrator',
        },
        req,
    });

    const effectivePermissions = await computeUserPermissions(targetUser);

    res.status(200).json(
        new ApiResponse(
            200,
            {
                user: targetUser,
                directPermissions: targetUser.directPermissions,
                revokedPermissions: targetUser.revokedPermissions,
                effectivePermissions,
            },
            `Permission "${permName}" successfully revoked from ${targetUser.firstName} ${targetUser.lastName}`
        )
    );
});

// @desc    Restore a previously revoked permission for a specific user
// @route   POST /api/admin/rbac/users/:userId/restore-permission
// @access  Private (Admin / Roles Manage)
export const restoreUserSpecificPermission = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { permissionSlug, reason } = req.body;

    if (!permissionSlug || !permissionSlug.trim()) {
        throw new ApiError(400, 'Permission slug is required to restore');
    }

    const cleanSlug = permissionSlug.trim();

    const targetUser = await User.findById(userId);
    if (!targetUser) {
        throw new ApiError(404, 'User not found');
    }

    const permExists = await Permission.findOne({ slug: cleanSlug });
    const permName = permExists ? permExists.name : cleanSlug;

    const previousRevoked = [...(targetUser.revokedPermissions || [])];

    // Remove from revokedPermissions
    targetUser.revokedPermissions = (targetUser.revokedPermissions || []).filter(
        (p) => p !== cleanSlug
    );
    targetUser.assignedBy = req.user._id;
    targetUser.assignedAt = new Date();
    await targetUser.save();

    // Log the restoration in immutable audit trail
    await logWorkActivity({
        actionType: 'USER_PERMISSION_RESTORED',
        module: 'RBAC',
        performedBy: req.user._id,
        targetUser: targetUser._id,
        targetEntityId: cleanSlug,
        title: `Permission "${permName}" restored for ${targetUser.firstName} ${targetUser.lastName}`,
        details: {
            targetEmail: targetUser.email,
            permissionSlug: cleanSlug,
            permissionName: permName,
            previousRevoked,
            newRevoked: targetUser.revokedPermissions,
            reason: reason || 'Permission restored by administrator',
        },
        req,
    });

    const effectivePermissions = await computeUserPermissions(targetUser);

    res.status(200).json(
        new ApiResponse(
            200,
            {
                user: targetUser,
                directPermissions: targetUser.directPermissions,
                revokedPermissions: targetUser.revokedPermissions,
                effectivePermissions,
            },
            `Permission "${permName}" successfully restored for ${targetUser.firstName} ${targetUser.lastName}`
        )
    );
});

// @desc    Grant an additional direct permission to a specific user
// @route   POST /api/admin/rbac/users/:userId/grant-permission
// @access  Private (Admin / Roles Manage)
export const grantUserDirectPermission = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { permissionSlug, reason } = req.body;

    if (!permissionSlug || !permissionSlug.trim()) {
        throw new ApiError(400, 'Permission slug is required to grant');
    }

    const cleanSlug = permissionSlug.trim();

    const targetUser = await User.findById(userId);
    if (!targetUser) {
        throw new ApiError(404, 'User not found');
    }

    const permExists = await Permission.findOne({ slug: cleanSlug });
    const permName = permExists ? permExists.name : cleanSlug;

    // Remove from revoked if present
    targetUser.revokedPermissions = (targetUser.revokedPermissions || []).filter(
        (p) => p !== cleanSlug
    );

    // Add to directPermissions if not present
    if (!targetUser.directPermissions) targetUser.directPermissions = [];
    if (!targetUser.directPermissions.includes(cleanSlug)) {
        targetUser.directPermissions.push(cleanSlug);
    }

    targetUser.assignedBy = req.user._id;
    targetUser.assignedAt = new Date();
    await targetUser.save();

    await logWorkActivity({
        actionType: 'PERMISSIONS_UPDATED',
        module: 'RBAC',
        performedBy: req.user._id,
        targetUser: targetUser._id,
        targetEntityId: cleanSlug,
        title: `Extra permission "${permName}" granted to ${targetUser.firstName} ${targetUser.lastName}`,
        details: {
            targetEmail: targetUser.email,
            permissionSlug: cleanSlug,
            permissionName: permName,
            directPermissions: targetUser.directPermissions,
            reason: reason || 'Additional permission granted by administrator',
        },
        req,
    });

    const effectivePermissions = await computeUserPermissions(targetUser);

    res.status(200).json(
        new ApiResponse(
            200,
            {
                user: targetUser,
                directPermissions: targetUser.directPermissions,
                revokedPermissions: targetUser.revokedPermissions,
                effectivePermissions,
            },
            `Permission "${permName}" granted to ${targetUser.firstName} ${targetUser.lastName}`
        )
    );
});

// @desc    Save both direct and revoked permissions overrides for a user in one step
// @route   PUT /api/admin/rbac/users/:userId/permissions
// @access  Private (Admin / Roles Manage)
export const updateUserPermissionOverrides = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { directPermissions, revokedPermissions, reason } = req.body;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
        throw new ApiError(404, 'User not found');
    }

    if (targetUser.role === 'superadmin') {
        throw new ApiError(400, 'Cannot override permissions for Super Administrator');
    }

    const previousDirect = targetUser.directPermissions || [];
    const previousRevoked = targetUser.revokedPermissions || [];

    targetUser.directPermissions = Array.isArray(directPermissions) ? directPermissions : [];
    targetUser.revokedPermissions = Array.isArray(revokedPermissions) ? revokedPermissions : [];
    targetUser.assignedBy = req.user._id;
    targetUser.assignedAt = new Date();

    await targetUser.save();

    await logWorkActivity({
        actionType: 'PERMISSIONS_UPDATED',
        module: 'RBAC',
        performedBy: req.user._id,
        targetUser: targetUser._id,
        title: `Custom permissions updated for ${targetUser.firstName} ${targetUser.lastName}`,
        details: {
            targetEmail: targetUser.email,
            previousDirect,
            previousRevoked,
            newDirect: targetUser.directPermissions,
            newRevoked: targetUser.revokedPermissions,
            reason: reason || 'Custom permissions updated by administrator',
        },
        req,
    });

    const effectivePermissions = await computeUserPermissions(targetUser);

    res.status(200).json(
        new ApiResponse(
            200,
            {
                user: targetUser,
                directPermissions: targetUser.directPermissions,
                revokedPermissions: targetUser.revokedPermissions,
                effectivePermissions,
            },
            `Permissions updated successfully for ${targetUser.firstName} ${targetUser.lastName}`
        )
    );
});

// @desc    Trigger explicit synchronization of code routes to permissions
// @route   POST /api/admin/rbac/sync-routes
// @access  Private (Admin / Roles View or Manage)
export const syncCodeRoutesToPermissions = asyncHandler(async (req, res) => {
    const { pages } = req.body || {};
    const result = await syncRoutePermissions(pages, req.user?._id);

    res.status(200).json(
        new ApiResponse(200, result, 'Route permissions synchronized successfully from code')
    );
});


