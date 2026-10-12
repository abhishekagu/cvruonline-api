import Application from '../models/Application.js';
import Document from '../models/Document.js';
import User from '../models/User.js';
import Lead from '../models/Lead.js';
import Payment from '../models/Payment.js';
import Contact from '../models/Contact.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { generateEnrollmentNumber } from '../utils/enrollmentGenerator.js';

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

    let application = await Application.findById(req.params.id);
    if (!application) throw new ApiError(404, 'Application not found');

    application.status = status;

    if (status === 'Accepted' && !application.enrollmentNumber) {
        const enrollmentNo = await generateEnrollmentNumber(application.program);
        application.enrollmentNumber = enrollmentNo;
        await User.findByIdAndUpdate(application.user, { enrollmentNo });
    }

    await application.save();

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
    const pendingApplications = await Application.countDocuments({ status: { $in: ['Submitted', 'Under Review'] } });

    // Fetch 5 most recent applications
    const recentApplications = await Application.find({ status: { $ne: 'Draft' } })
        .populate('user', 'firstName lastName email phone')
        .populate('program', 'name code')
        .sort('-createdAt')
        .limit(5);

    // Fetch 5 most recent successful payments
    const recentPayments = await Payment.find({ status: 'Success' })
        .populate('user', 'firstName lastName email')
        .populate('application', 'enrollmentNumber program')
        .sort('-createdAt')
        .limit(5);

    // Calculate actual total revenue from successful payments
    const revenueResult = await Payment.aggregate([
        { $match: { status: 'Success' } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' }, totalTransactions: { $sum: 1 } } }
    ]);
    
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    const totalTransactions = revenueResult.length > 0 ? revenueResult[0].totalTransactions : 0;

    res.status(200).json(new ApiResponse(200, {
        metrics: {
            totalUsers,
            totalApplications,
            totalLeads,
            acceptedApplications,
            pendingApplications,
            totalRevenue,
            totalTransactions,
            recentApplications,
            recentPayments
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

// @desc    Update contact inquiry status
// @route   PATCH /api/v1/admin/contacts/:id/status
// @access  Private (Admin)
export const updateContactStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['New', 'Reviewed', 'Replied'];
    if (!status || !allowedStatuses.includes(status)) {
        throw new ApiError(400, `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`);
    }

    const contact = await Contact.findByIdAndUpdate(id, { status }, { new: true });
    if (!contact) {
        throw new ApiError(404, 'Contact inquiry not found');
    }

    res.status(200).json(new ApiResponse(200, { contact }, `Inquiry marked as ${status}`));
});

// @desc    Delete contact inquiry
// @route   DELETE /api/v1/admin/contacts/:id
// @access  Private (Admin)
export const deleteContact = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const contact = await Contact.findByIdAndDelete(id);
    if (!contact) {
        throw new ApiError(404, 'Contact inquiry not found');
    }

    res.status(200).json(new ApiResponse(200, null, 'Contact inquiry deleted successfully'));
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

const PROGRAM_FEES = {
    bba: 22000,
    bca: 100,
    blibisc: 22500,
    mba: 42000,
    ma_english: 21700
};

const PROGRAM_NAMES = {
    bba: 'Bachelor of Business Administration (BBA)',
    bca: 'Bachelor of Computer Applications (BCA)',
    blibisc: 'Bachelor of Library and Information Science (B.Lib.I.Sc.)',
    mba: 'Master of Business Administration (MBA)',
    ma_english: 'Master of Arts in English'
};

// @desc    Lookup student & application by enrollment number for offline payment
// @route   GET /api/v1/admin/payments/lookup-enrollment
// @access  Private (Admin)
export const lookupEnrollmentForPayment = asyncHandler(async (req, res) => {
    const { enrollmentNumber } = req.query;

    if (!enrollmentNumber || !enrollmentNumber.trim()) {
        throw new ApiError(400, "Enrollment number is required");
    }

    const cleanEnrollment = enrollmentNumber.trim();
    const regex = new RegExp(`^${cleanEnrollment}$`, 'i');

    // 1. Try finding application directly by enrollmentNumber
    let application = await Application.findOne({ enrollmentNumber: regex })
        .populate('user', 'firstName lastName email phone enrollmentNo');

    // 2. If not found, check User model's enrollmentNo
    if (!application) {
        const user = await User.findOne({ enrollmentNo: regex });
        if (user) {
            application = await Application.findOne({ user: user._id })
                .populate('user', 'firstName lastName email phone enrollmentNo')
                .sort('-createdAt');
        }
    }

    if (!application) {
        throw new ApiError(404, `No student or application found matching enrollment number "${cleanEnrollment}".`);
    }

    const programKey = (application.program || '').toLowerCase();
    const totalFee = Number(application.totalFee) || PROGRAM_FEES[programKey] || 22000;
    const paidAmount = Number(application.paidAmount) || 0;
    const remainingBalance = application.remainingBalance !== undefined 
        ? Number(application.remainingBalance) 
        : Math.max(0, totalFee - paidAmount);

    res.status(200).json(new ApiResponse(200, {
        applicationId: application._id,
        enrollmentNumber: application.enrollmentNumber || application.user?.enrollmentNo || cleanEnrollment,
        user: {
            id: application.user?._id,
            firstName: application.user?.firstName || application.basicDetails?.firstName,
            lastName: application.user?.lastName || application.basicDetails?.lastName,
            email: application.user?.email || application.basicDetails?.email,
            phone: application.user?.phone || application.basicDetails?.mobileNo
        },
        program: {
            id: programKey,
            name: PROGRAM_NAMES[programKey] || application.program?.toUpperCase() || 'Degree Program'
        },
        financials: {
            totalFee,
            paidAmount,
            remainingBalance,
            paymentStatus: application.paymentStatus || (remainingBalance === 0 ? 'Success' : 'Pending'),
            status: application.status
        }
    }, 'Student enrollment record fetched successfully'));
});

// @desc    Record offline / cash payment against student enrollment number
// @route   POST /api/v1/admin/payments/offline
// @access  Private (Admin)
export const recordOfflinePayment = asyncHandler(async (req, res) => {
    const { 
        enrollmentNumber, 
        amount, 
        paymentMode, 
        referenceNumber, 
        paymentType, 
        remarks 
    } = req.body;

    if (!enrollmentNumber || !enrollmentNumber.trim()) {
        throw new ApiError(400, "Enrollment number is required");
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
        throw new ApiError(400, "A valid payment amount greater than 0 is required");
    }

    const cleanEnrollment = enrollmentNumber.trim();
    const regex = new RegExp(`^${cleanEnrollment}$`, 'i');

    // Find application
    let application = await Application.findOne({ enrollmentNumber: regex })
        .populate('user', 'firstName lastName email phone enrollmentNo');

    if (!application) {
        const user = await User.findOne({ enrollmentNo: regex });
        if (user) {
            application = await Application.findOne({ user: user._id })
                .populate('user', 'firstName lastName email phone enrollmentNo')
                .sort('-createdAt');
        }
    }

    if (!application) {
        throw new ApiError(404, `No application found for enrollment number "${cleanEnrollment}".`);
    }

    const programKey = (application.program || '').toLowerCase();
    const resolvedTotalFee = Number(application.totalFee) || PROGRAM_FEES[programKey] || 22000;
    const currentPaid = Number(application.paidAmount) || 0;
    const currentRemaining = application.remainingBalance !== undefined 
        ? Number(application.remainingBalance) 
        : Math.max(0, resolvedTotalFee - currentPaid);

    if (currentRemaining <= 0) {
        throw new ApiError(400, "All tuition fees for this student have already been cleared in full (Remaining balance is ₹0).");
    }

    if (numAmount > currentRemaining) {
        throw new ApiError(400, `Payment amount (₹${numAmount.toLocaleString('en-IN')}) cannot exceed the pending balance of ₹${currentRemaining.toLocaleString('en-IN')}.`);
    }

    const newPaidAmount = currentPaid + numAmount;
    const newRemainingBalance = Math.max(0, resolvedTotalFee - newPaidAmount);
    const newPaymentStatus = newRemainingBalance === 0 ? 'Success' : 'Partial';

    // Ensure enrollment number is assigned
    if (!application.enrollmentNumber) {
        application.enrollmentNumber = cleanEnrollment;
    }
    if (application.user && !application.user.enrollmentNo) {
        await User.findByIdAndUpdate(application.user._id, { enrollmentNo: cleanEnrollment });
    }

    // Update application
    application.totalFee = resolvedTotalFee;
    application.paidAmount = newPaidAmount;
    application.remainingBalance = newRemainingBalance;
    application.paymentStatus = newPaymentStatus;
    application.paymentType = paymentType || `Offline Payment (${paymentMode || 'Cash'})`;
    if (application.status === 'Draft' || !application.status) {
        application.status = 'Submitted';
    }
    await application.save();

    // Generate unique order and transaction IDs
    const timestamp = Date.now();
    const generatedVoucher = `CVRU-REC-${timestamp.toString().slice(-6)}`;
    const orderId = `ADMIN-OFFL-${timestamp}`;
    const transactionId = referenceNumber?.trim() || generatedVoucher;

    // Create Payment Record
    const payment = await Payment.create({
        user: application.user._id,
        application: application._id,
        amount: numAmount,
        currency: 'INR',
        orderId,
        transactionId,
        bankTransactionId: `${paymentMode || 'Cash'} / ADMIN_COLLECTION${remarks ? ` - ${remarks}` : ''}`,
        status: 'Success',
        type: paymentType || `Offline Payment (${paymentMode || 'Cash'})`
    });

    // Create or update subscription
    try {
        const Plan = (await import('../models/Plan.js')).default;
        const Subscription = (await import('../models/Subscription.js')).default;

        let plan = await Plan.findOne({ program: programKey, name: paymentType || 'Tuition Fee' });
        if (!plan) {
            plan = await Plan.create({
                program: programKey,
                name: paymentType || 'Offline Tuition Fee',
                price: numAmount,
                durationInDays: 180
            });
        }

        let subscription = await Subscription.findOne({ user: application.user._id, program: programKey });
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 180);

        if (subscription) {
            subscription.plan = plan._id;
            subscription.status = 'Active';
            subscription.expiryDate = expiryDate;
            await subscription.save();
        } else {
            await Subscription.create({
                user: application.user._id,
                plan: plan._id,
                program: programKey,
                status: 'Active',
                expiryDate
            });
        }
    } catch (subErr) {
        console.error("Subscription activation notice:", subErr.message);
    }

    // Return populated payment and updated application
    const populatedPayment = await Payment.findById(payment._id)
        .populate('user', 'firstName lastName email phone enrollmentNo')
        .populate('application');

    res.status(201).json(new ApiResponse(201, {
        payment: populatedPayment,
        application: {
            id: application._id,
            enrollmentNumber: application.enrollmentNumber,
            totalFee: resolvedTotalFee,
            paidAmount: newPaidAmount,
            remainingBalance: newRemainingBalance,
            paymentStatus: newPaymentStatus
        }
    }, `Offline payment of ₹${numAmount} successfully recorded for enrollment number ${cleanEnrollment}`));
});

