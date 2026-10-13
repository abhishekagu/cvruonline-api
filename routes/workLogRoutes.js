import express from 'express';
import { getWorkLogs, getUserWorkLogs } from '../controllers/workLogController.js';
import { verifyJWT, checkPermission } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyJWT);
router.use(checkPermission('worklogs.view'));

router.get('/', getWorkLogs);
router.get('/user/:userId', getUserWorkLogs);

export default router;
