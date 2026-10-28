import mongoose from 'mongoose';
import WorkLog from '../models/WorkLog.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

// @desc    Get paginated work and audit logs with rich filters and role-scoped visibility
// @route   GET /api/admin/work-logs
// @access  Private (Admin / SuperAdmin / Authorized Staff)
export const getWorkLogs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Role-Based Visibility Scoping:
    // 1. Super Admin: Unrestricted (sees all logs across entire university system)
    // 2. Admin: Can see staff logs and own logs, but CANNOT see logs of other Admins or Super Admins
    // 3. Others (staff/counselors/etc.): Can ONLY see their own logs (performedBy == req.user._id)
    const isSuperAdmin = Boolean(req.user.isSuperAdmin || req.user.role === 'superadmin');
    const isAdmin = Boolean(req.user.role === 'admin' || req.user.roleRef?.slug === 'admin');

    const query = {};
    let roleScopeFilter = {};

    if (isSuperAdmin) {
        // Super Admin has full system-wide visibility
        roleScopeFilter = {};
    } else if (isAdmin) {
        // Admin cannot see logs performed by other Admins or Super Admins
        const otherAdmins = await User.find({
            $or: [
                { role: 'superadmin' },
                { role: 'admin', _id: { $ne: req.user._id } },
            ],
        }).select('_id');
        const excludedUserIds = otherAdmins.map((u) => u._id);

        // Allow staff logs, current admin's own logs, and system automated tasks (performedBy: null)
        roleScopeFilter = {
            $or: [
                { performedBy: { $nin: excludedUserIds } },
                { performedBy: null, isSystemAction: true },
            ],
        };
    } else {
        // Others can ONLY see their own work logs
        roleScopeFilter = { performedBy: req.user._id };
    }

    // Apply base role scope filter
    Object.assign(query, roleScopeFilter);

    // Filter by high-level category tab ('rbac' | 'cms' | 'operational' | 'all')
    if (req.query.category) {
        if (req.query.category === 'rbac') {
            query.module = 'RBAC';
        } else if (req.query.category === 'cms') {
            query.module = 'CMS';
        } else if (req.query.category === 'operational') {
            query.module = { $nin: ['RBAC', 'CMS'] };
        }
    }

    // Specific module filter takes precedence if provided
    if (req.query.module) {
        query.module = req.query.module;
    }

    if (req.query.actionType) {
        query.actionType = req.query.actionType;
    }

    if (req.query.performedBy) {
        if (!isSuperAdmin && !isAdmin) {
            // Non-admin can only see their own logs
            query.performedBy = req.user._id;
        } else if (isAdmin) {
            // Admin cannot request logs of other admins or superadmins
            const requestedUser = await User.findById(req.query.performedBy).select('role');
            if (
                requestedUser &&
                (requestedUser.role === 'superadmin' ||
                    (requestedUser.role === 'admin' && String(requestedUser._id) !== String(req.user._id)))
            ) {
                // Return no results
                query.performedBy = new mongoose.Types.ObjectId();
            } else {
                query.performedBy = req.query.performedBy;
            }
        } else {
            query.performedBy = req.query.performedBy;
        }
    }

    if (req.query.targetUser) {
        query.targetUser = req.query.targetUser;
    }

    if (req.query.search) {
        const escapedSearch = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(escapedSearch, 'i');

        // Look up users whose names, email, phone, or enrollment match the query
        const matchingUsers = await User.find({
            $or: [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { email: searchRegex },
                { enrollmentNo: searchRegex },
                { phone: searchRegex },
            ],
        }).select('_id');
        const matchingUserIds = matchingUsers.map((u) => u._id);

        const searchConditions = [
            { title: searchRegex },
            { targetEntityId: searchRegex },
            { actionType: searchRegex },
            { module: searchRegex },
            { 'details.reason': searchRegex },
            { 'details.targetEmail': searchRegex },
            { 'details.enrollmentNumber': searchRegex },
            { 'details.transactionId': searchRegex },
            { 'details.referenceNumber': searchRegex },
            { 'details.slug': searchRegex },
            { 'details.name': searchRegex },
            { 'details.email': searchRegex },
            { 'details.remarks': searchRegex },
            { 'details.adminRemarks': searchRegex },
            { 'details.submitNote': searchRegex },
            { 'details.submitterNote': searchRegex },
        ];

        if (matchingUserIds.length > 0) {
            searchConditions.push(
                { performedBy: { $in: matchingUserIds } },
                { targetUser: { $in: matchingUserIds } }
            );
        }

        if (query.$or) {
            query.$and = [
                { $or: query.$or },
                { $or: searchConditions },
            ];
            delete query.$or;
        } else {
            query.$or = searchConditions;
        }
    }

    if (req.query.startDate || req.query.endDate) {
        query.createdAt = {};
        if (req.query.startDate) {
            query.createdAt.$gte = new Date(req.query.startDate);
        }
        if (req.query.endDate) {
            const end = new Date(req.query.endDate);
            end.setHours(23, 59, 59, 999);
            query.createdAt.$lte = end;
        }
    }

    // Sort order
    const sortField = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = {};
    if (['createdAt', 'actionType', 'module', 'title'].includes(sortField)) {
        sort[sortField] = sortOrder;
    } else {
        sort.createdAt = -1;
    }

    const [logs, total] = await Promise.all([
        WorkLog.find(query)
            .populate('performedBy', 'firstName lastName email phone role enrollmentNo')
            .populate('targetUser', 'firstName lastName email phone role enrollmentNo')
            .sort(sort)
            .skip(skip)
            .limit(limit),
        WorkLog.countDocuments(query),
    ]);

    // Aggregate key stats for dashboard cards (strictly scoped to user's permitted visibility)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [overallTotalCount, todayCount, rbacCount, cmsCount, operationalCount] = await Promise.all([
        WorkLog.countDocuments(roleScopeFilter),
        WorkLog.countDocuments({ ...roleScopeFilter, createdAt: { $gte: startOfToday } }),
        WorkLog.countDocuments({ ...roleScopeFilter, module: 'RBAC' }),
        WorkLog.countDocuments({ ...roleScopeFilter, module: 'CMS' }),
        WorkLog.countDocuments({ ...roleScopeFilter, module: { $nin: ['RBAC', 'CMS'] } }),
    ]);

    res.status(200).json(
        new ApiResponse(
            200,
            {
                logs,
                total,
                page,
                pages: Math.ceil(total / limit),
                limit,
                userScope: isSuperAdmin ? 'all' : isAdmin ? 'staff_and_self' : 'self_only',
                stats: {
                    totalLogs: overallTotalCount,
                    todayLogs: todayCount,
                    rbacLogs: rbacCount,
                    cmsLogs: cmsCount,
                    operationalLogs: operationalCount,
                },
            },
            'Work logs fetched successfully'
        )
    );
});

// @desc    Get audit trail history for a specific user
// @route   GET /api/admin/work-logs/user/:userId
// @access  Private (Admin / SuperAdmin / Self)
export const getUserWorkLogs = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const isSuperAdmin = Boolean(req.user.isSuperAdmin || req.user.role === 'superadmin');
    const isAdmin = Boolean(req.user.role === 'admin' || req.user.roleRef?.slug === 'admin');

    // If regular staff, they can ONLY view their own audit history
    if (!isSuperAdmin && !isAdmin && String(userId) !== String(req.user._id)) {
        throw new ApiError(403, 'You are only authorized to view your own work logs');
    }

    // If admin, ensure target is not another admin or superadmin
    if (isAdmin && !isSuperAdmin && String(userId) !== String(req.user._id)) {
        const targetUser = await User.findById(userId).select('role');
        if (targetUser && (targetUser.role === 'admin' || targetUser.role === 'superadmin')) {
            throw new ApiError(403, 'Admins are not authorized to view audit logs of other administrators');
        }
    }

    const logs = await WorkLog.find({
        $or: [{ targetUser: userId }, { performedBy: userId }],
    })
        .populate('performedBy', 'firstName lastName email phone role enrollmentNo')
        .populate('targetUser', 'firstName lastName email phone role enrollmentNo')
        .sort({ createdAt: -1 })
        .limit(50);

    res.status(200).json(
        new ApiResponse(200, { logs }, 'User work logs fetched successfully')
    );
});
