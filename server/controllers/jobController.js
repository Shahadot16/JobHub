
const Job = require("../models/Job");

// =========================
// Check Application Deadline
// A job expires after the end of its deadline date.
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
// Create Job
// Recruiter Only
// =========================
const createJob = async (req, res) => {
    try {
        const {
            title,
            company,
            description,
            location,
            salary,
            jobType,
            skills,
            deadline
        } = req.body;

        if (
            !title ||
            !company ||
            !description ||
            !location ||
            !jobType ||
            !deadline
        ) {
            return res.status(400).json({
                success: false,
                message: "All required job fields must be provided"
            });
        }

        const parsedDeadline = new Date(deadline);

        if (Number.isNaN(parsedDeadline.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid application deadline"
            });
        }

        const job = await Job.create({
            title,
            company,
            description,
            location,
            salary,
            jobType,
            skills: skills || [],
            deadline: parsedDeadline,
            postedBy: req.user._id || req.user.id
        });

        return res.status(201).json({
            success: true,
            message: "Job created successfully",
            job
        });
    } catch (error) {
        console.error("Create Job Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating job"
        });
    }
};

// =========================
// Get All Active, Non-Expired Jobs
// Public
// =========================
const getAllJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ isActive: true })
            .populate("postedBy", "name email")
            .sort({ createdAt: -1 });

        // Hide expired jobs from public job listings.
        const availableJobs = jobs.filter(
            (job) => !isDeadlinePassed(job.deadline)
        );

        return res.status(200).json({
            success: true,
            count: availableJobs.length,
            jobs: availableJobs
        });
    } catch (error) {
        console.error("Get Jobs Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching jobs"
        });
    }
};

// =========================
// Get My Jobs
// Recruiter Only
// Includes expired jobs for management.
// =========================
const getMyJobs = async (req, res) => {
    try {
        const recruiterId = req.user._id || req.user.id;

        const jobs = await Job.find({
            postedBy: recruiterId
        })
            .populate("postedBy", "name email")
            .sort({ createdAt: -1 });

        const jobsWithStatus = jobs.map((job) => {
            const expired = isDeadlinePassed(job.deadline);

            return {
                ...job.toObject(),
                isExpired: expired,
                displayStatus: expired
                    ? "Expired"
                    : job.isActive
                        ? "Active"
                        : "Inactive"
            };
        });

        return res.status(200).json({
            success: true,
            count: jobsWithStatus.length,
            jobs: jobsWithStatus
        });
    } catch (error) {
        console.error("Get My Jobs Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching your jobs"
        });
    }
};

// =========================
// Get Single Job
// Public
// =========================
const getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate("postedBy", "name email");

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        return res.status(200).json({
            success: true,
            job,
            isExpired: isDeadlinePassed(job.deadline),
            displayStatus: isDeadlinePassed(job.deadline)
                ? "Expired"
                : job.isActive
                    ? "Active"
                    : "Inactive"
        });
    } catch (error) {
        console.error("Get Job Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Server error while fetching job"
        });
    }
};

// =========================
// Update Job
// Recruiter Only
// =========================
const updateJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        const recruiterId = req.user._id || req.user.id;

        if (job.postedBy.toString() !== recruiterId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own jobs"
            });
        }

        const allowedFields = [
            "title",
            "company",
            "description",
            "location",
            "salary",
            "jobType",
            "skills",
            "deadline",
            "isActive"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (updates.deadline !== undefined) {
            const parsedDeadline = new Date(updates.deadline);

            if (Number.isNaN(parsedDeadline.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide a valid application deadline"
                });
            }

            updates.deadline = parsedDeadline;
        }

        const updatedJob = await Job.findByIdAndUpdate(
            req.params.id,
            updates,
            {
                new: true,
                runValidators: true
            }
        );

        return res.status(200).json({
            success: true,
            message: "Job updated successfully",
            job: updatedJob,
            isExpired: isDeadlinePassed(updatedJob.deadline),
            displayStatus: isDeadlinePassed(updatedJob.deadline)
                ? "Expired"
                : updatedJob.isActive
                    ? "Active"
                    : "Inactive"
        });
    } catch (error) {
        console.error("Update Job Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID or field value"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Server error while updating job"
        });
    }
};

// =========================
// Delete Job
// Recruiter Only
// =========================
const deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        const recruiterId = req.user._id || req.user.id;

        if (job.postedBy.toString() !== recruiterId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own jobs"
            });
        }

        await Job.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Job deleted successfully"
        });
    } catch (error) {
        console.error("Delete Job Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Server error while deleting job"
        });
    }
};

// =========================
// Export Controllers
// =========================
module.exports = {
    createJob,
    getAllJobs,
    getMyJobs,
    getJobById,
    updateJob,
    deleteJob
};
