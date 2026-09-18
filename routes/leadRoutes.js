import express from 'express';
import { captureProspectusLead, getAllLeads } from '../controllers/leadController.js';
import { verifyJWT, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public route: Capture lead details before downloading prospectus
router.post('/prospectus', captureProspectusLead);

// Protected route: Admins/Counselors can view all leads
router.use(verifyJWT);
router.use(restrictTo('admin', 'super-admin'));
router.get('/', getAllLeads);

export default router;
