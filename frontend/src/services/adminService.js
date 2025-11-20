import axios from 'axios';

/**
 * Admin Service - API calls cho admin quản lý courses
 * Note: Các function này cần truyền token từ Clerk vào
 */

// Lấy tất cả courses cho admin (bao gồm tất cả status)
export const getAllCoursesForAdmin = async (token, filters = {}) => {
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
    
    const response = await axios.get(
      `${import.meta.env.VITE_BASE_URL}/api/admin/courses?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching courses for admin:', error);
    throw error;
  }
};

// Lấy thống kê courses
export const getCourseStatistics = async (token) => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_BASE_URL}/api/admin/courses/statistics`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching course statistics:', error);
    throw error;
  }
};

// Lấy chi tiết course cho admin
export const getCourseByIdForAdmin = async (token, courseId) => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_BASE_URL}/api/admin/courses/${courseId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching course for admin:', error);
    throw error;
  }
};

// Lấy full course data cho admin (bao gồm sections và lessons)
export const getFullCourseDataForAdmin = async (token, courseId) => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_BASE_URL}/api/admin/courses/${courseId}/full`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching full course data for admin:', error);
    throw error;
  }
};

// Cập nhật status của course
export const updateCourseStatus = async (token, courseId, status, reason = '') => {
  try {
    const response = await axios.patch(
      `${import.meta.env.VITE_BASE_URL}/api/admin/courses/${courseId}/status`,
      {
        course_status: status,
        reason: reason
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating course status:', error);
    throw error;
  }
};

// Cập nhật thông tin course
export const updateCourseByAdmin = async (token, courseId, courseData) => {
  try {
    const response = await axios.put(
      `${import.meta.env.VITE_BASE_URL}/api/admin/courses/${courseId}`,
      courseData,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating course by admin:', error);
    throw error;
  }
};

// Xóa course
export const deleteCourseByAdmin = async (token, courseId) => {
  try {
    const response = await axios.delete(
      `${import.meta.env.VITE_BASE_URL}/api/admin/courses/${courseId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting course by admin:', error);
    throw error;
  }
};
