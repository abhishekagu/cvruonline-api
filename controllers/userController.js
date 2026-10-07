import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

// @desc    Get user's bookmarked programs
// @route   GET /api/users/my-programs
// @access  Private
export const getMyPrograms = asyncHandler(async (req, res) => {
    // req.user is set by verifyJWT middleware
    const user = await User.findById(req.user._id);
    
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.status(200).json(
        new ApiResponse(200, { myPrograms: user.myPrograms || [] }, 'Programs fetched successfully')
    );
});

// @desc    Toggle a program in user's bookmarks
// @route   POST /api/users/my-programs/toggle
// @access  Private
export const toggleMyProgram = asyncHandler(async (req, res) => {
    const { programId } = req.body;
    
    if (!programId) {
        throw new ApiError(400, 'Program ID is required');
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // Initialize myPrograms if undefined
    if (!user.myPrograms) {
        user.myPrograms = [];
    }

    const programIndex = user.myPrograms.indexOf(programId);
    
    // If program is already in array, remove it. Otherwise, add it.
    if (programIndex > -1) {
        user.myPrograms.splice(programIndex, 1);
    } else {
        user.myPrograms.push(programId);
    }

    await user.save();

    res.status(200).json(
        new ApiResponse(200, { myPrograms: user.myPrograms }, 'Program toggled successfully')
    );
});

// @desc    Get user's active subscriptions
// @route   GET /api/users/subscriptions
// @access  Private
export const getMySubscriptions = asyncHandler(async (req, res) => {
    const Subscription = (await import('../models/Subscription.js')).default;
    
    // Find active subscriptions where expiry is null or in the future
    const subscriptions = await Subscription.find({
        user: req.user._id,
        status: 'Active',
        $or: [
            { expiryDate: null },
            { expiryDate: { $gt: new Date() } }
        ]
    }).populate('plan');

    res.status(200).json(
        new ApiResponse(200, { subscriptions }, 'Subscriptions fetched successfully')
    );
});

// @desc    Get current user profile details
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json(new ApiResponse(200, { user }, 'Profile fetched successfully'));
});

// @desc    Update current user profile details
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const data = req.body;

    const parseJSON = (field) => {
        if (data[field]) {
            try { return typeof data[field] === 'string' ? JSON.parse(data[field]) : data[field]; }
            catch (e) { console.error(`Failed to parse ${field}`, e); return null; }
        }
        return null;
    };

    const parsedQualifications = parseJSON('qualifications') || [];
    const parsedCurrentAddress = parseJSON('currentAddress');
    const parsedPermanentAddress = parseJSON('permanentAddress');
    const parsedEmergencyContact = parseJSON('emergencyContact');

    // Process files if any
    const documentArray = user.profileDetails?.documents || [];
    if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
            const newDoc = {
                documentType: file.fieldname,
                fileUrl: `/uploads/${file.filename}`
            };
            const existingIndex = documentArray.findIndex(d => d.documentType === newDoc.documentType);
            if (existingIndex > -1) {
                documentArray[existingIndex] = newDoc;
            } else {
                documentArray.push(newDoc);
            }
        });
    }

    // Assign base user fields if provided
    if (data.firstName) user.firstName = data.firstName;
    if (data.lastName) user.lastName = data.lastName;
    if (data.phone) user.phone = data.phone;
    
    // Assign profileDetails
    user.profileDetails = {
        salutation: data.salutation || user.profileDetails?.salutation,
        middleName: data.middleName || user.profileDetails?.middleName,
        gender: data.gender || user.profileDetails?.gender,
        dob: data.dob || user.profileDetails?.dob,
        aadhaarNo: data.aadhaarNo || user.profileDetails?.aadhaarNo,
        fatherName: data.fatherName || user.profileDetails?.fatherName,
        motherName: data.motherName || user.profileDetails?.motherName,
        maritalStatus: data.maritalStatus || user.profileDetails?.maritalStatus,
        religion: data.religion || user.profileDetails?.religion,
        casteCategory: data.casteCategory || user.profileDetails?.casteCategory,
        nationality: data.nationality || user.profileDetails?.nationality,
        medium: data.medium || user.profileDetails?.medium,
        domicileState: data.domicileState || user.profileDetails?.domicileState,
        abcId: data.abcId || user.profileDetails?.abcId,
        apaarId: data.apaarId || user.profileDetails?.apaarId,
        debId: data.debId || user.profileDetails?.debId,
        currentAddress: parsedCurrentAddress || user.profileDetails?.currentAddress,
        permanentAddress: parsedPermanentAddress || user.profileDetails?.permanentAddress,
        emergencyContact: parsedEmergencyContact || user.profileDetails?.emergencyContact,
        qualifications: parsedQualifications.length > 0 ? parsedQualifications : user.profileDetails?.qualifications,
        documents: documentArray
    };

    await user.save();

    res.status(200).json(new ApiResponse(200, { user }, 'Profile updated successfully'));
});
