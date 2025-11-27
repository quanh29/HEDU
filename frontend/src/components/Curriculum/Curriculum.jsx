import React, { useState, useRef, useCallback } from 'react';
import { Plus, Trash2, GripVertical, PlayCircle, FileText, Upload, Edit2 } from 'lucide-react';
import MuxUploader from '../MuxUploader/MuxUploader';
import MaterialUploader from '../MaterialUploader/MaterialUploader';
import SectionModal from '../Modals/SectionModal';
import LessonModal from '../Modals/LessonModal';
import QuizQuestionModal from '../Modals/QuizQuestionModal';
import styles from './Curriculum.module.css';
import { useVideoSocket } from '../../context/SocketContext.jsx';
import { useAuth } from '@clerk/clerk-react';

const Curriculum = ({ sections, errors, addSection, updateSection, removeSection, addLesson, updateLesson, removeLesson }) => {
  const { getToken } = useAuth();
  const [uploadingLessons, setUploadingLessons] = useState({}); // Track multiple uploading lessons: { lessonId: true }
  const cancelFunctionsRef = useRef({}); // Store cancel functions for each lesson: { lessonId: cancelFunction }
  const cancellingRef = useRef({}); // Track which lessons are currently being cancelled
  
  // Modal states
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [quizQuestionModalOpen, setQuizQuestionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [currentSectionId, setCurrentSectionId] = useState(null);
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  
  // WebSocket listener for video status updates - handles ALL video updates for this component
  const handleVideoStatusUpdate = useCallback((data) => {
    console.log('📡 Curriculum received video status update:', data);
    
    // Find the lesson with this videoId across all sections
    let foundSection = null;
    let foundLesson = null;
    
    for (const section of sections) {
      const lesson = (section.lessons || []).find(l => 
        String(l.videoId) === String(data.videoId)
      );
      if (lesson) {
        foundSection = section;
        foundLesson = lesson;
        break;
      }
    }
    
    if (!foundSection || !foundLesson) {
      console.log('⚠️ Video not found in current sections:', data.videoId);
      return;
    }
    
    console.log('✅ Found lesson to update:', foundLesson.id || foundLesson._id, 'Status:', data.status);
    
    const sectionId = foundSection.id || foundSection._id;
    const lessonId = foundLesson.id || foundLesson._id;
    
    // Update lesson based on status
    switch (data.status) {
      case 'processing':
        console.log('🔄 Video processing...');
        updateLesson(sectionId, lessonId, 'status', 'processing');
        updateLesson(sectionId, lessonId, 'uploadStatus', 'processing');
        updateLesson(sectionId, lessonId, 'assetId', data.assetId || '');
        // Keep in uploading list to show processing status
        break;
        
      case 'ready':
        console.log('✅ Video ready!');
        updateLesson(sectionId, lessonId, 'status', 'ready');
        updateLesson(sectionId, lessonId, 'uploadStatus', 'success');
        updateLesson(sectionId, lessonId, 'contentUrl', data.contentUrl || '');
        updateLesson(sectionId, lessonId, 'playbackId', data.playbackId || '');
        updateLesson(sectionId, lessonId, 'assetId', data.assetId || '');
        updateLesson(sectionId, lessonId, 'duration', data.duration || 0);
        updateLesson(sectionId, lessonId, 'uploadProgress', undefined);
        // Remove from uploading list
        setUploadingLessons(prev => {
          const updated = { ...prev };
          delete updated[lessonId];
          return updated;
        });
        break;
        
      case 'error':
        console.error('❌ Video error:', data.error);
        updateLesson(sectionId, lessonId, 'status', 'error');
        updateLesson(sectionId, lessonId, 'uploadStatus', 'error');
        updateLesson(sectionId, lessonId, 'uploadError', data.error || 'Processing failed');
        // Remove from uploading list
        setUploadingLessons(prev => {
          const updated = { ...prev };
          delete updated[lessonId];
          return updated;
        });
        break;
        
      case 'cancelled':
        console.log('🛑 Video cancelled');
        updateLesson(sectionId, lessonId, 'status', '');
        updateLesson(sectionId, lessonId, 'uploadStatus', 'idle');
        // Remove from uploading list
        setUploadingLessons(prev => {
          const updated = { ...prev };
          delete updated[lessonId];
          return updated;
        });
        break;
        
      default:
        console.log(`ℹ️ Unhandled status: ${data.status}`);
    }
  }, [sections, updateLesson]);
  
  const handleVideoError = useCallback((data) => {
    console.error('❌ Video error event received:', data);
  }, []);
  
  // Setup WebSocket listener
  useVideoSocket(handleVideoStatusUpdate, handleVideoError);
  
  const handleVideoUploadComplete = (sectionId, lessonId, data) => {
    console.log('✅ Video upload complete in Curriculum:', data);
    console.log('📝 Section ID:', sectionId);
    console.log('📝 Lesson ID:', lessonId);
    console.log('📹 Video ID:', data.videoId);
    console.log('🎬 Asset ID:', data.assetId);
    
    // IMPORTANT: Store videoId immediately so WebSocket can find it
    updateLesson(sectionId, lessonId, 'videoId', data.videoId || '');
    updateLesson(sectionId, lessonId, 'uploadId', data.uploadId || '');
    updateLesson(sectionId, lessonId, 'assetId', data.assetId || '');
    
    // Set status to processing - WebSocket will update to 'ready' when encoding completes
    updateLesson(sectionId, lessonId, 'status', 'processing');
    updateLesson(sectionId, lessonId, 'uploadStatus', 'processing');
    updateLesson(sectionId, lessonId, 'uploadProgress', undefined);
    
    console.log('✅ Lesson updated with videoId, waiting for WebSocket status updates...');
    
    // Keep in uploading list until WebSocket confirms 'ready' or 'error'
    // WebSocket handler will remove it from uploadingLessons
  };

  const handleVideoUploadError = (sectionId, lessonId, error) => {
    console.error('❌ Video upload error:', error);
    updateLesson(sectionId, lessonId, 'uploadStatus', 'error');
    updateLesson(sectionId, lessonId, 'uploadError', error.message);
    
    // Remove from uploading list
    setUploadingLessons(prev => {
      const updated = { ...prev };
      delete updated[lessonId];
      return updated;
    });
    
    // Remove cancel function reference
    delete cancelFunctionsRef.current[lessonId];
  };

  const handleVideoUploadProgress = (sectionId, lessonId, progress) => {
    updateLesson(sectionId, lessonId, 'uploadProgress', progress);
  };

  const handleVideoUploadStatusChange = (sectionId, lessonId, status) => {
    updateLesson(sectionId, lessonId, 'uploadStatus', status);
  };

  const startUpload = (sectionId, lessonId) => {
    setUploadingLessons(prev => ({ ...prev, [lessonId]: true }));
    updateLesson(sectionId, lessonId, 'uploadStatus', 'idle');
    updateLesson(sectionId, lessonId, 'uploadProgress', 0);
  };

  const handleCancelUpload = async (sectionId, lessonId) => {
    // Prevent multiple simultaneous cancel calls for the same lesson
    if (cancellingRef.current[lessonId]) {
      console.log('⚠️ Cancel already in progress for lesson:', lessonId);
      return;
    }
    
    cancellingRef.current[lessonId] = true;
    console.log('🛑 Cancel upload requested for lesson:', lessonId);
    
    try {
      // Call the actual cancel function from MuxUploader if it exists
      const cancelFn = cancelFunctionsRef.current[lessonId];
      if (cancelFn) {
        console.log('🛑 Calling MuxUploader cancel function...');
        await cancelFn();
        
        // Remove the cancel function reference
        delete cancelFunctionsRef.current[lessonId];
      } else {
        console.warn('⚠️ No cancel function registered for lesson:', lessonId);
      }
      
      // Reset upload state
      setUploadingLessons(prev => {
        const updated = { ...prev };
        delete updated[lessonId];
        return updated;
      });
      
      // Clear all upload-related fields
      updateLesson(sectionId, lessonId, 'uploadStatus', 'idle');
      updateLesson(sectionId, lessonId, 'uploadProgress', 0);
      updateLesson(sectionId, lessonId, 'uploadError', undefined);
      updateLesson(sectionId, lessonId, 'contentUrl', '');
      updateLesson(sectionId, lessonId, 'playbackId', '');
      updateLesson(sectionId, lessonId, 'assetId', '');
      updateLesson(sectionId, lessonId, 'videoId', '');
      updateLesson(sectionId, lessonId, 'uploadId', '');
      updateLesson(sectionId, lessonId, 'duration', 0);
      updateLesson(sectionId, lessonId, 'status', '');
      
      console.log('✅ Upload state cleared');
    } finally {
      // Reset cancelling flag
      delete cancellingRef.current[lessonId];
    }
  };

  const handleCancelRegistered = (lessonId, cancelFn) => {
    // Only register if not already registered
    if (cancelFunctionsRef.current[lessonId]) {
      console.log('⚠️ Cancel function already registered for lesson:', lessonId, '- skipping');
      return;
    }
    
    console.log('📝 Registering cancel function for lesson:', lessonId);
    cancelFunctionsRef.current[lessonId] = cancelFn;
  };

  const handleDeleteVideo = async (sectionId, lessonId, videoId, skipConfirm = false) => {
    if (!videoId) {
      console.error('No videoId to delete');
      return;
    }

    if (!skipConfirm) {
      const confirmed = window.confirm('Bạn có chắc chắn muốn xóa video này không?');
      if (!confirmed) return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/video/${videoId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete video');
      }

      // Clear video data from lesson
      updateLesson(sectionId, lessonId, 'contentUrl', '');
      updateLesson(sectionId, lessonId, 'playbackId', '');
      updateLesson(sectionId, lessonId, 'assetId', '');
      updateLesson(sectionId, lessonId, 'videoId', '');
      updateLesson(sectionId, lessonId, 'uploadId', '');
      updateLesson(sectionId, lessonId, 'duration', 0);
      updateLesson(sectionId, lessonId, 'status', '');
      updateLesson(sectionId, lessonId, 'uploadStatus', 'idle');

      console.log('✅ Video deleted successfully');
    } catch (error) {
      console.error('Error deleting video:', error);
      if (!skipConfirm) {
        alert('Có lỗi khi xóa video. Vui lòng thử lại.');
      }
    }
  };

  const handleMaterialUploadComplete = (sectionId, lessonId, data) => {
    console.log('📤 [Curriculum] Material upload complete:', data);
    
    // Update lesson with material data
    updateLesson(sectionId, lessonId, 'materialId', data.materialId);
    updateLesson(sectionId, lessonId, 'publicId', data.publicId);
    updateLesson(sectionId, lessonId, 'fileName', data.fileName);
    
    console.log('✅ [Curriculum] Material data updated in lesson');
  };

  const handleDeleteMaterial = async (sectionId, lessonId, materialId, skipConfirm = false) => {
    if (!materialId) {
      console.error('No materialId to delete');
      return;
    }

    if (!skipConfirm) {
      const confirmed = window.confirm('Bạn có chắc chắn muốn xóa tài liệu này không?');
      if (!confirmed) return;
    }

    console.log('🗑️ [Curriculum] Deleting material:', materialId);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/material/delete/${materialId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete material');
      }

      // Clear material data from lesson
      updateLesson(sectionId, lessonId, 'materialId', '');
      updateLesson(sectionId, lessonId, 'publicId', '');
      updateLesson(sectionId, lessonId, 'fileName', '');

      console.log('✅ Material deleted successfully');
      if (!skipConfirm) {
        alert('Tài liệu đã được xóa thành công');
      }
    } catch (error) {
      console.error('❌ Error deleting material:', error);
      if (!skipConfirm) {
        alert('Có lỗi khi xóa tài liệu. Vui lòng thử lại.');
      }
    }
  };

  const handleDeleteLesson = async (sectionId, lessonId, lesson) => {
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa bài học "${lesson.title || 'này'}" không?\n\nNội dung của bài học (video/tài liệu/quiz) cũng sẽ bị xóa.`);
    if (!confirmed) return;

    console.log('🗑️ Deleting lesson:', lessonId, 'Type:', lesson.contentType);

    try {
      // Delete content based on lesson type
      if (lesson.contentType === 'video' && lesson.videoId) {
        console.log('🎬 Deleting video:', lesson.videoId);
        try {
          const response = await fetch(
            `${import.meta.env.VITE_BASE_URL}/api/video/${lesson.videoId}`,
            { method: 'DELETE' }
          );
          if (response.ok) {
            console.log('✅ Video deleted');
          }
        } catch (error) {
          console.error('❌ Error deleting video:', error);
        }
      } else if (lesson.contentType === 'material' && lesson.materialId) {
        console.log('📄 Deleting material:', lesson.materialId);
        try {
          const response = await fetch(
            `${import.meta.env.VITE_BASE_URL}/api/material/delete/${lesson.materialId}`,
            { method: 'DELETE' }
          );
          if (response.ok) {
            console.log('✅ Material deleted');
          }
        } catch (error) {
          console.error('❌ Error deleting material:', error);
        }
      } else if (lesson.contentType === 'quiz' && lesson.quizId) {
        console.log('📝 Deleting quiz:', lesson.quizId);
        try {
          const response = await fetch(
            `${import.meta.env.VITE_BASE_URL}/api/quiz/${lesson.quizId}`,
            { method: 'DELETE' }
          );
          if (response.ok) {
            console.log('✅ Quiz deleted');
          }
        } catch (error) {
          console.error('❌ Error deleting quiz:', error);
        }
      }

      // Remove lesson from UI
      removeLesson(sectionId, lessonId);
      console.log('✅ Lesson deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting lesson:', error);
      alert('Có lỗi khi xóa bài học. Vui lòng thử lại.');
    }
  };

  const handleDeleteSection = async (section) => {
    const lessonCount = (section.lessons || []).length;
    const confirmMessage = lessonCount > 0 
      ? `Bạn có chắc chắn muốn xóa chương "${section.title || 'này'}" không?\n\nChương này có ${lessonCount} bài học. Tất cả bài học và nội dung của chúng (video/tài liệu/quiz) sẽ bị xóa.`
      : `Bạn có chắc chắn muốn xóa chương "${section.title || 'này'}" không?`;
    
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    console.log('🗑️ Deleting section:', section.id || section._id, 'with', lessonCount, 'lessons');

    try {
      // Delete all lessons in the section
      for (const lesson of (section.lessons || [])) {
        console.log('🗑️ Deleting lesson:', lesson.id || lesson._id, 'Type:', lesson.contentType);
        
        // Delete content based on lesson type
        if (lesson.contentType === 'video' && lesson.videoId) {
          try {
            await fetch(
              `${import.meta.env.VITE_BASE_URL}/api/video/${lesson.videoId}`,
              { method: 'DELETE' }
            );
            console.log('✅ Video deleted:', lesson.videoId);
          } catch (error) {
            console.error('❌ Error deleting video:', error);
          }
        } else if (lesson.contentType === 'material' && lesson.materialId) {
          try {
            await fetch(
              `${import.meta.env.VITE_BASE_URL}/api/material/delete/${lesson.materialId}`,
              { method: 'DELETE' }
            );
            console.log('✅ Material deleted:', lesson.materialId);
          } catch (error) {
            console.error('❌ Error deleting material:', error);
          }
        } else if (lesson.contentType === 'quiz' && lesson.quizId) {
          try {
            await fetch(
              `${import.meta.env.VITE_BASE_URL}/api/quiz/${lesson.quizId}`,
              { method: 'DELETE' }
            );
            console.log('✅ Quiz deleted:', lesson.quizId);
          } catch (error) {
            console.error('❌ Error deleting quiz:', error);
          }
        }
      }

      // Remove section from UI
      removeSection(section.id || section._id);
      console.log('✅ Section and all lessons deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting section:', error);
      alert('Có lỗi khi xóa chương. Vui lòng thử lại.');
    }
  };

  // Section modal handlers
  const handleAddSection = () => {
    setEditingSection(null);
    setSectionModalOpen(true);
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    setSectionModalOpen(true);
  };

  const handleSectionSubmit = (title) => {
    if (editingSection) {
      // Edit existing section
      updateSection(editingSection.id || editingSection._id, 'title', title);
    } else {
      // Add new section with title
      addSection(title);
    }
    setSectionModalOpen(false);
    setEditingSection(null);
  };

  // Lesson modal handlers
  const handleAddLesson = (sectionId) => {
    setCurrentSectionId(sectionId);
    setEditingLesson(null);
    setLessonModalOpen(true);
  };

  const handleEditLesson = (sectionId, lesson) => {
    setCurrentSectionId(sectionId);
    setEditingLesson(lesson);
    setLessonModalOpen(true);
  };

  const handleLessonSubmit = async (title, contentType) => {
    if (!currentSectionId) return;

    if (editingLesson) {
      const lessonId = editingLesson.id || editingLesson._id;
      
      // Update title
      updateLesson(currentSectionId, lessonId, 'title', title);
      
      // Check if contentType changed
      if (contentType !== editingLesson.contentType) {
        console.log('📝 Content type changed from', editingLesson.contentType, 'to', contentType);
        
        // Delete old content based on previous type
        if (editingLesson.contentType === 'video' && editingLesson.videoId) {
          try {
            await fetch(
              `${import.meta.env.VITE_BASE_URL}/api/video/${editingLesson.videoId}`,
              { method: 'DELETE' }
            );
            console.log('✅ Old video deleted');
          } catch (error) {
            console.error('❌ Error deleting old video:', error);
          }
        } else if (editingLesson.contentType === 'material' && editingLesson.materialId) {
          try {
            await fetch(
              `${import.meta.env.VITE_BASE_URL}/api/material/delete/${editingLesson.materialId}`,
              { method: 'DELETE' }
            );
            console.log('✅ Old material deleted');
          } catch (error) {
            console.error('❌ Error deleting old material:', error);
          }
        } else if (editingLesson.contentType === 'quiz' && editingLesson.quizId) {
          try {
            await fetch(
              `${import.meta.env.VITE_BASE_URL}/api/quiz/${editingLesson.quizId}`,
              { method: 'DELETE' }
            );
            console.log('✅ Old quiz deleted');
          } catch (error) {
            console.error('❌ Error deleting old quiz:', error);
          }
        }
        
        // Update contentType and clear all content-related fields
        updateLesson(currentSectionId, lessonId, 'contentType', contentType);
        updateLesson(currentSectionId, lessonId, 'videoId', '');
        updateLesson(currentSectionId, lessonId, 'playbackId', '');
        updateLesson(currentSectionId, lessonId, 'assetId', '');
        updateLesson(currentSectionId, lessonId, 'materialId', '');
        updateLesson(currentSectionId, lessonId, 'publicId', '');
        updateLesson(currentSectionId, lessonId, 'fileName', '');
        updateLesson(currentSectionId, lessonId, 'quizId', '');
        updateLesson(currentSectionId, lessonId, 'quizQuestions', []);
        updateLesson(currentSectionId, lessonId, 'status', '');
        updateLesson(currentSectionId, lessonId, 'uploadStatus', 'idle');
      }
    } else {
      // Add new lesson with title and contentType
      addLesson(currentSectionId, title, contentType);
    }
    setLessonModalOpen(false);
    setEditingLesson(null);
    setCurrentSectionId(null);
  };

  // Quiz question modal handlers
  const handleAddQuizQuestion = (sectionId, lessonId) => {
    setCurrentSectionId(sectionId);
    setCurrentLessonId(lessonId);
    setEditingQuestion(null);
    setEditingQuestionIndex(null);
    setQuizQuestionModalOpen(true);
  };

  const handleEditQuizQuestion = (sectionId, lessonId, question, questionIndex) => {
    setCurrentSectionId(sectionId);
    setCurrentLessonId(lessonId);
    setEditingQuestion(question);
    setEditingQuestionIndex(questionIndex);
    setQuizQuestionModalOpen(true);
  };

  const handleQuizQuestionSubmit = async (question, answers, explanation) => {
    if (!currentSectionId || !currentLessonId) return;

    // Find the lesson
    const section = sections.find(s => (s.id || s._id) === currentSectionId);
    if (!section) return;

    const lesson = section.lessons?.find(l => (l.id || l._id) === currentLessonId);
    if (!lesson) return;

    const quizQuestions = [...(lesson.quizQuestions || [])];

    if (editingQuestionIndex !== null) {
      // Edit existing question
      quizQuestions[editingQuestionIndex] = { question, answers, explanation };
    } else {
      // Add new question
      quizQuestions.push({ question, answers, explanation });
    }

    // Update UI immediately
    updateLesson(currentSectionId, currentLessonId, 'quizQuestions', quizQuestions);
    
    // Sync with backend
    try {
      await syncQuizWithBackend(currentSectionId, currentLessonId, lesson, quizQuestions);
    } catch (error) {
      console.error('❌ Error syncing quiz with backend:', error);
      alert('Có lỗi khi lưu câu hỏi. Vui lòng thử lại.');
    }
    
    setQuizQuestionModalOpen(false);
    setEditingQuestion(null);
    setEditingQuestionIndex(null);
    setCurrentSectionId(null);
    setCurrentLessonId(null);
  };

  const handleDeleteQuizQuestion = async (sectionId, lessonId, questionIndex) => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này không?');
    if (!confirmed) return;

    const section = sections.find(s => (s.id || s._id) === sectionId);
    if (!section) return;

    const lesson = section.lessons?.find(l => (l.id || l._id) === lessonId);
    if (!lesson) return;

    const quizQuestions = [...(lesson.quizQuestions || [])];
    quizQuestions.splice(questionIndex, 1);
    
    // Update UI immediately
    updateLesson(sectionId, lessonId, 'quizQuestions', quizQuestions);
    
    // Sync with backend
    try {
      await syncQuizWithBackend(sectionId, lessonId, lesson, quizQuestions);
    } catch (error) {
      console.error('❌ Error syncing quiz with backend:', error);
      alert('Có lỗi khi xóa câu hỏi. Vui lòng thử lại.');
    }
  };

  // Helper function to sync quiz with backend
  const syncQuizWithBackend = async (sectionId, lessonId, lesson, quizQuestions) => {
    // Transform frontend format to backend format
    const backendQuestions = quizQuestions.map(q => ({
      questionText: q.question,
      options: q.answers.map(a => a.text),
      correctAnswers: q.answers
        .map((a, idx) => a.isCorrect ? a.text : null)
        .filter(a => a !== null),
      explanation: q.explanation || ''
    }));

    const token = await getToken();

    if (lesson.quizId) {
      // Update existing quiz
      console.log('📝 Updating quiz:', lesson.quizId);
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/quiz/${lesson.quizId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title: lesson.title || 'Quiz',
            questions: backendQuestions
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update quiz');
      }

      console.log('✅ Quiz updated successfully');
    } else {
      // Create new quiz
      console.log('➕ Creating new quiz for lesson:', lessonId);
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/quiz`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            section: sectionId,
            title: lesson.title || 'Quiz',
            questions: backendQuestions,
            order: lesson.order || 0
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create quiz');
      }

      const data = await response.json();
      const quizId = data._id;

      console.log('✅ Quiz created with ID:', quizId);

      // Link quiz with lesson via lesson update API
      const updateLessonResponse = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/lesson/${lessonId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            quiz: quizId
          })
        }
      );

      if (!updateLessonResponse.ok) {
        console.error('⚠️ Failed to link quiz to lesson');
      } else {
        console.log('✅ Linked quiz to lesson');
      }

      // Update UI with quizId
      updateLesson(sectionId, lessonId, 'quizId', quizId);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Chương trình học</h2>
      </div>
      {errors.sections && (
        <div className={styles.errorBox}>
          <p className={styles.error}>{errors.sections}</p>
        </div>
      )}
      <div className={styles.sections}>
        {sections.map((section, sectionIndex) => (
          <div key={section.id || section._id} className={styles.section}>
            {/* Section Header */}
            <div className={styles.sectionHeader}>
              <GripVertical size={16} style={{ color: '#9ca3af', cursor: 'grab' }} />
              <div className={styles.sectionInput} style={{ cursor: 'default', background: 'transparent', border: 'none', fontWeight: 500 }}>
                <span style={{ fontWeight: 'bold', fontSize: '15px' }}>Chương {sectionIndex + 1}:</span> {section.title || `Chương ${sectionIndex + 1}`}
              </div>
              <button
                onClick={() => handleEditSection(section)}
                className={styles.editSectionBtn}
                title="Chỉnh sửa chương"
                style={{ padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280' }}
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => handleDeleteSection(section)}
                className={styles.removeSectionBtn}
              >
                <Trash2 size={16} />
              </button>
            </div>
            {/* Lessons */}
            <div className={styles.lessons}>
              {(section.lessons || []).map((lesson, lessonIndex) => (
                <React.Fragment key={lesson.id || lesson._id}>
                  <div className={styles.lesson}>
                    <div
                      className={styles.lessonIcon}
                      style={{ background: lesson.contentType === 'video' ? '#3b82f6' : '#10b981' }}
                    >
                      {lesson.contentType === 'video' ? (
                        <PlayCircle size={12} />
                      ) : (
                        <FileText size={12} />
                      )}
                    </div>
                    <div className={styles.lessonInput} style={{ cursor: 'default', background: 'transparent', border: 'none' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Bài {lessonIndex + 1}:</span> {lesson.title || `Bài ${lessonIndex + 1}`}
                    </div>
                    <div style={{ 
                      padding: '6px 12px', 
                      fontSize: '13px', 
                      color: '#6b7280',
                      background: '#f9fafb',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      minWidth: '80px',
                      textAlign: 'center'
                    }}>
                      {lesson.contentType === 'video' ? '📹 Video' : lesson.contentType === 'material' ? '📄 Tài liệu' : '📝 Quiz'}
                    </div>
                    <button
                      onClick={() => handleEditLesson(section.id || section._id, lesson)}
                      style={{ 
                        padding: '6px', 
                        border: 'none', 
                        background: 'transparent', 
                        cursor: 'pointer', 
                        color: '#6b7280',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Chỉnh sửa bài học"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteLesson(section.id || section._id, lesson.id || lesson._id, lesson)}
                      className={styles.removeLessonBtn}
                      title="Xóa bài học"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  {/* MaterialUploader for article/material upload */}
                  {lesson.contentType === 'material' && (
                    <div style={{ marginTop: 12, marginBottom: 12, width: '100%' }}>
                        {!lesson.materialId && !lesson.fileName && (
                          <MaterialUploader
                            lessonTitle={lesson.title}
                            lessonId={lesson._id || lesson.id}
                            onUploadComplete={(data) => handleMaterialUploadComplete(
                              section.id || section._id,
                              lesson.id || lesson._id,
                              data
                            )}
                            onUploadError={(error) => console.error('Material upload error:', error)}
                          />
                        )}
                        
                        {/* Show material info if uploaded */}
                        {lesson.materialId && lesson.fileName && (
                          <div style={{
                            marginTop: 8,
                            padding: 12,
                            background: '#ecfdf5',
                            border: '2px solid #10b981',
                            borderRadius: 8,
                            fontSize: 13,
                            color: '#065f46'
                          }}>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>✓ Tài liệu đã upload thành công</div>
                            <div><strong>File:</strong> {lesson.fileName}</div>
                            <button
                              onClick={() => handleDeleteMaterial(
                                section.id || section._id,
                                lesson.id || lesson._id,
                                lesson.materialId
                              )}
                              style={{
                                marginTop: 8,
                                padding: '6px 12px',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <Trash2 size={14} />
                              Xóa tài liệu
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* MuxUploader for video upload */}
                    {lesson.contentType === 'video' && (
                      <div style={{ marginTop: 12, marginBottom: 12, width: '100%' }}>
                        {/* Upload button hoặc inline uploader - chỉ hiện khi chưa có playbackId, chưa ready và không đang processing */}
                        {!uploadingLessons[lesson.id || lesson._id] && !lesson.playbackId && lesson.status !== 'ready' && lesson.status !== 'processing' && (
                          <MuxUploader
                            lessonTitle={lesson.title}
                            sectionId={section._id || section.id}
                            lessonId={lesson._id || lesson.id}
                            onUploadStart={() => startUpload(section.id || section._id, lesson.id || lesson._id)}
                            onUploadComplete={(data) => handleVideoUploadComplete(
                              section.id || section._id,
                              lesson.id || lesson._id,
                              data
                            )}
                            onUploadError={(error) => handleVideoUploadError(
                              section.id || section._id,
                              lesson.id || lesson._id,
                              error
                            )}
                            onProgress={(progress) => handleVideoUploadProgress(
                              section.id || section._id,
                              lesson.id || lesson._id,
                              progress
                            )}
                            onStatusChange={(status) => handleVideoUploadStatusChange(
                              section.id || section._id,
                              lesson.id || lesson._id,
                              status
                            )}
                            onCancel={() => handleCancelUpload(
                              section.id || section._id,
                              lesson.id || lesson._id
                            )}
                            onCancelRegistered={(cancelFn) => handleCancelRegistered(
                              lesson.id || lesson._id,
                              cancelFn
                            )}
                            inline={true}
                          />
                        )}
                        
                        {/* Show upload status if uploading */}
                        {uploadingLessons[lesson.id || lesson._id] && (
                          <div style={{
                            border: '2px solid #3b82f6',
                            borderRadius: 8,
                            padding: '12px 16px',
                            background: '#eff6ff'
                          }}>
                            <div style={{ fontSize: 14, color: '#1e40af', marginBottom: 8, fontWeight: 500 }}>
                              {lesson.uploadStatus === 'uploading' && `Đang upload... ${lesson.uploadProgress || 0}%`}
                              {lesson.uploadStatus === 'processing' && 'Đang xử lý video...'}
                              {lesson.uploadStatus === 'success' && '✅ Hoàn tất!'}
                              {lesson.uploadStatus === 'error' && '❌ Lỗi upload'}
                            </div>
                            {lesson.uploadStatus === 'uploading' && (
                              <>
                                <div style={{
                                  width: '100%',
                                  height: 6,
                                  background: '#dbeafe',
                                  borderRadius: 3,
                                  overflow: 'hidden',
                                  marginBottom: 8
                                }}>
                                  <div style={{
                                    width: `${lesson.uploadProgress || 0}%`,
                                    height: '100%',
                                    background: '#3b82f6',
                                    transition: 'width 0.3s ease'
                                  }} />
                                </div>
                                <button
                                  onClick={() => handleCancelUpload(
                                    section.id || section._id,
                                    lesson.id || lesson._id
                                  )}
                                  style={{
                                    padding: '6px 12px',
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 500
                                  }}
                                >
                                  Hủy upload
                                </button>
                              </>
                            )}
                            {lesson.uploadStatus === 'error' && (
                              <div style={{ fontSize: 13, color: '#dc2626', marginTop: 4 }}>
                                {lesson.uploadError || 'Upload failed'}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Display video info if uploaded - only show if video actually exists */}
                        {lesson.playbackId && lesson.status === 'ready' && (
                          <div style={{
                            marginTop: 8,
                            padding: 12,
                            background: '#ecfdf5',
                            border: '2px solid #10b981',
                            borderRadius: 8,
                            fontSize: 13,
                            color: '#065f46'
                          }}>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>✓ Video đã upload thành công</div>
                            {lesson.playbackId && <div><strong>Playback ID:</strong> {lesson.playbackId}</div>}
                            <div><strong>Status:</strong> {lesson.status || 'ready'}</div>
                            {lesson.assetId && <div><strong>Asset ID:</strong> {lesson.assetId}</div>}
                            <button
                              onClick={() => handleDeleteVideo(
                                section.id || section._id,
                                lesson.id || lesson._id,
                                lesson.videoId
                              )}
                              style={{
                                marginTop: 8,
                                padding: '6px 12px',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <Trash2 size={14} />
                              Xóa video
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Upload file for document with styled box */}
                    {lesson.contentType === 'text' && (
                      <div style={{ marginTop: 8, marginBottom: 8, width: '100%' }}>
                        <label
                          htmlFor={`file-upload-${section.id || section._id}-${lesson.id || lesson._id}`}
                          style={{
                            display: 'block',
                            border: '2px dashed #d1d5db',
                            borderRadius: 8,
                            padding: '16px',
                            textAlign: 'center',
                            background: '#f9fafb',
                            color: '#6b7280',
                            cursor: 'pointer',
                            fontSize: 14,
                          }}
                        >
                          {lesson.file ? `Đã chọn: ${lesson.file.name}` : 'Chọn tệp tài liệu để tải lên'}
                          <input
                            id={`file-upload-${section.id || section._id}-${lesson.id || lesson._id}`}
                            type="file"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.xls,.xlsx,.csv,.zip,.rar,.jpg,.jpeg,.png,.gif"
                            style={{ display: 'none' }}
                            onChange={e => {
                              const file = e.target.files[0];
                              if (file) {
                                updateLesson(
                                  section.id || section._id,
                                  lesson.id || lesson._id,
                                  'file',
                                  file
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                  
                  {/* Quiz form for quiz lessons - now below the lesson row */}
                  {lesson.contentType === 'quiz' && (
                    <div style={{
                      border: '1px solid #d1d5db',
                      borderRadius: 8,
                      padding: 16,
                      background: '#f9fafb',
                      marginTop: 8,
                      width: '100%'
                    }}>
                      {/* Display existing questions */}
                      {(lesson.quizQuestions || []).map((q, qIdx) => (
                        <div key={qIdx} style={{ 
                          marginBottom: 16, 
                          padding: 12,
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: 8
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start',
                            marginBottom: 8
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#1f2937' }}>
                                Câu {qIdx + 1}: {q.question}
                              </div>
                              <div style={{ fontSize: 13, color: '#6b7280' }}>
                                {(q.answers || []).map((ans, ansIdx) => (
                                  <div key={ansIdx} style={{ 
                                    padding: '4px 0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6
                                  }}>
                                    <span style={{ 
                                      color: ans.isCorrect ? '#10b981' : '#6b7280',
                                      fontWeight: ans.isCorrect ? 600 : 400
                                    }}>
                                      {ans.isCorrect ? '✓' : '○'} {ans.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {q.explanation && (
                                <div style={{ 
                                  marginTop: 8, 
                                  fontSize: 12, 
                                  color: '#6b7280',
                                  fontStyle: 'italic',
                                  padding: 8,
                                  background: '#f9fafb',
                                  borderRadius: 4,
                                  border: '1px solid #e5e7eb'
                                }}>
                                  💡 {q.explanation}
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginLeft: 12 }}>
                              <button
                                type="button"
                                onClick={() => handleEditQuizQuestion(
                                  section.id || section._id,
                                  lesson.id || lesson._id,
                                  q,
                                  qIdx
                                )}
                                style={{ 
                                  padding: '6px',
                                  border: '1px solid #3b82f6',
                                  background: 'white',
                                  color: '#3b82f6',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  minWidth: '32px',
                                  height: '32px'
                                }}
                                title="Chỉnh sửa câu hỏi"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuizQuestion(
                                  section.id || section._id,
                                  lesson.id || lesson._id,
                                  qIdx
                                )}
                                style={{ 
                                  padding: '6px',
                                  border: '1px solid #ef4444',
                                  background: 'white',
                                  color: '#ef4444',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  minWidth: '32px',
                                  height: '32px'
                                }}
                                title="Xóa câu hỏi"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Add question button */}
                      <button
                        type="button"
                        onClick={() => handleAddQuizQuestion(
                          section.id || section._id,
                          lesson.id || lesson._id
                        )}
                        style={{ 
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px dashed #3b82f6',
                          background: 'white',
                          color: '#3b82f6',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6
                        }}
                      >
                        <Plus size={16} />
                        Thêm câu hỏi
                      </button>
                    </div>
                  )}
                </React.Fragment>
              ))}
              <button
                onClick={() => handleAddLesson(section.id || section._id)}
                className={styles.addLessonBtn}
              >
                <Plus size={16} />
                Thêm bài học
              </button>
            </div>
          </div>
        ))}
        {sections.length === 0 && (
          <div className={styles.emptySection}>
            <PlayCircle size={48} className={styles.emptyIcon} />
            <p style={{ fontSize: '16px', margin: 0 }}>Chưa có chương học nào</p>
            <p style={{ fontSize: '14px', margin: '8px 0 0 0' }}>Nhấn "Thêm chương" để bắt đầu tạo nội dung</p>
          </div>
        )}
        
        {/* Add Section Button - moved to bottom */}
        <button
          onClick={handleAddSection}
          className={styles.addSectionBtn}
          style={{ marginTop: sections.length > 0 ? '16px' : '0' }}
        >
          <Plus size={16} />
          Thêm chương
        </button>
      </div>

      {/* Section Modal */}
      <SectionModal
        isOpen={sectionModalOpen}
        mode={editingSection ? 'edit' : 'add'}
        initialTitle={editingSection?.title || ''}
        onSubmit={handleSectionSubmit}
        onClose={() => {
          setSectionModalOpen(false);
          setEditingSection(null);
        }}
      />

      {/* Lesson Modal */}
      <LessonModal
        isOpen={lessonModalOpen}
        mode={editingLesson ? 'edit' : 'add'}
        initialTitle={editingLesson?.title || ''}
        initialContentType={editingLesson?.contentType || 'video'}
        onSubmit={handleLessonSubmit}
        onClose={() => {
          setLessonModalOpen(false);
          setEditingLesson(null);
          setCurrentSectionId(null);
        }}
      />

      {/* Quiz Question Modal */}
      <QuizQuestionModal
        isOpen={quizQuestionModalOpen}
        mode={editingQuestionIndex !== null ? 'edit' : 'add'}
        initialQuestion={editingQuestion?.question || ''}
        initialAnswers={editingQuestion?.answers || [{ text: '', isCorrect: false }]}
        initialExplanation={editingQuestion?.explanation || ''}
        onSubmit={handleQuizQuestionSubmit}
        onClose={() => {
          setQuizQuestionModalOpen(false);
          setEditingQuestion(null);
          setEditingQuestionIndex(null);
          setCurrentSectionId(null);
          setCurrentLessonId(null);
        }}
      />
    </div>
  );
};

export default Curriculum;
