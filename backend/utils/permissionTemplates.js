// Permission Templates for Sub-Admin Roles

export const PERMISSION_TEMPLATES = {
    // Moderator: Can only moderate jobs and handle reports
    moderator: {
        name: 'Moderator',
        description: 'Job moderation and report handling',
        permissions: [
            {
                module: 'jobs',
                actions: ['view', 'edit', 'approve', 'reject']
            },
            {
                module: 'companies',
                actions: ['view']
            }
        ]
    },
    
    // Support: User management and application handling
    support: {
        name: 'Support',
        description: 'User management and application support',
        permissions: [
            {
                module: 'users',
                actions: ['view', 'edit']
            },
            {
                module: 'applications',
                actions: ['view', 'edit']
            },
            {
                module: 'companies',
                actions: ['view']
            },
            {
                module: 'jobs',
                actions: ['view']
            }
        ]
    },
    
    // Content Manager: Company verification and content management
    contentManager: {
        name: 'Content Manager',
        description: 'Company verification and content oversight',
        permissions: [
            {
                module: 'companies',
                actions: ['view', 'edit', 'approve', 'reject']
            },
            {
                module: 'jobs',
                actions: ['view', 'edit']
            },
            {
                module: 'users',
                actions: ['view']
            }
        ]
    },
    
    // Full Access: All permissions except critical admin operations
    fullAccess: {
        name: 'Full Access',
        description: 'All administrative permissions',
        permissions: [
            {
                module: 'users',
                actions: ['view', 'create', 'edit', 'delete']
            },
            {
                module: 'jobs',
                actions: ['view', 'create', 'edit', 'delete', 'approve', 'reject']
            },
            {
                module: 'companies',
                actions: ['view', 'create', 'edit', 'delete', 'approve', 'reject']
            },
            {
                module: 'applications',
                actions: ['view', 'edit', 'delete']
            },
            {
                module: 'analytics',
                actions: ['view']
            }
        ]
    },
    
    // Analytics Viewer: Read-only access to analytics and reports
    analyticsViewer: {
        name: 'Analytics Viewer',
        description: 'View analytics and generate reports',
        permissions: [
            {
                module: 'analytics',
                actions: ['view']
            },
            {
                module: 'users',
                actions: ['view']
            },
            {
                module: 'jobs',
                actions: ['view']
            },
            {
                module: 'companies',
                actions: ['view']
            },
            {
                module: 'applications',
                actions: ['view']
            }
        ]
    }
};

// Get template by name
export const getTemplate = (templateName) => {
    return PERMISSION_TEMPLATES[templateName] || null;
};

// Get all template names
export const getTemplateNames = () => {
    return Object.keys(PERMISSION_TEMPLATES);
};

// Validate custom permissions against allowed modules and actions
export const validatePermissions = (permissions) => {
    const validModules = ['users', 'jobs', 'companies', 'applications', 'analytics'];
    const validActions = ['view', 'create', 'edit', 'delete', 'approve', 'reject'];
    
    if (!Array.isArray(permissions) || permissions.length === 0) {
        return {
            valid: false,
            error: 'Permissions must be a non-empty array'
        };
    }
    
    for (const perm of permissions) {
        if (!perm.module || !validModules.includes(perm.module)) {
            return {
                valid: false,
                error: `Invalid module: ${perm.module}. Valid modules are: ${validModules.join(', ')}`
            };
        }
        
        if (!perm.actions || !Array.isArray(perm.actions) || perm.actions.length === 0) {
            return {
                valid: false,
                error: `Module ${perm.module} must have at least one action`
            };
        }
        
        for (const action of perm.actions) {
            if (!validActions.includes(action)) {
                return {
                    valid: false,
                    error: `Invalid action: ${action}. Valid actions are: ${validActions.join(', ')}`
                };
            }
        }
    }
    
    return { valid: true };
};

// Merge permissions (useful for combining templates or adding custom permissions)
export const mergePermissions = (...permissionSets) => {
    const merged = {};
    
    for (const permSet of permissionSets) {
        for (const perm of permSet) {
            if (!merged[perm.module]) {
                merged[perm.module] = new Set(perm.actions);
            } else {
                perm.actions.forEach(action => merged[perm.module].add(action));
            }
        }
    }
    
    return Object.entries(merged).map(([module, actions]) => ({
        module,
        actions: Array.from(actions)
    }));
};

// Check if permissions include specific module and action
export const hasPermission = (permissions, module, action) => {
    const modulePermission = permissions.find(p => p.module === module);
    if (!modulePermission) return false;
    return modulePermission.actions.includes(action);
};
