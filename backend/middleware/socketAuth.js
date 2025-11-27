import { verifyToken } from '@clerk/express';

/**
 * Socket.IO authentication middleware
 * Validates Clerk JWT token and attaches userId to socket
 * 
 * Usage:
 * io.use(socketAuth);
 */
export const socketAuth = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            const error = new Error('Authentication error: No token provided');
            error.data = { code: 'NO_TOKEN' };
            return next(error);
        }

        // Verify Clerk JWT token
        try {
            const payload = await verifyToken(token, {
                secretKey: process.env.CLERK_SECRET_KEY,
            });

            if (!payload || !payload.sub) {
                const error = new Error('Authentication error: Invalid token');
                error.data = { code: 'INVALID_TOKEN' };
                return next(error);
            }

            // Attach userId to socket for room management
            socket.userId = payload.sub;
            
            console.log(`✅ Socket authenticated - User: ${socket.userId}, Socket: ${socket.id}`);
            next();
        } catch (verifyError) {
            console.error('Token verification failed:', verifyError.message);
            const error = new Error('Authentication error: Token verification failed');
            error.data = { code: 'VERIFY_FAILED', details: verifyError.message };
            return next(error);
        }
    } catch (error) {
        console.error('Socket authentication error:', error);
        next(error);
    }
};

/**
 * Helper function to get user room name
 * Ensures consistent room naming across the application
 * 
 * @param {string} userId - Clerk user ID
 * @returns {string} - Room name (e.g., "user:usr_123abc")
 */
export const getUserRoom = (userId) => {
    return `user:${userId}`;
};

/**
 * Helper function to get notification room name
 * For future notification feature
 * 
 * @param {string} userId - Clerk user ID
 * @returns {string} - Room name (e.g., "notification:usr_123abc")
 */
export const getNotificationRoom = (userId) => {
    return `notification:${userId}`;
};

/**
 * Helper function to get chat room name
 * For future chat feature
 * 
 * @param {string} roomId - Chat room ID
 * @returns {string} - Room name (e.g., "chat:room_123")
 */
export const getChatRoom = (roomId) => {
    return `chat:${roomId}`;
};
