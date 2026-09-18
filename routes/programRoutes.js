import express from 'express';
import {
    getAllPrograms,
    getProgram,
    createProgram,
    updateProgram,
    deleteProgram
} from '../controllers/programController.js';
import { verifyJWT, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes for frontend catalog
router.get('/', getAllPrograms);
router.get('/:id', getProgram);

// Protect all routes after this middleware (Admin only)
router.use(verifyJWT);
router.use(restrictTo('admin', 'super-admin'));

router.post('/', createProgram);
router.patch('/:id', updateProgram);
router.delete('/:id', deleteProgram);

export default router;
