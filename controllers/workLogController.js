import WorkLog from '../models/WorkLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';

// @desc    Get paginated work and audit logs with rich filters
// @route   GET /api/admin/work-logs
// @access  Private (Admin / WorkLogs View)
export const getWorkLogs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.module) {
        query.module = req.query.module;
    }

    if (req.query.actionType) {
        query.actionType = req.query.actionType;
    }

    if (req.query.performedBy) {
        query.performedBy = req.query.performedBy;
    }

    if (req.query.targetUser) {
        query.targetUser = req.query.targetUser;
    }

    if (req.query.search) {
        const searchRegex = new RegExp(req.query.search.trim(), 'i');
        query.$or = [
            { title: searchRegex },
            { targetEntityId: searchRegex },
            { 'details.reason': searchRegex },
            { 'details.targetEmail': searchRegex },
        ];
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

    const [logs, total] = await Promise.all([
        WorkLog.find(query)
            .populate('performedBy', 'firstName lastName email role')
            .populate('targetUser', 'firstName lastName email role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        WorkLog.countDocuments(query),
    ]);

    // Aggregate key stats for dashboard cards
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [todayCount, rbacCount, operationalCount] = await Promise.all([
        WorkLog.countDocuments({ createdAt: { $gte: startOfToday } }),
        WorkLog.countDocuments({ module: 'RBAC' }),
        WorkLog.countDocuments({ module: { $ne: 'RBAC' } }),
    ]);

    res.status(200).json(
        new ApiResponse(
            200,
            {
                logs,
                total,
                page,
                pages: Math.ceil(total / limit),
                stats: {
                    totalLogs: total,
                    todayLogs: todayCount,
                    rbacLogs: rbacCount,
                    operationalLogs: operationalCount,
                },
            },
            'Work logs fetched successfully'
        )
    );
});

// @desc    Get audit trail history for a specific user
// @route   GET /api/admin/work-logs/user/:userId
// @access  Private (Admin / WorkLogs View)
export const getUserWorkLogs = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const logs = await WorkLog.find({
        $or: [{ targetUser: userId }, { performedBy: userId }],
    })
        .populate('performedBy', 'firstName lastName email role')
        .populate('targetUser', 'firstName lastName email role')
        .sort({ createdAt: -1 })
        .limit(50);

    res.status(200).json(
        new ApiResponse(200, { logs }, 'User work logs fetched successfully')
    );
});
