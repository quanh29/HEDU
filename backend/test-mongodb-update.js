// Test MongoDB update operation
// Run: node test-mongodb-update.js <videoId>

import mongoose from 'mongoose';
import 'dotenv/config';
import Video from './models/video.js';

const videoId = process.argv[2];

if (!videoId) {
    console.error('❌ Please provide videoId as argument');
    console.log('Usage: node test-mongodb-update.js <videoId>');
    process.exit(1);
}

const connectDB = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        console.log(`   URI: ${process.env.MONGODB_URI?.substring(0, 30)}...`);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

const testUpdate = async () => {
    console.log(`🧪 Testing update for video: ${videoId}\n`);
    console.log('─'.repeat(60));

    try {
        // 1. Find video
        console.log('1️⃣ Finding video...');
        const video = await Video.findById(videoId);
        
        if (!video) {
            console.error(`❌ Video not found: ${videoId}`);
            return;
        }

        console.log('✅ Video found:');
        console.log(`   Title: ${video.title}`);
        console.log(`   Status: ${video.status}`);
        console.log(`   AssetId: ${video.assetId || '(empty)'}`);
        console.log(`   PlaybackId: ${video.playbackId || '(empty)'}`);
        console.log(`   Duration: ${video.duration || '(empty)'}`);
        console.log(`   UpdatedAt: ${video.updatedAt}`);
        console.log();

        // 2. Update fields
        console.log('2️⃣ Updating fields...');
        const oldStatus = video.status;
        const oldPlaybackId = video.playbackId;
        
        video.status = 'ready';
        video.playbackId = 'TEST_PLAYBACK_ID_' + Date.now();
        video.duration = 123.45;
        
        console.log(`   status: ${oldStatus} → ${video.status}`);
        console.log(`   playbackId: ${oldPlaybackId || '(empty)'} → ${video.playbackId}`);
        console.log(`   duration: → ${video.duration}`);
        console.log();

        // 3. Save
        console.log('3️⃣ Saving to database...');
        const savedVideo = await video.save();
        console.log('✅ Save completed');
        console.log(`   Modified fields: ${JSON.stringify(savedVideo.modifiedPaths())}`);
        console.log();

        // 4. Verify by querying again
        console.log('4️⃣ Verifying by re-querying...');
        const verifyVideo = await Video.findById(videoId);
        console.log('✅ Verification result:');
        console.log(`   Status: ${verifyVideo.status}`);
        console.log(`   PlaybackId: ${verifyVideo.playbackId}`);
        console.log(`   Duration: ${verifyVideo.duration}`);
        console.log(`   UpdatedAt: ${verifyVideo.updatedAt}`);
        console.log();

        // 5. Check if values match
        console.log('5️⃣ Validation:');
        const statusMatch = verifyVideo.status === 'ready';
        const playbackMatch = verifyVideo.playbackId === video.playbackId;
        const durationMatch = verifyVideo.duration === 123.45;

        console.log(`   Status match: ${statusMatch ? '✅' : '❌'}`);
        console.log(`   PlaybackId match: ${playbackMatch ? '✅' : '❌'}`);
        console.log(`   Duration match: ${durationMatch ? '✅' : '❌'}`);
        console.log();

        if (statusMatch && playbackMatch && durationMatch) {
            console.log('🎉 All updates successful!');
        } else {
            console.log('⚠️ Some updates failed!');
        }

        // 6. Restore original values
        console.log('\n6️⃣ Restoring original values...');
        verifyVideo.status = oldStatus;
        verifyVideo.playbackId = oldPlaybackId;
        verifyVideo.duration = null;
        await verifyVideo.save();
        console.log('✅ Original values restored');

    } catch (error) {
        console.error('❌ Error during test:', error);
        console.error('Stack:', error.stack);
    }
};

// Run test
await connectDB();
await testUpdate();
await mongoose.disconnect();
console.log('\n✅ Disconnected from MongoDB');
