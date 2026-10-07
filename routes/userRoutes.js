import express from 'express';
import { getMyPrograms, toggleMyProgram } from '../controllers/userController.js';
import { verifyJWT } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply verifyJWT to all routes below
router.use(verifyJWT);

router.get('/my-programs', getMyPrograms);
router.post('/my-programs/toggle', toggleMyProgram);

export default router;
