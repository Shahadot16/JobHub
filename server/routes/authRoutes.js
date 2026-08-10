const express = require("express");

const {
    registerUser,
    loginUser
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// =========================
// Register
// =========================
router.post("/register", registerUser);

// =========================
// Login
// =========================
router.post("/login", loginUser);

// =========================
// Protected Profile
// =========================
router.get("/profile", protect, (req, res) => {
    res.status(200).json({
        success: true,
        message: "You are authorized",
        user: req.user
    });
});

// =========================
// Recruiter Only Test
// =========================
router.get(
    "/recruiter-test",
    protect,
    roleMiddleware("recruiter"),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Welcome Recruiter! You have access to this route.",
            user: req.user
        });
    }
);

module.exports = router;