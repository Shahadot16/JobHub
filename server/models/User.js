const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters"]
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
            select: false
        },

        role: {
            type: String,
            enum: ["jobseeker", "recruiter", "admin"],
            default: "jobseeker"
        },

        phone: {
            type: String,
            trim: true
        },

        profileImage: {
            type: String,
            default: ""
        },

        bio: {
            type: String,
            trim: true,
            maxlength: [500, "Bio cannot exceed 500 characters"]
        },

        skills: {
            type: [String],
            default: []
        },

        education: {
            type: [
                {
                    degree: String,
                    institution: String,
                    field: String,
                    startYear: Number,
                    endYear: Number
                }
            ],
            default: []
        },

        experience: {
            type: [
                {
                    company: String,
                    position: String,
                    startDate: Date,
                    endDate: Date,
                    description: String
                }
            ],
            default: []
        },

        resume: {
            type: String,
            default: ""
        },

        location: {
            type: String,
            trim: true
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

module.exports = User;