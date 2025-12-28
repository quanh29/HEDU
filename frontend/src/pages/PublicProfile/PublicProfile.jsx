import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Calendar, Briefcase, BookOpen, AlertCircle } from 'lucide-react';
import axios from 'axios';
import styles from './PublicProfile.module.css';
import Carousel from '../../components/Carousel/Carousel.jsx';

const PublicProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPublicProfile();
  }, [userId]);

  const fetchPublicProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/user/public-profile/${userId}`
      );

      if (response.data.success) {
        setProfile(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching public profile:', error);
      setError(error.response?.data?.message || 'Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Không có thông tin';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleCourseClick = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <AlertCircle className={styles.errorIcon} />
          <h2>Đã xảy ra lỗi</h2>
          <p>{error}</p>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <AlertCircle className={styles.errorIcon} />
          <h2>Không tìm thấy người dùng</h2>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const { user, courses } = profile;

  // Format courses for Carousel component
  const formattedCourses = courses.map(course => ({
    courseId: course._id,
    title: course.title,
    instructors: [user.full_name],
    rating: 0,
    reviewCount: 0,
    originalPrice: course.original_price,
    currentPrice: course.current_price,
    image: course.thumbnail_url
  }));

  return (
    <div className={styles.container}>
      <div className={styles.profileWrapper}>
        {/* Header Section */}
        <div className={styles.header}>
          <div className={styles.avatarSection}>
            {user.profile_image_url ? (
              <img
                src={user.profile_image_url}
                alt={user.full_name}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <User size={80} />
              </div>
            )}
          </div>

          <div className={styles.userInfo}>
            <h1 className={styles.fullName}>{user.full_name}</h1>
            {user.headline && (
              <p className={styles.headline}>{user.headline}</p>
            )}

            <div className={styles.metaInfo}>
              {user.is_male !== null && user.is_male !== undefined && (
                <div className={styles.metaItem}>
                  <User size={16} />
                  <span>{user.is_male ? 'Nam' : 'Nữ'}</span>
                </div>
              )}
              {user.dob && (
                <div className={styles.metaItem}>
                  <Calendar size={16} />
                  <span>{formatDate(user.dob)}</span>
                </div>
              )}
              {courses.length > 0 && (
                <div className={styles.metaItem}>
                  <Briefcase size={16} />
                  <span>Giảng viên</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bio Section */}
        {user.bio && (
          <div className={styles.bioSection}>
            <h2 className={styles.sectionTitle}>Giới thiệu</h2>
            <p className={styles.bioText}>{user.bio}</p>
          </div>
        )}

        {/* Courses Section */}
        {courses.length > 0 && (
          <div className={styles.coursesSection}>
            <div className={styles.coursesSectionHeader}>
              <BookOpen size={24} />
              <h2 className={styles.sectionTitle}>
                Khóa học đã đăng ({courses.length})
              </h2>
            </div>

            <Carousel 
              courses={formattedCourses}
              title=""
            />
          </div>
        )}

        {/* Empty State */}
        {courses.length === 0 && (
          <div className={styles.emptyState}>
            <BookOpen size={48} className={styles.emptyIcon} />
            <p className={styles.emptyText}>Người dùng chưa đăng khóa học nào</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;
