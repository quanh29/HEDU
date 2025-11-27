import mongoose from "mongoose";

const quizDraftSchema = new mongoose.Schema({
    // Link to published quiz (null if new quiz)
    publishedQuizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
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
    
    // Quiz data (mirrors Quiz model)
    title: {
        type: String,
        required: true,
    },
    questions: [
        {
            questionText: {
                type: String,
                required: true
            },
            options: [],
            correctAnswers: [],
            explanation: {
                type: String,
                required: false
            }
        }
    ],
    order: {
        type: Number,
        default: 1,
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
});

// Indexes for efficient queries
quizDraftSchema.index({ courseDraftId: 1, draftLessonId: 1 });
quizDraftSchema.index({ publishedQuizId: 1 });

const QuizDraft = mongoose.model("QuizDraft", quizDraftSchema);

export default QuizDraft;
