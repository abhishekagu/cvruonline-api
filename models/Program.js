import mongoose from 'mongoose';

const programSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A program must have a name'],
            trim: true,
            unique: true,
        },
        type: {
            type: String,
            required: [true, 'A program must have a type'],
            enum: ['UG', 'PG', 'Diploma', 'Certificate'],
        },
        duration: {
            type: String,
            required: [true, 'Please specify the duration (e.g., "3 Years", "6 Months")'],
        },
        eligibility_criteria: {
            type: String,
            required: [true, 'Please provide the eligibility criteria'],
        },
        total_fee: {
            type: Number,
            required: [true, 'A program must have a total fee'],
        },
        is_trending: {
            type: Boolean,
            default: false,
        },
        description: {
            type: String,
            trim: true,
        }
    },
    {
        timestamps: true,
    }
);

const Program = mongoose.model('Program', programSchema);

export default Program;
