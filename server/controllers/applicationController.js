
const mongoose = require("mongoose");
const Application = require("../models/Application");
const Job = require("../models/Job");

// =========================
// Check Application Deadline
// =========================
const isDeadlinePassed = (deadline) => {
    if (!deadline) return false;

    const deadlineEnd = new Date(deadline);

    if (Number.isNaN(deadlineEnd.getTime())) {
        return true;
    }

    deadlineEnd.setUTCHours(23, 59, 59, 999);

    return deadlineEnd < new Date();
};

// =========================
// Apply for a Job
// Jobseeker Only
// =========================
const applyForJob = async (req, res) => {
    try {
        const { jobId, coverLetter, resume } = req.body;
        const applicantId = req.user._id || req.user.id;

        if (!mongoose.Types.ObjectId.isValid(jobId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID"
            });
        }

        // Find the job, then check its deadline separately.
        // This allows us to return a clear expired-job message.
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        if (!job.isActive) {
            return res.status(400).json({
                success: false,
                message: "This job is no longer active"
            });
        }

        // Reject applications after the deadline.
        if (isDeadlinePassed(job.deadline)) {
            return res.status(400).json({
                success: false,
                message: "Application deadline has passed"
            });
        }

        // Prevent recruiter from applying to their own job.
        if (job.postedBy.toString() === applicantId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You cannot apply to your own job"
            });
        }

        // Prevent duplicate applications.
        const existingApplication = await Application.findOne({
            job: jobId,
            applicant: applicantId
        });

        if (existingApplication) {
            return res.status(409).json({
                success: false,
                message: "You have already applied for this job"
            });
        }

        const application = await Application.create({
            job: jobId,
            applicant: applicantId,
            coverLetter: coverLetter || "",
            resume: resume || req.user.resume || ""
        });

        return res.status(201).json({
            success: true,
            message: "Job application submitted successfully",
            application
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "You have already applied for this job"
            });
        }

        console.error("Apply for job error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to submit job application"
        });
    }
};

// =========================
// Get My Applications
// Jobseeker Only
// =========================
const getMyApplications = async (req, res) => {
    try {
        const applicantId = req.user._id || req.user.id;

        const applications = await Application.find({
            applicant: applicantId
        })
            .populate(
                "job",
                "title company location salary jobType deadline isActive"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: applications.length,
            applications
        });
    } catch (error) {
        console.error("Get my applications error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch your applications"
        });
    }
};

// =========================
// Get Applications for a Job
// Recruiter Only
// =========================
const getJobApplications = async (req, res) => {
    try {
        const { jobId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(jobId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID"
            });
        }

        const recruiterId = req.user._id || req.user.id;

        const job = await Job.findOne({
            _id: jobId,
            postedBy: recruiterId
        });

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found or you do not own this job"
            });
        }

        const applications = await Application.find({ job: jobId })
            .populate("applicant", "name email phone skills resume")
            .populate("job", "title company")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: applications.length,
            applications
        });
    } catch (error) {
        console.error("Get job applications error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch job applications"
        });
    }
};

// =========================
// Update Application Status
// Recruiter Only
// =========================
const updateApplicationStatus = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(applicationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid application ID"
            });
        }

        const allowedStatuses = [
            "pending",
            "reviewing",
            "shortlisted",
            "rejected",
            "accepted"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid application status"
            });
        }

        const application = await Application.findById(applicationId);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        const recruiterId = req.user._id || req.user.id;

        const job = await Job.findOne({
            _id: application.job,
            postedBy: recruiterId
        });

        if (!job) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this application"
            });
        }

        application.status = status;
        await application.save();

        return res.status(200).json({
            success: true,
            message: "Application status updated successfully",
            application
        });
    } catch (error) {
        console.error("Update application status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update application status"
        });
    }
};

module.exports = {
    applyForJob,
    getMyApplications,
    getJobApplications,
    updateApplicationStatus
};
