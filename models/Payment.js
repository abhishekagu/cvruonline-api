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
        razorpayOrderId: {
            type: String,
            required: true,
        },
        razorpayPaymentId: {
            type: String,
            // populated after successful payment
        },
        razorpaySignature: {
            type: String,
            // populated after successful payment
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
