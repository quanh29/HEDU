import mongoose from 'mongoose';

const lessonDraftSchema = new mongoose.Schema({
    // Link to published lesson (null if new lesson)
    publishedLessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        default: null
    },
    
    // Link to course draft
    courseDraftId: {
        type: String,
        ref: 'CourseDraft',
        required: true,
        index: true
    },
    
    // Link to draft section (required)
    draftSectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SectionDraft',
        required: true
    },
    
    // Lesson data (mirrors Lesson model)
    title: {
        type: String,
        required: true
    },
    contentType: {
        type: String,
        enum: ['video', 'material', 'quiz'],
        required: true
    },
    order: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        default: ''
    },
    duration: {
        type: Number,
        default: 0
    },
    isFreePreview: {
        type: Boolean,
        default: false
    },
    
    // References to draft content
    draftVideoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VideoDraft',
        default: null
    },
    draftMaterialId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MaterialDraft',
        default: null
    },
    draftQuizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuizDraft',
        default: null
    },
    
    // Draft-specific fields
    status: {
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
lessonDraftSchema.index({ courseDraftId: 1, draftSectionId: 1, order: 1 });
lessonDraftSchema.index({ publishedLessonId: 1 });

// Virtual to get content based on contentType
lessonDraftSchema.virtual('content').get(function() {
    switch (this.contentType) {
        case 'video':
            return this.draftVideoId;
        case 'material':
            return this.draftMaterialId;
        case 'quiz':
            return this.draftQuizId;
        default:
            return null;
    }
});

// Pre-delete hook to delete associated draft content
lessonDraftSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    try {
        console.log(`🗑️ Deleting draft lesson: ${this._id}`);
        
        const VideoDraft = mongoose.model('VideoDraft');
        const MaterialDraft = mongoose.model('MaterialDraft');
        const QuizDraft = mongoose.model('QuizDraft');
        
        // Delete associated draft content
        if (this.contentType === 'video' && this.draftVideoId) {
            await VideoDraft.findByIdAndDelete(this.draftVideoId);
            console.log(`   ✅ Deleted draft video: ${this.draftVideoId}`);
        } else if (this.contentType === 'material' && this.draftMaterialId) {
            await MaterialDraft.findByIdAndDelete(this.draftMaterialId);
            console.log(`   ✅ Deleted draft material: ${this.draftMaterialId}`);
        } else if (this.contentType === 'quiz' && this.draftQuizId) {
            await QuizDraft.findByIdAndDelete(this.draftQuizId);
            console.log(`   ✅ Deleted draft quiz: ${this.draftQuizId}`);
        }
        
        next();
    } catch (error) {
        console.error('Error in lesson draft pre-delete hook:', error);
        next(error);
    }
});

const LessonDraft = mongoose.model('LessonDraft', lessonDraftSchema);

export default LessonDraft;
