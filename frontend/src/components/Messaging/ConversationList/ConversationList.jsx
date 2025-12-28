import React, { useState, useEffect } from 'react';
import { MessageCircle, Search, User } from 'lucide-react';
import styles from './ConversationList.module.css';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { useSocket } from '../../../context/SocketContext';
import { useNavigate } from 'react-router-dom';

const ConversationList = ({ selectedConversation, onSelectConversation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { getToken } = useAuth();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for new messages to refresh conversation list
    const handleNewMessage = (data) => {
      // Update conversation list to show new message and unread count
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv._id === data.conversationId) {
            return {
              ...conv,
              lastMessage: {
                content: data.message.content,
                createdAt: data.message.createdAt,
                sender_id: data.message.sender_id
              },
              unreadCount: data.message.sender_id !== conv.otherUser?.id 
                ? conv.unreadCount 
                : conv.unreadCount + 1,
              updatedAt: new Date()
            };
          }
          return conv;
        });
        // Sort by updated time
        return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    };

    // Listen for messages read to refresh conversation list
    const handleMessagesRead = (data) => {
      // Update conversation to mark as read
      setConversations(prev => 
        prev.map(conv => 
          conv._id === data.conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messagesRead', handleMessagesRead);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messagesRead', handleMessagesRead);
    };
  }, [socket, isConnected]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/message/conversations`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setConversations(response.data.conversations);
      }
      console.log(response.data.conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút`;
    if (diffHours < 24) return `${diffHours} giờ`;
    if (diffDays < 7) return `${diffDays} ngày`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className={styles.conversationList}>
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>
          <MessageCircle className={styles.headerIcon} size={24} />
          Tin nhắn
        </h2>
      </div>

      <div className={styles.searchWrapper}>
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm cuộc trò chuyện..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.conversationsWrapper}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className={styles.emptyState}>
            <MessageCircle className={styles.emptyIcon} />
            <p className={styles.emptyText}>
              {searchQuery ? 'Không tìm thấy cuộc trò chuyện' : 'Chưa có cuộc trò chuyện nào'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation._id}
              className={`${styles.conversationItem} ${
                selectedConversation?._id === conversation._id ? styles.active : ''
              }`}
            >
              <div 
                className={styles.conversationMain}
                onClick={() => onSelectConversation(conversation)}
              >
                <div className={styles.avatarWrapper}>
                  <img
                    src={conversation.otherUser?.image_url || '/default-avatar.png'}
                    alt={conversation.otherUser?.full_name || 'User'}
                    className={styles.avatar}
                  />
                  {conversation.unreadCount > 0 && (
                    <div className={styles.unreadBadge}>{conversation.unreadCount}</div>
                  )}
                </div>
                <div className={styles.conversationInfo}>
                  <div className={styles.conversationHeader}>
                    <span className={styles.userName}>
                      {conversation.otherUser?.name || 'Người dùng'}
                    </span>
                    {conversation.lastMessage && (
                      <span className={styles.timestamp}>
                        {formatTimestamp(conversation.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  {conversation.lastMessage && (
                    <p
                      className={`${styles.lastMessage} ${
                        conversation.unreadCount > 0 ? styles.unread : ''
                      }`}
                    >
                      {conversation.lastMessage.content}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;
