import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: [true, 'Please provide the FAQ question'],
            trim: true,
        },
        answer: {
            type: String,
            required: [true, 'Please provide the FAQ answer'],
            trim: true,
        },
        category: {
            type: String,
            default: 'General',
            trim: true,
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

export default mongoose.model('FAQ', faqSchema);
