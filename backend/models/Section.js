import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
    course_id: {
        type: String,
        required: true,
        ref: 'Course' // Reference to MySQL course_id
    },
    title: {
        type: String,
        required: true,
    },
    order: {
        type: Number,
        default: 1,
    }
}, { 
    timestamps: true 
});

// Pre-delete hook to cascade delete all lessons and their content
sectionSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    try {
        console.log(`🗑️ Cascading delete for section: ${this._id}`);
        
        // Import Lesson model to avoid circular dependency
        const Lesson = mongoose.model('Lesson');
        const Video = mongoose.model('Video');
        const Material = mongoose.model('Material');
        const Quiz = mongoose.model('Quiz');
        
        // Get all lessons in this section
        const lessons = await Lesson.find({ section: this._id });
        console.log(`   Found ${lessons.length} lessons to delete`);
        
        // Delete each lesson's content first
        for (const lesson of lessons) {
            if (lesson.contentType === 'video' && lesson.video) {
                await Video.findByIdAndDelete(lesson.video);
                console.log(`   ✅ Deleted video: ${lesson.video}`);
            } else if (lesson.contentType === 'material' && lesson.material) {
                await Material.findByIdAndDelete(lesson.material);
                console.log(`   ✅ Deleted material: ${lesson.material}`);
            } else if (lesson.contentType === 'quiz' && lesson.quiz) {
                await Quiz.findByIdAndDelete(lesson.quiz);
                console.log(`   ✅ Deleted quiz: ${lesson.quiz}`);
            }
        }
        
        // Delete all lessons
        await Lesson.deleteMany({ section: this._id });
        console.log(`   ✅ Deleted ${lessons.length} lessons`);
        
        // Also delete any orphaned content that still references this section (backward compatibility)
        const deletedVideos = await Video.deleteMany({ section: this._id });
        const deletedMaterials = await Material.deleteMany({ section: this._id });
        const deletedQuizzes = await Quiz.deleteMany({ section: this._id });
        
        if (deletedVideos.deletedCount > 0) {
            console.log(`   ✅ Deleted ${deletedVideos.deletedCount} orphaned videos`);
        }
        if (deletedMaterials.deletedCount > 0) {
            console.log(`   ✅ Deleted ${deletedMaterials.deletedCount} orphaned materials`);
        }
        if (deletedQuizzes.deletedCount > 0) {
            console.log(`   ✅ Deleted ${deletedQuizzes.deletedCount} orphaned quizzes`);
        }
        
        next();
    } catch (error) {
        console.error('Error in section pre-delete hook:', error);
        next(error);
    }
});

const Section = mongoose.model("Section", sectionSchema);

export default Section;
