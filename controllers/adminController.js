import Application from '../models/Application.js';
import Document from '../models/Document.js';
import User from '../models/User.js';
import Lead from '../models/Lead.js';
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
    const totalUsers = await User.countDocuments({ role: 'applicant' });
    const totalApplications = await Application.countDocuments({ status: { $ne: 'Draft' } });
    const totalLeads = await Lead.countDocuments();
    const acceptedApplications = await Application.countDocuments({ status: 'Accepted' });

    // Mock revenue for now (Phase 5 will handle actual payments)
    const mockRevenue = acceptedApplications * 120000; 

    res.status(200).json(new ApiResponse(200, {
        metrics: {
            totalUsers,
            totalApplications,
            totalLeads,
            acceptedApplications,
            mockRevenue
        }
    }, 'Dashboard metrics fetched successfully'));
});
