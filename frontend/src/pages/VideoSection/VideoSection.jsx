import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoPlayer from '../../components/VideoPlayer/VideoPlayer';
import styles from './VideoSection.module.css';

const VideoSection = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  // Dữ liệu mẫu - trong thực tế sẽ fetch từ API dựa trên courseId và lessonId
  const courseData = {
    id: courseId,
    title: 'Lập trình Web từ cơ bản đến nâng cao',
    instructor: 'Nguyễn Văn A'
  };

  const lessonData = {
    id: lessonId,
    title: 'Giới thiệu về HTML và CSS',
    duration: '15:30',
    section: 'Chương 1: Cơ bản'
  };

  const handleBackToCourse = () => {
    // Chuyển về trang nội dung khóa học
    navigate(`/course/${courseId}/content`);
  };

  const handleBreadcrumbCourse = () => {
    // Chuyển về trang chi tiết khóa học
    navigate(`/course/${courseId}`);
  };

  return (
    <div className={styles.videoSectionContainer}>
      {/* Navigation Buttons */}
      {/* <div className={styles.navigationButtons}>
        <button 
          onClick={handleBackToCourse}
          className={styles.backButton}
        >
          ← Quay lại danh sách bài học
        </button>
        <div className={styles.lessonNavigation}>
          <button className={styles.prevButton} disabled>
            ← Bài trước
          </button>
          <button className={styles.nextButton}>
            Bài tiếp theo →
          </button>
        </div>
      </div> */}
    
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <button 
          onClick={handleBreadcrumbCourse}
          className={styles.breadcrumbLink}
        >
          {courseData.title}
        </button>
        <span className={styles.breadcrumbSeparator}>{'>'}</span>
        <span className={styles.breadcrumbCurrent}>
          {lessonData.title}
        </span>
      </div>

      {/* Video Player */}
      <div className={styles.videoPlayerWrapper}>
        <VideoPlayer />
      </div>

      {/* Lesson Description */}
      <div className={styles.lessonDescription}>
        <h3>Mô tả bài học</h3>
        <p>
          Trong bài học này, chúng ta sẽ tìm hiểu về HTML và CSS - hai ngôn ngữ cơ bản 
          nhất trong việc xây dựng trang web. Bạn sẽ học cách tạo cấu trúc trang web 
          với HTML và trang trí giao diện với CSS.
        </p>
        
        <h4>Nội dung chính:</h4>
        <ul>
          <li>Giới thiệu về HTML</li>
          <li>Cấu trúc cơ bản của trang HTML</li>
          <li>Các thẻ HTML phổ biến</li>
          <li>Giới thiệu về CSS</li>
          <li>Cách áp dụng CSS vào HTML</li>
        </ul>
      </div>
    </div>
  );
};

export default VideoSection;
