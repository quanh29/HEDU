import Conversation from '../models/Conversation.js';

/**
 * Setup message socket handlers
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Server} io - Socket.IO server instance
 */
export const setupMessageSocketHandlers = (socket, io) => {
  console.log(`📨 [Message Socket] Setting up handlers for user: ${socket.userId}`);

  /**
   * Join conversation room
   * Client emits: { conversationId }
   */
  socket.on('joinConversation', async (data) => {
    try {
      const { conversationId } = data;
      const userId = socket.userId;

      // Verify user is part of conversation
      const conversation = await Conversation.findOne({
        _id: conversationId,
        'participants.user_id': userId
      });

      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found or access denied' });
        return;
      }

      // Join the conversation room
      socket.join(`conversation:${conversationId}`);
      console.log(`✅ [Message Socket] User ${userId} joined conversation ${conversationId}`);

      socket.emit('conversationJoined', { conversationId });
    } catch (error) {
      console.error('❌ [Message Socket] Error joining conversation:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });

  /**
   * Leave conversation room
   * Client emits: { conversationId }
   */
  socket.on('leaveConversation', (data) => {
    try {
      const { conversationId } = data;
      const userId = socket.userId;

      socket.leave(`conversation:${conversationId}`);
      console.log(`👋 [Message Socket] User ${userId} left conversation ${conversationId}`);

      socket.emit('conversationLeft', { conversationId });
    } catch (error) {
      console.error('❌ [Message Socket] Error leaving conversation:', error);
    }
  });

  /**
   * Send message (real-time)
   * Client emits: { conversationId, message }
   */
  socket.on('sendMessage', async (data) => {
    try {
      const { conversationId, message } = data;
      const userId = socket.userId;

      // Verify user is part of conversation
      const conversation = await Conversation.findOne({
        _id: conversationId,
        'participants.user_id': userId
      });

      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found or access denied' });
        return;
      }

      // Broadcast message to all users in the conversation room
      io.to(`conversation:${conversationId}`).emit('newMessage', {
        conversationId,
        message
      });

      console.log(`📤 [Message Socket] Message sent in conversation ${conversationId}`);
    } catch (error) {
      console.error('❌ [Message Socket] Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  /**
   * Typing indicator
   * Client emits: { conversationId, isTyping }
   */
  socket.on('typing', async (data) => {
    try {
      const { conversationId, isTyping } = data;
      const userId = socket.userId;

      // Verify user is part of conversation
      const conversation = await Conversation.findOne({
        _id: conversationId,
        'participants.user_id': userId
      });

      if (!conversation) {
        return;
      }

      // Broadcast typing status to other users in the conversation
      socket.to(`conversation:${conversationId}`).emit('userTyping', {
        conversationId,
        userId,
        isTyping
      });
    } catch (error) {
      console.error('❌ [Message Socket] Error handling typing:', error);
    }
  });

  /**
   * Message read notification
   * Client emits: { conversationId, messageIds }
   */
  socket.on('markAsRead', async (data) => {
    try {
      const { conversationId, messageIds } = data;
      const userId = socket.userId;

      // Broadcast read status to other users in the conversation
      socket.to(`conversation:${conversationId}`).emit('messagesRead', {
        conversationId,
        messageIds,
        readBy: userId
      });

      console.log(`✅ [Message Socket] Messages marked as read in conversation ${conversationId}`);
    } catch (error) {
      console.error('❌ [Message Socket] Error marking as read:', error);
    }
  });

  /**
   * Handle disconnect
   */
  socket.on('disconnect', () => {
    console.log(`🔌 [Message Socket] User ${socket.userId} disconnected from messaging`);
  });
};
