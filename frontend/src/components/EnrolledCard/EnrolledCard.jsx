import React, { useState, useRef, useEffect } from 'react';
import styles from './EnrolledCard.module.css';
import { useNavigate } from 'react-router-dom';
import { MoreVertical } from 'lucide-react';

function EnrolledCard({ course, onContinueLearning, getProgressColor, onRequestRefund }) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleViewCourse = () => {
    // Navigate using only the course id
    navigate(`/course/${encodeURIComponent(course.id)}`);
  };

  const handleRefundRequest = () => {
    setShowMenu(false);
    if (onRequestRefund) {
      onRequestRefund(course);
    }
  };

  return (
    <div className={styles.courseCard}>
      <div className={styles.courseHeader}>
        <div className={styles.courseImage}>
          <img src={course.image} alt={course.title} />
        </div>
        <div className={styles.menuContainer} ref={menuRef}>
          <button 
            className={styles.menuButton}
            onClick={() => setShowMenu(!showMenu)}
            aria-label="More options"
          >
            <MoreVertical size={20} />
          </button>
          {showMenu && (
            <div className={styles.menuDropdown}>
              <button 
                className={styles.menuItem}
                onClick={handleRefundRequest}
              >
                Yêu cầu hoàn tiền
              </button>
            </div>
          )}
        </div>
      </div>
      <div className={styles.courseContent}>
        <h3 className={styles.courseTitle}>{course.title}</h3>
        <p className={styles.courseInstructor}>
          Giảng viên: {Array.isArray(course.instructor) ? course.instructor.join(', ') : course.instructor}
        </p>
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressText}>Tiến độ học tập</span>
            <span className={styles.progressStats}>
              {course.completedLessons}/{course.totalLessons} bài học
            </span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ 
                width: `${course.progress}%`,
                backgroundColor: getProgressColor(course.progress)
              }}
            ></div>
          </div>
          {/* <div className={styles.progressPercentage}>
            {course.progress}%
          </div> */}
        </div>
        <div className={styles.courseActions}>
          <button 
            className={styles.continueBtn}
            onClick={() => onContinueLearning(course.id)}
          >
            {course.progress === 0 ? 'Bắt đầu học' : 'Tiếp tục học'}
          </button>
          <button className={styles.viewCourseBtn} onClick={handleViewCourse}>
            Xem khóa học
          </button>
        </div>
      </div>
    </div>
  );
}

export default EnrolledCard;
