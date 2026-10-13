import Payment from '../models/Payment.js';
import Application from '../models/Application.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

// @desc    Get logged in user's payments
// @route   GET /api/payments/my-payments
// @access  Private
export const getUserPayments = asyncHandler(async (req, res) => {
    const payments = await Payment.find({ user: req.user._id })
        .populate('application') // Populates application info if needed
        .sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, { payments }, 'User payments fetched successfully'));
});

// @desc    Get all payments (Admin only)
// @route   GET /api/payments/all
// @access  Private/Admin
export const getAllPayments = asyncHandler(async (req, res) => {
    const payments = await Payment.find()
        .populate('user', 'firstName lastName email')
        .populate('application')
        .sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, { payments }, 'All payments fetched successfully'));
});

// @desc    Get single payment by ID
// @route   GET /api/payments/:id
// @access  Private
export const getPaymentById = asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.id)
        .populate('user', 'firstName lastName email phoneNumber')
        .populate('application')
        .populate('plan');

    if (!payment) {
        throw new ApiError(404, 'Payment not found');
    }

    const isOwner = Boolean(
        payment.user && (
            payment.user._id?.toString() === req.user._id.toString() ||
            payment.user.toString() === req.user._id.toString()
        )
    );

    const isAuthorizedStaffOrAdmin = Boolean(
        req.user?.isSuperAdmin ||
        req.user?.role === 'superadmin' ||
        req.user?.role === 'admin' ||
        req.user?.permissions?.includes('*') ||
        req.user?.permissions?.includes('payments.view') ||
        req.user?.permissions?.includes('payments.record_offline')
    );

    // Check if the user is authorized to view this payment
    if (!isOwner && !isAuthorizedStaffOrAdmin) {
        throw new ApiError(403, 'Not authorized to view this payment');
    }

    res.status(200).json(new ApiResponse(200, { payment }, 'Payment fetched successfully'));
});