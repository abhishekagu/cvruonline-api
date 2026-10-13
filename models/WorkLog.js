import mongoose from 'mongoose';

const workLogSchema = new mongoose.Schema(
    {
        actionType: {
            type: String,
            required: [true, 'Action type is required'],
            enum: [
                // RBAC / Management Actions
                'ROLE_ASSIGNED',
                'ROLE_REVOKED',
                'ROLE_CREATED',
                'ROLE_UPDATED',
                'ROLE_DELETED',
                'PERMISSIONS_UPDATED',
                'USER_PERMISSION_REVOKED',
                'USER_PERMISSION_RESTORED',
                'STAFF_REGISTERED',

                // Operational Work Tasks
                'APPLICATION_STATUS_UPDATED',
                'DOCUMENT_VERIFIED',
                'OFFLINE_PAYMENT_RECORDED',
                'CONTACT_STATUS_UPDATED',
                'CONTACT_DELETED',
                'USER_UPDATED',
            ],
        },
        module: {
            type: String,
            required: [true, 'Module is required'],
            enum: [
                'RBAC',
                'Applications',
                'Documents',
                'Payments',
                'Contacts',
                'Users',
                'CMS',
            ],
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Performer user ID is required'],
        },
        targetUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        targetEntityId: {
            type: String,
        },
        title: {
            type: String,
            required: [true, 'Log title is required'],
            trim: true,
        },
        details: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        ipAddress: {
            type: String,
            default: 'N/A',
        },
        userAgent: {
            type: String,
            default: 'N/A',
        },
    },
    {
        timestamps: true,
    }
);

// Indexing for rapid audit query filtering
workLogSchema.index({ performedBy: 1, createdAt: -1 });
workLogSchema.index({ targetUser: 1, createdAt: -1 });
workLogSchema.index({ actionType: 1, createdAt: -1 });
workLogSchema.index({ module: 1, createdAt: -1 });

const WorkLog = mongoose.model('WorkLog', workLogSchema);

export default WorkLog;
