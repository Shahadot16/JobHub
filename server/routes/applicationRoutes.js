
const express = require("express");

const {
    applyForJob,
    getMyApplications,
    getJobApplications,
    updateApplicationStatus
} = require("../controllers/applicationController");

const { protect } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// Jobseeker: Apply for a job
router.post(
    "/",
    protect,
    roleMiddleware("jobseeker"),
    applyForJob
);

// Jobseeker: Get own applications
router.get(
    "/my",
    protect,
    roleMiddleware("jobseeker"),
    getMyApplications
);

// Recruiter: Get applications for a job they own
router.get(
    "/job/:jobId",
    protect,
    roleMiddleware("recruiter"),
    getJobApplications
);

// Recruiter: Update an application's status
router.patch(
    "/:applicationId/status",
    protect,
    roleMiddleware("recruiter"),
    updateApplicationStatus
);

module.exports = router;
