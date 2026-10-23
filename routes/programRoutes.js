import express from 'express';
import {
    getAllPrograms,
    getAdminPrograms,
    getProgram,
    uploadProgramImage,
    cleanupUnusedUpload,
    createProgram,
    updateProgram,
    toggleProgramStatus,
    deleteProgram,
    requestPublishProgram,
    approveProgram,
    rejectProgram,
    unpublishProgram,
} from '../controllers/programController.js';
import { verifyJWT, checkPermission } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// =======================
// PROTECTED CMS ROUTES (Staff & Super Admin)
// Must be defined before parametric /:id routes to avoid shadowing
// =======================

// Admin listing (includes active and inactive)
router.get(
    '/admin/all',
    verifyJWT,
    checkPermission('programs.view', 'programs.manage'),
    getAdminPrograms
);

// Image & Brochure Document Upload Endpoint (Multer stored in uploads/)
router.post(
    '/upload-image',
    verifyJWT,
    checkPermission('programs.manage'),
    upload.any(),
    uploadProgramImage
);
router.post(
    '/upload-file',
    verifyJWT,
    checkPermission('programs.manage'),
    upload.any(),
    uploadProgramImage
);
router.post(
    '/cleanup-file',
    verifyJWT,
    checkPermission('programs.manage'),
    cleanupUnusedUpload
);

// Program Management Actions
router.post('/', verifyJWT, checkPermission('programs.manage'), createProgram);
router.patch('/:id/status', verifyJWT, checkPermission('programs.manage'), toggleProgramStatus);
router.patch('/:id', verifyJWT, checkPermission('programs.manage'), updateProgram);
router.delete('/:id', verifyJWT, checkPermission('programs.manage'), deleteProgram);

// Approval & Publishing Workflow Actions
router.post('/:id/request-publish', verifyJWT, checkPermission('programs.manage'), requestPublishProgram);
router.post('/:id/approve', verifyJWT, checkPermission('programs.approve'), approveProgram);
router.post('/:id/reject', verifyJWT, checkPermission('programs.approve'), rejectProgram);
router.post('/:id/unpublish', verifyJWT, checkPermission('programs.approve'), unpublishProgram);

// =======================
// PUBLIC CATALOG ROUTES
// =======================
router.get('/', getAllPrograms);
router.get('/:id', getProgram);

export default router;
