import React, { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, MessageSquare, X } from 'lucide-react';
import styles from './ChatWindow.module.css';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-react';

const ChatWindow = ({ conversation, socket }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [imageModal, setImageModal] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesWrapperRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const previousMessagesLengthRef = useRef(0);
  const previousScrollHeightRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const { getToken } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (conversation) {
      // Reset messages when switching conversation
      setMessages([]);
      setHasMore(true);
      previousMessagesLengthRef.current = 0;
      isInitialLoadRef.current = true;
      fetchMessages();
      joinConversation();
      markAsRead();
    }

    return () => {
      if (conversation && socket) {
        socket.emit('leaveConversation', { conversationId: conversation._id });
      }
    };
  }, [conversation]);

  useEffect(() => {
    const messagesWrapper = messagesWrapperRef.current;
    if (!messagesWrapper || isInitialLoadRef.current || loading) return;

    const handleScroll = () => {
      // Don't load more if already loading or no more messages
      if (loadingMore || !hasMore) return;
      
      if (messagesWrapper.scrollTop < 100) {
        loadMoreMessages();
      }
    };

    messagesWrapper.addEventListener('scroll', handleScroll);
    return () => messagesWrapper.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, messages, loading, isInitialLoadRef.current]);

  useEffect(() => {
    // Only scroll when new message is added (not when loading initial messages)
    if (messages.length > previousMessagesLengthRef.current && previousMessagesLengthRef.current > 0) {
      scrollToBottom();
    }
    previousMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  useEffect(() => {
    if (!socket || !conversation) return;

    // Listen for new messages
    socket.on('newMessage', handleNewMessage);

    // Listen for typing indicator
    socket.on('userTyping', handleUserTyping);

    // Listen for messages read
    socket.on('messagesRead', handleMessagesRead);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('userTyping', handleUserTyping);
      socket.off('messagesRead', handleMessagesRead);
    };
  }, [socket, conversation, messages]);

  const joinConversation = () => {
    if (socket && conversation) {
      socket.emit('joinConversation', { conversationId: conversation._id });
    }
  };

  const fetchMessages = async (before = null) => {
    try {
      if (before) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const token = await getToken();
      const url = new URL(
        `${import.meta.env.VITE_BASE_URL}/api/message/conversation/${conversation._id}`
      );
      url.searchParams.append('limit', '20');
      if (before) {
        url.searchParams.append('before', before);
      }

      const response = await axios.get(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        if (before) {
          // Prepend older messages
          setMessages((prev) => [...response.data.messages, ...prev]);
          setHasMore(response.data.hasMore);
        } else {
          // Initial load
          setMessages(response.data.messages);
          setHasMore(response.data.hasMore);
          // Scroll to bottom after loading messages
          setTimeout(() => {
            scrollToBottom();
            // Mark initial load as complete after scrolling
            setTimeout(() => {
              isInitialLoadRef.current = false;
            }, 100);
          }, 50);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreMessages = async () => {
    if (messages.length === 0 || loadingMore || !hasMore) return;

    // Store current scroll height before loading
    if (messagesWrapperRef.current) {
      previousScrollHeightRef.current = messagesWrapperRef.current.scrollHeight;
    }

    const oldestMessage = messages[0];
    await fetchMessages(oldestMessage.createdAt);

    // Maintain scroll position after loading
    setTimeout(() => {
      if (messagesWrapperRef.current) {
        const newScrollHeight = messagesWrapperRef.current.scrollHeight;
        const scrollDifference = newScrollHeight - previousScrollHeightRef.current;
        messagesWrapperRef.current.scrollTop = scrollDifference;
      }
    }, 50);
  };

  const markAsRead = async () => {
    try {
      const token = await getToken();
      await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/message/read/${conversation._id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleNewMessage = (data) => {
    if (data.conversationId === conversation._id) {
      setMessages((prev) => [...prev, data.message]);
      markAsRead();
    }
  };

  const handleUserTyping = (data) => {
    if (data.conversationId === conversation._id && data.userId !== user.id) {
      setTyping(data.isTyping);
    }
  };

  const handleMessagesRead = (data) => {
    if (data.conversationId === conversation._id) {
      setMessages((prev) =>
        prev.map((msg) =>
          data.messageIds.includes(msg._id) ? { ...msg, is_read: true } : msg
        )
      );
    }
  };

  const scrollToBottom = () => {
    if (messagesWrapperRef.current) {
      messagesWrapperRef.current.scrollTop = messagesWrapperRef.current.scrollHeight;
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Kích thước ảnh không được vượt quá 10MB');
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTyping = () => {
    if (socket && conversation) {
      socket.emit('typing', { conversationId: conversation._id, isTyping: true });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { conversationId: conversation._id, isTyping: false });
      }, 2000);
    }
  };

  const handleSendMessage = async () => {
    if ((!messageText.trim() && !selectedImage) || sending) return;

    try {
      setSending(true);
      const token = await getToken();
      const formData = new FormData();
      formData.append('conversationId', conversation._id);
      formData.append('content', messageText.trim());

      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/message/send`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        // Emit to socket for real-time update
        socket.emit('sendMessage', {
          conversationId: conversation._id,
          message: response.data.message
        });

        setMessageText('');
        removeImage();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getImageUrl = async (publicId) => {
    try {
      const token = await getToken();
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/message/image-url`,
        { publicId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        return response.data.url;
      }
    } catch (error) {
      console.error('Error getting image URL:', error);
    }
    return null;
  };

  const [imageUrls, setImageUrls] = useState({});

  useEffect(() => {
    // Fetch image URLs for all messages with images
    const fetchImageUrls = async () => {
      const urls = {};
      for (const msg of messages) {
        if (msg.img_url && !imageUrls[msg.img_url]) {
          const url = await getImageUrl(msg.img_url);
          if (url) {
            urls[msg.img_url] = url;
          }
        }
      }
      if (Object.keys(urls).length > 0) {
        setImageUrls((prev) => ({ ...prev, ...urls }));
      }
    };

    fetchImageUrls();
  }, [messages]);

  if (!conversation) {
    return (
      <div className={styles.emptyState}>
        <MessageSquare className={styles.emptyIcon} />
        <h3 className={styles.emptyTitle}>Chọn một cuộc trò chuyện</h3>
        <p className={styles.emptyText}>
          Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.chatWindow}>
      {/* Header */}
      <div className={styles.header}>
        <img
          src={conversation.otherUser?.image_url || '/default-avatar.png'}
          alt={conversation.otherUser?.name || 'User'}
          className={styles.avatar}
        />
        <div className={styles.userInfo}>
          <div className={styles.userName}>{conversation.otherUser?.name || 'Người dùng'}</div>
          <div className={styles.userStatus}>Đang hoạt động</div>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messagesWrapper} ref={messagesWrapperRef}>
        <div className={styles.messagesContainer}>
          {loadingMore && (
            <div className={styles.loadingMore}>
              <div className={styles.loadingSpinner}></div>
              <span>Đang tải tin nhắn...</span>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message._id}
              className={`${styles.messageItem} ${
                message.sender_id === user.id ? styles.own : ''
              }`}
            >
              <img
                src={message.sender?.image_url || '/default-avatar.png'}
                alt={message.sender?.name || 'User'}
                className={styles.messageAvatar}
              />
              <div className={styles.messageContent}>
                <div className={styles.messageBubble}>
                  <p className={styles.messageText}>{message.content}</p>
                  {message.img_url && imageUrls[message.img_url] && (
                    <img
                      src={imageUrls[message.img_url]}
                      alt="Message attachment"
                      className={styles.messageImage}
                      onClick={() => setImageModal(imageUrls[message.img_url])}
                    />
                  )}
                </div>
                <span className={styles.messageTime}>
                  {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))}
          {typing && (
            <div className={styles.typingIndicator}>
              <span>{conversation.otherUser?.name} đang nhập</span>
              <div className={styles.typingDots}>
                <div className={styles.typingDot}></div>
                <div className={styles.typingDot}></div>
                <div className={styles.typingDot}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Image Modal */}
      {imageModal && (
        <div className={styles.imageModal} onClick={() => setImageModal(null)}>
          <div className={styles.imageModalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeModal} onClick={() => setImageModal(null)}>
              <X size={24} />
            </button>
            <img src={imageModal} alt="Enlarged" className={styles.enlargedImage} />
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className={styles.inputArea}>
        {imagePreview && (
          <div className={styles.imagePreview}>
            <img src={imagePreview} alt="Preview" className={styles.previewImage} />
            <button onClick={removeImage} className={styles.removePreview}>
              <X size={16} />
            </button>
          </div>
        )}
        <div className={styles.inputWrapper}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className={styles.fileInput}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={styles.imageButton}
            title="Gửi ảnh"
          >
            <ImageIcon size={20} />
          </button>
          <textarea
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            className={styles.messageInput}
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={(!messageText.trim() && !selectedImage) || sending}
            className={styles.sendButton}
          >
            <Send size={18} />
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
