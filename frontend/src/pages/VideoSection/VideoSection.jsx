import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import MuxVideoPlayer from '../../components/MuxVideoPlayer/MuxVideoPlayer';
import styles from './VideoSection.module.css';

const VideoSection = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoId = searchParams.get('videoId'); // Lấy videoId từ query params

  const [lessonTitle, setLessonTitle] = useState('');
  const [playbackProgress, setPlaybackProgress] = useState({
    currentTime: 0,
    duration: 0,
    progress: 0
  });

  // Handle khi video data đã load
  const handleVideoReady = (data) => {
    setLessonTitle(data.title || 'Bài học');
  };

  // Handle time update từ video player
  const handleTimeUpdate = (data) => {
    setPlaybackProgress(data);
    // Có thể lưu progress vào localStorage hoặc backend
    // localStorage.setItem(`video_progress_${videoId}`, JSON.stringify(data));
  };

  // Handle khi video kết thúc
  const handleVideoEnded = () => {
    console.log('Video đã kết thúc!');
    // Có thể đánh dấu hoàn thành bài học
    // markLessonAsCompleted(videoId);
  };

  const handleBackToCourse = () => {
    // Chuyển về trang nội dung khóa học
    navigate(`/course/${courseId}/content`);
  };

  const handleBreadcrumbCourse = () => {
    // Chuyển về trang chi tiết khóa học
    navigate(`/course/${courseId}`);
  };

  // Format time sang MM:SS
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.videoSectionContainer}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <button 
          onClick={handleBreadcrumbCourse}
          className={styles.breadcrumbLink}
        >
          Khóa học
        </button>
        <span className={styles.breadcrumbSeparator}>›</span>
        <button 
          onClick={handleBackToCourse}
          className={styles.breadcrumbLink}
        >
          Nội dung
        </button>
        <span className={styles.breadcrumbSeparator}>›</span>
        <span className={styles.breadcrumbCurrent}>
          {lessonTitle || 'Đang tải...'}
        </span>
      </div>

      {/* Video Player */}
      <div className={styles.videoPlayerWrapper}>
        {videoId ? (
          <MuxVideoPlayer
            videoId={videoId}
            courseId={courseId}
            autoPlay={false}
            onReady={handleVideoReady}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
          />
        ) : (
          <div className={styles.noVideo}>
            <p>Không tìm thấy video. Vui lòng chọn bài học từ danh sách.</p>
            <button onClick={handleBackToCourse} className={styles.backButton}>
              Quay lại danh sách
            </button>
          </div>
        )}
      </div>

      {/* Lesson Description */}
      <div className={styles.lessonDescription}>
        <h3>Ghi chú bài học</h3>
        <p>
          Bạn có thể thêm ghi chú cho bài học này để dễ dàng ôn tập sau này.
        </p>
        
        {/* Có thể thêm textarea cho notes */}
        {/* <textarea 
          className={styles.notesTextarea}
          placeholder="Thêm ghi chú của bạn..."
        /> */}
      </div>
    </div>
  );
};

export default VideoSection;
