import crypto from 'crypto';
import Razorpay from 'razorpay';
import Payment from '../models/Payment.js';
import Application from '../models/Application.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

// Setup Razorpay instance
// Ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are in .env
const getRazorpayInstance = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new ApiError(500, 'Razorpay keys are missing from environment variables');
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

// @desc    Create a Razorpay Order
// @route   POST /api/v1/payments/create-order
// @access  Private
export const createOrder = asyncHandler(async (req, res) => {
    const { applicationId, amount, type } = req.body;

    if (!applicationId || !amount || !type) {
        throw new ApiError(400, 'Please provide applicationId, amount, and fee type');
    }

    // Verify application exists and belongs to user
    const application = await Application.findOne({ _id: applicationId, user: req.user._id });
    if (!application) {
        throw new ApiError(404, 'Application not found');
    }

    const instance = getRazorpayInstance();

    // Amount in paise (multiply by 100)
    const options = {
        amount: amount * 100,
        currency: 'INR',
        receipt: `receipt_app_${applicationId}`,
    };

    const order = await instance.orders.create(options);

    // Save payment intent in our DB
    const payment = await Payment.create({
        user: req.user._id,
        application: applicationId,
        amount,
        type,
        razorpayOrderId: order.id,
        status: 'Created'
    });

    res.status(201).json(new ApiResponse(201, { order, paymentId: payment._id }, 'Razorpay order created'));
});

// @desc    Verify Razorpay Payment Signature
// @route   POST /api/v1/payments/verify
// @access  Private
export const verifyPayment = asyncHandler(async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        throw new ApiError(400, 'Payment details are missing');
    }

    // Create expected signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpaySignature;

    if (!isAuthentic) {
        throw new ApiError(400, 'Invalid payment signature. Payment verification failed.');
    }

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
        { razorpayOrderId },
        {
            razorpayPaymentId,
            razorpaySignature,
            status: 'Success'
        },
        { new: true }
    );

    if (!payment) {
        throw new ApiError(404, 'Payment record not found for this order ID');
    }

    // Optionally: Update Application status or trigger enrollment process if it's Tuition Fee
    
    res.status(200).json(new ApiResponse(200, { payment }, 'Payment verified successfully'));
});
