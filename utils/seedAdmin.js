import User from '../models/User.js';
import Permission from '../models/Permission.js';
import Role from '../models/Role.js';

export const SYSTEM_PERMISSIONS = [
    // Dashboard
    {
        name: 'View Dashboard',
        slug: 'dashboard.view',
        category: 'Dashboard',
        description: 'View admin overview metrics and revenue stats',
        isSystem: true,
    },
    // Applications
    {
        name: 'View Applications',
        slug: 'applications.view',
        category: 'Applications',
        description: 'View submitted student applications and student profiles',
        isSystem: true,
    },
    {
        name: 'Manage Applications',
        slug: 'applications.manage',
        category: 'Applications',
        description: 'Accept, reject, review, or update application status',
        isSystem: true,
    },
    // Documents
    {
        name: 'View Documents',
        slug: 'documents.view',
        category: 'Documents',
        description: 'View student uploaded identity and academic documents',
        isSystem: true,
    },
    {
        name: 'Verify Documents',
        slug: 'documents.verify',
        category: 'Documents',
        description: 'Approve, verify, or reject applicant documents with remarks',
        isSystem: true,
    },
    // Payments
    {
        name: 'View Payments',
        slug: 'payments.view',
        category: 'Payments & Offline Fee',
        description: 'View online payment transactions and student fee status',
        isSystem: true,
    },
    {
        name: 'Record Offline Payment',
        slug: 'payments.record_offline',
        category: 'Payments & Offline Fee',
        description: 'Lookup student enrollments and collect/record offline cash fee payments',
        isSystem: true,
    },
    // Users
    {
        name: 'View Users',
        slug: 'users.view',
        category: 'Users & Students',
        description: 'View directory of registered users, applicants, and students',
        isSystem: true,
    },
    {
        name: 'Manage Users',
        slug: 'users.manage',
        category: 'Users & Students',
        description: 'Update user profiles, statuses, and student details',
        isSystem: true,
    },
    // Contacts
    {
        name: 'View Contacts',
        slug: 'contacts.view',
        category: 'Contacts & Inquiries',
        description: 'View student contact inquiries and messages',
        isSystem: true,
    },
    {
        name: 'Manage Contacts',
        slug: 'contacts.manage',
        category: 'Contacts & Inquiries',
        description: 'Update contact inquiry status and delete resolved inquiries',
        isSystem: true,
    },
    // CMS
    {
        name: 'Manage CMS',
        slug: 'cms.manage',
        category: 'CMS & Banners',
        description: 'Manage homepage banners, notices, and portal announcements',
        isSystem: true,
    },
    // Roles & RBAC
    {
        name: 'View Roles & Permissions',
        slug: 'roles.view',
        category: 'Roles & Permissions',
        description: 'View configured roles, permission catalog, and assigned privileges',
        isSystem: true,
    },
    {
        name: 'Manage Roles & Permissions',
        slug: 'roles.manage',
        category: 'Roles & Permissions',
        description: 'Create, edit, delete, assign, and revoke roles and user permissions',
        isSystem: true,
    },
    // Work & Audit Logs
    {
        name: 'View Work & Audit Logs',
        slug: 'worklogs.view',
        category: 'Audit & Work Logs',
        description: 'Inspect full audit trail of staff actions, assignments, and operational work',
        isSystem: true,
    },
];

export const seedPermissions = async () => {
    for (const perm of SYSTEM_PERMISSIONS) {
        await Permission.findOneAndUpdate(
            { slug: perm.slug },
            { $set: perm },
            { upsert: true, new: true }
        );
    }
};

export const seedRoles = async () => {
    const allSlugs = SYSTEM_PERMISSIONS.map((p) => p.slug);

    const defaultRoles = [
        {
            name: 'Super Admin',
            slug: 'superadmin',
            description: 'Unrestricted root administrator with automatic bypass of all permission restrictions',
            permissions: allSlugs,
            isSystem: true,
        },
        {
            name: 'Admin',
            slug: 'admin',
            description: 'General administrator with full management over applications, users, payments, contacts, and logs',
            permissions: allSlugs.filter((s) => s !== 'roles.manage'), // Can view roles, full management reserved for Super Admin unless assigned
            isSystem: true,
        },
        {
            name: 'Admission Counselor',
            slug: 'admission_counselor',
            description: 'Reviews applicant files, verifies academic certificates, and processes admission workflows',
            permissions: [
                'dashboard.view',
                'applications.view',
                'applications.manage',
                'documents.view',
                'documents.verify',
                'users.view',
            ],
            isSystem: true,
        },
        {
            name: 'Finance Officer',
            slug: 'finance_officer',
            description: 'Handles student tuition fees, transaction records, and offline payment collections',
            permissions: [
                'dashboard.view',
                'payments.view',
                'payments.record_offline',
                'users.view',
            ],
            isSystem: true,
        },
        {
            name: 'Support Agent',
            slug: 'support_agent',
            description: 'Manages student inquiries, replies to contact submissions, and views applicant directories',
            permissions: [
                'dashboard.view',
                'contacts.view',
                'contacts.manage',
                'users.view',
            ],
            isSystem: true,
        },
    ];

    for (const r of defaultRoles) {
        await Role.findOneAndUpdate(
            { slug: r.slug },
            {
                $set: {
                    name: r.name,
                    description: r.description,
                    permissions: r.permissions,
                    isSystem: r.isSystem,
                },
            },
            { upsert: true, new: true }
        );
    }
};

export const seedAdmin = async () => {
    try {
        // 1. Seed Permissions and Roles
        await seedPermissions();
        await seedRoles();

        const superAdminRole = await Role.findOne({ slug: 'superadmin' });

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@cvru.ac.in';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
        const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Super';
        const adminLastName = process.env.ADMIN_LAST_NAME || 'Admin';
        const adminPhone = process.env.ADMIN_PHONE || '9999999999';

        // 2. Elevate primary admin or create a new Super Admin
        let existingSuperAdmin = null;

        // A. Match by explicit configured ADMIN_EMAIL first
        if (adminEmail) {
            existingSuperAdmin = await User.findOne({ email: adminEmail });
        }

        // B. Fallback: match any existing superadmin or admin
        if (!existingSuperAdmin) {
            existingSuperAdmin = await User.findOne({
                $or: [{ role: 'superadmin' }, { role: 'admin' }],
            });
        }

        if (existingSuperAdmin) {
            // Elevate to superadmin and link roleRef
            existingSuperAdmin.role = 'superadmin';
            if (superAdminRole) {
                existingSuperAdmin.roleRef = superAdminRole._id;
            }
            existingSuperAdmin.isVerified = true;
            await existingSuperAdmin.save();
            console.log(`👑 Super Admin ensured & elevated: ${existingSuperAdmin.email} (Role: superadmin)`);
        } else {
            // Create brand new superadmin if no admin exists
            const newAdmin = new User({
                firstName: adminFirstName,
                lastName: adminLastName,
                email: adminEmail,
                phone: adminPhone,
                password: adminPassword,
                role: 'superadmin',
                roleRef: superAdminRole?._id,
                isVerified: true,
            });

            await newAdmin.save();
            console.log(`🚀 Successfully created Super Admin user: ${adminEmail}`);
        }

        // 3. Link any remaining existing 'admin' users to the Admin role so they never lose access
        const standardAdminRole = await Role.findOne({ slug: 'admin' });
        if (standardAdminRole) {
            const adminUsersUpdate = await User.updateMany(
                { role: 'admin', roleRef: { $exists: false } },
                { $set: { roleRef: standardAdminRole._id } }
            );
            if (adminUsersUpdate.modifiedCount > 0) {
                console.log(`🛡️ Linked ${adminUsersUpdate.modifiedCount} existing admin user(s) to Admin role definition.`);
            }
        }
    } catch (error) {
        console.error('❌ Error in seedAdmin script:', error.message);
    }
};
