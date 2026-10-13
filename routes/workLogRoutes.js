import express from 'express';
import { getWorkLogs, getUserWorkLogs } from '../controllers/workLogController.js';
import { verifyJWT } from '../middlewares/authMiddleware.js';
import { ApiError } from '../utils/apiError.js';

const router = express.Router();

router.use(verifyJWT);

// Authorization middleware for work logs:
// 1. Super Admin: full access
// 2. Admin: allowed (scoped to staff and own logs in controller)
// 3. Staff members / roles with 'worklogs.view': allowed (scoped strictly to own logs in controller)
// 4. Applicants & Students: blocked (403)
router.use((req, res, next) => {
    const isSuperAdmin = Boolean(req.user.isSuperAdmin || req.user.role === 'superadmin');
    const isAdmin = Boolean(req.user.role === 'admin' || req.user.roleRef?.slug === 'admin');
    const hasWorkLogsPerm = req.user.permissions?.includes('worklogs.view') || req.user.permissions?.includes('*');
    const isStaff = req.user.role && req.user.role !== 'applicant' && req.user.role !== 'student';

    if (isSuperAdmin || isAdmin || hasWorkLogsPerm || isStaff) {
        return next();
    }
    return next(new ApiError(403, 'Access denied. You do not have permission to view work logs.'));
});

router.get('/', getWorkLogs);
router.get('/user/:userId', getUserWorkLogs);

export default router;
