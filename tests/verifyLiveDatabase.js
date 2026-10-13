import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { syncRoutePermissions } from '../utils/routePermissionSyncer.js';
import Permission from '../models/Permission.js';
import Role from '../models/Role.js';

async function verifyLive() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    console.log('Running route permission synchronization check...');
    const result = await syncRoutePermissions();
    console.log('Sync Result:', JSON.stringify(result, null, 2));

    const totalPermissions = await Permission.countDocuments();
    console.log(`Total Permissions in MongoDB: ${totalPermissions}`);

    const autoDiscovered = await Permission.find({ isAutoDiscovered: true }).select('name slug route category');
    console.log(`Auto-Discovered Permissions (${autoDiscovered.length}):`);
    for (const p of autoDiscovered) {
        console.log(`  - [${p.category}] ${p.name} (${p.slug}) -> route: ${p.route}`);
    }

    const superAdminRole = await Role.findOne({ slug: 'superadmin' });
    console.log(`Super Admin Role Permissions count: ${superAdminRole?.permissions?.length || 0}`);

    await mongoose.disconnect();
    console.log('Verification finished cleanly.');
}

verifyLive().catch((err) => {
    console.error('Live verification failed:', err);
    process.exit(1);
});
