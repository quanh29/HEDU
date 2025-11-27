import { getUserRoom } from '../middleware/socketAuth.js';

/**
 * Video upload socket event handlers
 * Manages real-time video upload status updates
 * 
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Server} io - Socket.IO server instance
 */
export const setupVideoSocketHandlers = (socket, io) => {
    console.log(`📹 Video socket handlers registered for user: ${socket.userId}`);

    // Join user-specific room for targeted broadcasts
    const userRoom = getUserRoom(socket.userId);
    socket.join(userRoom);
    console.log(`✅ Socket ${socket.id} joined room: ${userRoom}`);

    // Handle client requesting to track a specific video
    socket.on('trackVideo', (data) => {
        const { videoId } = data;
        console.log(`📊 User ${socket.userId} tracking video: ${videoId}`);
        
        // Join video-specific room for granular updates (optional)
        socket.join(`video:${videoId}`);
        
        // Acknowledge tracking
        socket.emit('trackingVideo', { videoId, status: 'tracking' });
    });

    // Handle client stopping video tracking
    socket.on('untrackVideo', (data) => {
        const { videoId } = data;
        console.log(`🛑 User ${socket.userId} stopped tracking video: ${videoId}`);
        
        // Leave video-specific room
        socket.leave(`video:${videoId}`);
        
        // Acknowledge untracking
        socket.emit('untrackingVideo', { videoId, status: 'untracked' });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
        console.log(`❌ User ${socket.userId} disconnected - Socket: ${socket.id}, Reason: ${reason}`);
    });
};

/**
 * Emit video status update to specific user
 * Called from MUX webhook handlers after database update
 * 
 * @param {Server} io - Socket.IO server instance
 * @param {string} userId - Clerk user ID
 * @param {Object} data - Video status data
 * @param {string} data.videoId - MongoDB video document ID
 * @param {string} data.status - Video status (uploading, processing, ready, error, cancelled)
 * @param {string} [data.assetId] - MUX asset ID
 * @param {string} [data.playbackId] - MUX playback ID (for streaming)
 * @param {number} [data.duration] - Video duration in seconds
 * @param {string} [data.contentUrl] - Direct streaming URL
 * @param {string} [data.error] - Error message if status is 'error'
 */
export const emitVideoStatusUpdate = (io, userId, data) => {
    const userRoom = getUserRoom(userId);
    
    console.log(`📡 Emitting video status update to room: ${userRoom}`);
    console.log(`   Video ID: ${data.videoId}`);
    console.log(`   Status: ${data.status}`);
    console.log(`   Asset ID: ${data.assetId || '(empty)'}`);
    console.log(`   Playback ID: ${data.playbackId || '(empty)'}`);
    console.log(`   User ID: ${userId}`);
    
    // Check if there are any clients in the room
    const socketsInRoom = io.sockets.adapter.rooms.get(userRoom);
    console.log(`   Sockets in room ${userRoom}:`, socketsInRoom ? Array.from(socketsInRoom) : 'None');
    console.log(`   Total connected sockets:`, io.sockets.sockets.size);
    
    // Emit to user's room
    io.to(userRoom).emit('videoStatusUpdate', {
        videoId: data.videoId,
        status: data.status,
        assetId: data.assetId || '',
        playbackId: data.playbackId || '',
        duration: data.duration || 0,
        contentUrl: data.contentUrl || '',
        error: data.error || null,
        timestamp: new Date().toISOString(),
    });

    // Also emit to video-specific room if needed (for granular tracking)
    if (data.videoId) {
        io.to(`video:${data.videoId}`).emit('videoStatusUpdate', {
            videoId: data.videoId,
            status: data.status,
            assetId: data.assetId || '',
            playbackId: data.playbackId || '',
            duration: data.duration || 0,
            contentUrl: data.contentUrl || '',
            error: data.error || null,
            timestamp: new Date().toISOString(),
        });
    }

    console.log(`✅ Video status update emitted successfully`);
};

/**
 * Emit video upload progress to specific user
 * Can be called during upload process if needed
 * 
 * @param {Server} io - Socket.IO server instance
 * @param {string} userId - Clerk user ID
 * @param {Object} data - Upload progress data
 * @param {string} data.videoId - MongoDB video document ID
 * @param {number} data.progress - Upload progress (0-100)
 * @param {number} [data.uploadedBytes] - Bytes uploaded
 * @param {number} [data.totalBytes] - Total bytes
 */
export const emitVideoUploadProgress = (io, userId, data) => {
    const userRoom = getUserRoom(userId);
    
    io.to(userRoom).emit('videoUploadProgress', {
        videoId: data.videoId,
        progress: data.progress,
        uploadedBytes: data.uploadedBytes || 0,
        totalBytes: data.totalBytes || 0,
        timestamp: new Date().toISOString(),
    });
};

/**
 * Emit generic error to user
 * 
 * @param {Server} io - Socket.IO server instance
 * @param {string} userId - Clerk user ID
 * @param {Object} data - Error data
 * @param {string} data.message - Error message
 * @param {string} [data.code] - Error code
 * @param {*} [data.details] - Additional error details
 */
export const emitVideoError = (io, userId, data) => {
    const userRoom = getUserRoom(userId);
    
    console.error(`❌ Emitting video error to room: ${userRoom}`);
    console.error(`   Message: ${data.message}`);
    
    io.to(userRoom).emit('videoError', {
        message: data.message,
        code: data.code || 'UNKNOWN_ERROR',
        details: data.details || null,
        timestamp: new Date().toISOString(),
    });
};
