const express = require("express");

const {
    createJob,
    getAllJobs,
    getJobById,
    updateJob,
    deleteJob
} = require("../controllers/jobController");

const { protect } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// =========================
// Create Job
// Recruiter Only
// =========================
router.post(
    "/",
    protect,
    roleMiddleware("recruiter"),
    createJob
);

// =========================
// Get All Jobs
// Public
// =========================
router.get(
    "/",
    getAllJobs
);

// =========================
// Get Single Job
// Public
// =========================
router.get(
    "/:id",
    getJobById
);

// =========================
// Update Job
// Recruiter Only
// =========================
router.put(
    "/:id",
    protect,
    roleMiddleware("recruiter"),
    updateJob
);

// =========================
// Delete Job
// Recruiter Only
// =========================
router.delete(
    "/:id",
    protect,
    roleMiddleware("recruiter"),
    deleteJob
);

module.exports = router;