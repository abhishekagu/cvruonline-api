import Job from '../models/Job.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';

// =======================
// LMS GATEWAY API (MOCK)
// =======================

// @desc    Get live classes & schedule for the enrolled student
// @route   GET /api/v1/lms/classes
// @access  Private (Student)
export const getLiveClasses = asyncHandler(async (req, res) => {
    // In a real system, you'd fetch this from a third-party LMS (like Canvas, Moodle) 
    // or a dedicated schedule collection based on the student's program.
    
    const mockSchedule = [
        {
            id: 'c1',
            subject: 'Advanced Database Management',
            faculty: 'Dr. Smith',
            time: '10:00 AM - 11:30 AM',
            joinLink: 'https://zoom.us/j/mocklink123',
            type: 'Live Lecture'
        },
        {
            id: 'c2',
            subject: 'Data Structures and Algorithms',
            faculty: 'Prof. John',
            time: '01:00 PM - 02:00 PM',
            joinLink: 'https://zoom.us/j/mocklink456',
            type: 'Doubt Session'
        }
    ];

    res.status(200).json(new ApiResponse(200, { schedule: mockSchedule }, 'LMS schedule fetched successfully'));
});

// =======================
// PLACEMENT / JOB BOARD API
// =======================

// @desc    Get all active jobs
// @route   GET /api/v1/lms/jobs
// @access  Private (Student/Alumni)
export const getJobs = asyncHandler(async (req, res) => {
    const jobs = await Job.find({ isActive: true }).sort('-createdAt');
    res.status(200).json(new ApiResponse(200, { jobs }, 'Jobs fetched successfully'));
});

// @desc    Create a new job posting
// @route   POST /api/v1/lms/jobs
// @access  Private (Admin)
export const createJob = asyncHandler(async (req, res) => {
    const job = await Job.create(req.body);
    res.status(201).json(new ApiResponse(201, { job }, 'Job posted successfully'));
});
