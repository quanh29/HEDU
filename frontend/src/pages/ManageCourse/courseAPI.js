// API service cho quản lý khóa học
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const courseAPI = {
  // Lấy thông tin khóa học
  getCourse: async (courseId) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/course/${courseId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin khóa học');
    }
  },

  // Tạo khóa học mới
  createCourse: async (courseData) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/course`, courseData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Không thể tạo khóa học');
    }
  },

  // Cập nhật khóa học
  updateCourse: async (courseId, courseData) => {
    try {
      const response = await axios.put(`${BASE_URL}/api/course/${courseId}`, courseData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Không thể cập nhật khóa học');
    }
  },

  // Upload ảnh thumbnail
  uploadThumbnail: async (file) => {
    try {
      const formData = new FormData();
      formData.append('thumbnail', file);
      
      const response = await axios.post(`${BASE_URL}/api/upload/thumbnail`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.url;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Không thể upload ảnh');
    }
  },

  // Xóa khóa học
  deleteCourse: async (courseId) => {
    try {
      await axios.delete(`${BASE_URL}/api/course/${courseId}`);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Không thể xóa khóa học');
    }
  }
};

export default courseAPI;
