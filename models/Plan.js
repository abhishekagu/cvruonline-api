import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
    {
        program: {
            type: String, // String to match frontend IDs like 'mba', 'bca'
            required: true,
        },
        name: {
            type: String,
            required: [true, 'A plan must have a name (e.g., Lifetime, 6 Months)'],
            trim: true,
        },
        price: {
            type: Number,
            required: [true, 'A plan must have a price'],
        },
        durationInDays: {
            type: Number,
            default: null, // null means lifetime
        },
        features: [{
            type: String,
            trim: true
        }],
        isActive: {
            type: Boolean,
            default: true,
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('Plan', planSchema);
