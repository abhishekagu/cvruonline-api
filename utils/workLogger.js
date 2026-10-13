import WorkLog from '../models/WorkLog.js';

/**
 * Utility to asynchronously record an audit / work log entry.
 * It is non-blocking and handles errors without disrupting caller transactions.
 * 
 * @param {Object} options
 * @param {string} options.actionType
 * @param {string} options.module
 * @param {string} options.performedBy - User ObjectId or string
 * @param {string} [options.targetUser] - User ObjectId or string
 * @param {string} [options.targetEntityId] - Specific ID (applicationId, roleId, paymentId)
 * @param {string} options.title - Short summary
 * @param {Object} [options.details] - Detailed metadata or diff
 * @param {Object} [options.req] - Express request object for IP and userAgent extraction
 */
export const logWorkActivity = async ({
    actionType,
    module,
    performedBy,
    targetUser,
    targetEntityId,
    title,
    details = {},
    req = null,
}) => {
    try {
        let ipAddress = '127.0.0.1';
        let userAgent = 'Unknown';

        if (req) {
            ipAddress =
                req.headers['x-forwarded-for']?.split(',')[0].trim() ||
                req.socket?.remoteAddress ||
                req.ip ||
                '127.0.0.1';
            userAgent = req.headers['user-agent'] || 'Unknown';
        }

        await WorkLog.create({
            actionType,
            module,
            performedBy,
            targetUser: targetUser || null,
            targetEntityId: targetEntityId ? String(targetEntityId) : null,
            title,
            details,
            ipAddress,
            userAgent,
        });
    } catch (err) {
        console.error('⚠️ Failed to write WorkLog entry:', err.message);
    }
};

export default logWorkActivity;
