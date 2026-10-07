import express from 'express';
import { createOrder, verifyPayment, getUserPayments, getAllPayments } from '../controllers/paymentController.js';
import { initiatePaytmPayment, verifyPaytmPayment } from '../controllers/paytmController.js';
import { verifyJWT, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyJWT);

// Get User's Payments
router.get('/my-payments', getUserPayments);

// Razorpay Routes (Legacy)
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);

// Paytm Routes (New S2S Custom Checkout)
router.post('/paytm/initiate', initiatePaytmPayment);
router.post('/paytm/verify', verifyPaytmPayment);

// Admin Routes
router.get('/all', restrictTo('admin'), getAllPayments);

export default router;
