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
