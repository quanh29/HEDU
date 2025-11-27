import mongoose, { version } from "mongoose";

const courseDraftSchema = new mongoose.Schema({
    _id: {
        type: String, // MySQL course_id used as _id
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
        required: true,
    },
    language: {
        type: String,
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
    sections:[], // Legacy: embedded sections array (kept for backward compatibility)
    
    // NEW: References to draft documents (only one draft per course)
    draftSections: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SectionDraft'
    }],
    draftLessons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LessonDraft'
    }],
    draftVideos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VideoDraft'
    }],
    draftMaterials: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MaterialDraft'
    }],
    draftQuizzes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuizDraft'
    }],
    
    status: {
        type: String,
        enum: ['draft', 'approved', 'pending', 'rejected'],
        required: true
    },
    version: {
        type: Number,
        required: true,
        default: 1,
    },
    
    // Snapshot of previous version (for rollback)
    previousVersion: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    
    // Metadata
    lv_id: String,
    lang_id: String,
    categories: [String], // Array of category_ids
    picture_url: String,
    rejectionReason: String, // Lý do từ chối nếu bị reject
    
    // Timestamps for revision workflow
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: String, // Admin user ID who reviewed
    
    // Auto-generated from published course
    isAutoCreated: {
        type: Boolean,
        default: false // True if draft was auto-created from published course
    }
}, {
    _id: false, // Disable auto _id generation since we use courseId as _id
    timestamps: true // Adds createdAt and updatedAt automatically
});

const CourseDraft = mongoose.model("CourseDraft", courseDraftSchema);

export default CourseDraft;
