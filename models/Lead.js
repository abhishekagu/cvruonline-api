import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide your full name'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Please provide your email address'],
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email address',
            ],
            trim: true,
        },
        phone: {
            type: String,
            required: [true, 'Please provide your phone number'],
            trim: true,
        },
        interested_program: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Program',
            required: false,
        },
        downloaded_prospectus: {
            type: Boolean,
            default: false,
        },
        source: {
            type: String,
            default: 'Website',
        },
        status: {
            type: String,
            enum: ['New', 'Contacted', 'Not Interested', 'Converted'],
            default: 'New',
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('Lead', leadSchema);
