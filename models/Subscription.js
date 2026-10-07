import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
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
        plan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Plan',
            required: true,
        },
        status: {
            type: String,
            enum: ['Pending', 'Active', 'Expired', 'Cancelled'],
            default: 'Pending',
        },
        startDate: {
            type: Date,
        },
        expiryDate: {
            type: Date,
            default: null, // null means lifetime access
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('Subscription', subscriptionSchema);
