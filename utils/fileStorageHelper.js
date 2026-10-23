import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import Program from '../models/Program.js';
import User from '../models/User.js';
import Document from '../models/Document.js';
import HomepageBanner from '../models/HomepageBanner.js';
import Application from '../models/Application.js';

// Resolve uploads directory reliably relative to backend root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// In-memory cache of file hashes: Map<sha256Hex, filename>
const fileHashCache = new Map();
let isCacheInitialized = false;

/**
 * Calculate SHA-256 hash of a file on disk
 * @param {string} filePath 
 * @returns {string|null}
 */
export const calculateFileHash = (filePath) => {
    try {
        if (!fs.existsSync(filePath)) return null;
        const fileBuffer = fs.readFileSync(filePath);
        return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    } catch (err) {
        console.error(`[STORAGE] Error hashing file ${filePath}:`, err.message);
        return null;
    }
};

/**
 * Initialize or warm up the hash cache by scanning uploads/
 */
export const initFileHashCache = () => {
    try {
        if (!fs.existsSync(UPLOAD_DIR)) return;
        const files = fs.readdirSync(UPLOAD_DIR);
        for (const file of files) {
            const fullPath = path.join(UPLOAD_DIR, file);
            try {
                const stat = fs.statSync(fullPath);
                if (stat.isFile()) {
                    const hash = calculateFileHash(fullPath);
                    if (hash && !fileHashCache.has(hash)) {
                        fileHashCache.set(hash, file);
                    }
                }
            } catch (statErr) {
                // Ignore transient file read issues
            }
        }
        isCacheInitialized = true;
    } catch (err) {
        console.error('[STORAGE] Error initializing hash cache:', err.message);
    }
};

/**
 * Check if an identical file already exists in the uploads folder
 * @param {string} newFilePath Path to the newly uploaded file
 * @param {string} uploadDir Optional upload directory
 * @returns {{ filename: string, path: string, url: string, hash: string } | null}
 */
export const findExistingDuplicateFile = (newFilePath, uploadDir = UPLOAD_DIR) => {
    if (!fs.existsSync(newFilePath)) return null;

    let newFileSize = 0;
    try {
        newFileSize = fs.statSync(newFilePath).size;
    } catch (e) {
        return null;
    }

    const newFileHash = calculateFileHash(newFilePath);
    if (!newFileHash) return null;

    const normalizedNewPath = path.resolve(newFilePath);

    // 1. Fast check: In-memory hash cache
    if (fileHashCache.has(newFileHash)) {
        const cachedFilename = fileHashCache.get(newFileHash);
        const cachedPath = path.join(uploadDir, cachedFilename);
        if (fs.existsSync(cachedPath) && path.resolve(cachedPath) !== normalizedNewPath) {
            return {
                filename: cachedFilename,
                path: cachedPath,
                url: `/uploads/${cachedFilename}`,
                hash: newFileHash,
            };
        } else if (!fs.existsSync(cachedPath)) {
            fileHashCache.delete(newFileHash);
        }
    }

    // 2. Scan upload directory for exact file size matches first (instant pre-filter)
    try {
        const files = fs.readdirSync(uploadDir);
        for (const filename of files) {
            const existingPath = path.join(uploadDir, filename);
            if (path.resolve(existingPath) === normalizedNewPath) {
                continue;
            }

            try {
                const stat = fs.statSync(existingPath);
                if (stat.isFile() && stat.size === newFileSize) {
                    const existingHash = calculateFileHash(existingPath);
                    if (existingHash === newFileHash) {
                        // Found duplicate! Update cache and return
                        fileHashCache.set(newFileHash, filename);
                        return {
                            filename,
                            path: existingPath,
                            url: `/uploads/${filename}`,
                            hash: newFileHash,
                        };
                    }
                }
            } catch (fErr) {
                // Ignore unreadable files
            }
        }
    } catch (scanErr) {
        console.error('[STORAGE] Directory scan error during deduplication:', scanErr.message);
    }

    // Unique file: register its hash in memory
    const newFilename = path.basename(newFilePath);
    fileHashCache.set(newFileHash, newFilename);
    return null;
};

/**
 * Extract all file URLs and filenames referenced in a Program object/payload
 * @param {object} data Program document or form payload
 * @returns {string[]} Array of unique filenames
 */
export const extractProgramFiles = (data) => {
    if (!data || typeof data !== 'object') return [];
    const files = new Set();

    const addIfUpload = (val) => {
        if (typeof val === 'string' && val.trim().length > 0) {
            const clean = val.replace(/\\/g, '/');
            if (clean.includes('/uploads/') || clean.startsWith('uploads/')) {
                const parts = clean.split('/uploads/');
                const filename = parts[parts.length - 1];
                if (filename && filename.trim()) {
                    files.add(filename.trim());
                }
            }
        }
    };

    // Hero & Card
    addIfUpload(data.heroImage);
    addIfUpload(data.cardImage);

    // Documents & Guides
    addIfUpload(data.brochureUrl);
    addIfUpload(data.programmeGuideUrl);
    addIfUpload(data.pprUrl);
    addIfUpload(data.elmUrl);

    // Placements
    if (data.placements) {
        addIfUpload(data.placements.supportImage);
        if (Array.isArray(data.placements.enhancement)) {
            data.placements.enhancement.forEach(card => {
                if (card && card.image) addIfUpload(card.image);
            });
        }
    }

    // Curriculum Semesters & Course SLM PDFs
    if (data.curriculum && Array.isArray(data.curriculum.semesters)) {
        data.curriculum.semesters.forEach(sem => {
            if (Array.isArray(sem?.courses)) {
                sem.courses.forEach(course => {
                    if (course && course.pdfUrl) addIfUpload(course.pdfUrl);
                });
            }
        });
    }

    return Array.from(files);
};

/**
 * Check if a file is referenced anywhere in MongoDB collections
 * @param {string} filenameOrUrl 
 * @param {string|mongoose.Types.ObjectId|null} excludedProgramId Program ID to exclude (e.g. while updating)
 * @returns {Promise<boolean>}
 */
export const isFileReferencedInDb = async (filenameOrUrl, excludedProgramId = null) => {
    if (!filenameOrUrl) return false;
    const clean = filenameOrUrl.replace(/\\/g, '/');
    const filename = clean.includes('/uploads/') ? clean.split('/uploads/').pop() : path.basename(clean);
    if (!filename || !filename.trim()) return false;

    // Build regex that matches the filename in relative or absolute paths
    const escaped = filename.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    // 1. Check Programs collection
    const programQuery = {
        $or: [
            { heroImage: regex },
            { cardImage: regex },
            { brochureUrl: regex },
            { programmeGuideUrl: regex },
            { pprUrl: regex },
            { elmUrl: regex },
            { 'placements.supportImage': regex },
            { 'placements.enhancement.image': regex },
            { 'curriculum.semesters.courses.pdfUrl': regex },
            { 'lastPublishedSnapshot.heroImage': regex },
            { 'lastPublishedSnapshot.cardImage': regex },
            { 'lastPublishedSnapshot.brochureUrl': regex },
            { 'lastPublishedSnapshot.programmeGuideUrl': regex },
            { 'lastPublishedSnapshot.pprUrl': regex },
        ]
    };
    if (excludedProgramId) {
        programQuery._id = { $ne: excludedProgramId };
    }

    try {
        const programCount = await Program.countDocuments(programQuery);
        if (programCount > 0) return true;
    } catch (e) {
        console.error('[STORAGE] Program ref check error:', e.message);
    }

    // 2. Check Users (avatars, profile documents)
    try {
        const userCount = await User.countDocuments({
            $or: [
                { avatar: regex },
                { 'profileDetails.documents.fileUrl': regex }
            ]
        });
        if (userCount > 0) return true;
    } catch (e) {}

    // 3. Check HomepageBanner
    try {
        const bannerCount = await HomepageBanner.countDocuments({
            $or: [
                { desktopImageUrl: regex },
                { mobileImageUrl: regex }
            ]
        });
        if (bannerCount > 0) return true;
    } catch (e) {}

    // 4. Check Application documents
    try {
        const appCount = await Application.countDocuments({
            'documents.fileUrl': regex
        });
        if (appCount > 0) return true;
    } catch (e) {}

    // 5. Check Document collection
    try {
        const docCount = await Document.countDocuments({
            fileUrl: regex
        });
        if (docCount > 0) return true;
    } catch (e) {}

    return false;
};

/**
 * Delete a file from uploads/ if it is not referenced in MongoDB
 * @param {string} filenameOrUrl 
 * @param {string|mongoose.Types.ObjectId|null} excludedProgramId 
 * @returns {Promise<{ deleted: boolean, filename: string, reason?: string, error?: string }>}
 */
export const deleteFileIfUnused = async (filenameOrUrl, excludedProgramId = null) => {
    if (!filenameOrUrl) return { deleted: false, reason: 'No file specified' };

    const clean = filenameOrUrl.replace(/\\/g, '/');
    const filename = clean.includes('/uploads/') ? clean.split('/uploads/').pop() : path.basename(clean);
    if (!filename || !filename.trim()) return { deleted: false, reason: 'Invalid filename' };

    const filePath = path.join(UPLOAD_DIR, filename);

    // Reference check
    const isReferenced = await isFileReferencedInDb(filename, excludedProgramId);
    if (isReferenced) {
        return { deleted: false, filename, reason: 'File is currently in use by another program or document' };
    }

    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);

            // Remove from hash cache
            for (const [hash, cachedName] of fileHashCache.entries()) {
                if (cachedName === filename) {
                    fileHashCache.delete(hash);
                    break;
                }
            }

            console.log(`[STORAGE] Deleted unreferenced file to maintain disk space: ${filename}`);
            return { deleted: true, filename };
        } catch (err) {
            console.error(`[STORAGE] Failed to delete file ${filename}:`, err.message);
            return { deleted: false, filename, error: err.message };
        }
    } else {
        return { deleted: false, filename, reason: 'File does not exist on disk' };
    }
};

/**
 * Delete multiple files if unused
 * @param {string[]} files 
 * @param {string|mongoose.Types.ObjectId|null} excludedProgramId 
 * @returns {Promise<Array>}
 */
export const deleteMultipleFilesIfUnused = async (files, excludedProgramId = null) => {
    if (!Array.isArray(files) || files.length === 0) return [];
    const results = [];
    for (const f of files) {
        const res = await deleteFileIfUnused(f, excludedProgramId);
        results.push(res);
    }
    return results;
};
