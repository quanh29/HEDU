import mongoose from 'mongoose';

const sectionDraftSchema = new mongoose.Schema({
    // Link to published section (null if new section)
    publishedSectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        default: null
    },
    
    // Link to course draft
    courseDraftId: {
        type: String,
        ref: 'CourseDraft',
        required: true,
        index: true
    },
    
    // Course reference (same as published section)
    course_id: {
        type: String,
        required: true,
        ref: 'Course'
    },
    
    // Section data (mirrors Section model)
    title: {
        type: String,
        required: true,
    },
    order: {
        type: Number,
        default: 1,
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

// Index for efficient queries
sectionDraftSchema.index({ revisionId: 1, order: 1 });
sectionDraftSchema.index({ course_id: 1, revisionId: 1 });

// Pre-delete hook to cascade delete all draft lessons and their content
sectionDraftSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    try {
        console.log(`🗑️ Cascading delete for draft section: ${this._id}`);
        
        const LessonDraft = mongoose.model('LessonDraft');
        const VideoDraft = mongoose.model('VideoDraft');
        const MaterialDraft = mongoose.model('MaterialDraft');
        const QuizDraft = mongoose.model('QuizDraft');
        
        // Get all draft lessons in this section
        const draftLessons = await LessonDraft.find({ draftSectionId: this._id });
        console.log(`   Found ${draftLessons.length} draft lessons to delete`);
        
        // Delete each draft lesson's content first
        for (const lesson of draftLessons) {
            if (lesson.contentType === 'video' && lesson.draftVideoId) {
                await VideoDraft.findByIdAndDelete(lesson.draftVideoId);
                console.log(`   ✅ Deleted draft video: ${lesson.draftVideoId}`);
            } else if (lesson.contentType === 'material' && lesson.draftMaterialId) {
                await MaterialDraft.findByIdAndDelete(lesson.draftMaterialId);
                console.log(`   ✅ Deleted draft material: ${lesson.draftMaterialId}`);
            } else if (lesson.contentType === 'quiz' && lesson.draftQuizId) {
                await QuizDraft.findByIdAndDelete(lesson.draftQuizId);
                console.log(`   ✅ Deleted draft quiz: ${lesson.draftQuizId}`);
            }
        }
        
        // Delete all draft lessons
        await LessonDraft.deleteMany({ draftSectionId: this._id });
        console.log(`   ✅ Deleted ${draftLessons.length} draft lessons`);
        
        next();
    } catch (error) {
        console.error('Error in section draft pre-delete hook:', error);
        next(error);
    }
});

const SectionDraft = mongoose.model("SectionDraft", sectionDraftSchema);

export default SectionDraft;
