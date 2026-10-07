import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        application: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Application',
            required: false, // Changed from true to allow Paytm payments without application
        },
        amount: {
            type: Number,
            required: [true, 'Payment amount is required'],
        },
        currency: {
            type: String,
            default: 'INR',
        },
        orderId: {
            type: String,
            required: true,
        },
        transactionId: {
            type: String,
        },
        signature: {
            type: String,
        },
        status: {
            type: String,
            enum: ['Created', 'Pending', 'Success', 'Failed', 'Refunded'],
            default: 'Created',
        },
        type: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('Payment', paymentSchema);
