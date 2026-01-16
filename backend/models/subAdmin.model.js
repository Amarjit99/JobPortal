import mongoose from 'mongoose';

const subAdminSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
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
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    notes: {
        type: String
    }
}, { timestamps: true });

// Index for faster queries (userId index is already created by unique: true)
subAdminSchema.index({ isActive: 1 });

// Method to check if sub-admin has specific permission
subAdminSchema.methods.hasPermission = function(module, action) {
    if (!this.isActive) return false;
    
    const modulePermission = this.permissions.find(p => p.module === module);
    if (!modulePermission) return false;
    
    return modulePermission.actions.includes(action);
};

// Method to get all modules sub-admin can access
subAdminSchema.methods.getAccessibleModules = function() {
    if (!this.isActive) return [];
    
    return this.permissions.map(p => p.module);
};

export const SubAdmin = mongoose.model('SubAdmin', subAdminSchema);
