import express from 'express';
import {
    getAllFAQs,
    createFAQ,
    getAllBlogs,
    getBlogBySlug,
    getActiveBanners,
    getAllBannersAdmin,
    createBanner,
    updateBanner,
    deleteBanner,
    createBlog
} from '../controllers/cmsController.js';
import { verifyJWT, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

// =======================
// PUBLIC ROUTES
// =======================
router.get('/faqs', getAllFAQs);
router.get('/blogs', getAllBlogs);
router.get('/blogs/:slug', getBlogBySlug);
router.get('/banners', getActiveBanners);

// =======================
// PROTECTED ROUTES (Admin)
// =======================
router.use(verifyJWT);
router.use(restrictTo('admin', 'super-admin'));

router.post('/faqs', createFAQ);
router.post('/blogs', createBlog);

router.get('/admin/banners', getAllBannersAdmin);
router.post('/banners', createBanner);
router.patch('/banners/:id', updateBanner);
router.delete('/banners/:id', deleteBanner);

export default router;
