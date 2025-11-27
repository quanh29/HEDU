import mongoose from 'mongoose';

/**
 * Lesson Model
 * Represents a single lesson within a section
 * Acts as a container for one content item (Video, Material, or Quiz)
 * 
 * Structure: Course → Section → Lesson → Content (Video/Material/Quiz)
 */
const lessonSchema = new mongoose.Schema({
    section: {
        type: String,
        ref: 'Section',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    contentType: {
        type: String,
        enum: ['video', 'material', 'quiz'],
        required: true
    },
    // Reference to the actual content (only one will be populated based on contentType)
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
        default: null
    },
    material: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material',
        default: null
    },
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        default: null
    },
    order: {
        type: Number,
        required: true,
        default: 0
    },
    description: {
        type: String,
        default: ''
    },
    // Duration in seconds (for videos, calculated automatically)
    duration: {
        type: Number,
        default: 0
    },
    // Free preview flag
    isFreePreview: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient querying
lessonSchema.index({ section: 1, order: 1 });
lessonSchema.index({ contentType: 1 });

// Virtual to get content based on contentType
lessonSchema.virtual('content').get(function() {
    switch (this.contentType) {
        case 'video':
            return this.video;
        case 'material':
            return this.material;
        case 'quiz':
            return this.quiz;
        default:
            return null;
    }
});

// Method to populate content based on contentType
lessonSchema.methods.populateContent = async function() {
    const populateField = this.contentType;
    if (populateField && this[populateField]) {
        await this.populate(populateField);
    }
    return this;
};

// Static method to get lessons for a section with content populated
lessonSchema.statics.getLessonsForSection = async function(sectionId) {
    const lessons = await this.find({ section: sectionId })
        .sort({ order: 1 })
        .populate('video')
        .populate('material')
        .populate('quiz')
        .lean();
    
    return lessons;
};

// Pre-delete hook to cascade delete content
lessonSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    try {
        console.log(`🗑️ Cascading delete for lesson: ${this._id}, type: ${this.contentType}`);
        
        // Delete the associated content based on contentType
        if (this.contentType === 'video' && this.video) {
            const Video = mongoose.model('Video');
            await Video.findByIdAndDelete(this.video);
            console.log(`   ✅ Deleted video: ${this.video}`);
        } else if (this.contentType === 'material' && this.material) {
            const Material = mongoose.model('Material');
            await Material.findByIdAndDelete(this.material);
            console.log(`   ✅ Deleted material: ${this.material}`);
        } else if (this.contentType === 'quiz' && this.quiz) {
            const Quiz = mongoose.model('Quiz');
            await Quiz.findByIdAndDelete(this.quiz);
            console.log(`   ✅ Deleted quiz: ${this.quiz}`);
        }
        
        next();
    } catch (error) {
        console.error('Error in lesson pre-delete hook:', error);
        next(error);
    }
});

// Ensure virtuals are included in JSON output
lessonSchema.set('toJSON', { virtuals: true });
lessonSchema.set('toObject', { virtuals: true });

const Lesson = mongoose.model('Lesson', lessonSchema);

export default Lesson;
