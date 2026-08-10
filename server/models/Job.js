const mongoose = require("mongoose");

// =========================
// Job Schema
// =========================
const jobSchema = new mongoose.Schema(
    {
        // Job title
        title: {
            type: String,
            required: [true, "Job title is required"],
            trim: true,
            minlength: [3, "Job title must be at least 3 characters"]
        },

        // Job description
        description: {
            type: String,
            required: [true, "Job description is required"],
            trim: true,
            minlength: [10, "Job description must be at least 10 characters"]
        },

        // Company name
        company: {
            type: String,
            required: [true, "Company name is required"],
            trim: true
        },

        // Job location
        location: {
            type: String,
            required: [true, "Job location is required"],
            trim: true
        },

        // Salary
        salary: {
            type: String,
            trim: true,
            default: "Negotiable"
        },

        // Job type
        jobType: {
            type: String,
            enum: [
                "full-time",
                "part-time",
                "remote",
                "internship",
                "contract"
            ],
            default: "full-time"
        },

        // Required skills
        skills: {
            type: [String],
            default: []
        },

        // Application deadline
        deadline: {
            type: Date,
            required: [true, "Application deadline is required"]
        },

        // Recruiter who posted the job
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Job must have a recruiter"]
        },

        // Job status
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// =========================
// Export Model
// =========================
const Job = mongoose.model("Job", jobSchema);

module.exports = Job;