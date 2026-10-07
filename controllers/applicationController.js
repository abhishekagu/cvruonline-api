import Application from '../models/Application.js';
import Document from '../models/Document.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

// @desc    Initialize a new draft application
// @route   POST /api/v1/applications
// @access  Private (Applicant)
export const createApplication = asyncHandler(async (req, res) => {
    const { programId } = req.body;
    
    if (!programId) {
        throw new ApiError(400, "programId is required");
    }

    const user = req.user;
    const profile = user.profileDetails || {};

    // Find or create application
    let application = await Application.findOne({ user: user._id, program: programId });
    
    const applicationData = {
        user: user._id,
        program: programId,
        status: 'Draft',
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
    const applications = await Application.find({ user: req.user._id }).populate('program', 'name type duration fee');
    res.status(200).json(new ApiResponse(200, { applications }, 'Applications fetched successfully.'));
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
