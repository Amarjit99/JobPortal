// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    try {
        console.log('isAdmin middleware called, req.id:', req.id);
        
        if (!req.id) {
            console.log('isAdmin: No req.id found');
            return res.status(401).json({
                message: "User not authenticated",
                success: false
            });
        }

        // Get user role from database
        const User = (await import('../models/user.model.js')).User;
        const user = await User.findById(req.id);

        console.log('isAdmin: Found user:', { id: user?._id, role: user?.role });

        if (!user) {
            console.log('isAdmin: User not found in database');
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        if (user.role !== 'admin') {
            console.log('isAdmin: User is not admin, role:', user.role);
            return res.status(403).json({
                message: "Access denied. Admin privileges required.",
                success: false
            });
        }

        console.log('isAdmin: Access granted for admin user');
        next();
    } catch (error) {
        console.error('isAdmin middleware error:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Middleware to check if user is recruiter or admin
const isRecruiterOrAdmin = async (req, res, next) => {
    try {
        if (!req.id) {
            return res.status(401).json({
                message: "User not authenticated",
                success: false
            });
        }

        const User = (await import('../models/user.model.js')).User;
        const user = await User.findById(req.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        if (user.role !== 'recruiter' && user.role !== 'admin') {
            return res.status(403).json({
                message: "Access denied. Recruiter or Admin privileges required.",
                success: false
            });
        }

        // Store role in request for later use
        req.userRole = user.role;
        next();
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export { isAdmin, isRecruiterOrAdmin };
