import express from 'express';
import {
    getAllApplications,
    updateApplicationStatus,
    verifyDocument,
    getDashboardMetrics,
    getContacts,
    updateContactStatus,
    deleteContact,
    getAllUsers,
    getUserById,
    lookupEnrollmentForPayment,
    recordOfflinePayment,
} from '../controllers/adminController.js';
import { verifyJWT, checkPermission } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require valid authentication
router.use(verifyJWT);

// Dashboard Metrics (Requires dashboard.view or Super Admin)
router.get('/dashboard/metrics', checkPermission('dashboard.view'), getDashboardMetrics);

// Offline Payment Collection
router.get('/payments/lookup-enrollment', checkPermission('payments.record_offline', 'payments.view'), lookupEnrollmentForPayment);
router.post('/payments/offline', checkPermission('payments.record_offline'), recordOfflinePayment);

// Users Management
router.get('/users', checkPermission('users.view'), getAllUsers);
router.get('/users/:id', checkPermission('users.view'), getUserById);

// Application Management
router.get('/applications', checkPermission('applications.view'), getAllApplications);
router.patch('/applications/:id/status', checkPermission('applications.manage'), updateApplicationStatus);

// Document Verification
router.patch('/documents/:id/verify', checkPermission('documents.verify'), verifyDocument);

// Contact Inquiries
router.get('/contacts', checkPermission('contacts.view'), getContacts);
router.patch('/contacts/:id/status', checkPermission('contacts.manage'), updateContactStatus);
router.delete('/contacts/:id', checkPermission('contacts.manage'), deleteContact);

export default router;
