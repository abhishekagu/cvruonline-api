import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email',
            ],
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            unique: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters long'],
            select: false, // Security: Do not return password in queries by default
        },
        role: {
            type: String,
            enum: ['applicant', 'student', 'faculty', 'admin', 'superadmin'],
            default: 'applicant',
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        myPrograms: [{
            type: String
        }],
        passwordResetToken: String,
        passwordResetExpires: Date,
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

// Document middleware: Hash password before saving to the database
userSchema.pre('save', async function () {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return;

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
});

// Instance method: Compare input password with the hashed password in the database
userSchema.methods.comparePassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

export default User;
