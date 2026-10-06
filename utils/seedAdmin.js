import User from '../models/User.js';

export const seedAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Super';
        const adminLastName = process.env.ADMIN_LAST_NAME || 'Admin';
        const adminPhone = process.env.ADMIN_PHONE || '0000000000';

        if (!adminEmail || !adminPassword) {
            console.log('⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not found in .env. Skipping admin check/creation.');
            return;
        }

        // Check if admin already exists by email
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log(`✅ Admin with email ${adminEmail} already exists. Skipping creation.`);
        } else {
            // Create a new admin
            const newAdmin = new User({
                firstName: adminFirstName,
                lastName: adminLastName,
                email: adminEmail,
                phone: adminPhone,
                password: adminPassword,
                role: 'admin',
                isVerified: true
            });

            await newAdmin.save();
            console.log(`🚀 Successfully created admin user: ${adminEmail}`);
        }
    } catch (error) {
        console.error('❌ Error in seedAdmin script:', error.message);
    }
};
