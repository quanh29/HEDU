import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth, useUser } from '@clerk/clerk-react';
import axios from 'axios';

/**
 * Custom hook to manage unread message count
 * @returns {Object} { unreadCount, refetchUnreadCount }
 */
export const useUnreadMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket, isConnected } = useSocket();
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();

  const fetchUnreadCount = async () => {
    if (!isSignedIn) return;

    try {
      const token = await getToken();
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/message/unread-count`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [isSignedIn]);

  useEffect(() => {
    if (!socket || !isConnected || !user?.id) return;

    // Listen for unread count update specific to this user
    const eventName = `unreadCountUpdate:${user.id}`;
    
    const handleUnreadCountUpdate = (data) => {
      if (data.unreadCount !== undefined) {
        setUnreadCount(data.unreadCount);
      }
    };

    socket.on(eventName, handleUnreadCountUpdate);

    return () => {
      socket.off(eventName, handleUnreadCountUpdate);
    };
  }, [socket, isConnected, user?.id]);

  return {
    unreadCount,
    refetchUnreadCount: fetchUnreadCount
  };
};
