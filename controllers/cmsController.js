import FAQ from '../models/FAQ.js';
import Blog from '../models/Blog.js';
import HomepageBanner from '../models/HomepageBanner.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

// =======================
// FAQ CONTROLLERS
// =======================

export const getAllFAQs = asyncHandler(async (req, res) => {
    // Public route: only show active FAQs
    const faqs = await FAQ.find({ isActive: true });
    res.status(200).json(new ApiResponse(200, { faqs }, 'FAQs fetched successfully'));
});

export const createFAQ = asyncHandler(async (req, res) => {
    const faq = await FAQ.create(req.body);
    res.status(201).json(new ApiResponse(201, { faq }, 'FAQ created successfully'));
});

// =======================
// BLOG CONTROLLERS
// =======================

export const getAllBlogs = asyncHandler(async (req, res) => {
    // Public route: only show published blogs
    const blogs = await Blog.find({ isPublished: true }).sort('-createdAt');
    res.status(200).json(new ApiResponse(200, { blogs }, 'Blogs fetched successfully'));
});

export const getBlogBySlug = asyncHandler(async (req, res) => {
    const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true });
    
    if (!blog) {
        throw new ApiError(404, 'Blog not found');
    }
    
    res.status(200).json(new ApiResponse(200, { blog }, 'Blog fetched successfully'));
});

export const createBlog = asyncHandler(async (req, res) => {
    // Attach the current admin user as author
    req.body.author = req.user._id;
    
    const blog = await Blog.create(req.body);
    res.status(201).json(new ApiResponse(201, { blog }, 'Blog created successfully'));
});

// =======================
// BANNER CONTROLLERS
// =======================

export const getActiveBanners = asyncHandler(async (req, res) => {
    // Public route: fetch active banners sorted by order
    const banners = await HomepageBanner.find({ isActive: true }).sort('displayOrder');
    res.status(200).json(new ApiResponse(200, { banners }, 'Banners fetched successfully'));
});

export const getAllBannersAdmin = asyncHandler(async (req, res) => {
    const banners = await HomepageBanner.find().sort('displayOrder');
    res.status(200).json(new ApiResponse(200, { banners }, 'All banners fetched successfully'));
});

export const createBanner = asyncHandler(async (req, res) => {
    const banner = await HomepageBanner.create(req.body);
    res.status(201).json(new ApiResponse(201, { banner }, 'Banner created successfully'));
});

export const updateBanner = asyncHandler(async (req, res) => {
    const banner = await HomepageBanner.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!banner) throw new ApiError(404, 'Banner not found');
    res.status(200).json(new ApiResponse(200, { banner }, 'Banner updated successfully'));
});

export const deleteBanner = asyncHandler(async (req, res) => {
    const banner = await HomepageBanner.findByIdAndDelete(req.params.id);
    if (!banner) throw new ApiError(404, 'Banner not found');
    res.status(200).json(new ApiResponse(200, null, 'Banner deleted successfully'));
});
