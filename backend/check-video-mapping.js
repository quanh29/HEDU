// Script để kiểm tra video-upload mapping
// Run: node check-video-mapping.js

import mongoose from 'mongoose';
import 'dotenv/config';
import Video from './models/video.js';

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

const checkMapping = async () => {
    console.log('🔍 Checking Video-Upload-Asset Mapping\n');
    console.log('═'.repeat(80));

    try {
        // Get all videos, sorted by creation time
        const videos = await Video.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('_id title uploadId assetId playbackId status createdAt updatedAt');

        console.log(`Found ${videos.length} recent videos:\n`);

        videos.forEach((video, index) => {
            console.log(`${index + 1}. Video: ${video._id}`);
            console.log(`   Title: ${video.title}`);
            console.log(`   Status: ${video.status}`);
            console.log(`   Created: ${video.createdAt}`);
            console.log(`   Updated: ${video.updatedAt}`);
            console.log(`   ─────────────────────────────────────────────────────`);
            console.log(`   Upload ID:   ${video.uploadId || '❌ MISSING'}`);
            console.log(`   Asset ID:    ${video.assetId || '❌ MISSING'}`);
            console.log(`   Playback ID: ${video.playbackId || '❌ MISSING'}`);
            
            // Status check
            const issues = [];
            if (!video.uploadId) issues.push('No uploadId');
            if (video.status === 'processing' && !video.assetId) issues.push('Processing but no assetId');
            if (video.status === 'ready' && !video.playbackId) issues.push('Ready but no playbackId');
            if (video.status === 'ready' && !video.assetId) issues.push('Ready but no assetId');
            
            if (issues.length > 0) {
                console.log(`   ⚠️  Issues: ${issues.join(', ')}`);
            } else if (video.status === 'ready') {
                console.log(`   ✅ Complete and ready`);
            } else if (video.status === 'processing') {
                console.log(`   ⏳ Processing...`);
            } else if (video.status === 'uploading') {
                console.log(`   📤 Uploading...`);
            }
            
            console.log();
        });

        // Statistics
        console.log('═'.repeat(80));
        console.log('\n📊 Statistics:\n');

        const stats = {
            total: videos.length,
            byStatus: {},
            withUploadId: 0,
            withAssetId: 0,
            withPlaybackId: 0,
            complete: 0,
            stuck: 0
        };

        videos.forEach(v => {
            // Count by status
            stats.byStatus[v.status] = (stats.byStatus[v.status] || 0) + 1;
            
            // Count fields
            if (v.uploadId) stats.withUploadId++;
            if (v.assetId) stats.withAssetId++;
            if (v.playbackId) stats.withPlaybackId++;
            
            // Complete check
            if (v.status === 'ready' && v.uploadId && v.assetId && v.playbackId) {
                stats.complete++;
            }
            
            // Stuck check
            if (v.status === 'uploading' && !v.assetId) {
                const hoursSinceCreation = (Date.now() - v.createdAt) / (1000 * 60 * 60);
                if (hoursSinceCreation > 1) {
                    stats.stuck++;
                }
            }
        });

        console.log(`Total videos: ${stats.total}`);
        console.log(`\nBy Status:`);
        Object.entries(stats.byStatus).forEach(([status, count]) => {
            console.log(`  ${status}: ${count}`);
        });
        console.log(`\nField Coverage:`);
        console.log(`  With Upload ID: ${stats.withUploadId}/${stats.total}`);
        console.log(`  With Asset ID: ${stats.withAssetId}/${stats.total}`);
        console.log(`  With Playback ID: ${stats.withPlaybackId}/${stats.total}`);
        console.log(`\nHealth:`);
        console.log(`  Complete (ready with all IDs): ${stats.complete}`);
        console.log(`  Stuck (uploading >1hr, no asset): ${stats.stuck}`);

        // Find duplicates
        console.log('\n═'.repeat(80));
        console.log('\n🔍 Checking for duplicate Upload IDs...\n');

        const uploadIds = videos.map(v => v.uploadId).filter(id => id);
        const duplicates = uploadIds.filter((id, index) => uploadIds.indexOf(id) !== index);

        if (duplicates.length > 0) {
            console.log('⚠️  Duplicate Upload IDs found:');
            duplicates.forEach(uploadId => {
                const vids = videos.filter(v => v.uploadId === uploadId);
                console.log(`  Upload ID: ${uploadId}`);
                vids.forEach(v => {
                    console.log(`    - Video ${v._id}: ${v.title} (${v.status})`);
                });
            });
        } else {
            console.log('✅ No duplicate Upload IDs found');
        }

        // Find potential orphans
        console.log('\n═'.repeat(80));
        console.log('\n🔍 Checking for potential orphans...\n');

        const orphans = videos.filter(v => 
            !v.uploadId || 
            (v.status === 'processing' && !v.assetId) ||
            (v.status === 'ready' && (!v.assetId || !v.playbackId))
        );

        if (orphans.length > 0) {
            console.log(`⚠️  Found ${orphans.length} potential orphan(s):\n`);
            orphans.forEach(v => {
                console.log(`  ${v._id}: ${v.title}`);
                console.log(`    Status: ${v.status}`);
                console.log(`    Upload ID: ${v.uploadId || '❌ MISSING'}`);
                console.log(`    Asset ID: ${v.assetId || '❌ MISSING'}`);
                console.log(`    Created: ${v.createdAt}`);
                console.log();
            });
        } else {
            console.log('✅ No orphans found');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
};

// Run
await connectDB();
await checkMapping();
await mongoose.disconnect();
console.log('\n✅ Disconnected from MongoDB');
