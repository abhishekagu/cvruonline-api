import express from 'express';
import {
    createApplication,
    getMyApplications,
    updateApplication,
    submitApplication,
    addDocument,
    getDocuments
} from '../controllers/applicationController.js';
import { verifyJWT } from '../middlewares/authMiddleware.js';

const router = express.Router();

import { upload } from '../middlewares/uploadMiddleware.js';

// All application routes require authentication
router.use(verifyJWT);

// Application endpoints
router.post('/', upload.any(), createApplication);
router.get('/me', getMyApplications);
router.patch('/:id', updateApplication);
router.post('/:id/submit', submitApplication);

// Document endpoints attached to an application
router.post('/:id/documents', addDocument);
router.get('/:id/documents', getDocuments);

export default router;
