import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
    section: {
        type: String,
        ref: 'Section',
        required: false, // Optional for backward compatibility
    },
    lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: false, // Will be required for new structure
    },
    title: {
        type: String,
        required: true,
    },
    userId: {
        type: String, // Clerk user ID for socket room targeting
        required: true,
        index: true, // Index for efficient queries
    },
    uploadId: {
        type: String, // MUX upload ID
    },
    assetId: {
        type: String, // MUX asset ID
    },
    playbackId: {
        type: String, // MUX playback ID (dùng để phát video)
    },
    status: {
        type: String,
        enum: ['uploading', 'processing', 'ready', 'error', 'cancelled'],
        default: 'uploading'
    },
    duration: {
        type: Number, // Thời lượng video (giây)
    },
    description: {
        type: String,
    },
    order: {
        type: Number,
        default: 1,
    },
    aspectRatio: {
        type: String,
    },
    max_resolution: {
        type: String,
    },
}, {
    timestamps: true // Tự động tạo createdAt và updatedAt
});

const Video = mongoose.model("Video", videoSchema);

export default Video;
