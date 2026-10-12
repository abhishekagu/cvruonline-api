import express from 'express';
import {
    getAllApplications,
    updateApplicationStatus,
    verifyDocument,
    getDashboardMetrics,
    getContacts,
    getAllUsers,
    getUserById,
    lookupEnrollmentForPayment,
    recordOfflinePayment
} from '../controllers/adminController.js';
import { verifyJWT, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All admin routes require admin privileges
router.use(verifyJWT);
router.use(restrictTo('admin', 'superadmin', 'super-admin'));

// Offline Payment Collection
router.get('/payments/lookup-enrollment', lookupEnrollmentForPayment);
router.post('/payments/offline', recordOfflinePayment);

// Users Management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);

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
