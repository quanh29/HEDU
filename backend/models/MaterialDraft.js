import mongoose from "mongoose";

const materialDraftSchema = new mongoose.Schema({
    // Link to published material (null if new material)
    publishedMaterialId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material',
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
    
    // Material data (mirrors Material model)
    title: {
        type: String,
        required: false,
    },
    contentUrl: {
        type: String,
        required: true,
    },
    order: {
        type: Number,
        required: false,
    },
    resource_type: {
        type: String,
        default: 'raw',
    },
    originalFilename: {
        type: String,
        required: false,
    },
    fileSize: {
        type: Number,
        required: false,
    },
    extension: {
        type: String,
        required: false,
    },
    isTemporary: {
        type: Boolean,
        default: true,
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
materialDraftSchema.index({ courseDraftId: 1, draftLessonId: 1 });
materialDraftSchema.index({ publishedMaterialId: 1 });

const MaterialDraft = mongoose.model("MaterialDraft", materialDraftSchema);

export default MaterialDraft;
