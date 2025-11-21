import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import styles from './MyLearning.module.css';
import EnrolledCard from '../../components/EnrolledCard/EnrolledCard';
import TabSwitch from '../../components/TabSwitch/TabSwitch';

function MyLearning() {
  const navigate = useNavigate();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect to login if not signed in (after Clerk loads)
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/auth/login');
    }
  }, [isLoaded, isSignedIn, navigate]);

  // Fetch enrolled courses from backend
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      // Chờ Clerk load xong và user đã đăng nhập
      if (!isLoaded || !isSignedIn) {
        return;
      }

      try {
        setLoading(true);
        const token = await getToken();
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/enrollment`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.success) {
          // Transform the data to match the expected format
          const transformedCourses = response.data.data.map(enrollment => {
            const course = enrollment.course;
            
            if (!course) return null; // Skip if course data is missing

            // Calculate total lessons from course sections
            const totalLessons = course.sections?.reduce((total, section) => {
              return total + (section.lessons?.count || 0);
            }, 0) || 0;

            // Calculate progress percentage
            const completedCount = enrollment.completedLessons?.length || 0;
            const progress = totalLessons > 0 
              ? Math.round((completedCount / totalLessons) * 100) 
              : 0;

            // Format instructor name
            const instructorName = course.fName && course.lName 
              ? `${course.fName} ${course.lName}`
              : 'Chưa có giảng viên';

            return {
              id: course.course_id,
              title: course.title || 'Chưa có tiêu đề',
              instructor: instructorName,
              image: course.picture_url || 'https://via.placeholder.com/400x300?text=No+Image',
              progress: progress,
              totalLessons: totalLessons,
              completedLessons: completedCount,
              lastAccessed: new Date(enrollment.enrolledAt).toLocaleDateString('vi-VN'),
              duration: course.duration || 'Chưa xác định',
              rating: course.rating || 0,
              enrollmentId: enrollment.enrollmentId,
              courseId: enrollment.courseId
            };
          }).filter(course => course !== null); // Remove null entries

          setEnrolledCourses(transformedCourses);
        }
      } catch (err) {
        console.error('Error fetching enrolled courses:', err);
        setError('Không thể tải danh sách khóa học. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, [isLoaded, isSignedIn, getToken]);


  const tabs = [
    {
      id: 'all',
      label: 'Tất cả khóa học',
      icon: '📚',
      count: enrolledCourses.length
    },
    {
      id: 'in-progress',
      label: 'Đang học',
      icon: '🎯',
      count: enrolledCourses.filter(course => course.progress > 0 && course.progress < 100).length
    },
    {
      id: 'completed',
      label: 'Hoàn thành',
      icon: '✅',
      count: enrolledCourses.filter(course => course.progress === 100).length
    },
    {
      id: 'not-started',
      label: 'Chưa bắt đầu',
      icon: '⭐',
      count: enrolledCourses.filter(course => course.progress === 0).length
    },
  ];

  const getFilteredCourses = () => {
    switch (activeTab) {
      case 'in-progress':
        return enrolledCourses.filter(course => course.progress > 0 && course.progress < 100);
      case 'completed':
        return enrolledCourses.filter(course => course.progress === 100);
      case 'not-started':
        return enrolledCourses.filter(course => course.progress === 0);
      default:
        return enrolledCourses;
    }
  };

  const filteredCourses = getFilteredCourses();
  
  const handleContinueLearning = (courseId) => {
    navigate(`/course/${courseId}/content`);
  };

  const getProgressColor = (progress) => {
    return '#10b981'; // Green
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Đang tải khóa học...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>❌ {error}</p>
          <button onClick={() => window.location.reload()} className={styles.retryBtn}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Empty state (no enrollments)
  if (enrolledCourses.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Khóa học của tôi</h1>
          <p className={styles.subtitle}>Tiếp tục học tập và phát triển kỹ năng của bạn</p>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📚</div>
          <h2>Bạn chưa đăng ký khóa học nào</h2>
          <p>Khám phá các khóa học để bắt đầu hành trình học tập của bạn</p>
          <button onClick={() => navigate('/')} className={styles.exploreBtn}>
            Khám phá khóa học
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Khóa học của tôi</h1>
        <p className={styles.subtitle}>Tiếp tục học tập và phát triển kỹ năng của bạn</p>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <h3 className={styles.statNumber}>{enrolledCourses.length}</h3>
          <p className={styles.statLabel}>Khóa học đã đăng ký</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.statNumber}>
            {enrolledCourses.filter(course => course.progress === 100).length}
          </h3>
          <p className={styles.statLabel}>Khóa học hoàn thành</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.statNumber}>
            {enrolledCourses.length > 0 
              ? Math.round(enrolledCourses.reduce((acc, course) => acc + course.progress, 0) / enrolledCourses.length)
              : 0}%
          </h3>
          <p className={styles.statLabel}>Tiến độ trung bình</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.statNumber}>
            {enrolledCourses.reduce((acc, course) => acc + course.completedLessons, 0)}
          </h3>
          <p className={styles.statLabel}>Bài học đã hoàn thành</p>
        </div>
      </div>

      <TabSwitch 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className={styles.coursesGrid}>
        {filteredCourses.length > 0 ? (
          filteredCourses.map(course => (
            <EnrolledCard
              key={course.id}
              course={course}
              onContinueLearning={handleContinueLearning}
              getProgressColor={getProgressColor}
            />
          ))
        ) : (
          <div className={styles.emptyCourses}>
            <p>Không có khóa học nào trong danh mục này.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyLearning;