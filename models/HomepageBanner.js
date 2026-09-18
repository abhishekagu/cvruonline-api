import mongoose from 'mongoose';

const homepageBannerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'A banner must have a title'],
            trim: true,
        },
        subtitle: {
            type: String,
            trim: true,
        },
        desktopImageUrl: {
            type: String,
            required: [true, 'Please provide the desktop image URL'],
        },
        mobileImageUrl: {
            type: String,
            required: [true, 'Please provide the mobile image URL'],
        },
        linkUrl: {
            type: String,
            default: '/',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        displayOrder: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('HomepageBanner', homepageBannerSchema);
