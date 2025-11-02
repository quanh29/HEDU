import React, { useState, useRef } from 'react';
import { Plus, Trash2, GripVertical, PlayCircle, FileText, Upload } from 'lucide-react';
import MuxUploader from '../MuxUploader/MuxUploader';
import styles from './Curriculum.module.css';

const Curriculum = ({ sections, errors, addSection, updateSection, removeSection, addLesson, updateLesson, removeLesson }) => {
  const [uploadingLessons, setUploadingLessons] = useState({}); // Track multiple uploading lessons: { lessonId: true }
  const cancelFunctionsRef = useRef({}); // Store cancel functions for each lesson: { lessonId: cancelFunction }
  const cancellingRef = useRef({}); // Track which lessons are currently being cancelled
  
  const handleVideoUploadComplete = (sectionId, lessonId, data) => {
    console.log('✅ Video upload complete in Curriculum:', data);
    console.log('📝 Section ID:', sectionId);
    console.log('📝 Lesson ID:', lessonId);
    console.log('📹 Playback ID:', data.playbackId);
    console.log('🎬 Asset ID:', data.assetId);
    
    // Update lesson with video data
    updateLesson(sectionId, lessonId, 'contentUrl', data.contentUrl || '');
    updateLesson(sectionId, lessonId, 'playbackId', data.playbackId || '');
    updateLesson(sectionId, lessonId, 'assetId', data.assetId || '');
    updateLesson(sectionId, lessonId, 'videoId', data.videoId || '');
    updateLesson(sectionId, lessonId, 'uploadId', data.uploadId || '');
    updateLesson(sectionId, lessonId, 'duration', data.duration || 0);
    updateLesson(sectionId, lessonId, 'status', 'ready'); // Set to ready explicitly
    updateLesson(sectionId, lessonId, 'uploadProgress', undefined);
    updateLesson(sectionId, lessonId, 'uploadStatus', 'success'); // Set to success
    
    console.log('✅ Lesson updated with video data');
    
    // Remove from uploading list
    setUploadingLessons(prev => {
      const updated = { ...prev };
      delete updated[lessonId];
      console.log('📋 Updated uploading lessons:', updated);
      return updated;
    });
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

  const handleDeleteVideo = async (sectionId, lessonId, videoId) => {
    if (!videoId) {
      console.error('No videoId to delete');
      return;
    }

    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa video này không?');
    if (!confirmed) return;

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
      alert('Có lỗi khi xóa video. Vui lòng thử lại.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Chương trình học</h2>
        <button
          onClick={addSection}
          className={styles.addSectionBtn}
        >
          <Plus size={16} />
          Thêm chương
        </button>
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
              <input
                type="text"
                value={section.title}
                onChange={(e) => updateSection(section.id || section._id, 'title', e.target.value)}
                placeholder={`Chương ${sectionIndex + 1}...`}
                className={styles.sectionInput}
              />
              <button
                onClick={() => removeSection(section.id || section._id)}
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
                    <input
                      type="text"
                      value={lesson.title}
                      onChange={(e) => updateLesson(
                        section.id || section._id,
                        lesson.id || lesson._id,
                        'title',
                        e.target.value
                      )}
                      placeholder={`Bài ${lessonIndex + 1}...`}
                      className={styles.lessonInput}
                    />
                    <select
                      value={lesson.contentType}
                      onChange={(e) => updateLesson(
                        section.id || section._id,
                        lesson.id || lesson._id,
                        'contentType',
                        e.target.value
                      )}
                      className={styles.lessonSelect}
                    >
                      <option value="video">Video</option>
                      <option value="article">Tài liệu</option>
                      <option value="quiz">Quiz</option>
                    </select>
                    {/* URL input for article only */}
                    {lesson.contentType === 'article' && (
                      <input
                        type="url"
                        value={lesson.url || ''}
                        onChange={e => updateLesson(
                          section.id || section._id,
                          lesson.id || lesson._id,
                          'url',
                          e.target.value
                        )}
                        placeholder="Nhập URL tài liệu..."
                        className={styles.lessonInput}
                        style={{ marginTop: 8 }}
                      />
                    )}
                    {/* MuxUploader for video upload */}
                    {lesson.contentType === 'video' && (
                      <div style={{ marginTop: 12, marginBottom: 12 }}>
                        {/* Upload button hoặc inline uploader - chỉ hiện khi chưa có playbackId và chưa ready */}
                        {!uploadingLessons[lesson.id || lesson._id] && !lesson.playbackId && lesson.status !== 'ready' && (
                          <MuxUploader
                            lessonTitle={lesson.title}
                            sectionId={section._id || section.id}
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
                        
                        {/* Show processing message even when not in uploadingLessons */}
                        {!uploadingLessons[lesson.id || lesson._id] && 
                         lesson.status === 'processing' && 
                         !lesson.playbackId && (
                          <div style={{
                            border: '2px solid #f59e0b',
                            borderRadius: 8,
                            padding: '12px 16px',
                            background: '#fffbeb'
                          }}>
                            <div style={{ fontSize: 14, color: '#92400e', marginBottom: 4, fontWeight: 500 }}>
                              ⏳ Đang xử lý video...
                            </div>
                            <div style={{ fontSize: 12, color: '#78350f' }}>
                              Video đang được mã hóa bởi MUX. Vui lòng đợi...
                            </div>
                          </div>
                        )}
                        
                        {/* Display video info if uploaded */}
                        {(lesson.playbackId || lesson.status === 'ready') && (
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
                      <div style={{ marginTop: 8, marginBottom: 8 }}>
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
                    <button
                      onClick={() => removeLesson(section.id || section._id, lesson.id || lesson._id)}
                      className={styles.removeLessonBtn}
                    >
                      
                    </button>
                  </div>
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
                      {(lesson.quizQuestions || []).map((q, qIdx) => (
                        <div key={q.id || qIdx} style={{ marginBottom: 20, borderBottom: '1px solid #e5e7eb', paddingBottom: 12 }}>
                          <div style={{ marginBottom: 8 }}>
                            <input
                              type="text"
                              value={q.question || ''}
                              placeholder={`Câu hỏi ${qIdx + 1}`}
                              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d1d5db', fontSize: 14 }}
                              onChange={e => {
                                const updated = [...(lesson.quizQuestions || [])];
                                updated[qIdx] = { ...q, question: e.target.value };
                                updateLesson(section.id || section._id, lesson.id || lesson._id, 'quizQuestions', updated);
                              }}
                            />
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            {(q.answers || []).map((ans, ansIdx) => (
                              <div key={ans.id || ansIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <input
                                  type="checkbox"
                                  checked={!!ans.isCorrect}
                                  onChange={e => {
                                    const updated = [...(lesson.quizQuestions || [])];
                                    const answers = [...(q.answers || [])];
                                    answers[ansIdx] = { ...ans, isCorrect: e.target.checked };
                                    updated[qIdx] = { ...q, answers };
                                    updateLesson(section.id || section._id, lesson.id || lesson._id, 'quizQuestions', updated);
                                  }}
                                  style={{ marginRight: 4 }}
                                />
                                <input
                                  type="text"
                                  value={ans.text || ''}
                                  placeholder={`Đáp án ${ansIdx + 1}`}
                                  style={{ flex: 1, padding: 6, borderRadius: 4, border: '1px solid #d1d5db', fontSize: 13 }}
                                  onChange={e => {
                                    const updated = [...(lesson.quizQuestions || [])];
                                    const answers = [...(q.answers || [])];
                                    answers[ansIdx] = { ...ans, text: e.target.value };
                                    updated[qIdx] = { ...q, answers };
                                    updateLesson(section.id || section._id, lesson.id || lesson._id, 'quizQuestions', updated);
                                  }}
                                />
                                <button
                                  type="button"
                                  style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: 16 }}
                                  onClick={() => {
                                    const updated = [...(lesson.quizQuestions || [])];
                                    const answers = [...(q.answers || [])];
                                    answers.splice(ansIdx, 1);
                                    updated[qIdx] = { ...q, answers };
                                    updateLesson(section.id || section._id, lesson.id || lesson._id, 'quizQuestions', updated);
                                  }}
                                >✕</button>
                              </div>
                            ))}
                            <button
                              type="button"
                              style={{ marginTop: 4, border: '1px dashed #3b82f6', background: 'white', color: '#3b82f6', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 13 }}
                              onClick={() => {
                                const updated = [...(lesson.quizQuestions || [])];
                                const answers = [...(q.answers || [])];
                                answers.push({ text: '', isCorrect: false });
                                updated[qIdx] = { ...q, answers };
                                updateLesson(section.id || section._id, lesson.id || lesson._id, 'quizQuestions', updated);
                              }}
                            >+ Thêm đáp án</button>
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <input
                              type="text"
                              value={q.explanation || ''}
                              placeholder="Giải thích (tuỳ chọn)"
                              style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #d1d5db', fontSize: 13 }}
                              onChange={e => {
                                const updated = [...(lesson.quizQuestions || [])];
                                updated[qIdx] = { ...q, explanation: e.target.value };
                                updateLesson(section.id || section._id, lesson.id || lesson._id, 'quizQuestions', updated);
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            style={{ border: '1px solid #ef4444', background: 'white', color: '#ef4444', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 13 }}
                            onClick={() => {
                              const updated = [...(lesson.quizQuestions || [])];
                              updated.splice(qIdx, 1);
                              updateLesson(section.id || section._id, lesson.id || lesson._id, 'quizQuestions', updated);
                            }}
                          >Xoá câu hỏi</button>
                        </div>
                      ))}
                      <button
                        type="button"
                        style={{ border: '1px dashed #3b82f6', background: 'white', color: '#3b82f6', borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontSize: 14 }}
                        onClick={() => {
                          const updated = [...(lesson.quizQuestions || [])];
                          updated.push({ question: '', answers: [{ text: '', isCorrect: false }], explanation: '' });
                          updateLesson(section.id || section._id, lesson.id || lesson._id, 'quizQuestions', updated);
                        }}
                      >+ Thêm câu hỏi</button>
                    </div>
                  )}
                </React.Fragment>
              ))}
              <button
                onClick={() => addLesson(section.id || section._id)}
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
      </div>
    </div>
  );
};

export default Curriculum;
