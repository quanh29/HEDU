import api from './api';

/**
 * Admin Service - API calls cho admin quản lý courses
 */

// Lấy tất cả courses cho admin (bao gồm tất cả status)
export const getAllCoursesForAdmin = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.status && filters.status !== 'all') {
      params.append('course_status', filters.status);
    }
    if (filters.category && filters.category !== 'all') {
      params.append('category', filters.category);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.page) {
      params.append('page', filters.page);
    }
    if (filters.limit) {
      params.append('limit', filters.limit);
    }
    
    const response = await api.get(`/api/admin/courses?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching courses for admin:', error);
    throw error;
  }
};

// Lấy thống kê courses
export const getCourseStatistics = async () => {
  try {
    const response = await api.get('/api/admin/courses/statistics');
    return response.data;
  } catch (error) {
    console.error('Error fetching course statistics:', error);
    throw error;
  }
};

// Lấy chi tiết course cho admin
export const getCourseByIdForAdmin = async (courseId) => {
  try {
    const response = await api.get(`/api/admin/courses/${courseId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching course for admin:', error);
    throw error;
  }
};

// Lấy full course data cho admin (bao gồm sections và lessons)
export const getFullCourseDataForAdmin = async (courseId) => {
  try {
    const response = await api.get(`/api/admin/courses/${courseId}/full`);
    return response.data;
  } catch (error) {
    console.error('Error fetching full course data for admin:', error);
    throw error;
  }
};

// Cập nhật status của course
export const updateCourseStatus = async (courseId, status, reason = '') => {
  try {
    const response = await api.patch(`/api/admin/courses/${courseId}/status`, {
      course_status: status,
      reason: reason
    });
    return response.data;
  } catch (error) {
    console.error('Error updating course status:', error);
    throw error;
  }
};

// Cập nhật thông tin course
export const updateCourseByAdmin = async (courseId, courseData) => {
  try {
    const response = await api.put(`/api/admin/courses/${courseId}`, courseData);
    return response.data;
  } catch (error) {
    console.error('Error updating course by admin:', error);
    throw error;
  }
};

// Xóa course
export const deleteCourseByAdmin = async (courseId) => {
  try {
    const response = await api.delete(`/api/admin/courses/${courseId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting course by admin:', error);
    throw error;
  }
};
