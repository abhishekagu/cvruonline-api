import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        program: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Program',
            required: true,
        },
        status: {
            type: String,
            enum: ['Draft', 'Submitted', 'Under Review', 'Accepted', 'Rejected'],
            default: 'Draft',
        },
        // Step 1: Personal Details
        personalDetails: {
            fatherName: String,
            motherName: String,
            dateOfBirth: Date,
            gender: {
                type: String,
                enum: ['Male', 'Female', 'Other'],
            },
            category: String, // General, OBC, SC, ST
            nationality: { type: String, default: 'Indian' },
        },
        // Step 2: Address
        address: {
            street: String,
            city: String,
            state: String,
            pincode: String,
            country: { type: String, default: 'India' },
        },
        // Step 3: Academic Qualifications
        academics: [
            {
                qualificationLevel: String, // e.g., '10th', '12th', 'UG'
                boardOrUniversity: String,
                yearOfPassing: Number,
                percentageOrCGPA: Number,
            }
        ],
        submittedAt: {
            type: Date,
        }
    },
    {
        timestamps: true,
    }
);

// Ensure a user can only have one active/draft application for a specific program
applicationSchema.index({ user: 1, program: 1 }, { unique: true });

export default mongoose.model('Application', applicationSchema);
