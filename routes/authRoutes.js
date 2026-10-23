import express from 'express';
import {
    register,
    login,
    changePassword,
    sendForgotPasswordOtp,
    verifyForgotPasswordOtp,
    resetPasswordWithOtp,
} from '../controllers/authController.js';
import { verifyJWT } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/change-password', verifyJWT, changePassword);

// Forgot Password Flow
router.post('/forgot-password/send-otp', sendForgotPasswordOtp);
router.post('/forgot-password/verify-otp', verifyForgotPasswordOtp);
router.post('/forgot-password/reset', resetPasswordWithOtp);

export default router;
