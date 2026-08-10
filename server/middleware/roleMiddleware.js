// =========================
// Role Middleware
// =========================

const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {

        // Check if user exists
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please login first"
            });
        }

        // Check user role
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You do not have permission"
            });
        }

        next();
    };
};

// Export Middleware
module.exports = roleMiddleware;