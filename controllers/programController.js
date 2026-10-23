import fs from 'fs';
import mongoose from 'mongoose';
import Program from '../models/Program.js';
import WorkLog from '../models/WorkLog.js';
import { initialProgramsSeedData } from '../utils/seedPrograms.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import {
    findExistingDuplicateFile,
    extractProgramFiles,
    deleteMultipleFilesIfUnused,
    deleteFileIfUnused,
} from '../utils/fileStorageHelper.js';

// @desc    Get all programs (Public catalog: active and published only; Admin: optionally all)
// @route   GET /api/programs
// @access  Public / Staff
export const getAllPrograms = asyncHandler(async (req, res) => {
    const { includeInactive, all, type, level, category } = req.query;

    const query = {};

    // For public catalog: Return active published programs,
    // OR programs that have an active lastPublishedSnapshot or are seeded core programs
    if (includeInactive !== 'true' && all !== 'true') {
        query.isActive = true;
        query.$or = [
            { publishStatus: 'PUBLISHED' },
            { publishStatus: { $exists: false } },
            { lastPublishedSnapshot: { $ne: null } },
            { slug: { $in: initialProgramsSeedData.map(s => s.slug) } }
        ];
    }

    if (type) query.type = type;
    if (level) query.level = level;
    if (category && category !== 'all') {
        query.categories = category;
    }

    let programs = await Program.find(query).sort({ level: 1, type: 1, createdAt: -1 });

    // For public requests: If a program has a pending revision/draft/rejected state,
    // serve the live snapshot (or seed baseline) so the public catalog is never broken!
    if (includeInactive !== 'true' && all !== 'true') {
        programs = programs.map(p => {
            if (p.publishStatus !== 'PUBLISHED') {
                const snapshot = p.lastPublishedSnapshot || initialProgramsSeedData.find(s => s.slug === p.slug);
                if (snapshot) {
                    const snap = typeof snapshot === 'object' ? { ...snapshot } : snapshot;
                    snap._id = p._id;
                    snap.slug = p.slug;
                    snap.isActive = p.isActive !== false;
                    return snap;
                }
            }
            return p;
        });
    }

    // Fallback: If DB is empty, use initial seed programs
    if (programs.length === 0 && (!type && !level)) {
        const activeInitial = includeInactive === 'true' || all === 'true'
            ? initialProgramsSeedData
            : initialProgramsSeedData.filter(p => p.isActive !== false);
        programs = activeInitial;
    }

    res.status(200).json(
        new ApiResponse(200, { programs, total: programs.length }, 'Programs fetched successfully')
    );
});

// @desc    Get all programs for Admin CMS (includes active, inactive, drafts, pending approval, rejected)
// @route   GET /api/programs/admin/all
// @access  Private (Staff with programs.view, programs.manage / Super Admin)
export const getAdminPrograms = asyncHandler(async (req, res) => {
    const { type, level, category, publishStatus } = req.query;

    const query = {};
    if (type) query.type = type;
    if (level) query.level = level;
    if (category && category !== 'all') {
        query.categories = category;
    }
    if (publishStatus && publishStatus !== 'ALL') {
        query.publishStatus = publishStatus;
    }

    let programs = await Program.find(query)
        .populate('createdBy', 'firstName lastName email role')
        .populate('reviewedBy', 'firstName lastName email role')
        .populate('assignedReviewer', 'firstName lastName email role')
        .populate('approvalHistory.performedBy', 'firstName lastName email role')
        .sort({ level: 1, type: 1, createdAt: -1 });

    // Fallback: If DB is empty, use initial seed programs
    if (programs.length === 0 && (!type && !level && !publishStatus)) {
        programs = initialProgramsSeedData;
    }

    res.status(200).json(
        new ApiResponse(200, { programs, total: programs.length }, 'Admin programs fetched successfully')
    );
});

// @desc    Get single program by slug or ID
// @route   GET /api/programs/:id
// @access  Public
export const getProgram = asyncHandler(async (req, res) => {
    const param = req.params.id;
    let program = null;

    if (mongoose.Types.ObjectId.isValid(param)) {
        program = await Program.findById(param)
            .populate('createdBy', 'firstName lastName email role')
            .populate('reviewedBy', 'firstName lastName email role')
            .populate('assignedReviewer', 'firstName lastName email role')
            .populate('approvalHistory.performedBy', 'firstName lastName email role');
    }

    if (!program) {
        program = await Program.findOne({ slug: param.toLowerCase() })
            .populate('createdBy', 'firstName lastName email role')
            .populate('reviewedBy', 'firstName lastName email role')
            .populate('assignedReviewer', 'firstName lastName email role')
            .populate('approvalHistory.performedBy', 'firstName lastName email role');
    }

    // Fallback from initial seed data if not found in database
    if (!program) {
        const staticMatch = initialProgramsSeedData.find(
            p => p.slug === param.toLowerCase()
        );
        if (staticMatch) {
            program = staticMatch;
        }
    }

    if (!program) {
        throw new ApiError(404, 'Program not found');
    }

    // If the program revision is currently in review/draft/rejected, but an approved live snapshot (or seed baseline) exists:
    // Serve the live snapshot to public visitors so the degree details page is never broken while edits are under review!
    if (program.publishStatus !== 'PUBLISHED') {
        const snapshot = program.lastPublishedSnapshot || initialProgramsSeedData.find(s => s.slug === program.slug);
        if (snapshot) {
            const liveSnapshot = typeof snapshot === 'object' 
                ? { ...snapshot } 
                : snapshot;
            liveSnapshot._id = program._id;
            liveSnapshot.slug = program.slug;
            liveSnapshot.isActive = program.isActive !== false;
            
            return res.status(200).json(
                new ApiResponse(200, { program: liveSnapshot }, 'Program fetched successfully (Live Snapshot)')
            );
        }
    }

    res.status(200).json(
        new ApiResponse(200, { program }, 'Program fetched successfully')
    );
});

// @desc    Upload program image (hero image, placement image, PEP enhancement image)
// @route   POST /api/programs/upload-image
// @access  Private (Staff with programs.manage / Super Admin)
export const uploadProgramImage = asyncHandler(async (req, res) => {
    const file = req.file || (req.files && req.files[0]);
    if (!file) {
        throw new ApiError(400, 'Please select a file to upload');
    }

    // Clean up any extra files received if multipart contained duplicate fields
    if (req.files && req.files.length > 1) {
        for (let i = 1; i < req.files.length; i++) {
            try {
                if (fs.existsSync(req.files[i].path)) {
                    fs.unlinkSync(req.files[i].path);
                }
            } catch (cleanupErr) {
                // Ignore transient cleanup issue
            }
        }
    }

    // Check if an identical file content already exists in uploads/
    const duplicate = findExistingDuplicateFile(file.path);
    if (duplicate) {
        // Remove newly created duplicate file from disk
        try {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        } catch (unlinkErr) {
            console.error('[STORAGE] Error unlinking duplicate upload:', unlinkErr.message);
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    url: duplicate.url,
                    filename: duplicate.filename,
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    reused: true,
                },
                'Existing identical file found in uploads and reused to save storage space'
            )
        );
    }

    // Unique file saved in 'uploads/' directory
    const fileUrl = `/uploads/${file.filename}`;

    res.status(200).json(
        new ApiResponse(
            200,
            {
                url: fileUrl,
                filename: file.filename,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                reused: false,
            },
            'File uploaded successfully'
        )
    );
});

// @desc    Clean up unreferenced uploaded file (e.g. replaced during editing session)
// @route   POST /api/programs/cleanup-file
// @access  Private (Staff with programs.manage / Super Admin)
export const cleanupUnusedUpload = asyncHandler(async (req, res) => {
    const { fileUrl, fileUrls } = req.body;
    const targets = Array.isArray(fileUrls) ? fileUrls : (fileUrl ? [fileUrl] : []);

    if (targets.length === 0) {
        throw new ApiError(400, 'No file URL provided for cleanup');
    }

    const results = await deleteMultipleFilesIfUnused(targets);
    res.status(200).json(
        new ApiResponse(200, { results }, 'Unused files cleanup processed')
    );
});

// Helper to validate mandatory banner images and conditional detail images
export const validateProgramImages = (payload, isUpdating = false) => {
    // 1. Hero banner image is required
    if (!isUpdating || payload.heroImage !== undefined) {
        if (!payload.heroImage || !payload.heroImage.trim()) {
            throw new ApiError(400, 'Hero banner image is required');
        }
    }

    // 2. If placement support narrative is provided, placement banner image is required
    if (payload.placements?.supportText && payload.placements.supportText.trim().length > 0) {
        if (!payload.placements.supportImage || !payload.placements.supportImage.trim()) {
            throw new ApiError(400, 'Placement banner image is required when placement support narrative is provided');
        }
    }

    // 3. For each PEP card in placements.enhancement, if title or desc is filled, image is required
    if (Array.isArray(payload.placements?.enhancement)) {
        for (let i = 0; i < payload.placements.enhancement.length; i++) {
            const card = payload.placements.enhancement[i];
            const hasDetail = Boolean(card?.title?.trim() || card?.desc?.trim());
            if (hasDetail && (!card?.image || !card.image.trim())) {
                throw new ApiError(400, `Image is required for PEP enhancement card #${i + 1} ("${card?.title?.trim() || 'Untitled'}") because details are filled`);
            }
        }
    }
};

// @desc    Create a new academic program
// @route   POST /api/programs
// @access  Private (Staff with programs.manage / Super Admin)
export const createProgram = asyncHandler(async (req, res) => {
    const data = { ...req.body };

    // Image fields validation (Banner and conditional detail images)
    validateProgramImages(data, false);

    // Strip protected internal and populated relation fields so they never conflict with schema types
    delete data._id;
    delete data.createdBy;
    delete data.reviewedBy;
    delete data.reviewedAt;
    delete data.submittedAt;
    delete data.approvalHistory;
    delete data.lastPublishedSnapshot;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.__v;

    if (data.assignedReviewer && typeof data.assignedReviewer === 'object') {
        data.assignedReviewer = data.assignedReviewer._id || null;
    }

    // Format slug
    if (!data.slug) {
        data.slug = (data.type || data.title || '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
    } else {
        data.slug = data.slug.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
    }

    if (!data.slug) {
        throw new ApiError(400, 'A valid slug or degree type is required to identify the program');
    }

    const existing = await Program.findOne({ slug: data.slug });
    if (existing) {
        throw new ApiError(400, `A program with identifier "${data.slug}" already exists`);
    }

    // Determine user publishing authorization (Super Admin or role holding programs.approve)
    const isApprover = Boolean(
        req.user?.isSuperAdmin ||
        req.user?.role === 'superadmin' ||
        req.user?.permissions?.includes('*') ||
        req.user?.permissions?.includes('programs.approve')
    );

    const submissionIntent = data.submissionIntent || (data.isDraft ? 'DRAFT' : null);

    if (isApprover) {
        // Approver / Super Admin can publish directly or save as draft
        if (submissionIntent === 'DRAFT' || data.publishStatus === 'DRAFT') {
            data.publishStatus = 'DRAFT';
            data.isActive = false;
        } else {
            data.publishStatus = 'PUBLISHED';
            data.isActive = typeof data.isActive === 'boolean' ? data.isActive : true;
            data.reviewedBy = req.user?._id;
            data.reviewedAt = new Date();
        }
    } else {
        // Non-superadmin / Staff author
        // MUST enter PENDING_APPROVAL unless saved explicitly as DRAFT
        if (submissionIntent === 'DRAFT' || data.publishStatus === 'DRAFT') {
            data.publishStatus = 'DRAFT';
            data.isActive = false;
        } else {
            data.publishStatus = 'PENDING_APPROVAL';
            data.isActive = false; // Cannot be active until approved
            data.submittedAt = new Date();
        }
    }

    data.createdBy = req.user?._id || null;

    // Initialize approvalHistory
    data.approvalHistory = [
        {
            action: data.publishStatus === 'PUBLISHED' ? 'APPROVED' : data.publishStatus === 'DRAFT' ? 'EDITED' : 'SUBMITTED',
            performedBy: req.user?._id || null,
            performedAt: new Date(),
            reason: data.publishStatus === 'PUBLISHED' 
                ? 'Directly approved and published by administrator' 
                : data.publishStatus === 'DRAFT' 
                    ? 'Saved initial draft' 
                    : 'Submitted program for administrative approval and publishing',
        }
    ];

    delete data.submissionIntent;
    delete data.isDraft;

    if (data.publishStatus === 'PUBLISHED') {
        const snap = { ...data };
        delete snap.approvalHistory;
        data.lastPublishedSnapshot = snap;
    }

    const program = await Program.create(data);

    // Audit Log
    try {
        await WorkLog.create({
            actionType: data.publishStatus === 'PENDING_APPROVAL' ? 'PROGRAM_SUBMITTED' : 'PROGRAM_CREATED',
            module: 'CMS',
            performedBy: req.user?._id || null,
            targetEntityId: program._id.toString(),
            title: data.publishStatus === 'PENDING_APPROVAL'
                ? `Submitted Program for Approval: ${program.title} (${program.type})`
                : `Created Program: ${program.title} (${program.type}) [Status: ${program.publishStatus}]`,
            details: {
                slug: program.slug,
                type: program.type,
                level: program.level,
                baseFee: program.baseFee,
                isActive: program.isActive,
                publishStatus: program.publishStatus,
                isApprover,
            },
        });
    } catch (logErr) {
        console.error('WorkLog error on program create:', logErr);
    }

    res.status(201).json(
        new ApiResponse(201, { program }, data.publishStatus === 'PENDING_APPROVAL'
            ? 'Program submitted for approval. Super Admin or assigned reviewers will review before publishing.'
            : 'Program created successfully')
    );
});

// @desc    Update an existing academic program
// @route   PATCH /api/programs/:id
// @access  Private (Staff with programs.manage / Super Admin)
export const updateProgram = asyncHandler(async (req, res) => {
    const param = req.params.id;
    let program = null;

    if (mongoose.Types.ObjectId.isValid(param)) {
        program = await Program.findById(param);
    }
    if (!program) {
        program = await Program.findOne({ slug: param.toLowerCase() });
    }

    if (!program) {
        throw new ApiError(404, 'Program not found');
    }

    // If slug is being updated, verify it doesn't conflict
    if (req.body.slug && req.body.slug.toLowerCase() !== program.slug) {
        const cleanSlug = req.body.slug.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
        const conflict = await Program.findOne({ slug: cleanSlug, _id: { $ne: program._id } });
        if (conflict) {
            throw new ApiError(400, `Slug "${cleanSlug}" is already used by another program`);
        }
        req.body.slug = cleanSlug;
    }

    // Image fields validation (Banner and conditional detail images)
    validateProgramImages(req.body, true);

    const isApprover = Boolean(
        req.user?.isSuperAdmin ||
        req.user?.role === 'superadmin' ||
        req.user?.permissions?.includes('*') ||
        req.user?.permissions?.includes('programs.approve')
    );

    const submissionIntent = req.body.submissionIntent;

    let hasLiveSnapshot = Boolean(program.lastPublishedSnapshot);
    if (!hasLiveSnapshot) {
        const seedBaseline = initialProgramsSeedData.find(p => p.slug === program.slug);
        if (seedBaseline) {
            program.lastPublishedSnapshot = seedBaseline;
            hasLiveSnapshot = true;
        }
    }

    // Handle workflow transitions when updating:
    if (!isApprover) {
        // Staff user editing:
        if (submissionIntent === 'SUBMIT') {
            // Submitting (or resubmitting) for approval
            program.publishStatus = 'PENDING_APPROVAL';
            // If the program has a live published snapshot, keep isActive true so public site is not interrupted!
            program.isActive = hasLiveSnapshot;
            program.submittedAt = new Date();
            program.rejectionReason = ''; // Clear previous rejection reason
            if (req.body.submitNote || req.body.submitterNote) {
                program.submitterNote = req.body.submitNote || req.body.submitterNote;
            }
            program.approvalHistory.push({
                action: 'SUBMITTED',
                performedBy: req.user?._id || null,
                performedAt: new Date(),
                reason: req.body.submitNote || req.body.submitterNote || 'Resubmitted for administrative approval'
            });
        } else if (submissionIntent === 'DRAFT') {
            // Keep or switch to DRAFT
            program.publishStatus = 'DRAFT';
            program.isActive = hasLiveSnapshot;
        } else if (program.publishStatus === 'REJECTED') {
            // If saving an edit on a rejected item without submit, keep in REJECTED or DRAFT
            if (req.body.publishStatus && req.body.publishStatus !== 'PUBLISHED') {
                program.publishStatus = req.body.publishStatus;
            }
            if (hasLiveSnapshot) {
                program.isActive = true;
            }
        }
    } else {
        // Approver / Super Admin can change publishStatus or publish directly
        if (submissionIntent === 'PUBLISH') {
            program.publishStatus = 'PUBLISHED';
            program.isActive = true;
            program.reviewedBy = req.user?._id;
            program.reviewedAt = new Date();
            program.rejectionReason = '';
            program.approvalHistory.push({
                action: 'APPROVED',
                performedBy: req.user?._id || null,
                performedAt: new Date(),
                reason: req.body.submitNote || req.body.submitterNote || 'Directly approved and published by administrator'
            });
        } else if (submissionIntent === 'DRAFT') {
            program.publishStatus = 'DRAFT';
            program.isActive = hasLiveSnapshot;
        } else if (req.body.publishStatus) {
            program.publishStatus = req.body.publishStatus;
            if (typeof req.body.isActive === 'boolean') {
                program.isActive = req.body.isActive;
            }
            if (program.publishStatus === 'PUBLISHED') {
                program.isActive = true;
                program.rejectionReason = '';
            }
        }
    }

    // Clean payload of action helpers, internal metadata, and populated relation objects
    // WORKFLOW FIELDS MUST BE DELETED so Object.assign NEVER overwrites workflow decisions!
    delete req.body._id;
    delete req.body.createdBy;
    delete req.body.reviewedBy;
    delete req.body.reviewedAt;
    delete req.body.submittedAt;
    delete req.body.approvalHistory;
    delete req.body.lastPublishedSnapshot;
    delete req.body.hasLiveSnapshot;
    delete req.body.createdAt;
    delete req.body.updatedAt;
    delete req.body.__v;
    delete req.body.submissionIntent;
    delete req.body.submitNote;
    delete req.body.submitterNote;
    delete req.body.publishStatus;
    delete req.body.isActive;
    delete req.body.rejectionReason;

    if (req.body.assignedReviewer && typeof req.body.assignedReviewer === 'object') {
        req.body.assignedReviewer = req.body.assignedReviewer._id || null;
    }

    // Extract file references from the existing program document before updating
    const previousFiles = extractProgramFiles(program.toObject());

    Object.assign(program, req.body);
    if (program.publishStatus === 'PUBLISHED') {
        program.isActive = true;
        program.rejectionReason = '';
        const snap = program.toObject();
        delete snap.lastPublishedSnapshot;
        delete snap.approvalHistory;
        program.lastPublishedSnapshot = snap;
    }
    await program.save();

    // Check for replaced/removed files and delete them if no other program or model uses them
    const currentFiles = extractProgramFiles(program.toObject());
    const replacedFiles = previousFiles.filter(f => !currentFiles.includes(f));
    if (replacedFiles.length > 0) {
        deleteMultipleFilesIfUnused(replacedFiles, program._id).catch(cleanErr => {
            console.error('[STORAGE] Error cleaning replaced files on program update:', cleanErr.message);
        });
    }

    // Audit Log
    try {
        await WorkLog.create({
            actionType: 'PROGRAM_UPDATED',
            module: 'CMS',
            performedBy: req.user?._id || null,
            targetEntityId: program._id.toString(),
            title: `Updated Program: ${program.title} (${program.type})`,
            details: {
                slug: program.slug,
                type: program.type,
                isActive: program.isActive,
                publishStatus: program.publishStatus,
                baseFee: program.baseFee,
            },
        });
    } catch (logErr) {
        console.error('WorkLog error on program update:', logErr);
    }

    res.status(200).json(
        new ApiResponse(200, { program }, 'Program updated successfully')
    );
});

// @desc    Submit / Request publish for a draft or rejected program
// @route   POST /api/programs/:id/request-publish
// @access  Private (Staff with programs.manage / Super Admin)
export const requestPublishProgram = asyncHandler(async (req, res) => {
    const param = req.params.id;
    let program = null;

    if (mongoose.Types.ObjectId.isValid(param)) {
        program = await Program.findById(param);
    }
    if (!program) {
        program = await Program.findOne({ slug: param.toLowerCase() });
    }

    if (!program) {
        throw new ApiError(404, 'Program not found');
    }

    if (program.publishStatus === 'PUBLISHED') {
        throw new ApiError(400, 'Program is already published');
    }

    const { note, assignedReviewer } = req.body;

    let hasLiveSnapshot = Boolean(program.lastPublishedSnapshot);
    if (!hasLiveSnapshot) {
        const seedBaseline = initialProgramsSeedData.find(p => p.slug === program.slug);
        if (seedBaseline) {
            program.lastPublishedSnapshot = seedBaseline;
            hasLiveSnapshot = true;
        }
    }

    program.publishStatus = 'PENDING_APPROVAL';
    program.isActive = hasLiveSnapshot;
    program.submittedAt = new Date();
    program.rejectionReason = ''; // Clear previous rejection
    if (note) {
        program.submitterNote = note;
    }
    if (assignedReviewer && mongoose.Types.ObjectId.isValid(assignedReviewer)) {
        program.assignedReviewer = assignedReviewer;
    }

    // Add to approval history
    program.approvalHistory.push({
        action: 'SUBMITTED',
        performedBy: req.user?._id || null,
        performedAt: new Date(),
        reason: note || 'Submitted for administrative approval and publishing',
    });

    await program.save();

    // Audit Log
    try {
        await WorkLog.create({
            actionType: 'PROGRAM_SUBMITTED',
            module: 'CMS',
            performedBy: req.user?._id || null,
            targetEntityId: program._id.toString(),
            title: `Requested Publish: ${program.title} (${program.type})`,
            details: {
                slug: program.slug,
                type: program.type,
                note: note || '',
                assignedReviewer: assignedReviewer || null,
            },
        });
    } catch (logErr) {
        console.error('WorkLog error on request publish:', logErr);
    }

    res.status(200).json(
        new ApiResponse(200, { program }, 'Program submitted for approval successfully')
    );
});

// @desc    Approve and publish a program to live catalog
// @route   POST /api/programs/:id/approve
// @access  Private (Super Admin or Staff with programs.approve)
export const approveProgram = asyncHandler(async (req, res) => {
    const param = req.params.id;
    let program = null;

    if (mongoose.Types.ObjectId.isValid(param)) {
        program = await Program.findById(param);
    }
    if (!program) {
        program = await Program.findOne({ slug: param.toLowerCase() });
    }

    if (!program) {
        throw new ApiError(404, 'Program not found');
    }

    const { note } = req.body;

    program.publishStatus = 'PUBLISHED';
    program.isActive = true;
    program.reviewedBy = req.user?._id;
    program.reviewedAt = new Date();
    program.rejectionReason = ''; // Clear rejection reason

    // Freeze approved state into snapshot for visual diff comparisons
    const snap = program.toObject();
    delete snap.lastPublishedSnapshot;
    delete snap.approvalHistory;
    program.lastPublishedSnapshot = snap;

    program.approvalHistory.push({
        action: 'APPROVED',
        performedBy: req.user?._id || null,
        performedAt: new Date(),
        reason: note || 'Approved and published to university catalog',
    });

    await program.save();

    // Audit Log
    try {
        await WorkLog.create({
            actionType: 'PROGRAM_APPROVED',
            module: 'CMS',
            performedBy: req.user?._id || null,
            targetEntityId: program._id.toString(),
            title: `Approved & Published: ${program.title} (${program.type})`,
            details: {
                slug: program.slug,
                type: program.type,
                note: note || '',
            },
        });
    } catch (logErr) {
        console.error('WorkLog error on approve program:', logErr);
    }

    res.status(200).json(
        new ApiResponse(200, { program }, 'Program approved and published successfully')
    );
});

// @desc    Reject a program with reason
// @route   POST /api/programs/:id/reject
// @access  Private (Super Admin or Staff with programs.approve)
export const rejectProgram = asyncHandler(async (req, res) => {
    const param = req.params.id;
    let program = null;

    if (mongoose.Types.ObjectId.isValid(param)) {
        program = await Program.findById(param);
    }
    if (!program) {
        program = await Program.findOne({ slug: param.toLowerCase() });
    }

    if (!program) {
        throw new ApiError(404, 'Program not found');
    }

    const { reason } = req.body;
    if (!reason || !reason.trim()) {
        throw new ApiError(400, 'A specific rejection reason is required so the author knows what needs revision');
    }

    let hasLiveSnapshot = Boolean(program.lastPublishedSnapshot);
    if (!hasLiveSnapshot) {
        const seedBaseline = initialProgramsSeedData.find(p => p.slug === program.slug);
        if (seedBaseline) {
            program.lastPublishedSnapshot = seedBaseline;
            hasLiveSnapshot = true;
        }
    }

    program.publishStatus = 'REJECTED';
    // If an approved live snapshot exists, keep isActive = true so the live public website is not taken down!
    program.isActive = hasLiveSnapshot;
    program.rejectionReason = reason.trim();
    program.reviewedBy = req.user?._id;
    program.reviewedAt = new Date();

    program.approvalHistory.push({
        action: 'REJECTED',
        performedBy: req.user?._id || null,
        performedAt: new Date(),
        reason: reason.trim(),
    });

    await program.save();

    // Audit Log
    try {
        await WorkLog.create({
            actionType: 'PROGRAM_REJECTED',
            module: 'CMS',
            performedBy: req.user?._id || null,
            targetEntityId: program._id.toString(),
            title: `Rejected Program: ${program.title} (${program.type})`,
            details: {
                slug: program.slug,
                type: program.type,
                reason: reason.trim(),
            },
        });
    } catch (logErr) {
        console.error('WorkLog error on reject program:', logErr);
    }

    res.status(200).json(
        new ApiResponse(200, { program }, 'Program has been rejected with feedback')
    );
});

// @desc    Unpublish a program (revert to DRAFT)
// @route   POST /api/programs/:id/unpublish
// @access  Private (Super Admin or Staff with programs.approve)
export const unpublishProgram = asyncHandler(async (req, res) => {
    const param = req.params.id;
    let program = null;

    if (mongoose.Types.ObjectId.isValid(param)) {
        program = await Program.findById(param);
    }
    if (!program) {
        program = await Program.findOne({ slug: param.toLowerCase() });
    }

    if (!program) {
        throw new ApiError(404, 'Program not found');
    }

    const { reason } = req.body;

    program.publishStatus = 'DRAFT';
    program.isActive = false;
    program.lastPublishedSnapshot = null;

    program.approvalHistory.push({
        action: 'UNPUBLISHED',
        performedBy: req.user?._id || null,
        performedAt: new Date(),
        reason: reason || 'Unpublished by administrator',
    });

    await program.save();

    // Audit Log
    try {
        await WorkLog.create({
            actionType: 'PROGRAM_UNPUBLISHED',
            module: 'CMS',
            performedBy: req.user?._id || null,
            targetEntityId: program._id.toString(),
            title: `Unpublished Program: ${program.title} (${program.type})`,
            details: {
                slug: program.slug,
                type: program.type,
                reason: reason || '',
            },
        });
    } catch (logErr) {
        console.error('WorkLog error on unpublish program:', logErr);
    }

    res.status(200).json(
        new ApiResponse(200, { program }, 'Program unpublished successfully')
    );
});

// @desc    Toggle active / inactive status of program
// @route   PATCH /api/programs/:id/status
// @access  Private (Staff with programs.manage / Super Admin)
export const toggleProgramStatus = asyncHandler(async (req, res) => {
    const param = req.params.id;
    let program = null;

    if (mongoose.Types.ObjectId.isValid(param)) {
        program = await Program.findById(param);
    }
    if (!program) {
        program = await Program.findOne({ slug: param.toLowerCase() });
    }

    if (!program) {
        throw new ApiError(404, 'Program not found');
    }

    const newStatus = typeof req.body.isActive === 'boolean' ? req.body.isActive : !program.isActive;

    if (newStatus && program.publishStatus && program.publishStatus !== 'PUBLISHED') {
        throw new ApiError(
            400,
            `Cannot activate a program in "${program.publishStatus}" status. It must be reviewed and published first.`
        );
    }

    program.isActive = newStatus;
    await program.save();

    // Audit Log
    try {
        await WorkLog.create({
            actionType: 'PROGRAM_STATUS_CHANGED',
            module: 'CMS',
            performedBy: req.user?._id || null,
            targetEntityId: program._id.toString(),
            title: `${newStatus ? 'Activated' : 'Deactivated'} Program: ${program.title}`,
            details: {
                slug: program.slug,
                type: program.type,
                isActive: newStatus,
            },
        });
    } catch (logErr) {
        console.error('WorkLog error on program status toggle:', logErr);
    }

    res.status(200).json(
        new ApiResponse(
            200,
            { program, isActive: program.isActive },
            `Program marked as ${newStatus ? 'Active' : 'Inactive'}`
        )
    );
});

// @desc    Delete academic program
// @route   DELETE /api/programs/:id
// @access  Private (Staff with programs.manage / Super Admin)
export const deleteProgram = asyncHandler(async (req, res) => {
    const param = req.params.id;
    let program = null;

    if (mongoose.Types.ObjectId.isValid(param)) {
        program = await Program.findById(param);
    }
    if (!program) {
        program = await Program.findOne({ slug: param.toLowerCase() });
    }

    if (!program) {
        throw new ApiError(404, 'Program not found');
    }

    const title = program.title;
    const slug = program.slug;
    const programId = program._id;
    const filesToDelete = extractProgramFiles(program.toObject());

    await Program.findByIdAndDelete(program._id);

    // Clean up any files that are no longer used by any other program or model
    if (filesToDelete.length > 0) {
        deleteMultipleFilesIfUnused(filesToDelete, programId).catch(cleanErr => {
            console.error('[STORAGE] Error cleaning files on program delete:', cleanErr.message);
        });
    }

    // Audit Log
    try {
        await WorkLog.create({
            actionType: 'PROGRAM_DELETED',
            module: 'CMS',
            performedBy: req.user?._id || null,
            targetEntityId: program._id.toString(),
            title: `Deleted Program: ${title} (${slug})`,
            details: { slug, title },
        });
    } catch (logErr) {
        console.error('WorkLog error on program delete:', logErr);
    }

    res.status(200).json(
        new ApiResponse(200, null, 'Program deleted successfully')
    );
});
