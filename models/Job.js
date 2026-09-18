import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Job title is required'],
            trim: true,
        },
        company: {
            type: String,
            required: [true, 'Company name is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Job description is required'],
        },
        requirements: [String],
        salary: {
            type: String,
            default: 'Not Disclosed',
        },
        applyUrl: {
            type: String, // Link to external application or internal contact
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('Job', jobSchema);
