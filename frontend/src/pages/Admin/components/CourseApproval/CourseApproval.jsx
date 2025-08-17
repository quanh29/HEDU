import { useState, useEffect } from 'react';
import styles from './CourseApproval.module.css';

const CourseApproval = () => {
  const [pendingCourses, setPendingCourses] = useState([
    {
      id: 1,
      title: 'React Advanced - Hooks và Context',
      instructor: 'Nguyễn Văn A',
      instructorEmail: 'nguyenvana@email.com',
      category: 'Lập trình',
      price: 599000,
      duration: '25 giờ',
      lessons: 45,
      description: 'Khóa học nâng cao về React với các kiến thức về Hooks, Context API, và Performance Optimization.',
      thumbnail: '/api/placeholder/300/200',
      submitDate: '2024-01-15',
      status: 'pending'
    },
    {
      id: 2,
      title: 'Digital Marketing từ A-Z',
      instructor: 'Trần Thị B',
      instructorEmail: 'tranthib@email.com',
      category: 'Marketing',
      price: 799000,
      duration: '30 giờ',
      lessons: 52,
      description: 'Khóa học toàn diện về Digital Marketing, từ SEO, SEM đến Social Media Marketing.',
      thumbnail: '/api/placeholder/300/200',
      submitDate: '2024-01-14',
      status: 'pending'
    },
    {
      id: 3,
      title: 'UI/UX Design Fundamentals',
      instructor: 'Lê Văn C',
      instructorEmail: 'levanc@email.com',
      category: 'Thiết kế',
      price: 899000,
      duration: '35 giờ',
      lessons: 60,
      description: 'Khóa học cơ bản về thiết kế UI/UX với Figma và Adobe XD.',
      thumbnail: '/api/placeholder/300/200',
      submitDate: '2024-01-13',
      status: 'pending'
    }
  ]);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');

  const handleViewDetails = (course) => {
    setSelectedCourse(course);
  };

  const handleApprove = (courseId) => {
    setPendingCourses(prev => 
      prev.map(course => 
        course.id === courseId 
          ? { ...course, status: 'approved' }
          : course
      )
    );
    setSelectedCourse(null);
    setReviewNote('');
  };

  const handleReject = (courseId) => {
    if (!reviewNote.trim()) {
      alert('Vui lòng nhập lý do từ chối!');
      return;
    }
    
    setPendingCourses(prev => 
      prev.map(course => 
        course.id === courseId 
          ? { ...course, status: 'rejected', reviewNote }
          : course
      )
    );
    setSelectedCourse(null);
    setReviewNote('');
  };

  const filteredCourses = pendingCourses.filter(course => {
    if (filterStatus === 'all') return true;
    return course.status === filterStatus;
  });

  return (
    <div className={styles.courseApproval}>
      <div className={styles.header}>
        <h2>Duyệt Khóa Học</h2>
        <div className={styles.filters}>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className={styles.statusFilter}
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Đã từ chối</option>
          </select>
        </div>
      </div>

      <div className={styles.coursesList}>
        {filteredCourses.map(course => (
          <div key={course.id} className={`${styles.courseCard} ${styles[course.status]}`}>
            <div className={styles.courseImage}>
              <img src={course.thumbnail} alt={course.title} />
              <div className={`${styles.statusBadge} ${styles[course.status]}`}>
                {course.status === 'pending' && 'Chờ duyệt'}
                {course.status === 'approved' && 'Đã duyệt'}
                {course.status === 'rejected' && 'Đã từ chối'}
              </div>
            </div>
            
            <div className={styles.courseInfo}>
              <h3>{course.title}</h3>
              <p className={styles.instructor}>
                Giảng viên: {course.instructor} ({course.instructorEmail})
              </p>
              <div className={styles.courseDetails}>
                <span className={styles.category}>{course.category}</span>
                <span className={styles.price}>{course.price.toLocaleString('vi-VN')} ₫</span>
                <span className={styles.duration}>{course.duration}</span>
                <span className={styles.lessons}>{course.lessons} bài học</span>
              </div>
              <p className={styles.description}>{course.description}</p>
              <p className={styles.submitDate}>
                Ngày gửi: {new Date(course.submitDate).toLocaleDateString('vi-VN')}
              </p>
              
              <div className={styles.actions}>
                <button 
                  className={styles.viewBtn}
                  onClick={() => handleViewDetails(course)}
                >
                  Xem chi tiết
                </button>
                {course.status === 'pending' && (
                  <>
                    <button 
                      className={styles.approveBtn}
                      onClick={() => handleApprove(course.id)}
                    >
                      Phê duyệt
                    </button>
                    <button 
                      className={styles.rejectBtn}
                      onClick={() => handleViewDetails(course)}
                    >
                      Từ chối
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Chi tiết khóa học</h3>
              <button 
                className={styles.closeBtn}
                onClick={() => setSelectedCourse(null)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.courseDetailImage}>
                <img src={selectedCourse.thumbnail} alt={selectedCourse.title} />
              </div>
              
              <div className={styles.courseDetailInfo}>
                <h4>{selectedCourse.title}</h4>
                <p><strong>Giảng viên:</strong> {selectedCourse.instructor}</p>
                <p><strong>Email:</strong> {selectedCourse.instructorEmail}</p>
                <p><strong>Danh mục:</strong> {selectedCourse.category}</p>
                <p><strong>Giá:</strong> {selectedCourse.price.toLocaleString('vi-VN')} ₫</p>
                <p><strong>Thời lượng:</strong> {selectedCourse.duration}</p>
                <p><strong>Số bài học:</strong> {selectedCourse.lessons}</p>
                <p><strong>Mô tả:</strong> {selectedCourse.description}</p>
                
                {selectedCourse.status === 'pending' && (
                  <div className={styles.reviewSection}>
                    <h5>Đánh giá khóa học</h5>
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Nhập ghi chú đánh giá (bắt buộc khi từ chối)..."
                      className={styles.reviewTextarea}
                      rows={4}
                    />
                    
                    <div className={styles.reviewActions}>
                      <button 
                        className={styles.approveBtn}
                        onClick={() => handleApprove(selectedCourse.id)}
                      >
                        Phê duyệt
                      </button>
                      <button 
                        className={styles.rejectBtn}
                        onClick={() => handleReject(selectedCourse.id)}
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>
                )}
                
                {selectedCourse.reviewNote && (
                  <div className={styles.reviewNote}>
                    <h5>Ghi chú đánh giá:</h5>
                    <p>{selectedCourse.reviewNote}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseApproval;
