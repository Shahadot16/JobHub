const jwt = require("jsonwebtoken");
const User = require("../models/User");

// =========================
// Protect Route
// =========================
const protect = async (req, res, next) => {
    try {
        // 1. Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Not authorized. No token provided"
            });
        }

        // 2. Extract token
        const token = authHeader.split(" ")[1];

        // 3. Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // 4. Find user
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        // 5. Attach user to request
        req.user = user;

        // 6. Continue to next middleware/controller
        next();

    } catch (error) {
        console.error("Auth Middleware Error:", error);

        return res.status(401).json({
            success: false,
            message: "Not authorized. Invalid or expired token"
        });
    }
};

module.exports = {
    protect
};