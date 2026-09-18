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
            required: true,
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
            enum: ['Created', 'Success', 'Failed', 'Refunded'],
            default: 'Created',
        },
        type: {
            type: String,
            enum: ['Application Fee', 'Tuition Fee'],
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('Payment', paymentSchema);
