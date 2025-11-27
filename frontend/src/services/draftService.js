import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL;

/**
 * Draft Service - Handles all draft-related API calls
 * Integrates with the backend draft system (CourseDraft, SectionDraft, LessonDraft, etc.)
 */

/**
 * Get or create a draft for a course
 * Backend will auto-create draft from published if not exists
 */
export const getOrCreateDraft = async (courseId, token) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/course-revision/draft/${courseId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting/creating draft:', error);
    throw error;
  }
};

/**
 * Check if a course has pending draft
 */
export const hasPendingDraft = async (courseId, token) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/course-draft/${courseId}/status`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data; // { hasDraft, status, draftId }
  } catch (error) {
    console.error('Error checking draft status:', error);
    return { hasDraft: false, status: null };
  }
};

/**
 * Submit draft for approval
 */
export const submitDraftForApproval = async (courseId, token) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/course-draft/${courseId}/submit`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting draft:', error);
    throw error;
  }
};

/**
 * Cancel/Delete draft
 */
export const cancelDraft = async (courseId, token) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/course-draft/${courseId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error canceling draft:', error);
    throw error;
  }
};

/**
 * Add section - Creates SectionDraft if course is approved
 * Backend handles draft logic automatically
 */
export const addSection = async (courseId, sectionData, token) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/section`,
      {
        courseId: courseId,
        ...sectionData
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data; // { success, isDraft, courseDraftId, data }
  } catch (error) {
    console.error('Error adding section:', error);
    throw error;
  }
};

/**
 * Update section - Creates/updates draft if needed
 */
export const updateSection = async (sectionId, updates, token, isDraft = false) => {
  try {
    const response = await axios.put(
      `${BASE_URL}/api/section/${sectionId}`,
      { ...updates, isDraft },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating section:', error);
    throw error;
  }
};

/**
 * Delete section - Creates "deleted" marker or direct delete
 */
export const deleteSection = async (sectionId, token, isDraft = false) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/section/${sectionId}?isDraft=${isDraft}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting section:', error);
    throw error;
  }
};

/**
 * Get sections with draft support
 * Returns ONLY draft sections if draft exists and course is approved
 * Returns published sections otherwise
 */
export const getSectionsWithDrafts = async (courseId, token, includeDrafts = true) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/section/${courseId}?includeDrafts=${includeDrafts}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data; // { success, hasDraft, draftStatus, courseDraftId, sections }
  } catch (error) {
    console.error('Error getting sections:', error);
    throw error;
  }
};

/**
 * Add lesson - Creates LessonDraft if needed
 */
export const addLesson = async (sectionId, lessonData, token, isDraft = false) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/lesson`,
      {
        sectionId,
        ...lessonData,
        isDraft
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error adding lesson:', error);
    throw error;
  }
};

/**
 * Update lesson - Handles draft logic
 */
export const updateLesson = async (lessonId, updates, token, isDraft = false) => {
  try {
    const response = await axios.put(
      `${BASE_URL}/api/lesson/${lessonId}`,
      { ...updates, isDraft },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating lesson:', error);
    throw error;
  }
};

/**
 * Delete lesson
 */
export const deleteLesson = async (lessonId, token, isDraft = false) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/lesson/${lessonId}?isDraft=${isDraft}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting lesson:', error);
    throw error;
  }
};

/**
 * Get lesson with draft support
 */
export const getLesson = async (lessonId, token, isDraft = false) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/lesson/${lessonId}?isDraft=${isDraft}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting lesson:', error);
    throw error;
  }
};

/**
 * Get lessons by section with draft support
 */
export const getLessonsBySection = async (sectionId, token, isDraft = false) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/lesson/section/${sectionId}?isDraft=${isDraft}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting lessons:', error);
    throw error;
  }
};

/**
 * Get change log for a draft
 */
export const getDraftChangeLog = async (courseId, token) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/course-draft/${courseId}/changelog`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting change log:', error);
    throw error;
  }
};

export default {
  getOrCreateDraft,
  hasPendingDraft,
  submitDraftForApproval,
  cancelDraft,
  addSection,
  updateSection,
  deleteSection,
  getSectionsWithDrafts,
  addLesson,
  updateLesson,
  deleteLesson,
  getLesson,
  getLessonsBySection,
  getDraftChangeLog
};
