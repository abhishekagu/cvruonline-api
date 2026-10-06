import express from 'express';
import {
    getAllApplications,
    updateApplicationStatus,
    verifyDocument,
    getDashboardMetrics,
    getContacts
} from '../controllers/adminController.js';
import { verifyJWT, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All admin routes require admin privileges
router.use(verifyJWT);
router.use(restrictTo('admin', 'super-admin'));

// Application Management
router.get('/applications', getAllApplications);
router.patch('/applications/:id/status', updateApplicationStatus);

// Document Verification
router.patch('/documents/:id/verify', verifyDocument);

// Dashboard Metrics
router.get('/dashboard/metrics', getDashboardMetrics);

// Contact Inquiries
router.get('/contacts', getContacts);

export default router;
