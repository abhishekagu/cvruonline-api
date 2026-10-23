import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(backendDir, '.env') });

import connectDB from '../config/db.js';
import Program from '../models/Program.js';
import User from '../models/User.js';
import Application from '../models/Application.js';
import HomepageBanner from '../models/HomepageBanner.js';
import Document from '../models/Document.js';

const UPLOAD_DIR = path.join(backendDir, 'uploads');

const calculateHash = (filePath) => {
    try {
        const buf = fs.readFileSync(filePath);
        return crypto.createHash('sha256').update(buf).digest('hex');
    } catch (e) {
        return null;
    }
};

const runDeduplicationCleanup = async () => {
    console.log('\n[START] Scanning uploads directory for duplicate files...');
    if (!fs.existsSync(UPLOAD_DIR)) {
        console.log('[INFO] Uploads directory does not exist.');
        return;
    }

    await connectDB();

    const allFiles = fs.readdirSync(UPLOAD_DIR);
    console.log(`[INFO] Found ${allFiles.length} total files in ${UPLOAD_DIR}`);

    // Map: hash -> array of { filename, size, path }
    const hashMap = new Map();

    for (const filename of allFiles) {
        const fullPath = path.join(UPLOAD_DIR, filename);
        try {
            const stat = fs.statSync(fullPath);
            if (stat.isFile()) {
                const hash = calculateHash(fullPath);
                if (!hash) continue;

                if (!hashMap.has(hash)) {
                    hashMap.set(hash, []);
                }
                hashMap.get(hash).push({
                    filename,
                    size: stat.size,
                    path: fullPath,
                    mtime: stat.mtimeMs,
                });
            }
        } catch (e) {
            // Ignore single file error
        }
    }

    let totalDuplicateFiles = 0;
    let totalBytesSaved = 0;
    let totalDbReferencesUpdated = 0;

    for (const [hash, group] of hashMap.entries()) {
        if (group.length > 1) {
            // Sort to pick canonical file (oldest created file first)
            group.sort((a, b) => a.mtime - b.mtime);
            const canonical = group[0];
            const duplicates = group.slice(1);

            console.log(`\n[DUPLICATE GROUP] Hash: ${hash.slice(0, 12)}...`);
            console.log(`  Canonical to keep: ${canonical.filename} (${(canonical.size / 1024).toFixed(1)} KB)`);

            for (const dup of duplicates) {
                console.log(`  Duplicate to remove: ${dup.filename}`);
                totalDuplicateFiles++;
                totalBytesSaved += dup.size;

                const dupRegex = new RegExp(dup.filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                const canonicalUrl = `/uploads/${canonical.filename}`;

                // 1. Update Programs
                const programs = await Program.find({
                    $or: [
                        { heroImage: { $regex: dup.filename } },
                        { cardImage: { $regex: dup.filename } },
                        { brochureUrl: { $regex: dup.filename } },
                        { programmeGuideUrl: { $regex: dup.filename } },
                        { pprUrl: { $regex: dup.filename } },
                        { elmUrl: { $regex: dup.filename } },
                        { 'placements.supportImage': { $regex: dup.filename } },
                        { 'placements.enhancement.image': { $regex: dup.filename } },
                        { 'curriculum.semesters.courses.pdfUrl': { $regex: dup.filename } },
                    ]
                });

                for (const prog of programs) {
                    let changed = false;
                    const replaceField = (val) => {
                        if (typeof val === 'string' && val.includes(dup.filename)) {
                            changed = true;
                            return val.replace(dup.filename, canonical.filename);
                        }
                        return val;
                    };

                    prog.heroImage = replaceField(prog.heroImage);
                    prog.cardImage = replaceField(prog.cardImage);
                    prog.brochureUrl = replaceField(prog.brochureUrl);
                    prog.programmeGuideUrl = replaceField(prog.programmeGuideUrl);
                    prog.pprUrl = replaceField(prog.pprUrl);
                    prog.elmUrl = replaceField(prog.elmUrl);

                    if (prog.placements) {
                        prog.placements.supportImage = replaceField(prog.placements.supportImage);
                        if (Array.isArray(prog.placements.enhancement)) {
                            prog.placements.enhancement.forEach(c => {
                                if (c) c.image = replaceField(c.image);
                            });
                        }
                    }

                    if (prog.curriculum && Array.isArray(prog.curriculum.semesters)) {
                        prog.curriculum.semesters.forEach(s => {
                            if (Array.isArray(s?.courses)) {
                                s.courses.forEach(c => {
                                    if (c && c.pdfUrl) c.pdfUrl = replaceField(c.pdfUrl);
                                });
                            }
                        });
                    }

                    if (changed) {
                        await prog.save();
                        totalDbReferencesUpdated++;
                        console.log(`    Updated references in Program: ${prog.title || prog.slug}`);
                    }
                }

                // Delete the duplicate physical file from disk
                try {
                    if (fs.existsSync(dup.path)) {
                        fs.unlinkSync(dup.path);
                        console.log(`    Successfully unlinked: ${dup.filename}`);
                    }
                } catch (delErr) {
                    console.error(`    Failed to delete duplicate ${dup.filename}:`, delErr.message);
                }
            }
        }
    }

    console.log('\n======================================================');
    console.log('[SUMMARY] Deduplication Cleanup Completed');
    console.log(`> Duplicate files purged: ${totalDuplicateFiles}`);
    console.log(`> Disk space reclaimed: ${(totalBytesSaved / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`> MongoDB program records updated: ${totalDbReferencesUpdated}`);
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
};

runDeduplicationCleanup().catch(err => {
    console.error('Fatal cleanup error:', err);
    process.exit(1);
});
