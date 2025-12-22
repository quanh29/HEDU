import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import styles from './MyLearning.module.css';
import EnrolledCard from '../../components/EnrolledCard/EnrolledCard';
import TabSwitch from '../../components/TabSwitch/TabSwitch';
import useDocumentTitle from '../../hooks/useDocumentTitle';

function MyLearning() {
  useDocumentTitle('Khóa học của tôi');
  
  const navigate = useNavigate();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [refundReason, setRefundReason] = useState('');

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
              enrollmentId: enrollment._id || enrollment.enrollmentId,
              courseId: course.course_id
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

  const handleRequestRefund = async (course) => {
    console.log('Opening refund modal for course:', course);
    
    if (!course.enrollmentId || !course.courseId) {
      toast.error('Không thể xác định thông tin khóa học. Vui lòng thử lại.');
      console.error('Missing enrollmentId or courseId:', { enrollmentId: course.enrollmentId, courseId: course.courseId });
      return;
    }
    
    setSelectedCourse(course);
    setRefundReason('');
    setShowRefundModal(true);
  };

  const handleSubmitRefund = async () => {
    if (!refundReason.trim()) {
      toast.error('Vui lòng nhập lý do hoàn tiền');
      return;
    }

    if (refundReason.trim().length < 10) {
      toast.error('Lý do hoàn tiền phải có ít nhất 10 ký tự');
      return;
    }

    try {
      const token = await getToken();
      console.log('Sending refund request with data:', {
        enrollmentId: selectedCourse.enrollmentId,
        courseId: selectedCourse.courseId,
        reason: refundReason.trim()
      });
      
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/refund/request`,
        {
          enrollmentId: selectedCourse.enrollmentId,
          courseId: selectedCourse.courseId,
          reason: refundReason.trim()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('Refund request response:', response.data);
      
      if (response.data.success) {
        toast.success('Yêu cầu hoàn tiền đã được gửi thành công!');
        setShowRefundModal(false);
        setSelectedCourse(null);
        setRefundReason('');
      }
    } catch (error) {
      console.error('Error requesting refund:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Không thể gửi yêu cầu hoàn tiền. Vui lòng thử lại sau.';
      toast.error(errorMessage);
    }
  };

  const handleCloseRefundModal = () => {
    setShowRefundModal(false);
    setSelectedCourse(null);
    setRefundReason('');
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
              onRequestRefund={handleRequestRefund}
            />
          ))
        ) : (
          <div className={styles.emptyCourses}>
            <p>Không có khóa học nào trong danh mục này.</p>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {showRefundModal && selectedCourse && (
        <div className={styles.modalOverlay} onClick={handleCloseRefundModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Yêu cầu hoàn tiền</h2>
              <button className={styles.closeButton} onClick={handleCloseRefundModal}>
                ✕
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.courseInfoBox}>
                <img 
                  src={selectedCourse.image} 
                  alt={selectedCourse.title}
                  className={styles.courseImage}
                />
                <div className={styles.courseDetails}>
                  <h3 className={styles.courseTitle}>{selectedCourse.title}</h3>
                  <p className={styles.courseInstructor}>Giảng viên: {selectedCourse.instructor}</p>
                </div>
              </div>

              <div className={styles.refundNotice}>
                <p>⚠️ <strong>Lưu ý quan trọng:</strong></p>
                <ul>
                  <li>Yêu cầu hoàn tiền sẽ được xem xét và xử lý trong vòng 7-14 ngày làm việc</li>
                  <li>Sau khi yêu cầu được chấp nhận, bạn sẽ không còn quyền truy cập khóa học này</li>
                  <li>Vui lòng mô tả rõ lý do để chúng tôi xử lý nhanh chóng hơn</li>
                </ul>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="refundReason" className={styles.label}>
                  Lý do hoàn tiền <span className={styles.required}>*</span>
                </label>
                <textarea
                  id="refundReason"
                  className={styles.textarea}
                  placeholder="Vui lòng mô tả lý do bạn muốn hoàn tiền (tối thiểu 10 ký tự)..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={5}
                  maxLength={500}
                />
                <div className={styles.charCount}>
                  {refundReason.length}/500 ký tự
                </div>
              </div>

              <div className={styles.modalActions}>
                <button 
                  className={styles.cancelButton} 
                  onClick={handleCloseRefundModal}
                >
                  Hủy bỏ
                </button>
                <button 
                  className={styles.submitButton} 
                  onClick={handleSubmitRefund}
                  disabled={!refundReason.trim() || refundReason.trim().length < 10}
                >
                  Gửi yêu cầu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyLearning;