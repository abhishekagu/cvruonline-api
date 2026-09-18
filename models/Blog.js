import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'A blog must have a title'],
            trim: true,
        },
        slug: {
            type: String,
            required: [true, 'A blog must have a slug'],
            unique: true,
            trim: true,
        },
        content: {
            type: String,
            required: [true, 'A blog must have content'],
        },
        coverImage: {
            type: String,
            required: [true, 'Please provide the cover image URL'],
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        tags: [String],
        isPublished: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Auto-populate author name on find queries
blogSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'author',
        select: 'firstName lastName',
    });
    next();
});

export default mongoose.model('Blog', blogSchema);
