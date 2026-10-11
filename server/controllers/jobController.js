const Job = require("../models/Job");

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

        const job = await Job.create({
            title,
            company,
            description,
            location,
            salary,
            jobType,
            skills: skills || [],
            deadline,
            postedBy: req.user._id || req.user.id
        });

        res.status(201).json({
            success: true,
            message: "Job created successfully",
            job
        });
    } catch (error) {
        console.error("Create Job Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while creating job"
        });
    }
};


// =========================
// Get All Active Jobs
// Public
// =========================
const getAllJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ isActive: true })
            .populate("postedBy", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: jobs.length,
            jobs
        });
    } catch (error) {
        console.error("Get Jobs Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching jobs"
        });
    }
};


// =========================
// Get My Jobs
// Recruiter Only
// =========================
const getMyJobs = async (req, res) => {
    try {
        const recruiterId = req.user._id || req.user.id;

        const jobs = await Job.find({
            postedBy: recruiterId
        })
            .populate("postedBy", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: jobs.length,
            jobs
        });
    } catch (error) {
        console.error("Get My Jobs Error:", error);

        res.status(500).json({
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

        res.status(200).json({
            success: true,
            job
        });
    } catch (error) {
        console.error("Get Job Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID"
            });
        }

        res.status(500).json({
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

        // Only the recruiter who posted the job can update it
        if (job.postedBy.toString() !== recruiterId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own jobs"
            });
        }

        // Only allow editable job fields
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

        const updatedJob = await Job.findByIdAndUpdate(
            req.params.id,
            updates,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            message: "Job updated successfully",
            job: updatedJob
        });
    } catch (error) {
        console.error("Update Job Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID"
            });
        }

        res.status(500).json({
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

        // Only the recruiter who posted the job can delete it
        if (job.postedBy.toString() !== recruiterId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own jobs"
            });
        }

        await Job.findByIdAndDelete(req.params.id);

        res.status(200).json({
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

        res.status(500).json({
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