import express from 'express';
import { getUserPayments, getAllPayments, getPaymentById } from '../controllers/paymentController.js';
import { initiatePaytmPayment, verifyPaytmPayment, paytmWebhook, paytmCallback } from '../controllers/paytmController.js';
import { verifyJWT, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Paytm Webhook (Public)
router.post('/paytm/webhook', paytmWebhook);

// Paytm Callback (Public)
router.post('/paytm/callback', paytmCallback);

router.use(verifyJWT);

// Get User's Payments
router.get('/my-payments', getUserPayments);

// Admin Routes
router.get('/all', restrictTo('admin'), getAllPayments);

// Paytm Routes (New S2S Custom Checkout)
router.post('/paytm/initiate', initiatePaytmPayment);
router.post('/paytm/verify', verifyPaytmPayment);

// Get Single Payment (keep this at bottom to not intercept other GETs)
router.get('/:id', getPaymentById);

export default router;