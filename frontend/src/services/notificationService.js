import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL;

/**
 * Get all notifications for the current user
 * @param {string} token - Auth token
 * @param {Object} options - Query options
 * @returns {Promise}
 */
export const getNotifications = async (token, options = {}) => {
  try {
    const { page = 1, limit = 10, is_read, event_type } = options;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (is_read !== undefined) {
      params.append('is_read', is_read.toString());
    }
    if (event_type) {
      params.append('event_type', event_type);
    }

    const response = await axios.get(
      `${BASE_URL}/api/notifications?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Mark a notification as read
 * @param {string} token - Auth token
 * @param {string} notificationId - Notification ID
 * @returns {Promise}
 */
export const markNotificationAsRead = async (token, notificationId) => {
  try {
    const response = await axios.put(
      `${BASE_URL}/api/notifications/${notificationId}/read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 * @param {string} token - Auth token
 * @returns {Promise}
 */
export const markAllNotificationsAsRead = async (token) => {
  try {
    const response = await axios.put(
      `${BASE_URL}/api/notifications/read-all`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Get unread notification count
 * @param {string} token - Auth token
 * @returns {Promise}
 */
export const getUnreadNotificationCount = async (token) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/notifications/unread-count`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    throw error;
  }
};

/**
 * Delete a notification
 * @param {string} token - Auth token
 * @param {string} notificationId - Notification ID
 * @returns {Promise}
 */
export const deleteNotification = async (token, notificationId) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/notifications/${notificationId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};
