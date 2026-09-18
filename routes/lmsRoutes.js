import express from 'express';
import { getLiveClasses, getJobs, createJob } from '../controllers/lmsController.js';
import { verifyJWT, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Require login for all LMS/Placement routes
router.use(verifyJWT);

// LMS Gateway
router.get('/classes', getLiveClasses);

// Placement / Job Board
router.get('/jobs', getJobs); // Students can view jobs

// Admin only routes for LMS/Placements
router.use(restrictTo('admin', 'super-admin'));
router.post('/jobs', createJob); // Admins post jobs

export default router;
