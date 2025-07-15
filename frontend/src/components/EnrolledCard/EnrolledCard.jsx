import React from 'react';
import styles from './EnrolledCard.module.css';
import { useNavigate } from 'react-router-dom';

function EnrolledCard({ course, onContinueLearning, getProgressColor }) {
  const navigate = useNavigate();

  const handleViewCourse = () => {
    const slugify = str =>
      str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu tiếng Việt
      .replace(/[^a-z0-9\s-]/g, '') // Loại bỏ ký tự đặc biệt
      .replace(/\s+/g, '-') // Thay thế khoảng trắng bằng dấu gạch ngang
      .replace(/-+/g, '-') // Loại bỏ dấu gạch ngang liên tiếp
      .trim('-'); // Loại bỏ dấu gạch ngang ở đầu/cuối
    const courseSlug = `${course.id}-${slugify(course.title)}`;
    navigate(`/course/${courseSlug}`);
  };

  return (
    <div className={styles.courseCard}>
      <div className={styles.courseImage}>
        <img src={course.image} alt={course.title} />
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
