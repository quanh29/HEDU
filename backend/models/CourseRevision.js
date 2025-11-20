import mongoose, { version } from "mongoose";

const courseSchema = new mongoose.Schema({
    courseId: {
        type: String, // MySQL course_id
        required: true,
    },
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
    currentPrice: {
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
        enum: ['approved', 'pending', 'rejected'],
        required: true
    },
    version: {
        type: Number,
        required: true,
        default: 1,
    },
    // Metadata
    lv_id: String,
    lang_id: String,
    categories: [String], // Array of category_ids
    picture_url: String,
    rejectionReason: String // Lý do từ chối nếu bị reject
});

const CourseRevision = mongoose.model("CourseRevision", courseSchema);

export default CourseRevision;
