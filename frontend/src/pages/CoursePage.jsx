import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Carousel from '../components/Carousel/Carousel';
import { courses as relatedCourses } from '../assets/dummyData';
import RatingListModal from '../components/RatingListModal/RatingListModal';
import axios from 'axios';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useUser } from '@clerk/clerk-react';
import { useCart } from '../context/CartContext';

function CoursePage() {
  // Lấy params từ URL - chỉ courseId (no slug)
  const { courseId: paramCourseId } = useParams();
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const { addToCart } = useCart();

  // State management
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Set dynamic title based on course name
  useDocumentTitle(course?.title || 'Khóa học');

  // Function để convert title to slug
  const convertToSlug = (title) => {
    if (!title) return '';
    
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // courseId directly from route param
  const courseId = paramCourseId ? decodeURIComponent(paramCourseId) : null;

  // Fetch course data từ backend
  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        setError('ID khóa học không hợp lệ');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching course with ID:', courseId);
        
        // Gọi API getFullCourseContent với endpoint /full (dữ liệu công khai)
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/course/${courseId}/full`);
        
        console.log('Course data received:', response.data);
        setCourse(response.data);

        // No slug redirect: URL now uses only courseId
      } catch (err) {
        console.error('Error fetching course:', err);
        if (err.response?.status === 404) {
          setError('Không tìm thấy khóa học');
        } else {
          setError('Có lỗi xảy ra khi tải dữ liệu khóa học');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, navigate]);

  // Format giá tiền
  const formatPrice = (price) => {
    if (price === null || price === undefined || price === '') return '';
    const num = Number(price);
    if (Number.isNaN(num)) return price + '₫';
    return new Intl.NumberFormat('en-US').format(num) + '₫';
  };

  // State cho dropdown curriculum
  const [openSections, setOpenSections] = React.useState([]);

  // Toggle mở/đóng section
  const handleToggleSection = idx => {
    setOpenSections(prev =>
      prev.includes(idx)
        ? prev.filter(i => i !== idx)
        : [...prev, idx]
    );
  };

  // Handler for "Mua ngay" button
  const handleBuyNow = async () => {
    if (!isSignedIn) {
      navigate('/auth/login');
      return;
    }

    if (!courseId) {
      console.warn('Missing courseId for purchase');
      return;
    }

    // Navigate to checkout with single course, bypassing cart
    navigate('/checkout', {
      state: {
        buyNow: true,
        course: {
          courseId: courseId,
          title: courseData?.title,
          picture_url: courseData?.thumbnail,
          instructor_name: courseData?.instructors?.[0]?.fullName || 'Giảng viên',
          currentPrice: courseData?.currentPrice,
          originalPrice: courseData?.originalPrice
        }
      }
    });
  };

  // Handler for "Thêm vào giỏ hàng" button
  const handleAddToCart = async () => {
    if (!isSignedIn) {
      navigate('/auth/login');
      return;
    }

    if (!courseId) {
      console.warn('Missing courseId for cart addition');
      return;
    }

    const success = await addToCart(courseId);
    if (success) {
      alert('Đã thêm khóa học vào giỏ hàng!');
    } else {
      alert('Có lỗi xảy ra khi thêm vào giỏ hàng');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ background: '#f8f9fa', minHeight: '100vh', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', color: '#333', marginBottom: '1rem' }}>Đang tải khóa học...</div>
          <div style={{ fontSize: '1rem', color: '#666' }}>Vui lòng chờ trong giây lát</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ background: '#f8f9fa', minHeight: '100vh', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', color: '#e74c3c', marginBottom: '1rem' }}>Có lỗi xảy ra</div>
          <div style={{ fontSize: '1rem', color: '#666', marginBottom: '2rem' }}>{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              padding: '0.75rem 1.5rem', 
              background: '#333', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer' 
            }}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // No course found
  if (!course) {
    return (
      <div style={{ background: '#f8f9fa', minHeight: '100vh', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', color: '#666', marginBottom: '1rem' }}>Không tìm thấy khóa học</div>
          <a href="/course/search" style={{ color: '#333', textDecoration: 'none', fontWeight: 600 }}>← Quay lại trang tìm kiếm</a>
        </div>
      </div>
    );
  }

  // Extract course data từ backend response
  const courseData = course?.course || course;
  const sections = course?.sections || [];

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginTop: 70, padding: '2rem 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
          {/* Breadcrumb */}
          <div style={{ marginBottom: '1rem', color: '#666' }}>
            <a href="/" style={{ fontWeight: 'bold' }}>Trang chủ</a> &gt; <a href="/courses" style={{ fontWeight: 'bold' }}>Lập trình</a> &gt; <a href="/courses" style={{ fontWeight: 'bold' }}>Web Development</a> &gt; {courseData?.title}
          </div>
          
          {/* Main Layout with Sidebar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '3rem', marginBottom: '3rem', marginLeft: '-18vw', paddingLeft: '2rem' }}>
            {/* Left Column - Main Content */}
            <div>
              {/* Course Layout */}
              <div style={{ marginBottom: '3rem' }}>
                {/* Course Main Info */}
                <div style={{ background: 'white', borderRadius: 15, padding: '2rem', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
                  <div style={{ width: '100%', height: '45rem', background: 'linear-gradient(45deg, #333, #666)', borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0rem', backgroundImage: `url(${courseData?.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    
                  </div>
                  <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem', color: '#333' }}>{courseData?.title}</h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: '#333' }}>{courseData?.rating}</span>
                      <span style={{ color: '#FFD700', fontSize: '1.2rem' }}>⭐</span>
                      <span 
                        style={{ color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => setShowRatingModal(true)}
                      >
                        ({courseData?.reviewCount?.toLocaleString('vi-VN')} đánh giá)
                      </span>
                    </div>
                    <div style={{ color: '#666' }}>{courseData?.enrollmentCount?.toLocaleString('vi-VN') || 0} học viên</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    {courseData?.tags?.map((tag, idx) => (
                      <span key={idx} style={{ background: '#f8f9fa', color: '#333', padding: '0.3rem 0.8rem', borderRadius: 15, fontSize: '0.8rem', fontWeight: 500, border: '1px solid #ddd' }}>{tag}</span>
                    ))}
                  </div>
                  <p style={{ color: '#555', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '2rem' }}>{courseData?.description}</p>
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ color: '#333', marginBottom: '1rem' }}>Giảng viên:</h3>
                    {courseData?.instructors && courseData.instructors.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {courseData.instructors.map((instructor, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: 10, border: '1px solid #ddd' }}>
                            {instructor.avaUrl ? (
                              <img 
                                src={instructor.avaUrl} 
                                alt={instructor.fullName}
                                style={{ 
                                  width: 60, 
                                  height: 60, 
                                  borderRadius: '50%', 
                                  objectFit: 'cover',
                                  border: '2px solid #ddd'
                                }} 
                              />
                            ) : (
                              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(45deg, #333, #666)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                {instructor.fullName?.charAt(0).toUpperCase() || 'G'}
                              </div>
                            )}
                            <div>
                              <h4 style={{ color: '#333', marginBottom: '0.3rem' }}>{instructor.fullName || 'Giảng viên'}</h4>
                              <p style={{ color: '#666', fontSize: '0.9rem' }}>{instructor.headline || 'Giảng viên chuyên nghiệp'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: 10, border: '1px solid #ddd' }}>
                        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(45deg, #333, #666)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
                          G
                        </div>
                        <div>
                          <h4 style={{ color: '#333', marginBottom: '0.3rem' }}>Giảng viên</h4>
                          <p style={{ color: '#666', fontSize: '0.9rem' }}>Thông tin giảng viên đang được cập nhật...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* What You'll Learn */}
              <div style={{ background: 'white', borderRadius: 15, padding: '2rem', marginBottom: '2rem', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '1.5rem', color: '#333' }}>Những gì bạn sẽ học được</h2>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {courseData?.objectives?.map((obj, idx) => (
                    <li key={idx} style={{ padding: '0.75rem 0', color: '#555', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '1.1rem', lineHeight: 1.6 }}>
                      <span style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '0.1rem' }}>✓</span> {obj}
                    </li>
                  )) || <li style={{ color: '#666' }}>Thông tin mục tiêu học tập đang được cập nhật...</li>}
                </ul>
              </div>

              {/* Requirements */}
              <div style={{ background: 'white', borderRadius: 15, padding: '2rem', marginBottom: '2rem', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '1.5rem', color: '#333' }}>Yêu cầu</h2>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {courseData?.requirements?.map((req, idx) => (
                    <li key={idx} style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1rem' }}>📋</span> {req}
                    </li>
                  )) || <li style={{ color: '#666' }}>Thông tin yêu cầu đang được cập nhật...</li>}
                </ul>
              </div>

              {/* Course Description */}
              <div style={{ background: 'white', borderRadius: 15, padding: '2rem', marginBottom: '2rem', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '1.5rem', color: '#333' }}>Mô tả khóa học</h2>
                <div style={{ lineHeight: 1.8, color: '#555' }}>
                  {courseData?.description ? (
                    <div dangerouslySetInnerHTML={{ __html: courseData.description.replace(/\n/g, '<br/>') }} />
                  ) : (
                    <p style={{ color: '#666' }}>Mô tả khóa học đang được cập nhật...</p>
                  )}
                </div>
              </div>

              {/* Course Curriculum */}
              <div style={{ background: 'white', borderRadius: 15, padding: '2rem', marginBottom: '2rem', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '1.5rem', color: '#333' }}>Nội dung khóa học</h2>
                <div>
                  {sections?.map((section, idx) => {
                    const isOpen = openSections.includes(idx);
                    return (
                      <div key={idx} style={{ border: '1px solid #eee', borderRadius: 8, marginBottom: '1rem', overflow: 'hidden' }}>
                        <div
                          style={{
                            background: isOpen ? '#e3e7ed' : '#f8f9fa',
                            padding: '1rem 1.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'background 0.3s',
                            border: '1px solid #ddd',
                            fontWeight: 600,
                            color: '#333',
                            userSelect: 'none',
                          }}
                          onClick={() => handleToggleSection(idx)}
                          aria-expanded={isOpen}
                        >
                          <span>{section.title}</span>
                          <span style={{ color: '#666', fontSize: '0.9rem', marginLeft: 10 }}>
                            {section.lessons?.length || 0} bài học
                            <span style={{ marginLeft: 16, fontSize: '1.2rem' }}>{isOpen ? '▲' : '▼'}</span>
                          </span>
                        </div>
                        {isOpen && (
                          <div style={{ padding: '0 1.5rem', animation: 'fadeIn 0.3s' }}>
                            {section.lessons?.map((lesson, lidx) => (
                              <div key={lidx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #f0f0f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ color: '#666' }}>
                                    {lesson.contentType === 'video' ? '🎥' : 
                                     lesson.contentType === 'quiz' ? '📝' : 
                                     lesson.contentType === 'material' ? '📄' : '📚'}
                                  </span>
                                  <span>{lesson.title}</span>
                                </div>
                                <span style={{ color: '#999', fontSize: '0.85rem' }}>
                                  {lesson.contentType === 'video' ? 'Video' : 
                                   lesson.contentType === 'quiz' ? 'Quiz' : 
                                   lesson.contentType === 'material' ? 'Tài liệu' : 'Bài học'}
                                </span>
                              </div>
                            )) || <div style={{ padding: '1rem', color: '#666', textAlign: 'center' }}>Chưa có bài học</div>}
                          </div>
                        )}
                      </div>
                    );
                  }) || <div style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>Nội dung khóa học đang được cập nhật...</div>}
                </div>
              </div>

              {/* Related Courses */}
              <div style={{ marginTop: '3rem' }}>
                <div style={{ marginTop: '2rem' }}>
                  <Carousel courses={relatedCourses} title="Khóa học liên quan" />
                </div>
              </div>
            </div>

            {/* Right Column - Course Sidebar */}
            <div style={{ position: 'sticky', top: 100, height: 'fit-content' }}>
              <div style={{ background: 'white', borderRadius: 15, padding: '2rem', boxShadow: '0 5px 15px rgba(0,0,0,0.08)', marginBottom: '2rem' }}>
                {courseData?.originalPrice ? (
                  <>
                    <div style={{ textDecoration: 'line-through', color: '#999', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{formatPrice(courseData.originalPrice)}</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#333', marginBottom: '1rem' }}>{formatPrice(courseData.currentPrice)}</div>
                  </>
                ) : (
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#333', marginBottom: '1rem' }}>{formatPrice(courseData?.currentPrice || 0)}</div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                  <button
                    onClick={handleBuyNow}
                    style={{
                      padding: '1rem 2rem',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: '#333',
                      color: 'white',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#000';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#333';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    Mua ngay
                  </button>
                  <button
                    onClick={handleAddToCart}
                    style={{
                      padding: '1rem 2rem',
                      border: '2px solid #333',
                      borderRadius: 10,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: 'transparent',
                      color: '#333',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#333';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#333';
                    }}
                  >
                    Thêm vào giỏ hàng
                  </button>
                </div>
                <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: 10, border: '1px solid #ddd' }}>
                  <h4 style={{ marginBottom: '1rem', color: '#333', fontWeight: 'bold' }}>Khóa học bao gồm:</h4>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li>📚 {sections?.length || 0} chương học</li>
                    <li>📖 {sections?.reduce((total, section) => total + (section.lessons?.length || 0), 0) || 0} bài học</li>
                    {courseData?.hasPractice && <li>📝 Bài tập thực hành</li>}
                    {courseData?.hasCertificate && <li>🏆 Chứng chỉ hoàn thành</li>}
                    {courseData?.language && <li>🌐 Ngôn ngữ: {courseData.language}</li>}
                    {courseData?.level && <li>📊 Trình độ: {courseData.level}</li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating List Modal */}
      <RatingListModal
        courseId={courseId}
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        totalRatings={courseData?.reviewCount || 0}
        averageRating={courseData?.rating || 0}
      />
    </div>
  );
}

export default CoursePage;