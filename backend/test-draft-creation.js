/**
 * Test script to verify draft creation with video/quiz/material copies
 * Run: node test-draft-creation.js <courseId>
 */

import mongoose from 'mongoose';
import { getOrCreateDraft } from './utils/draftHelper.js';
import CourseDraft from './models/CourseDraft.js';
import VideoDraft from './models/VideoDraft.js';
import MaterialDraft from './models/MaterialDraft.js';
import QuizDraft from './models/QuizDraft.js';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://quanhoang291203:Quanhpro1@hedudb.6tqyl.mongodb.net/HEDU?retryWrites=true&w=majority&appName=HEDUDB';

async function testDraftCreation() {
    try {
        // Get courseId from command line
        const courseId = process.argv[2];
        if (!courseId) {
            console.log('Usage: node test-draft-creation.js <courseId>');
            process.exit(1);
        }

        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Delete existing draft first (for clean test)
        console.log('🗑️  Deleting existing draft...');
        await CourseDraft.findByIdAndDelete(courseId);
        await VideoDraft.deleteMany({ courseDraftId: courseId });
        await MaterialDraft.deleteMany({ courseDraftId: courseId });
        await QuizDraft.deleteMany({ courseDraftId: courseId });
        console.log('✅ Cleanup complete\n');

        // Create draft
        console.log('📝 Creating draft from published course...');
        const draft = await getOrCreateDraft(courseId, 'test-user-123');
        
        if (!draft) {
            console.error('❌ Failed to create draft');
            process.exit(1);
        }

        console.log('\n✅ Draft created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📋 Draft ID: ${draft._id}`);
        console.log(`📌 Status: ${draft.status}`);
        console.log(`📦 Sections: ${draft.draftSections.length}`);
        console.log(`📝 Lessons: ${draft.draftLessons.length}`);
        console.log(`🎥 Videos: ${draft.draftVideos.length}`);
        console.log(`📄 Materials: ${draft.draftMaterials.length}`);
        console.log(`📝 Quizzes: ${draft.draftQuizzes.length}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Verify video drafts
        const videoDrafts = await VideoDraft.find({ courseDraftId: courseId });
        console.log(`\n🎥 Video Drafts (${videoDrafts.length}):`);
        videoDrafts.forEach((v, i) => {
            console.log(`  ${i + 1}. ${v.title}`);
            console.log(`     Published ID: ${v.publishedVideoId}`);
            console.log(`     Status: ${v.status}`);
            console.log(`     Change Type: ${v.changeType}`);
        });

        // Verify material drafts
        const materialDrafts = await MaterialDraft.find({ courseDraftId: courseId });
        console.log(`\n📄 Material Drafts (${materialDrafts.length}):`);
        materialDrafts.forEach((m, i) => {
            console.log(`  ${i + 1}. ${m.title || m.originalFilename}`);
            console.log(`     Published ID: ${m.publishedMaterialId}`);
            console.log(`     Change Type: ${m.changeType}`);
        });

        // Verify quiz drafts
        const quizDrafts = await QuizDraft.find({ courseDraftId: courseId });
        console.log(`\n📝 Quiz Drafts (${quizDrafts.length}):`);
        quizDrafts.forEach((q, i) => {
            console.log(`  ${i + 1}. ${q.title}`);
            console.log(`     Published ID: ${q.publishedQuizId}`);
            console.log(`     Questions: ${q.questions.length}`);
            console.log(`     Change Type: ${q.changeType}`);
        });

        console.log('\n✅ Test completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

testDraftCreation();
