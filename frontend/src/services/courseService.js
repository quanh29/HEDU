import api from './api.js';

/**
 * Search courses with filters
 * @param {Object} params - Query parameters
 * @returns {Promise}
 */
export const searchCourses = async (params = {}) => {
  try {
    const response = await api.get('/api/course/search', { params });
    return response.data;
  } catch (error) {
    console.error('Error searching courses:', error);
    throw error;
  }
};
