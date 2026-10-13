import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Role name is required'],
            trim: true,
            unique: true,
        },
        slug: {
            type: String,
            required: [true, 'Role slug is required'],
            unique: true,
            trim: true,
            lowercase: true,
        },
        description: {
            type: String,
            trim: true,
        },
        permissions: [
            {
                type: String,
                trim: true,
            },
        ],
        isSystem: {
            type: Boolean,
            default: false,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

const Role = mongoose.model('Role', roleSchema);

export default Role;
