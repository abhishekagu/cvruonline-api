import Permission from '../models/Permission.js';
import Role from '../models/Role.js';
import { extractAllRegistryPermissions } from '../config/adminPagesRegistry.js';
import { logWorkActivity } from './workLogger.js';

/**
 * Automatically discovers routes/pages from code and synchronizes permissions into MongoDB.
 * 
 * If a new page or route was declared in code, this function:
 * 1. Checks if its permission exists in MongoDB.
 * 2. If missing, automatically creates it.
 * 3. Appends the new permission slug to Super Admin so they have immediate root access.
 * 4. Logs the automated registration into WorkLog for full audit trail.
 */
export const syncRoutePermissions = async (customPages = null, actorId = null) => {
    try {
        const registryPermissions = extractAllRegistryPermissions(customPages);
        let createdCount = 0;
        let existingCount = 0;
        const newlyCreatedSlugs = [];

        for (const candidate of registryPermissions) {
            const existing = await Permission.findOne({ slug: candidate.slug });

            if (!existing) {
                try {
                    // Auto-create in MongoDB
                    await Permission.create({
                        name: candidate.name,
                        slug: candidate.slug,
                        category: candidate.category,
                        description: candidate.description,
                        route: candidate.route,
                        isSystem: Boolean(candidate.isSystem),
                        isAutoDiscovered: true,
                        actions: candidate.actions || ['view'],
                    });

                    createdCount++;
                    newlyCreatedSlugs.push(candidate.slug);
                } catch (err) {
                    if (err.code === 11000) {
                        // Concurrently created by parallel worker or process
                        existingCount++;
                    } else {
                        throw err;
                    }
                }
            } else {
                existingCount++;
                let changed = false;
                if (!existing.route && candidate.route) {
                    existing.route = candidate.route;
                    changed = true;
                }
                if (!existing.isAutoDiscovered) {
                    existing.isAutoDiscovered = true;
                    changed = true;
                }
                if ((!existing.actions || existing.actions.length === 0) && candidate.actions?.length > 0) {
                    existing.actions = candidate.actions;
                    changed = true;
                }
                if (changed) {
                    await existing.save();
                }
            }
        }

        // If any new permissions were auto-discovered, append them to the Super Admin role
        if (newlyCreatedSlugs.length > 0) {
            await Role.updateOne(
                { slug: 'superadmin' },
                { $addToSet: { permissions: { $each: newlyCreatedSlugs } } }
            );

            // Audit log the auto-discovery event
            try {
                let resolvedActorId = actorId;
                if (!resolvedActorId) {
                    const User = (await import('../models/User.js')).default;
                    const rootAdmin = await User.findOne({ role: 'superadmin' });
                    resolvedActorId = rootAdmin?._id || null;
                }

                await logWorkActivity({
                    actionType: 'PERMISSIONS_UPDATED',
                    module: 'RBAC',
                    performedBy: resolvedActorId,
                    isSystemAction: !actorId,
                    title: `Automated Permission Discovery: ${newlyCreatedSlugs.length} new permission(s) created from code`,
                    details: {
                        newlyCreatedSlugs,
                        totalDiscovered: registryPermissions.length,
                    },
                });
            } catch (logErr) {
                // Non-blocking logger failure during initial boot
                console.warn('[RBAC Auto-Sync] WorkLog notice:', logErr.message);
            }

            console.log(`\x1b[32m[RBAC Auto-Sync] ✓ Auto-discovered & created ${createdCount} new permission(s): ${newlyCreatedSlugs.join(', ')}\x1b[0m`);
        }

        return {
            totalChecked: registryPermissions.length,
            created: createdCount,
            existing: existingCount,
            newlyCreatedSlugs,
        };
    } catch (error) {
        console.error('[RBAC Auto-Sync] Error synchronizing permissions:', error);
        return {
            totalChecked: 0,
            created: 0,
            existing: 0,
            error: error.message,
        };
    }
};
