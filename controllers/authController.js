import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { sendPasswordResetOtpEmail } from '../utils/emailService.js';
import { logWorkActivity } from '../utils/workLogger.js';

import { computeUserPermissions } from '../middlewares/authMiddleware.js';

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'super-secret-default-key-for-cvru-online-must-change', {
        expiresIn: process.env.JWT_EXPIRES_IN || '90d',
    });
};

const createSendToken = async (user, statusCode, res, message) => {
    const token = signToken(user._id);

    const permissions = await computeUserPermissions(user);
    const userObj = user.toObject ? user.toObject() : { ...user };
    userObj.password = undefined;
    userObj.permissions = permissions;
    userObj.isSuperAdmin = user.role === 'superadmin' || permissions.includes('*');

    res.status(statusCode).json(
        new ApiResponse(statusCode, { user: userObj, token }, message)
    );
};

export const register = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone, password, role } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
        throw new ApiError(400, 'Please provide all required fields');
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
        throw new ApiError(409, 'User with this email or phone already exists');
    }

    const newUser = await User.create({
        firstName,
        lastName,
        email,
        phone,
        password,
        role: role || 'applicant',
    });

    await createSendToken(newUser, 201, res, 'User registered successfully');
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, 'Please provide email and password');
    }

    // Explicitly select password since we set select: false in the model
    const user = await User.findOne({ email }).select('+password').populate('roleRef');

    if (!user || !(await user.comparePassword(password, user.password))) {
        throw new ApiError(401, 'Incorrect email or password');
    }

    await createSendToken(user, 200, res, 'Logged in successfully');
});

export const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, 'Please provide both old and new passwords');
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (user.role === 'superadmin' || req.user?.role === 'superadmin' || req.user?.isSuperAdmin) {
        throw new ApiError(403, 'Password changes are not allowed for Super Admin');
    }

    if (!(await user.comparePassword(oldPassword, user.password))) {
        throw new ApiError(401, 'Incorrect old password');
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json(new ApiResponse(200, {}, 'Password changed successfully'));
});

/**
 * Step 1: Send OTP to registered user email for password reset
 */
export const sendForgotPasswordOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, 'Please provide your registered email address');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        throw new ApiError(404, 'No account found with this email address');
    }

    if (user.role === 'superadmin') {
        throw new ApiError(403, 'Super Admin password cannot be reset via this form');
    }

    // Generate 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Hash OTP with SHA-256 before storing in database
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // Save token with 10-minute validity
    user.passwordResetToken = hashedOtp;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    // Send the email with the OTP
    try {
        await sendPasswordResetOtpEmail({
            to: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Student',
            otp,
        });
    } catch (mailError) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        console.error('Error sending OTP email:', mailError);
        throw new ApiError(500, 'Failed to send OTP to your email. Please try again later.');
    }

    res.status(200).json(
        new ApiResponse(200, { email: user.email }, 'Verification OTP has been sent to your email address')
    );
});

/**
 * Step 2: Verify the OTP sent to user email
 */
export const verifyForgotPasswordOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        throw new ApiError(400, 'Email and 6-digit OTP are required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = otp.toString().trim();

    const hashedOtp = crypto.createHash('sha256').update(normalizedOtp).digest('hex');

    const user = await User.findOne({
        email: normalizedEmail,
        passwordResetToken: hashedOtp,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(400, 'Invalid or expired OTP. Please verify the code or request a new one.');
    }

    // Issue a short-lived reset token (15 mins) for the password update step
    const resetToken = jwt.sign(
        { id: user._id, email: user.email, purpose: 'password_reset' },
        process.env.JWT_SECRET || 'super-secret-default-key-for-cvru-online-must-change',
        { expiresIn: '15m' }
    );

    res.status(200).json(
        new ApiResponse(200, { resetToken }, 'OTP verified successfully')
    );
});

/**
 * Step 3: Set new password using verified reset token
 */
export const resetPasswordWithOtp = asyncHandler(async (req, res) => {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
        throw new ApiError(400, 'Email, reset token, and new password are required');
    }

    if (newPassword.length < 8) {
        throw new ApiError(400, 'Password must be at least 8 characters long');
    }

    let decoded;
    try {
        decoded = jwt.verify(
            resetToken,
            process.env.JWT_SECRET || 'super-secret-default-key-for-cvru-online-must-change'
        );
    } catch (err) {
        throw new ApiError(400, 'Password reset session has expired. Please request a new OTP.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (decoded.purpose !== 'password_reset' || decoded.email !== normalizedEmail) {
        throw new ApiError(400, 'Invalid reset credentials. Please restart the reset process.');
    }

    const user = await User.findById(decoded.id).select('+password');
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (user.role === 'superadmin') {
        throw new ApiError(403, 'Super Admin password cannot be reset via this form');
    }

    // Set new password (pre-save hook will hash it with bcrypt)
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Log in audit log
    await logWorkActivity({
        actionType: 'PASSWORD_RESET',
        module: 'AUTH',
        performedBy: user._id,
        isSystemAction: false,
        targetUser: user._id,
        title: `User ${user.email} reset account password via OTP`,
        details: { email: user.email },
        req,
    });

    res.status(200).json(
        new ApiResponse(200, {}, 'Password reset successfully. You can now log in with your new password.')
    );
});
