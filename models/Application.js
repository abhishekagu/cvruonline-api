import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        program: {
            type: String, // String to match frontend IDs
            required: true,
        },
        status: {
            type: String,
            enum: ['Draft', 'Submitted', 'Under Review', 'Accepted', 'Rejected'],
            default: 'Draft',
        },
        basicDetails: {
            salutation: String,
            firstName: String,
            middleName: String,
            lastName: String,
            gender: String,
            dob: Date,
            mobileNo: String,
            email: String,
            aadhaarNo: String,
            fatherName: String,
            motherName: String,
        },
        otherDetails: {
            maritalStatus: String,
            religion: String,
            casteCategory: String,
            nationality: String,
            medium: String,
            domicileState: String,
            abcId: String,
            apaarId: String,
            debId: String,
        },
        currentAddress: {
            fullAddress: String,
            country: String,
            state: String,
            district: String,
            city: String,
            pinCode: String,
        },
        permanentAddress: {
            fullAddress: String,
            country: String,
            state: String,
            district: String,
            city: String,
            pinCode: String,
        },
        emergencyContact: {
            name: String,
            relation: String,
            contactNo: String,
            address: String,
        },
        qualifications: [
            {
                level: String,
                programName: String,
                specialization: String,
                institute: String,
                board: String,
                passingYear: String,
                percentage: String,
                grade: String,
                enrollmentNumber: String,
            }
        ],
        documents: [{
            documentType: String,
            fileUrl: String,
        }],
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
