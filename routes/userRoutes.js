import express from 'express';
import { getMyPrograms, toggleMyProgram, getMySubscriptions, getUserProfile, updateUserProfile } from '../controllers/userController.js';
import { verifyJWT } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Apply verifyJWT to all routes below
router.use(verifyJWT);

router.get('/profile', getUserProfile);
router.put('/profile', upload.any(), updateUserProfile);

router.get('/my-programs', getMyPrograms);
router.post('/my-programs/toggle', toggleMyProgram);
router.get('/subscriptions', getMySubscriptions);

export default router;
