// Quick manual update test
// Chạy: node manual-update-video.js <videoId> <assetId> <playbackId>

import mongoose from 'mongoose';
import 'dotenv/config';
import Video from './models/video.js';

const [videoId, assetId, playbackId] = process.argv.slice(2);

if (!videoId) {
    console.error('❌ Usage: node manual-update-video.js <videoId> [assetId] [playbackId]');
    process.exit(1);
}

console.log('🔧 Manual Video Update Tool\n');
console.log('Target Video ID:', videoId);
if (assetId) console.log('Asset ID:', assetId);
if (playbackId) console.log('Playback ID:', playbackId);
console.log();

try {
    // Connect
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // Find video
    console.log('🔍 Finding video...');
    const video = await Video.findById(videoId);
    
    if (!video) {
        console.error(`❌ Video not found: ${videoId}`);
        process.exit(1);
    }

    console.log('✅ Current state:');
    console.log(`   Title: ${video.title}`);
    console.log(`   Status: ${video.status}`);
    console.log(`   AssetId: ${video.assetId || '(none)'}`);
    console.log(`   PlaybackId: ${video.playbackId || '(none)'}`);
    console.log(`   Duration: ${video.duration || '(none)'}`);
    console.log();

    // Update
    console.log('📝 Updating...');
    
    if (assetId) {
        video.assetId = assetId;
        console.log(`   ✓ Set assetId: ${assetId}`);
    }
    
    if (playbackId) {
        video.playbackId = playbackId;
        console.log(`   ✓ Set playbackId: ${playbackId}`);
    }
    
    video.status = 'ready';
    video.duration = video.duration || 60; // Default 60s if not set
    console.log(`   ✓ Set status: ready`);
    console.log(`   ✓ Set duration: ${video.duration}`);
    console.log();

    // Save
    console.log('💾 Saving...');
    await video.save();
    console.log('✅ Saved successfully!\n');

    // Verify
    const updated = await Video.findById(videoId);
    console.log('🔍 Verification:');
    console.log(`   Status: ${updated.status}`);
    console.log(`   AssetId: ${updated.assetId || '(none)'}`);
    console.log(`   PlaybackId: ${updated.playbackId || '(none)'}`);
    console.log(`   Duration: ${updated.duration}`);
    console.log(`   UpdatedAt: ${updated.updatedAt}`);
    console.log();

    console.log('🎉 Update completed!');

} catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
} finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
}
