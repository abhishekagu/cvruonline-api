import express from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import { verifyJWT } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyJWT);

// Create razorpay order intent
router.post('/create-order', createOrder);

// Verify signature after payment
router.post('/verify', verifyPayment);

export default router;
