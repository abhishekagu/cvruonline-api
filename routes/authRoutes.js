import express from 'express';
import { register, login, changePassword } from '../controllers/authController.js';
import { verifyJWT } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/change-password', verifyJWT, changePassword);

export default router;
