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
            enum: [
                'Dashboard',
                'Applications',
                'Documents',
                'Payments & Offline Fee',
                'Users & Students',
                'Contacts & Inquiries',
                'CMS & Banners',
                'Roles & Permissions',
                'Audit & Work Logs',
            ],
        },
        description: {
            type: String,
            trim: true,
        },
        isSystem: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Permission = mongoose.model('Permission', permissionSchema);

export default Permission;
