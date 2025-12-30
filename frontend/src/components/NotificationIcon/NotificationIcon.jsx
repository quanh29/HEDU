import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Bell, CheckCheck } from 'lucide-react';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadNotificationCount 
} from '../../services/notificationService';
import styles from './NotificationIcon.module.css';
import { io } from 'socket.io-client';

const NotificationIcon = () => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const notificationMenuRef = useRef(null);
  const scrollRef = useRef(null);
  const socketRef = useRef(null);

  // Close notification menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Setup socket connection
  useEffect(() => {
    if (!isSignedIn || !user) return;

    const setupSocket = async () => {
      try {
        const token = await getToken();
        
        if (!token) {
          console.error('❌ [Notification Socket] No token available');
          return;
        }
        
        console.log('🔌 [Notification Socket] Connecting to:', import.meta.env.VITE_BASE_URL);
        
        const socket = io(import.meta.env.VITE_BASE_URL, {
          auth: { token },
          transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
          console.log('✅ [Notification Socket] Connected with socket id:', socket.id);
        });

        socket.on('notificationReady', (data) => {
          console.log('✅ [Notification Socket] System ready:', data);
        });

        socket.on('newNotification', (notification) => {
          console.log('📬 [Notification Socket] New notification:', notification);
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        });

        socket.on('connect_error', (error) => {
          console.error('❌ [Notification Socket] Connection error:', error.message);
        });

        socket.on('error', (error) => {
          console.error('❌ [Notification Socket] Error:', error);
        });
        
        socket.on('disconnect', (reason) => {
          console.log('🔌 [Notification Socket] Disconnected:', reason);
        });

        socketRef.current = socket;
      } catch (error) {
        console.error('❌ [Notification Socket] Setup error:', error);
      }
    };

    setupSocket();

    return () => {
      if (socketRef.current) {
        console.log('🔌 [Notification Socket] Cleaning up connection');
        socketRef.current.disconnect();
      }
    };
  }, [isSignedIn, user]);

  // Fetch notifications
  const fetchNotifications = async (pageNum = 1, append = false) => {
    if (!isSignedIn || !user) return;

    try {
      setLoading(true);
      const token = await getToken();
      
      console.log('📡 [Notification] Fetching notifications, page:', pageNum);
      
      const response = await getNotifications(token, { page: pageNum, limit: 10 });

      console.log('📡 [Notification] Response:', response);

      if (response.success) {
        const newNotifications = response.data.notifications;
        setNotifications(prev => append ? [...prev, ...newNotifications] : newNotifications);
        setUnreadCount(response.data.unreadCount);
        setHasMore(response.data.pagination.page < response.data.pagination.totalPages);
        console.log('✅ [Notification] Loaded', newNotifications.length, 'notifications');
      }
    } catch (error) {
      console.error('❌ [Notification] Error fetching:', error);
      if (error.response) {
        console.error('Response error:', error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (isSignedIn && showNotifications) {
      fetchNotifications(1);
    }
  }, [isSignedIn, showNotifications]);

  // Fetch unread count on mount
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!isSignedIn || !user) return;
      
      try {
        console.log('📊 [Notification] Fetching unread count');
        const token = await getToken();
        const response = await getUnreadNotificationCount(token);
        console.log('📊 [Notification] Unread count response:', response);
        if (response.success) {
          setUnreadCount(response.data.unreadCount);
        }
      } catch (error) {
        console.error('❌ [Notification] Error fetching unread count:', error);
        if (error.response) {
          console.error('Response error:', error.response.data);
        }
      }
    };

    fetchUnreadCount();
  }, [isSignedIn, user]);

  // Handle scroll to load more
  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
    if (bottom && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage, true);
    }
  };

  const handleNotificationMenuToggle = () => {
    setShowNotifications(!showNotifications);
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.is_read) {
        const token = await getToken();
        await markNotificationAsRead(token, notification._id);
        
        setNotifications(prev =>
          prev.map(n => n._id === notification._id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      setShowNotifications(false);
      
      if (notification.event_url) {
        navigate(notification.event_url);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = await getToken();
      await markAllNotificationsAsRead(token);
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  const getNotificationIcon = (eventType) => {
    switch (eventType) {
      case 'course_enrollment':
        return '🎓';
      case 'course_update':
        return '📚';
      case 'course_review':
        return '⭐';
      case 'refund':
        return '💰';
      case 'system_alert':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className={styles.notificationWrapper} ref={notificationMenuRef}>
      <button
        className={styles.notificationButton}
        onClick={handleNotificationMenuToggle}
        aria-label="Thông báo"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={styles.notificationBadge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {showNotifications && (
        <div className={styles.notificationDropdown}>
          <div className={styles.notificationHeader}>
            <h3>Thông báo ({unreadCount > 0 ? unreadCount : 'Không có mới'})</h3>
            {unreadCount > 0 && (
              <button 
                className={styles.markAllReadBtn}
                onClick={handleMarkAllAsRead}
                title="Đánh dấu tất cả đã đọc"
              >
                <CheckCheck size={16} />
              </button>
            )}
          </div>
          <div className={styles.notificationDivider}></div>
          {loading && page === 1 ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Đang tải...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div 
              className={styles.notificationItems} 
              ref={scrollRef}
              onScroll={handleScroll}
            >
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`${styles.notificationItem} ${!notification.is_read ? styles.unread : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={styles.notificationIcon}>
                    {getNotificationIcon(notification.event_type)}
                  </div>
                  <div className={styles.notificationContent}>
                    <h4 className={styles.notificationTitle}>
                      {notification.event_title}
                    </h4>
                    <p className={styles.notificationMessage}>
                      {notification.event_message}
                    </p>
                    <span className={styles.notificationTime}>
                      {getRelativeTime(notification.createdAt)}
                    </span>
                  </div>
                  {!notification.is_read && (
                    <div className={styles.unreadDot}></div>
                  )}
                </div>
              ))}
              {loading && page > 1 && (
                <div className={styles.loadingMore}>
                  <div className={styles.spinner}></div>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.emptyNotifications}>
              <Bell size={48} />
              <p>Không có thông báo</p>
              <span>Bạn sẽ nhận được thông báo về hoạt động của mình tại đây</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationIcon;
