import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
    {
        application: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Application',
            required: true,
        },
        documentType: {
            type: String,
            required: true,
            enum: ['Profile Photo', 'Signature', 'Aadhar Card', '10th Marksheet', '12th Marksheet', 'UG Degree', 'Other'],
        },
        fileUrl: {
            type: String,
            required: [true, 'File URL is required (uploaded via frontend)'],
        },
        verificationStatus: {
            type: String,
            enum: ['Pending', 'Verified', 'Rejected'],
            default: 'Pending',
        },
        adminRemarks: {
            type: String, // Reason if rejected
        }
    },
    {
        timestamps: true,
    }
);

// Ensure an application doesn't have duplicate document types (like two 10th marksheets)
documentSchema.index({ application: 1, documentType: 1 }, { unique: true });

export default mongoose.model('Document', documentSchema);
