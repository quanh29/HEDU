import mongoose from "mongoose";

const videoDraftSchema = new mongoose.Schema({
    // Link to published video (null if new video)
    publishedVideoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
        default: null
    },
    
    // Link to course draft
    courseDraftId: {
        type: String,
        ref: 'CourseDraft',
        required: true,
        index: true
    },
    
    // Link to draft lesson (required)
    draftLessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LessonDraft',
        required: true
    },
    
    // Video data (mirrors Video model)
    title: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
        index: true,
    },
    uploadId: {
        type: String,
    },
    assetId: {
        type: String,
    },
    playbackId: {
        type: String,
    },
    status: {
        type: String,
        enum: ['uploading', 'processing', 'ready', 'error', 'cancelled'],
        default: 'uploading'
    },
    duration: {
        type: Number,
    },
    description: {
        type: String,
    },
    order: {
        type: Number,
        default: 1,
    },
    aspectRatio: {
        type: String,
    },
    max_resolution: {
        type: String,
    },
    
    // Draft-specific fields
    draftStatus: {
        type: String,
        enum: ['draft', 'pending', 'approved', 'rejected'],
        default: 'draft'
    },
    changeType: {
        type: String,
        enum: ['new', 'modified', 'deleted', 'unchanged'],
        default: 'new'
    },
    
    // Track changes for comparison
    changes: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
videoDraftSchema.index({ courseDraftId: 1, draftLessonId: 1 });
videoDraftSchema.index({ publishedVideoId: 1 });
videoDraftSchema.index({ userId: 1, status: 1 });

const VideoDraft = mongoose.model("VideoDraft", videoDraftSchema);

export default VideoDraft;
