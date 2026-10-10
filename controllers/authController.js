import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'super-secret-default-key-for-cvru-online-must-change', {
        expiresIn: process.env.JWT_EXPIRES_IN || '90d',
    });
};

const createSendToken = (user, statusCode, res, message) => {
    const token = signToken(user._id);

    // Remove password from output just to be safe
    user.password = undefined;

    res.status(statusCode).json(
        new ApiResponse(statusCode, { user, token }, message)
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

    createSendToken(newUser, 201, res, 'User registered successfully');
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, 'Please provide email and password');
    }

    // Explicitly select password since we set select: false in the model
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password, user.password))) {
        throw new ApiError(401, 'Incorrect email or password');
    }

    createSendToken(user, 200, res, 'Logged in successfully');
});

export const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, 'Please provide both old and new passwords');
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user || !(await user.comparePassword(oldPassword, user.password))) {
        throw new ApiError(401, 'Incorrect old password');
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json(new ApiResponse(200, {}, 'Password changed successfully'));
});
