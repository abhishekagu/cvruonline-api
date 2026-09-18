import Program from '../models/Program.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

// @desc    Get all programs
// @route   GET /api/v1/programs
// @access  Public
export const getAllPrograms = asyncHandler(async (req, res) => {
    // Basic filtering based on query params (e.g., ?type=UG & is_trending=true)
    const queryObj = { ...req.query };
    
    // Execute query
    const programs = await Program.find(queryObj);

    res.status(200).json(
        new ApiResponse(200, { programs }, 'Programs fetched successfully')
    );
});

// @desc    Get single program by ID
// @route   GET /api/v1/programs/:id
// @access  Public
export const getProgram = asyncHandler(async (req, res) => {
    const program = await Program.findById(req.params.id);

    if (!program) {
        throw new ApiError(404, 'Program not found');
    }

    res.status(200).json(
        new ApiResponse(200, { program }, 'Program fetched successfully')
    );
});

// @desc    Create a new program
// @route   POST /api/v1/programs
// @access  Private (Admin)
export const createProgram = asyncHandler(async (req, res) => {
    const newProgram = await Program.create(req.body);

    res.status(201).json(
        new ApiResponse(201, { program: newProgram }, 'Program created successfully')
    );
});

// @desc    Update program
// @route   PATCH /api/v1/programs/:id
// @access  Private (Admin)
export const updateProgram = asyncHandler(async (req, res) => {
    const program = await Program.findByIdAndUpdate(req.params.id, req.body, {
        new: true, // return the updated document
        runValidators: true,
    });

    if (!program) {
        throw new ApiError(404, 'Program not found');
    }

    res.status(200).json(
        new ApiResponse(200, { program }, 'Program updated successfully')
    );
});

// @desc    Delete program
// @route   DELETE /api/v1/programs/:id
// @access  Private (Admin)
export const deleteProgram = asyncHandler(async (req, res) => {
    const program = await Program.findByIdAndDelete(req.params.id);

    if (!program) {
        throw new ApiError(404, 'Program not found');
    }

    res.status(200).json(
        new ApiResponse(200, null, 'Program deleted successfully')
    );
});
