import Application from '../models/Application.js';
import Document from '../models/Document.js';
import User from '../models/User.js';
import Lead from '../models/Lead.js';
import Payment from '../models/Payment.js';
import Contact from '../models/Contact.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

// @desc    Get all submitted applications with filters
// @route   GET /api/v1/admin/applications
// @access  Private (Admin)
export const getAllApplications = asyncHandler(async (req, res) => {
    // Exclude Drafts by default unless specified
    const query = { status: { $ne: 'Draft' } };
    
    if (req.query.status) query.status = req.query.status;
    if (req.query.programId) query.program = req.query.programId;

    const applications = await Application.find(query)
        .populate('user', 'firstName lastName email phone')
        .populate('program', 'name type')
        .sort('-submittedAt');

    res.status(200).json(new ApiResponse(200, { applications }, 'Applications fetched successfully'));
});

// @desc    Update overall application status
// @route   PATCH /api/v1/admin/applications/:id/status
// @access  Private (Admin)
export const updateApplicationStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!['Under Review', 'Accepted', 'Rejected'].includes(status)) {
        throw new ApiError(400, 'Invalid status update');
    }

    const application = await Application.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
    );

    if (!application) throw new ApiError(404, 'Application not found');

    res.status(200).json(new ApiResponse(200, { application }, `Application marked as ${status}`));
});

// @desc    Verify a specific document
// @route   PATCH /api/v1/admin/documents/:id/verify
// @access  Private (Admin)
export const verifyDocument = asyncHandler(async (req, res) => {
    const { verificationStatus, adminRemarks } = req.body;

    if (!['Verified', 'Rejected'].includes(verificationStatus)) {
        throw new ApiError(400, 'Status must be Verified or Rejected');
    }

    const document = await Document.findById(req.params.id);
    if (!document) throw new ApiError(404, 'Document not found');

    document.verificationStatus = verificationStatus;
    if (adminRemarks) document.adminRemarks = adminRemarks;
    
    await document.save();

    res.status(200).json(new ApiResponse(200, { document }, `Document marked as ${verificationStatus}`));
});

// @desc    Get dashboard metrics
// @route   GET /api/v1/admin/dashboard/metrics
// @access  Private (Admin)
export const getDashboardMetrics = asyncHandler(async (req, res) => {
    // Count all registered users except the current admin
    const totalUsers = await User.countDocuments({ _id: { $ne: req.user._id } });
    const totalApplications = await Application.countDocuments({ status: { $ne: 'Draft' } });
    const totalLeads = await Lead.countDocuments();
    const acceptedApplications = await Application.countDocuments({ status: 'Accepted' });

    // Fetch 5 most recent applications
    const recentApplications = await Application.find({ status: { $ne: 'Draft' } })
        .populate('user', 'firstName lastName email')
        .populate('program', 'name')
        .sort('-createdAt')
        .limit(5);

    // Calculate actual total revenue from successful payments
    const revenueResult = await Payment.aggregate([
        { $match: { status: 'Success' } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
    ]);
    
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    res.status(200).json(new ApiResponse(200, {
        metrics: {
            totalUsers,
            totalApplications,
            totalLeads,
            acceptedApplications,
            totalRevenue,
            recentApplications
        }
    }, 'Dashboard metrics fetched successfully'));
});

// @desc    Get all contact inquiries
// @route   GET /api/v1/admin/contacts
// @access  Private (Admin)
export const getContacts = asyncHandler(async (req, res) => {
    const contacts = await Contact.find().sort('-createdAt');
    res.status(200).json(new ApiResponse(200, { contacts }, 'Contacts fetched successfully'));
});

// @desc    Get all users (with optional filtering and pagination)
// @route   GET /api/v1/admin/users
// @access  Private (Admin)
export const getAllUsers = asyncHandler(async (req, res) => {
    // Pagination (optional, default to 1 and 50)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.role) query.role = req.query.role;

    const users = await User.find(query)
        .select('-password')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json(
        new ApiResponse(200, { 
            users, 
            total,
            page,
            pages: Math.ceil(total / limit)
        }, 'Users fetched successfully')
    );
});

// @desc    Get user details by ID
// @route   GET /api/v1/admin/users/:id
// @access  Private (Admin)
export const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const applications = await Application.find({ user: user._id });
    
    // Attempt to fetch subscriptions if the model is available
    let subscriptions = [];
    try {
        const Subscription = (await import('../models/Subscription.js')).default;
        subscriptions = await Subscription.find({ user: user._id }).populate('plan');
    } catch (err) {
        console.error("Could not fetch subscriptions", err);
    }

    res.status(200).json(new ApiResponse(200, { user, applications, subscriptions }, 'User details fetched successfully'));
});

