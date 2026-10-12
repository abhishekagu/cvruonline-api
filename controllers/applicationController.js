import Application from '../models/Application.js';
import Document from '../models/Document.js';
import User from '../models/User.js';
import { generateEnrollmentNumber } from '../utils/enrollmentGenerator.js';
import { checkAcademicEligibility } from '../utils/eligibilityChecker.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

const PROGRAM_FEES = {
    bba: 22000,
    bca: 100,
    blibisc: 22500,
    mba: 42000,
    ma_english: 21700
};

// @desc    Initialize a new draft application
// @route   POST /api/v1/applications
// @access  Private (Applicant)
export const createApplication = asyncHandler(async (req, res) => {
    const { programId, totalFee } = req.body;
    
    if (!programId) {
        throw new ApiError(400, "programId is required");
    }

    const user = req.user;
    const profile = user.profileDetails || {};

    // Enforce academic eligibility criteria (e.g. PG requires Graduation)
    const eligibility = checkAcademicEligibility(programId, profile.qualifications || []);
    if (!eligibility.isEligible) {
        throw new ApiError(400, eligibility.reason);
    }

    // Determine initial fee
    const resolvedTotalFee = totalFee ? Number(totalFee) : (PROGRAM_FEES[programId] || 22000);

    // Find or create application
    let application = await Application.findOne({ user: user._id, program: programId });
    
    const applicationData = {
        user: user._id,
        program: programId,
        status: application ? application.status : 'Draft',
        totalFee: resolvedTotalFee,
        paidAmount: application ? application.paidAmount : 0,
        remainingBalance: application && application.paidAmount > 0 
            ? Math.max(0, resolvedTotalFee - application.paidAmount) 
            : resolvedTotalFee,
        paymentStatus: application ? application.paymentStatus : 'Pending',
        basicDetails: {
            salutation: profile.salutation,
            firstName: user.firstName,
            middleName: profile.middleName,
            lastName: user.lastName,
            gender: profile.gender,
            dob: profile.dob,
            mobileNo: user.phone,
            email: user.email,
            aadhaarNo: profile.aadhaarNo,
            fatherName: profile.fatherName,
            motherName: profile.motherName,
        },
        otherDetails: {
            maritalStatus: profile.maritalStatus,
            religion: profile.religion,
            casteCategory: profile.casteCategory,
            nationality: profile.nationality,
            medium: profile.medium,
            domicileState: profile.domicileState,
            abcId: profile.abcId,
            apaarId: profile.apaarId,
            debId: profile.debId,
        },
        currentAddress: profile.currentAddress || {},
        permanentAddress: profile.permanentAddress || {},
        emergencyContact: profile.emergencyContact || {},
        qualifications: profile.qualifications || [],
        documents: profile.documents || []
    };

    if (application) {
        // Update existing application
        Object.assign(application, applicationData);
        await application.save();
    } else {
        // Create new application
        application = await Application.create(applicationData);
    }

    res.status(200).json(new ApiResponse(200, { application }, 'Draft application created from profile.'));
});

// @desc    Get user's applications
// @route   GET /api/v1/applications/me
// @access  Private (Applicant)
export const getMyApplications = asyncHandler(async (req, res) => {
    const applications = await Application.find({ user: req.user._id });
    const Payment = (await import('../models/Payment.js')).default;

    const enrichedApplications = await Promise.all(applications.map(async (app) => {
        const appObj = app.toObject();
        
        // Find all successful payments for this user linked to this application or general
        const successfulPayments = await Payment.find({
            user: req.user._id,
            status: 'Success'
        });

        const appPayments = successfulPayments.filter(p => 
            (p.application && p.application.toString() === app._id.toString()) ||
            (!p.application && p.type && (p.type.includes('Registration') || p.type.includes('Tuition')))
        );

        const totalPaid = appPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const totalFee = app.totalFee || PROGRAM_FEES[app.program] || 22000;
        const remainingBalance = Math.max(0, totalFee - totalPaid);

        let paymentStatus = 'Pending';
        if (totalPaid > 0) {
            paymentStatus = remainingBalance === 0 ? 'Success' : 'Partial';
        }

        // Keep database record synchronized and ensure enrollmentNumber for active/paid applications
        let enrollmentNumber = app.enrollmentNumber;
        if (!enrollmentNumber && (totalPaid > 0 || app.status !== 'Draft')) {
            enrollmentNumber = await generateEnrollmentNumber(app.program);
            app.enrollmentNumber = enrollmentNumber;
            await User.findByIdAndUpdate(req.user._id, { enrollmentNo: enrollmentNumber });
        }

        if (app.paidAmount !== totalPaid || app.remainingBalance !== remainingBalance || app.paymentStatus !== paymentStatus || !app.totalFee || (enrollmentNumber && !app.enrollmentNumber)) {
            app.totalFee = totalFee;
            app.paidAmount = totalPaid;
            app.remainingBalance = remainingBalance;
            app.paymentStatus = paymentStatus;
            app.enrollmentNumber = enrollmentNumber;
            await app.save();
        }

        return {
            ...appObj,
            enrollmentNumber,
            totalFee,
            paidAmount: totalPaid,
            remainingBalance,
            paymentStatus,
        };
    }));

    res.status(200).json(new ApiResponse(200, { applications: enrichedApplications }, 'Applications fetched successfully.'));
});

// @desc    Update application step data (Multi-step form)
// @route   PATCH /api/v1/applications/:id
// @access  Private (Applicant)
export const updateApplication = asyncHandler(async (req, res) => {
    const { personalDetails, address, academics } = req.body;

    const application = await Application.findOne({ _id: req.params.id, user: req.user._id });

    if (!application) {
        throw new ApiError(404, 'Application not found');
    }

    if (application.status !== 'Draft') {
        throw new ApiError(400, 'You cannot edit an application that has already been submitted.');
    }

    if (personalDetails) application.personalDetails = personalDetails;
    if (address) application.address = address;
    if (academics) application.academics = academics;

    await application.save();

    res.status(200).json(new ApiResponse(200, { application }, 'Application saved successfully.'));
});

// @desc    Submit application
// @route   POST /api/v1/applications/:id/submit
// @access  Private (Applicant)
export const submitApplication = asyncHandler(async (req, res) => {
    const application = await Application.findOne({ _id: req.params.id, user: req.user._id });

    if (!application) throw new ApiError(404, 'Application not found');
    if (application.status !== 'Draft') throw new ApiError(400, 'Application is already submitted.');

    // In a real scenario, you'd check if all required fields and documents are provided before submitting.
    application.status = 'Submitted';
    application.submittedAt = Date.now();

    if (!application.enrollmentNumber) {
        const enrollmentNo = await generateEnrollmentNumber(application.program);
        application.enrollmentNumber = enrollmentNo;
        await User.findByIdAndUpdate(req.user._id, { enrollmentNo });
    }

    await application.save();

    res.status(200).json(new ApiResponse(200, { application }, 'Application submitted successfully.'));
});

// @desc    Add a document URL to the application
// @route   POST /api/v1/applications/:id/documents
// @access  Private (Applicant)
export const addDocument = asyncHandler(async (req, res) => {
    const { documentType, fileUrl } = req.body;

    if (!documentType || !fileUrl) {
        throw new ApiError(400, 'Please provide both documentType and fileUrl.');
    }

    const application = await Application.findOne({ _id: req.params.id, user: req.user._id });
    if (!application) throw new ApiError(404, 'Application not found');
    if (application.status !== 'Draft') throw new ApiError(400, 'Cannot add documents after submission.');

    const document = await Document.findOneAndUpdate(
        { application: application._id, documentType },
        { fileUrl, verificationStatus: 'Pending' },
        { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json(new ApiResponse(200, { document }, `${documentType} saved successfully.`));
});

// @desc    Get all documents for an application
// @route   GET /api/v1/applications/:id/documents
// @access  Private (Applicant)
export const getDocuments = asyncHandler(async (req, res) => {
    const documents = await Document.find({ application: req.params.id });
    res.status(200).json(new ApiResponse(200, { documents }, 'Documents fetched successfully.'));
});
