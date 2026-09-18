import Lead from '../models/Lead.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';

// @desc    Capture a new lead and mark prospectus as downloaded
// @route   POST /api/v1/leads/prospectus
// @access  Public
export const captureProspectusLead = asyncHandler(async (req, res) => {
    const { name, email, phone, interested_program } = req.body;

    // Create the lead
    const lead = await Lead.create({
        name,
        email,
        phone,
        interested_program,
        downloaded_prospectus: true, // Auto true because this is the prospectus endpoint
        source: 'Prospectus Download'
    });

    // In a real scenario, you might want to send an email with the prospectus link here
    // using a service like AWS SES, SendGrid, or Nodemailer.
    
    // For now, return success and a mock prospectus download URL
    const prospectusUrl = "https://lpu-online-mock-bucket.s3.amazonaws.com/LPU-Online-Prospectus-2026.pdf";

    res.status(201).json(
        new ApiResponse(201, { lead, prospectusUrl }, 'Lead captured. Prospectus is ready to download.')
    );
});

// @desc    Get all leads (For Admission Counselors/Admins)
// @route   GET /api/v1/leads
// @access  Private (Admin)
export const getAllLeads = asyncHandler(async (req, res) => {
    const leads = await Lead.find().sort('-createdAt').populate('interested_program', 'name type');
    
    res.status(200).json(
        new ApiResponse(200, { leads }, 'Leads fetched successfully')
    );
});
