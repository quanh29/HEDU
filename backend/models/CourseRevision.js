import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    subtitle: {
        type: String,
        required: true,
    },
    instructors: {
        type: Array,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    thumbnail: {
        type: String,
        required: true,
    },
    originalPrice: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
    },
    updatedAt: {
        type: Date,
        required: true,
    },
    tags: {
        type: Array,
        required: true,
    },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'expert'],
        required: true,
    },
    language: {
        type: String,
        enum: ['vietnamese', 'english', 'chinese', 'spanish', 'french', 'german', 'japanese', 'korean', 'portuguese', 'russian', 'other'],
        required: true,
    },
    hasPractice: {
        type: Boolean,
        default: false,
    },
    hasCertificate: {
        type: Boolean,
        default: false,
    },
    requirements: {
        type: Array,
        required: true,
    },
    objectives: {
        type: Array,
        required: true,
    },
    sections:[],
    status: {
        type: String,
        enum: ['approved', 'pending'],
        required: true
    }
});

const CourseRevision = mongoose.model("CourseRevision", courseSchema);

export default CourseRevision;
