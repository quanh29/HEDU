import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import styles from './CourseManagement.module.css';
import MuxVideoPlayer from '../../../../components/MuxVideoPlayer/MuxVideoPlayer';
import { 
  Video, 
  FileText, 
  HelpCircle, 
  Eye, 
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  Paperclip,
  BookOpen
} from 'lucide-react';
import { 
  getAllCoursesForAdmin,
  getCourseStatistics,
  getCourseByIdForAdmin,
  getFullCourseDataForAdmin,
  updateCourseStatus, 
  deleteCourseByAdmin
} from '../../../../services/adminService';

// Silence console.log in this module (temporary; easiest way to "comment out" without changing every line)
// To restore logs, remove the next two lines or set console.log = _origConsoleLog;
// const _origConsoleLog = console.log;
// console.log = () => {};

const CourseManagement = () => {
  const { getToken } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [actionType, setActionType] = useState('');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showLessonModal, setShowLessonModal] = useState(false);

  const categories = ['all', 'Lập trình', 'Marketing', 'Thiết kế', 'Kinh doanh'];

  // Fetch courses from backend
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const data = await getAllCoursesForAdmin(token);
      console.log('Fetched courses:', data);
      setCourses(data || []);
    } catch (err) {
      console.error('Error loading courses:', err);
      setError('Không thể tải danh sách khóa học. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = courses.filter(course => {
      const matchesSearch = 
        course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || course.course_status === statusFilter;
      
      const matchesCategory = categoryFilter === 'all' || 
        (course.categories && course.categories.some(cat => cat.title === categoryFilter));
      
      return matchesSearch && matchesStatus && matchesCategory;
    });

    setFilteredCourses(filtered);
  }, [courses, searchTerm, statusFilter, categoryFilter]);

  const handleStatusChange = async (courseId, newStatus) => {
    try {
      const token = await getToken();
      await updateCourseStatus(token, courseId, newStatus);
      // Update local state
      setCourses(prev => 
        prev.map(course => 
          course.course_id === courseId 
            ? { ...course, course_status: newStatus }
            : course
        )
      );
      alert('Cập nhật trạng thái thành công!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Không thể cập nhật trạng thái. Vui lòng thử lại.');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khóa học này?')) {
      try {
        const token = await getToken();
        await deleteCourseByAdmin(token, courseId);
        setCourses(prev => prev.filter(course => course.course_id !== courseId));
        alert('Xóa khóa học thành công!');
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Không thể xóa khóa học. Vui lòng thử lại.');
      }
    }
  };

  const handleViewReports = (course) => {
    setSelectedCourse(course);
    setActionType('reports');
  };

  const handleViewDetails = async (course) => {
    try {
      const token = await getToken();
      const response = await getFullCourseDataForAdmin(token, course.course_id);
      console.log('Full course data:', response);
      setSelectedCourse(response.course || response);
      setActionType('details');
    } catch (error) {
      console.error('Error loading course details:', error);
      alert('Không thể tải chi tiết khóa học.');
    }
  };

  const getContentTypeIcon = (contentType) => {
    switch (contentType) {
      case 'video':
        return <Video size={16} />;
      case 'material':
        return <FileText size={16} />;
      case 'quiz':
        return <HelpCircle size={16} />;
      default:
        return <BookOpen size={16} />;
    }
  };

  const getContentTypeLabel = (contentType) => {
    switch (contentType) {
      case 'video':
        return 'Video';
      case 'material':
        return 'Tài liệu';
      case 'quiz':
        return 'Quiz';
      default:
        return 'Nội dung';
    }
  };

  const handleViewLesson = (lesson) => {
    console.log('Opening lesson modal:', lesson);
    console.log('Lesson type:', lesson.contentType);
    console.log('Video ID:', lesson.videoId || lesson._id);
    setSelectedLesson(lesson);
    setShowLessonModal(true);
  };

  const closeLessonModal = () => {
    setShowLessonModal(false);
    setSelectedLesson(null);
  };

  const handleDownloadMaterial = async (materialId, fileName) => {
    try {
      console.log('🔽 [Download Material] Starting download...');
      console.log('   Material ID:', materialId);
      console.log('   File Name:', fileName);
      
      const token = await getToken();
      console.log('   Token obtained:', !!token);
      
      const url = `${import.meta.env.VITE_BASE_URL}/api/admin/materials/${materialId}/signed-url`;
      console.log('   Request URL:', url);
      
      // Call admin API to get signed URL
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expiresIn: 3600 })
      });

      console.log('   Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('   Error response:', errorData);
        throw new Error('Failed to generate download URL');
      }

      const data = await response.json();
      console.log('   Signed URL received:', !!data.signedUrl);
      
      // Open signed URL in new tab
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
      
      console.log('✅ Material download initiated');
    } catch (error) {
      console.error('❌ Error downloading material:', error);
      alert('Không thể tải tài liệu. Vui lòng thử lại.');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: 'Nháp', className: 'draft' },
      pending: { label: 'Chờ duyệt', className: 'pending' },
      approved: { label: 'Đã duyệt', className: 'approved' },
      rejected: { label: 'Từ chối', className: 'rejected' },
      published: { label: 'Đang hoạt động', className: 'published' },
      hidden: { label: 'Đã ẩn', className: 'hidden' },
      suspended: { label: 'Tạm dừng', className: 'suspended' }
    };
    
    const config = statusConfig[status] || { label: 'Unknown', className: 'unknown' };
    return <span className={`${styles.statusBadge} ${styles[config.className]}`}>{config.label}</span>;
  };

  const getInstructorName = (instructor) => {
    if (!instructor) return 'N/A';
    return instructor.full_name || instructor.email || 'N/A';
  };

  const getCategoryNames = (categories) => {
    if (!categories || categories.length === 0) return 'Chưa phân loại';
    return categories.map(cat => cat.title).join(', ');
  };

  if (loading) {
    return (
      <div className={styles.courseManagement}>
        <div className={styles.loading}>Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.courseManagement}>
        <div className={styles.error}>
          {error}
          <button onClick={fetchCourses} className={styles.retryBtn}>Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.courseManagement}>
      <div className={styles.header}>
        <h2>Quản Lý Khóa Học</h2>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span>Tổng khóa học: {courses.length}</span>
          </div>
          <div className={styles.statItem}>
            <span>Đã duyệt: {courses.filter(c => c.course_status === 'approved').length}</span>
          </div>
          <div className={styles.statItem}>
            <span>Chờ duyệt: {courses.filter(c => c.course_status === 'pending').length}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Tìm kiếm khóa học hoặc giảng viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterGroup}>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="draft">Nháp</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
            <option value="published">Đang hoạt động</option>
            <option value="hidden">Đã ẩn</option>
            <option value="suspended">Tạm dừng</option>
          </select>
          
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Tất cả danh mục</option>
            {categories.slice(1).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Courses Table */}
      <div className={styles.tableContainer}>
        <table className={styles.coursesTable}>
          <thead>
            <tr>
              <th>Khóa học</th>
              <th>Giảng viên</th>
              <th>Danh mục</th>
              <th>Trạng thái</th>
              <th>Học viên</th>
              <th>Doanh thu</th>
              <th>Đánh giá</th>
              <th>Báo cáo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.length === 0 ? (
              <tr>
                <td colSpan="9" className={styles.noData}>
                  Không tìm thấy khóa học nào
                </td>
              </tr>
            ) : (
              filteredCourses.map(course => (
                <tr key={course.course_id} className={course.reports > 0 ? styles.reportedRow : ''}>
                  <td>
                    <div className={styles.courseInfo}>
                      <strong>{course.title}</strong>
                      <small>ID: {course.course_id}</small>
                    </div>
                  </td>
                  <td>{getInstructorName(course.instructor)}</td>
                  <td>{getCategoryNames(course.categories)}</td>
                  <td>{getStatusBadge(course.course_status)}</td>
                  <td>{course.students || 0}</td>
                  <td>{(course.currentPrice || 0).toLocaleString('vi-VN')} ₫</td>
                  <td>
                    <div className={styles.rating}>
                      <Star size={16} fill="#f59e0b" color="#f59e0b" /> {course.rating || 0}
                    </div>
                  </td>
                  <td>
                    <div className={styles.reports}>
                      {course.reports > 0 ? (
                        <span className={styles.reportCount} onClick={() => handleViewReports(course)}>
                          <AlertTriangle size={16} /> {course.reports}
                        </span>
                      ) : (
                        <span className={styles.noReports}><CheckCircle size={16} /> 0</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button 
                        className={styles.viewBtn}
                        onClick={() => handleViewDetails(course)}
                      >
                        Xem
                      </button>
                      
                      <select 
                        value={course.course_status}
                        onChange={(e) => handleStatusChange(course.course_id, e.target.value)}
                        className={styles.statusSelect}
                      >
                        <option value="draft">Nháp</option>
                        <option value="pending">Chờ duyệt</option>
                        <option value="approved">Duyệt</option>
                        <option value="rejected">Từ chối</option>
                        <option value="suspended">Tạm dừng</option>
                      </select>
                      
                      <button 
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteCourse(course.course_id)}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Course Details/Reports */}
      {selectedCourse && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>
                {actionType === 'reports' ? 'Báo cáo vi phạm' : 'Chi tiết khóa học'}
              </h3>
              <button 
                className={styles.closeBtn}
                onClick={() => setSelectedCourse(null)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <h4>{selectedCourse.title}</h4>
              <p><strong>Giảng viên:</strong> {getInstructorName(selectedCourse.instructor)}</p>
              <p><strong>Danh mục:</strong> {getCategoryNames(selectedCourse.categories)}</p>
              <p><strong>Trạng thái:</strong> {getStatusBadge(selectedCourse.course_status)}</p>
              <p><strong>Giá gốc:</strong> {(selectedCourse.originalPrice || 0).toLocaleString('vi-VN')} ₫</p>
              <p><strong>Giá hiện tại:</strong> {(selectedCourse.currentPrice || 0).toLocaleString('vi-VN')} ₫</p>
              <p><strong>Số học viên:</strong> {selectedCourse.students || 0}</p>
              <p><strong>Đánh giá:</strong> <Star size={16} fill="#f59e0b" color="#f59e0b" /> {selectedCourse.rating || 0} ({selectedCourse.reviewCount || 0} đánh giá)</p>
              
              {selectedCourse.des && (
                <div className={styles.description}>
                  <p><strong>Mô tả:</strong></p>
                  <p>{selectedCourse.des}</p>
                </div>
              )}

              {/* Hiển thị nội dung khóa học (Sections & Lessons) */}
              {actionType === 'details' && selectedCourse.sections && selectedCourse.sections.length > 0 && (
                <div className={styles.courseContent}>
                  <h5>Nội dung khóa học</h5>
                  <div className={styles.contentStats}>
                    <span><BookOpen size={16} /> {selectedCourse.sections.length} chương</span>
                    <span><Video size={16} /> {selectedCourse.sections.reduce((total, section) => 
                      total + (section.lessons?.filter(l => l.contentType === 'video').length || 0), 0)} videos</span>
                    <span><FileText size={16} /> {selectedCourse.sections.reduce((total, section) => 
                      total + (section.lessons?.filter(l => l.contentType === 'material').length || 0), 0)} tài liệu</span>
                    <span><HelpCircle size={16} /> {selectedCourse.sections.reduce((total, section) => 
                      total + (section.lessons?.filter(l => l.contentType === 'quiz').length || 0), 0)} quiz</span>
                  </div>
                  
                  <div className={styles.sectionsList}>
                    {selectedCourse.sections.map((section, sectionIndex) => (
                      <div key={section._id} className={styles.sectionItem}>
                        <div className={styles.sectionHeader}>
                          <h6>Chương {sectionIndex + 1}: {section.title}</h6>
                          <span className={styles.lessonCount}>
                            {section.lessons?.length || 0} bài học
                          </span>
                        </div>
                        
                        {section.lessons && section.lessons.length > 0 && (
                          <div className={styles.lessonsList}>
                            {section.lessons.map((lesson, lessonIndex) => (
                              <div key={lesson._id} className={styles.lessonItem}>
                                <div className={styles.lessonInfo}>
                                  <span className={styles.lessonIcon}>
                                    {getContentTypeIcon(lesson.contentType)}
                                  </span>
                                  <div className={styles.lessonDetails}>
                                    <span className={styles.lessonTitle}>
                                      {lessonIndex + 1}. {lesson.title}
                                    </span>
                                    <span className={styles.lessonType}>
                                      {getContentTypeLabel(lesson.contentType)}
                                    </span>
                                  </div>
                                  <button 
                                    className={styles.viewLessonBtn}
                                    onClick={() => handleViewLesson(lesson)}
                                    title="Xem nội dung"
                                  >
                                    <Eye size={16} /> Xem
                                  </button>
                                </div>
                                
                                {/* Hiển thị thông tin chi tiết theo loại */}
                                {lesson.contentType === 'video' && (
                                  <div className={styles.lessonMeta}>
                                    {lesson.duration && <span><Clock size={14} /> {lesson.duration}s</span>}
                                    {lesson.status && (
                                      <span className={`${styles.videoStatus} ${styles[lesson.status]}`}>
                                        {lesson.status}
                                      </span>
                                    )}
                                  </div>
                                )}
                                
                                {lesson.contentType === 'material' && lesson.fileName && (
                                  <div className={styles.lessonMeta}>
                                    <span><Paperclip size={14} /> {lesson.fileName}</span>
                                  </div>
                                )}
                                
                                {lesson.contentType === 'quiz' && lesson.questions && (
                                  <div className={styles.lessonMeta}>
                                    <span><HelpCircle size={14} /> {lesson.questions.length} câu hỏi</span>
                                  </div>
                                )}
                                
                                {lesson.description && (
                                  <div className={styles.lessonDescription}>
                                    {lesson.description}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCourse.sections && selectedCourse.sections.length > 0 && actionType !== 'details' && (
                <div className={styles.sectionsInfo}>
                  <p><strong>Số chương:</strong> {selectedCourse.sections.length}</p>
                  <p><strong>Tổng bài học:</strong> {selectedCourse.sections.reduce((total, section) => total + (section.lessons?.length || 0), 0)}</p>
                </div>
              )}
              
              {actionType === 'reports' && selectedCourse.reports > 0 && (
                <div className={styles.reportsSection}>
                  <h5>Chi tiết báo cáo ({selectedCourse.reports} báo cáo)</h5>
                  <div className={styles.reportsList}>
                    <div className={styles.reportItem}>
                      <p><strong>Loại:</strong> Nội dung không phù hợp</p>
                      <p><strong>Người báo cáo:</strong> user123@email.com</p>
                      <p><strong>Lý do:</strong> Nội dung khóa học không đúng với mô tả</p>
                      <p><strong>Ngày:</strong> 2024-01-14</p>
                    </div>
                  </div>
                  
                  <div className={styles.reportActions}>
                    <button 
                      className={styles.warningBtn}
                      onClick={() => {
                        alert('Đã gửi cảnh báo đến giảng viên');
                        setSelectedCourse(null);
                      }}
                    >
                      Gửi cảnh báo
                    </button>
                    <button 
                      className={styles.suspendBtn}
                      onClick={() => {
                        handleStatusChange(selectedCourse.course_id, 'suspended');
                        setSelectedCourse(null);
                      }}
                    >
                      Tạm dừng khóa học
                    </button>
                    <button 
                      className={styles.rejectBtn}
                      onClick={() => {
                        handleStatusChange(selectedCourse.course_id, 'rejected');
                        setSelectedCourse(null);
                      }}
                    >
                      Từ chối khóa học
                    </button>
                  </div>
                </div>
              )}

              {actionType === 'details' && selectedCourse.course_status === 'pending' && (
                <div className={styles.approvalActions}>
                  <button 
                    className={styles.approveBtn}
                    onClick={() => {
                      handleStatusChange(selectedCourse.course_id, 'approved');
                      setSelectedCourse(null);
                    }}
                  >
                    Phê duyệt khóa học
                  </button>
                  <button 
                    className={styles.rejectBtn}
                    onClick={() => {
                      const reason = prompt('Nhập lý do từ chối:');
                      if (reason) {
                        handleStatusChange(selectedCourse.course_id, 'rejected');
                        setSelectedCourse(null);
                      }
                    }}
                  >
                    Từ chối
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal for Lesson Content (Video/Material/Quiz) */}
      {showLessonModal && selectedLesson && (
        <div className={styles.modal}>
          <div className={`${styles.modalContent} ${styles.lessonModalContent}`}>
            <div className={styles.modalHeader}>
              <h3>
                {getContentTypeIcon(selectedLesson.contentType)} {selectedLesson.title}
              </h3>
              <button 
                className={styles.closeBtn}
                onClick={closeLessonModal}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {/* Video Player */}
              {selectedLesson.contentType === 'video' && (
                <div className={styles.videoPreview}>
                  {selectedLesson.videoId ? (
                    <div className={styles.muxPlayerWrapper}>
                      <MuxVideoPlayer
                        videoId={selectedLesson.videoId}
                        courseId={selectedCourse.course_id}
                        autoPlay={false}
                        onReady={(data) => {
                          console.log('Video ready:', data);
                        }}
                        onEnded={() => {
                          console.log('Video ended');
                        }}
                      />
                    </div>
                  ) : (
                    <div className={styles.noContent}>
                      <p>Video chưa sẵn sàng để phát</p>
                      {selectedLesson.status && (
                        <span className={`${styles.videoStatus} ${styles[selectedLesson.status]}`}>
                          Status: {selectedLesson.status}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {selectedLesson.description && (
                    <div className={styles.contentDescription}>
                      <h4>Mô tả:</h4>
                      <p>{selectedLesson.description}</p>
                    </div>
                  )}
                  
                  <div className={styles.contentInfo}>
                    {selectedLesson.duration && (
                      <p><strong>Thời lượng:</strong> {selectedLesson.duration}</p>
                    )}
                    {selectedLesson.assetId && (
                      <p><strong>Asset ID:</strong> {selectedLesson.assetId}</p>
                    )}
                    {selectedLesson.uploadId && (
                      <p><strong>Upload ID:</strong> {selectedLesson.uploadId}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Material Download */}
              {selectedLesson.contentType === 'material' && (
                <div className={styles.materialPreview}>
                  {selectedLesson.contentUrl ? (
                    <>
                      <div className={styles.materialInfo}>
                        <p><strong>Tên file:</strong> {selectedLesson.fileName || 'N/A'}</p>
                        <p><strong>Loại file:</strong> {selectedLesson.fileName ? selectedLesson.fileName.split('.').pop()?.toUpperCase() : 'N/A'}</p>
                        <p><strong>Public ID:</strong> {selectedLesson.contentUrl}</p>
                      </div>
                      
                      <div className={styles.materialViewer}>
                        {(() => {
                          const publicId = selectedLesson.contentUrl;
                          const fileName = selectedLesson.fileName || 'document';
                          const materialId = selectedLesson.materialId || selectedLesson.draftMaterialId || selectedLesson._id;
                          const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
                          const fileExtension = fileName ? fileName.split('.').pop()?.toUpperCase() : 'File';
                          
                          console.log('📁 Material data:', { 
                            lessonId: selectedLesson._id, 
                            materialId: selectedLesson.materialId,
                            draftMaterialId: selectedLesson.draftMaterialId,
                            usedMaterialId: materialId,
                            publicId, 
                            fileName 
                          });
                          
                          return (
                            <div className={styles.downloadPrompt}>
                              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                <FileText size={64} style={{ color: '#3b82f6', marginBottom: '15px' }} />
                                <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                                  {fileName}
                                </p>
                                <p style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}>
                                  Định dạng: {fileExtension}
                                </p>
                                {selectedLesson.description && (
                                  <p style={{ fontSize: '14px', color: '#6c757d', marginTop: '10px', fontStyle: 'italic' }}>
                                    {selectedLesson.description}
                                  </p>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button 
                                  onClick={() => handleDownloadMaterial(materialId, fileName)}
                                  className={styles.downloadBtn}
                                  style={{ 
                                    padding: '12px 24px',
                                    fontSize: '16px',
                                    fontWeight: '500',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    border: 'none',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Paperclip size={20} /> Tải xuống tài liệu
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </>
                  ) : (
                    <div className={styles.noContent}>
                      <p>Không tìm thấy nội dung tài liệu</p>
                    </div>
                  )}
                </div>
              )}

              {/* Quiz Viewer */}
              {selectedLesson.contentType === 'quiz' && (
                <div className={styles.quizPreview}>
                  {selectedLesson.description && (
                    <div className={styles.quizDescription}>
                      <h4>Mô tả:</h4>
                      <p>{selectedLesson.description}</p>
                    </div>
                  )}
                  
                  {selectedLesson.questions && selectedLesson.questions.length > 0 ? (
                    <div className={styles.questionsList}>
                      <h4>Danh sách câu hỏi ({selectedLesson.questions.length} câu):</h4>
                      {selectedLesson.questions.map((question, index) => (
                        <div key={index} className={styles.questionItem}>
                          <div className={styles.questionHeader}>
                            <span className={styles.questionNumber}>Câu {index + 1}</span>
                            {question.type && (
                              <span className={styles.questionType}>
                                {question.type === 'multiple-choice' ? 'Trắc nghiệm' : 'Tự luận'}
                              </span>
                            )}
                          </div>
                          
                          <p className={styles.questionText}>{question.questionText || question.question}</p>
                          
                          {question.options && question.options.length > 0 && (
                            <div className={styles.optionsList}>
                              {question.options.map((option, optionIndex) => (
                                <div 
                                  key={optionIndex} 
                                  className={`${styles.optionItem} ${
                                    question.correctAnswer === optionIndex ? styles.correctAnswer : ''
                                  }`}
                                >
                                  <span className={styles.optionLabel}>
                                    {String.fromCharCode(65 + optionIndex)}.
                                  </span>
                                  <span className={styles.optionText}>{option}</span>
                                  {question.correctAnswer === optionIndex && (
                                    <span className={styles.correctBadge}><CheckCircle size={14} /> Đáp án đúng</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {question.explanation && (
                            <div className={styles.explanation}>
                              <strong>Giải thích:</strong>
                              <p>{question.explanation}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.noContent}>
                      <p>Quiz chưa có câu hỏi</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
