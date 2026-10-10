
const mongoose = require("mongoose");

// =========================
// Job Application Schema
// =========================
const applicationSchema = new mongoose.Schema(
    {
        // Job the applicant applied for
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: [true, "Job ID is required"]
        },

        // User who applied
        applicant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Applicant ID is required"]
        },

        // Resume URL or file path
        resume: {
            type: String,
            trim: true,
            default: ""
        },

        // Applicant's cover letter
        coverLetter: {
            type: String,
            trim: true,
            maxlength: [3000, "Cover letter cannot exceed 3000 characters"],
            default: ""
        },

        // Application status
        status: {
            type: String,
            enum: [
                "pending",
                "reviewing",
                "shortlisted",
                "rejected",
                "accepted"
            ],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate applications to the same job
applicationSchema.index(
    { job: 1, applicant: 1 },
    { unique: true }
);

// =========================
// Export Model
// =========================
const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;
