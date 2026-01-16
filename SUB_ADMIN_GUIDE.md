# Sub-Admin Role System - Implementation Guide

## Overview
The Sub-Admin role system allows administrators to delegate specific permissions to users, enabling them to manage certain modules without full admin access. This provides granular control over user capabilities in the Job Portal application.

## Architecture

### Core Components

1. **SubAdmin Model** (`backend/models/subAdmin.model.js`)
   - Stores sub-admin permissions and metadata
   - Links to User model via userId
   - Tracks who assigned the permissions

2. **Permission Middleware** (`backend/middlewares/checkPermission.js`)
   - Validates permissions before allowing access
   - Three middleware functions for different access levels

3. **SubAdmin Controller** (`backend/controllers/subAdmin.controller.js`)
   - CRUD operations for sub-admin management
   - Permission validation and user role updates

4. **Frontend Components**
   - SubAdminManagement: List and manage sub-admins
   - SubAdminForm: Create/edit sub-admin permissions
   - PermissionMatrix: Visual permission selection grid

## Permission System

### Modules
The system supports five main modules:
- **users**: User account management
- **jobs**: Job posting management
- **companies**: Company profile management
- **applications**: Job application management
- **analytics**: System analytics and reports

### Actions
Each module can have the following actions:
- **view**: Read-only access
- **create**: Ability to create new items
- **edit**: Ability to modify existing items
- **delete**: Ability to delete items
- **approve**: Ability to approve items
- **reject**: Ability to reject items

## Backend Implementation

### Database Schema

```javascript
const subAdminSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true  // Each user can only be a sub-admin once
    },
    permissions: [{
        module: {
            type: String,
            enum: ['users', 'jobs', 'companies', 'applications', 'analytics'],
            required: true
        },
        actions: [{
            type: String,
            enum: ['view', 'create', 'edit', 'delete', 'approve', 'reject'],
            required: true
        }]
    }],
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true  // Tracks which admin assigned permissions
    },
    isActive: {
        type: Boolean,
        default: true  // Can deactivate without deleting
    },
    notes: String  // Optional notes about responsibilities
}, { timestamps: true });
```

### API Endpoints

#### Admin-Only Endpoints (require admin role)

**POST /api/v1/sub-admin**
- Create a new sub-admin
- Request Body:
  ```json
  {
    "userId": "60a7...",
    "permissions": [
      {
        "module": "jobs",
        "actions": ["view", "create", "edit"]
      },
      {
        "module": "companies",
        "actions": ["view", "edit"]
      }
    ],
    "notes": "Manages job postings and company profiles"
  }
  ```
- Response: Created sub-admin with user details

**GET /api/v1/sub-admin**
- Get all sub-admins
- Query Parameters:
  - `isActive`: Filter by active status (true/false)
- Response: Array of sub-admins with populated user and assignedBy fields

**GET /api/v1/sub-admin/:id**
- Get specific sub-admin by ID
- Response: Sub-admin details with full user information

**PUT /api/v1/sub-admin/:id**
- Update sub-admin permissions or status
- Request Body:
  ```json
  {
    "permissions": [...],  // Optional
    "isActive": true,      // Optional
    "notes": "Updated responsibilities"  // Optional
  }
  ```

**DELETE /api/v1/sub-admin/:id**
- Remove sub-admin
- Reverts user role to 'student'
- Deletes SubAdmin record

#### Sub-Admin Endpoints

**GET /api/v1/sub-admin/me/permissions**
- Get own permissions (for logged-in sub-admin)
- Protected by `isAdminOrSubAdmin` middleware
- Response:
  ```json
  {
    "permissions": [...],
    "accessibleModules": ["jobs", "companies"]
  }
  ```

### Permission Middleware

#### checkPermission(module, action)
Main permission checker - flexible middleware that allows both admin and sub-admin:

```javascript
export const checkPermission = (module, action) => {
    return async (req, res, next) => {
        const userId = req.id;
        const user = await User.findById(userId);
        
        // Admin: full access
        if (user?.role === 'admin') {
            logger.info(`Admin ${userId} granted full access`);
            return next();
        }
        
        // Sub-admin: check permissions
        if (user?.role === 'sub-admin') {
            const subAdmin = await SubAdmin.findOne({ 
                userId, 
                isActive: true 
            });
            
            if (subAdmin && subAdmin.hasPermission(module, action)) {
                logger.info(`Sub-admin ${userId} granted ${action} on ${module}`);
                return next();
            }
            
            logger.warn(`Sub-admin ${userId} denied ${action} on ${module}`);
            return res.status(403).json({ 
                message: `Permission denied: ${action} on ${module}`,
                success: false 
            });
        }
        
        // Others: access denied
        return res.status(403).json({ 
            message: 'Admin or sub-admin role required',
            success: false 
        });
    };
};
```

#### isAdmin
Strict admin-only check (sub-admin NOT allowed):

```javascript
export const isAdmin = async (req, res, next) => {
    const userId = req.id;
    const user = await User.findById(userId);
    
    if (user?.role === 'admin') {
        return next();
    }
    
    return res.status(403).json({
        message: 'Admin role required',
        success: false
    });
};
```

#### isAdminOrSubAdmin
Allow both admin and sub-admin roles:

```javascript
export const isAdminOrSubAdmin = async (req, res, next) => {
    const userId = req.id;
    const user = await User.findById(userId);
    
    if (user?.role === 'admin' || user?.role === 'sub-admin') {
        return next();
    }
    
    return res.status(403).json({
        message: 'Admin or sub-admin role required',
        success: false
    });
};
```

### Using Middleware in Routes

```javascript
// Strict admin-only (managing sub-admins)
router.post('/', isAuthenticated, isAdmin, createSubAdmin);

// Allow both admin and sub-admin
router.get('/dashboard', isAuthenticated, isAdminOrSubAdmin, getDashboard);

// Granular permission check
router.post('/jobs', isAuthenticated, checkPermission('jobs', 'create'), createJob);
router.put('/jobs/:id', isAuthenticated, checkPermission('jobs', 'edit'), updateJob);
router.delete('/jobs/:id', isAuthenticated, checkPermission('jobs', 'delete'), deleteJob);
```

## Frontend Implementation

### SubAdminManagement Component

Main management interface with:
- Table listing all sub-admins
- Search and filter functionality (by name, email, status)
- View, Edit, Toggle Status, Delete actions
- Create new sub-admin dialog

**Features:**
- Real-time filtering by active/inactive status
- Search by name or email
- Shows module count and permission count for each sub-admin
- Confirmation dialogs for destructive actions
- Auto-refresh after changes

### SubAdminForm Component

Form for creating and editing sub-admins:
- User selection dropdown (create mode only)
- Permission matrix (embedded PermissionMatrix component)
- Notes textarea for responsibilities
- Validation: ensures user and permissions are selected

**Workflow:**
1. Admin selects eligible user (student or recruiter role)
2. Admin selects modules and actions using permission matrix
3. Admin adds optional notes
4. Submit creates SubAdmin record and updates user role

### PermissionMatrix Component

Visual grid for permission selection:
- Rows: Modules (users, jobs, companies, applications, analytics)
- Columns: Actions (view, create, edit, delete, approve, reject)
- Click to toggle individual permissions
- "Select All" / "Deselect All" per module
- Visual feedback (green = enabled, gray = disabled)
- Summary section showing selected permissions
- Read-only mode for viewing existing permissions

### Navigation Integration

**Admin Navbar:**
- Added "Sub-Admins" link in admin menu
- Route: `/admin/sub-admins`

**Admin Dashboard:**
- Quick action button to access Sub-Admin management
- Shield icon for easy identification

## User Workflow

### Creating a Sub-Admin

1. Admin navigates to Admin Dashboard → Sub-Admins
2. Clicks "Create Sub-Admin" button
3. Selects user from dropdown (filters to eligible users)
4. Uses permission matrix to grant specific permissions
5. Adds optional notes about responsibilities
6. Submits form
7. System:
   - Creates SubAdmin record
   - Updates user role to 'sub-admin'
   - Records admin who assigned permissions

### Editing Sub-Admin Permissions

1. Admin clicks "Edit" icon on sub-admin row
2. Permission matrix shows current permissions
3. Admin modifies permissions using grid
4. Updates notes if needed
5. Submits form
6. System updates SubAdmin permissions

### Activating/Deactivating Sub-Admin

1. Admin clicks shield icon (activate/deactivate toggle)
2. System updates `isActive` status
3. When deactivated:
   - Sub-admin retains role but has no access
   - All permission checks fail
   - Can be reactivated without re-assigning permissions

### Removing Sub-Admin

1. Admin clicks "Delete" icon
2. Confirms deletion
3. System:
   - Deletes SubAdmin record
   - Reverts user role to 'student'
   - Sub-admin loses all access

## Security Considerations

### Permission Validation
- All permission checks happen server-side
- Middleware validates every request
- Inactive sub-admins automatically denied
- Comprehensive logging of all access attempts

### Role Hierarchy
1. **Admin**: Full system access, can manage sub-admins
2. **Sub-Admin**: Limited access based on assigned permissions
3. **Recruiter**: Company and job management (no sub-admin access)
4. **Student**: Job browsing and applications (no sub-admin access)

### Audit Trail
- All sub-admin creations logged with assignedBy field
- Permission changes tracked via timestamps
- Access attempts logged (granted/denied)
- Logging includes: userId, role, module, action, result

## Testing Guide

### Manual Testing Steps

1. **Create Sub-Admin:**
   ```
   - Login as admin
   - Navigate to /admin/sub-admins
   - Create sub-admin with limited permissions (e.g., jobs: view, create)
   - Verify SubAdmin record created
   - Verify user role updated to 'sub-admin'
   ```

2. **Test Permissions:**
   ```
   - Logout admin, login as sub-admin
   - Try accessing allowed module (e.g., view jobs) → Should succeed
   - Try accessing restricted action (e.g., delete jobs) → Should get 403
   - Try accessing non-permitted module → Should get 403
   ```

3. **Update Permissions:**
   ```
   - Login as admin
   - Edit sub-admin, add new permissions
   - Login as sub-admin, verify new access granted
   ```

4. **Deactivate Sub-Admin:**
   ```
   - Login as admin, deactivate sub-admin
   - Login as sub-admin, try any action → Should get 403
   - Reactivate, verify access restored
   ```

5. **Delete Sub-Admin:**
   ```
   - Login as admin, delete sub-admin
   - Verify user role reverted to 'student'
   - Login as former sub-admin, verify no admin access
   ```

### API Testing with cURL

**Create Sub-Admin:**
```bash
curl -X POST http://localhost:8000/api/v1/sub-admin \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_ADMIN_TOKEN" \
  -d '{
    "userId": "USER_ID_HERE",
    "permissions": [
      {
        "module": "jobs",
        "actions": ["view", "create", "edit"]
      }
    ],
    "notes": "Manages job postings"
  }'
```

**Get All Sub-Admins:**
```bash
curl http://localhost:8000/api/v1/sub-admin \
  -H "Cookie: token=YOUR_ADMIN_TOKEN"
```

**Update Permissions:**
```bash
curl -X PUT http://localhost:8000/api/v1/sub-admin/SUB_ADMIN_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_ADMIN_TOKEN" \
  -d '{
    "permissions": [
      {
        "module": "jobs",
        "actions": ["view", "create", "edit", "delete"]
      },
      {
        "module": "companies",
        "actions": ["view", "edit"]
      }
    ]
  }'
```

## Best Practices

### Permission Design
1. **Principle of Least Privilege**: Grant only necessary permissions
2. **Module-Based**: Organize permissions by business domain
3. **Action-Specific**: Separate read vs write permissions
4. **Reviewable**: Admin can easily audit permissions

### Performance
1. **Indexing**: userId and isActive indexed for fast queries
2. **Caching**: Consider caching permissions for active sub-admins
3. **Eager Loading**: Populate user details in list queries

### Error Handling
1. **Clear Messages**: Permission denied messages specify module/action
2. **Logging**: All permission checks logged for audit
3. **Graceful Degradation**: Deactivated sub-admins handled gracefully

## Troubleshooting

### Common Issues

**Issue: Permission check returns 403 even with correct permissions**
- Check if sub-admin is active (`isActive: true`)
- Verify permissions array has correct module and action
- Check server logs for permission check details

**Issue: Cannot create sub-admin**
- Verify user exists and has student or recruiter role
- Check if user already has sub-admin record (unique constraint)
- Ensure admin is authenticated and has admin role

**Issue: Frontend shows incorrect permissions**
- Clear browser cache and reload
- Check API response for correct data
- Verify PermissionMatrix component receives correct props

## Future Enhancements

1. **Permission Templates**: Pre-defined permission sets (e.g., "Content Manager", "User Support")
2. **Time-Based Permissions**: Expiring sub-admin access
3. **Delegation**: Sub-admins creating other sub-admins (with approval)
4. **Activity Dashboard**: Sub-admin activity monitoring
5. **Audit Logs**: Detailed sub-admin action history
6. **Bulk Operations**: Assign same permissions to multiple users
7. **Permission Inheritance**: Role-based default permissions
8. **Notification System**: Alert sub-admins of permission changes

## Dependencies

### Backend
- mongoose: Database modeling and validation
- express: Route handling
- jsonwebtoken: Authentication (via isAuthenticated)
- winston: Logging (via logger utility)

### Frontend
- react: UI framework
- react-router-dom: Routing
- axios: HTTP requests
- sonner: Toast notifications
- lucide-react: Icons
- shadcn/ui: UI components (Button, Table, Dialog, etc.)

## File Structure

```
backend/
├── models/
│   ├── subAdmin.model.js          # SubAdmin schema with methods
│   └── user.model.js               # Updated with 'sub-admin' role
├── controllers/
│   └── subAdmin.controller.js     # CRUD operations
├── middlewares/
│   ├── isAuthenticated.js         # Auth check
│   └── checkPermission.js         # Permission checks
└── routes/
    └── subAdmin.route.js          # API endpoints

frontend/
├── components/
│   └── admin/
│       ├── SubAdminManagement.jsx  # Main management UI
│       ├── SubAdminForm.jsx        # Create/edit form
│       ├── PermissionMatrix.jsx    # Permission grid
│       └── AdminDashboard.jsx      # Updated with quick action
└── utils/
    └── constant.js                 # API endpoint constants
```

## Support and Maintenance

For issues or questions:
1. Check server logs for detailed error messages
2. Review permission checks in middleware
3. Verify database SubAdmin records
4. Test API endpoints directly with cURL
5. Check browser console for frontend errors

## Changelog

### Version 1.0.0 (Initial Release)
- Complete sub-admin role system
- Granular permission management (5 modules × 6 actions)
- Admin UI for sub-admin management
- Permission validation middleware
- Comprehensive logging and audit trail
- Visual permission matrix component
- Active/inactive status toggle
- Full CRUD operations

---

**Last Updated:** January 14, 2026
**Implemented By:** Phase 1 Week 2 Day 4-5
**Status:** Production Ready ✅
