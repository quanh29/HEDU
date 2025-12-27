import Message from '../models/Message.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import { clerkClient } from '@clerk/express';
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';
import { io } from '../server.js';

/**
 * Helper function to upload buffer to Cloudinary (private)
 */
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    const readable = Readable.from(buffer);
    readable.pipe(uploadStream);
  });
};

/**
 * Get or create conversation between two users
 * POST /api/message/conversation
 */
export const getOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req;
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ message: 'otherUserId is required' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      'participants.user_id': { $all: [userId, otherUserId] },
      'participants': { $size: 2 }
    });

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [
          { user_id: userId },
          { user_id: otherUserId }
        ]
      });
      await conversation.save();
    }

    res.status(200).json({ 
      success: true,
      conversationId: conversation._id 
    });
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    res.status(500).json({ message: 'Failed to get/create conversation' });
  }
};

/**
 * Get all conversations for current user
 * GET /api/message/conversations
 */
export const getConversations = async (req, res) => {
  try {
    const { userId } = req;

    const conversations = await Conversation.find({
      'participants.user_id': userId
    }).sort({ updatedAt: -1 });

    // Get last message and unread count for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipant = conv.participants.find(p => p.user_id !== userId);
        
        // Get other user info from User model from mongodb
        const otherUser = await User.findOne({ _id: otherParticipant.user_id }).lean();
        
        // Get last message
        const lastMessage = await Message.findOne({ 
          conversation_id: conv._id 
        }).sort({ createdAt: -1 });

        // Get unread count
        const unreadCount = await Message.countDocuments({
          conversation_id: conv._id,
          sender_id: { $ne: userId },
          is_read: false
        });

        return {
          _id: conv._id,
          otherUser: {
            id: otherUser?.id,
            name: otherUser?.full_name || 'User',
            image_url: otherUser?.profile_image_url
          },
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            sender_id: lastMessage.sender_id
          } : null,
          unreadCount,
          updatedAt: conv.updatedAt
        };
      })
    );

    res.status(200).json({ 
      success: true,
      conversations: conversationsWithDetails 
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ message: 'Failed to get conversations' });
  }
};

/**
 * Get messages for a conversation
 * GET /api/message/conversation/:conversationId
 * Query params: limit (default 20), before (ISO date for pagination)
 */
export const getMessages = async (req, res) => {
  try {
    const { userId } = req;
    const { conversationId } = req.params;
    const { limit = 20, before } = req.query;

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user_id': userId
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Build query
    const query = { conversation_id: conversationId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Get sender info for each message
    const messagesWithSender = await Promise.all(
      messages.map(async (msg) => {
        let sender = null;
        try {
          sender = await clerkClient.users.getUser(msg.sender_id);
        } catch (error) {
          console.error(`Error fetching sender ${msg.sender_id}:`, error);
        }
        return {
          _id: msg._id,
          content: msg.content,
          img_url: msg.img_url,
          sender_id: msg.sender_id,
          sender: {
            name: sender?.fullName || sender?.firstName || 'User',
            image_url: sender?.imageUrl
          },
          is_read: msg.is_read,
          createdAt: msg.createdAt
        };
      })
    );

    // Check if there are more messages
    const hasMore = messages.length === parseInt(limit);

    res.status(200).json({ 
      success: true,
      messages: messagesWithSender.reverse(),
      hasMore
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: 'Failed to get messages' });
  }
};

/**
 * Send message (with optional image)
 * POST /api/message/send
 */
export const sendMessage = async (req, res) => {
  try {
    const { userId } = req;
    const { conversationId, content } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({ message: 'conversationId and content are required' });
    }

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user_id': userId
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    let imgUrl = null;

    // Handle image upload if present
    if (req.file) {
      console.log('📤 Uploading message image to Cloudinary...');
      const uploadOptions = {
        folder: 'messages',
        resource_type: 'image',
        type: 'private',
        use_filename: true,
        unique_filename: true
      };

      const result = await uploadToCloudinary(req.file.buffer, uploadOptions);
      imgUrl = result.public_id; // Store public_id to generate signed URLs later
      console.log('✅ Image uploaded:', result.public_id);
    }

    // Create message
    const message = new Message({
      conversation_id: conversationId,
      sender_id: userId,
      content,
      img_url: imgUrl,
      is_read: false
    });

    await message.save();

    // Update conversation timestamp
    conversation.updatedAt = new Date();
    await conversation.save();

    // Get sender info from Clerk
    let sender = null;
    try {
      sender = await clerkClient.users.getUser(userId);
    } catch (error) {
      console.error(`Error fetching sender ${userId}:`, error);
    }

    // Emit socket event (will be handled in socket handler)
    const messageData = {
      _id: message._id,
      conversation_id: conversationId,
      content: message.content,
      img_url: message.img_url,
      sender_id: message.sender_id,
      sender: {
        name: sender?.fullName || sender?.firstName || 'User',
        image_url: sender?.imageUrl
      },
      is_read: message.is_read,
      createdAt: message.createdAt
    };

    // Update unread count for other participants
    if (io) {
      const otherParticipant = conversation.participants.find(p => p.user_id !== userId);
      if (otherParticipant) {
        // Get all conversations for the other user
        const userConversations = await Conversation.find({
          'participants.user_id': otherParticipant.user_id
        });
        
        const conversationIds = userConversations.map(c => c._id);
        
        // Count unread messages
        const unreadCount = await Message.countDocuments({
          conversation_id: { $in: conversationIds },
          sender_id: { $ne: otherParticipant.user_id },
          is_read: false
        });
        
        // Emit to other user's socket
        io.emit(`unreadCountUpdate:${otherParticipant.user_id}`, { unreadCount });
      }
    }

    res.status(201).json({ 
      success: true,
      message: messageData 
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

/**
 * Mark messages as read
 * PUT /api/message/read/:conversationId
 */
export const markAsRead = async (req, res) => {
  try {
    const { userId } = req;
    const { conversationId } = req.params;

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user_id': userId
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Mark all messages from other users as read
    const result = await Message.updateMany(
      {
        conversation_id: conversationId,
        sender_id: { $ne: userId },
        is_read: false
      },
      {
        is_read: true
      }
    );

    // Emit socket event to all participants to update unread count
    if (io && result.modifiedCount > 0) {
      // Get all participants
      const participants = conversation.participants;
      
      // Emit to each participant to recalculate their unread count
      for (const participant of participants) {
        // Get all conversations for this user
        const userConversations = await Conversation.find({
          'participants.user_id': participant.user_id
        });
        
        const conversationIds = userConversations.map(c => c._id);
        
        // Count unread messages
        const unreadCount = await Message.countDocuments({
          conversation_id: { $in: conversationIds },
          sender_id: { $ne: participant.user_id },
          is_read: false
        });
        
        // Emit to user's socket
        io.emit(`unreadCountUpdate:${participant.user_id}`, { unreadCount });
      }
    }

    res.status(200).json({ 
      success: true,
      message: 'Messages marked as read' 
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
};

/**
 * Get total unread message count
 * GET /api/message/unread-count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req;

    // Get all conversations for user
    const conversations = await Conversation.find({
      'participants.user_id': userId
    });

    const conversationIds = conversations.map(c => c._id);

    // Count all unread messages
    const unreadCount = await Message.countDocuments({
      conversation_id: { $in: conversationIds },
      sender_id: { $ne: userId },
      is_read: false
    });

    res.status(200).json({ 
      success: true,
      unreadCount 
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
};

/**
 * Generate signed URL for private image
 * POST /api/message/image-url
 */
export const getImageUrl = async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({ message: 'publicId is required' });
    }

    const expiresIn = 3600; // 1 hour
    const timestamp = Math.floor(Date.now() / 1000) + expiresIn;

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        public_id: publicId,
        type: 'private'
      },
      process.env.CLOUDINARY_API_SECRET
    );

    const signedUrl = cloudinary.url(publicId, {
      type: 'private',
      sign_url: true,
      secure: true,
      resource_type: 'image'
    });

    res.status(200).json({
      success: true,
      url: signedUrl,
      expiresAt: new Date(timestamp * 1000)
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ message: 'Failed to generate signed URL' });
  }
};
