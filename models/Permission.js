import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Permission name is required'],
            trim: true,
        },
        slug: {
            type: String,
            required: [true, 'Permission slug is required'],
            unique: true,
            trim: true,
            lowercase: true,
        },
        category: {
            type: String,
            required: [true, 'Permission category is required'],
            trim: true,
            default: 'General',
        },
        description: {
            type: String,
            trim: true,
        },
        route: {
            type: String,
            trim: true,
        },
        isSystem: {
            type: Boolean,
            default: false,
        },
        isAutoDiscovered: {
            type: Boolean,
            default: false,
        },
        actions: [
            {
                type: String,
                trim: true,
            },
        ],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

const Permission = mongoose.model('Permission', permissionSchema);

export default Permission;
