/**
 * Admin Pages & Code-First Permission Registry
 * 
 * To add a new administrative page or module to the portal:
 * Simply add an object to ADMIN_PAGE_REGISTRY below!
 * 
 * The system will AUTOMATICALLY:
 * 1. Discover the new route on server boot or client load.
 * 2. Check MongoDB and automatically create the permissions if missing.
 * 3. Grant immediate access to Super Admin.
 * 4. Surface the permission in AdminRoles.jsx for assignment to other roles.
 * 5. Display the page in sidebar navigation for authorized users (unless hideFromSidebar: true or dynamic :id).
 * 
 * NOTE: For sub-actions or detail pages (e.g. "Record Fee", "Receipt", or "/admin/applications/:id"),
 * specify `hideFromSidebar: true` so the permission is fully tracked & secured without cluttering the sidebar.
 */

export const ADMIN_PAGE_REGISTRY = [
    {
        id: 'dashboard',
        title: 'Executive Dashboard',
        path: '/admin',
        category: 'Dashboard',
        icon: 'LayoutDashboard',
        isSystem: true,
        permissions: [
            {
                name: 'View Dashboard',
                slug: 'dashboard.view',
                action: 'view',
                description: 'View admin overview metrics and revenue stats',
                isSystem: true,
            },
        ],
    },
    {
        id: 'applications',
        title: 'Applications Management',
        path: '/admin/applications',
        category: 'Applications',
        icon: 'FileText',
        isSystem: true,
        permissions: [
            {
                name: 'View Applications',
                slug: 'applications.view',
                action: 'view',
                description: 'View submitted student applications and student profiles',
                isSystem: true,
            },
            {
                name: 'Manage Applications',
                slug: 'applications.manage',
                action: 'manage',
                description: 'Accept, reject, review, or update application status',
                isSystem: true,
            },
        ],
    },
    {
        id: 'documents',
        title: 'Document Verification',
        path: '/admin/applications/:id',
        category: 'Documents',
        icon: 'FileCheck',
        hideFromSidebar: true,
        isSystem: true,
        permissions: [
            {
                name: 'View Documents',
                slug: 'documents.view',
                action: 'view',
                description: 'View student uploaded identity and academic documents',
                isSystem: true,
            },
            {
                name: 'Verify Documents',
                slug: 'documents.verify',
                action: 'verify',
                description: 'Approve, verify, or reject applicant documents with remarks',
                isSystem: true,
            },
        ],
    },
    {
        id: 'contacts',
        title: 'Contacts & Inquiries',
        path: '/admin/contacts',
        category: 'Contacts & Inquiries',
        icon: 'MessageSquare',
        isSystem: true,
        permissions: [
            {
                name: 'View Contacts',
                slug: 'contacts.view',
                action: 'view',
                description: 'View student contact inquiries and messages',
                isSystem: true,
            },
            {
                name: 'Manage Contacts',
                slug: 'contacts.manage',
                action: 'manage',
                description: 'Update contact inquiry status and delete resolved inquiries',
                isSystem: true,
            },
        ],
    },
    {
        id: 'users',
        title: 'User & Student Management',
        path: '/admin/users',
        category: 'Users & Students',
        icon: 'Users',
        isSystem: true,
        permissions: [
            {
                name: 'View Users',
                slug: 'users.view',
                action: 'view',
                description: 'View directory of registered users, applicants, and students',
                isSystem: true,
            },
            {
                name: 'Manage Users',
                slug: 'users.manage',
                action: 'manage',
                description: 'Update user profiles, statuses, and student details',
                isSystem: true,
            },
        ],
    },
    {
        id: 'transactions',
        title: 'Payment Transactions',
        path: '/admin/transactions',
        category: 'Payments & Offline Fee',
        icon: 'CreditCard',
        isSystem: true,
        permissions: [
            {
                name: 'View Payments',
                slug: 'payments.view',
                action: 'view',
                description: 'View online payment transactions and student fee status',
                isSystem: true,
            },
            {
                name: 'Record Offline Payment',
                slug: 'payments.record_offline',
                action: 'record_offline',
                description: 'Lookup student enrollments and collect/record offline cash fee payments',
                isSystem: true,
            },
        ],
    },
    {
        id: 'cms',
        title: 'Academic Programs & CMS Banners',
        path: '/admin/programs',
        category: 'CMS & Banners',
        icon: 'GraduationCap',
        isSystem: true,
        permissions: [
            {
                name: 'Manage CMS & Programs',
                slug: 'cms.manage',
                action: 'manage',
                description: 'Manage homepage banners, notices, and academic programs',
                isSystem: true,
            },
        ],
    },
    {
        id: 'roles',
        title: 'Roles & Permissions',
        path: '/admin/roles',
        category: 'Roles & Permissions',
        icon: 'ShieldCheck',
        isSystem: true,
        permissions: [
            {
                name: 'View Roles & Permissions',
                slug: 'roles.view',
                action: 'view',
                description: 'View configured roles, permission catalog, and assigned privileges',
                isSystem: true,
            },
            {
                name: 'Manage Roles & Permissions',
                slug: 'roles.manage',
                action: 'manage',
                description: 'Create, edit, delete, assign, and revoke roles and user permissions',
                isSystem: true,
            },
        ],
    },
    {
        id: 'worklogs',
        title: 'Work & Audit Logs',
        path: '/admin/work-logs',
        category: 'Audit & Work Logs',
        icon: 'History',
        isSystem: true,
        permissions: [
            {
                name: 'View Work & Audit Logs',
                slug: 'worklogs.view',
                action: 'view',
                description: 'Inspect full audit trail of staff actions, assignments, and operational work',
                isSystem: true,
            },
        ],
    },
];

/**
 * Normalizes all pages in the registry into a flat list of permission definitions.
 * Handles both explicit permissions array and shorthand actions: ['view', 'manage'].
 */
export const extractAllRegistryPermissions = (customPages = null) => {
    const pages = customPages || ADMIN_PAGE_REGISTRY;
    const permissionsMap = new Map();

    for (const page of pages) {
        const category = page.category || 'General Operations';
        const pageRoute = page.path || page.route || '';
        const pageTitle = page.title || page.name || page.id;

        // 1. Explicit permissions defined on the page
        if (Array.isArray(page.permissions) && page.permissions.length > 0) {
            for (const perm of page.permissions) {
                const slug = perm.slug ? perm.slug.toLowerCase().trim() : `${page.id}.${perm.action || 'view'}`;
                permissionsMap.set(slug, {
                    name: perm.name || `${perm.action || 'Access'} ${pageTitle}`,
                    slug,
                    category: perm.category || category,
                    description: perm.description || `Permissions for ${pageTitle}`,
                    route: perm.route || pageRoute,
                    isSystem: Boolean(perm.isSystem || page.isSystem),
                    isAutoDiscovered: true,
                    actions: [perm.action || 'view'],
                });
            }
        }

        // 2. Shorthand actions (e.g. actions: ['view', 'manage', 'export'])
        if (Array.isArray(page.actions) && page.actions.length > 0) {
            for (const act of page.actions) {
                const actionSlug = act.toLowerCase().trim();
                const fullSlug = `${page.id}.${actionSlug}`;
                if (!permissionsMap.has(fullSlug)) {
                    const actionCapitalized = actionSlug.charAt(0).toUpperCase() + actionSlug.slice(1);
                    permissionsMap.set(fullSlug, {
                        name: `${actionCapitalized} ${pageTitle}`,
                        slug: fullSlug,
                        category,
                        description: `Ability to ${actionSlug} ${pageTitle}`,
                        route: pageRoute,
                        isSystem: Boolean(page.isSystem),
                        isAutoDiscovered: true,
                        actions: [actionSlug],
                    });
                }
            }
        }
    }

    return Array.from(permissionsMap.values());
};
