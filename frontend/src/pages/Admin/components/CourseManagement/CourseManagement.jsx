import { useState, useEffect } from 'react';
import styles from './CourseManagement.module.css';

const CourseManagement = () => {
  const [courses, setCourses] = useState([
    {
      id: 1,
      title: 'JavaScript Fundamentals',
      instructor: 'Nguyễn Văn A',
      category: 'Lập trình',
      status: 'published',
      students: 245,
      revenue: 12450000,
      rating: 4.5,
      reports: 0,
      publishDate: '2024-01-10',
      lastUpdate: '2024-01-15'
    },
    {
      id: 2,
      title: 'PHP và MySQL',
      instructor: 'Trần Thị B',
      category: 'Lập trình',
      status: 'published',
      students: 189,
      revenue: 9450000,
      rating: 4.2,
      reports: 2,
      publishDate: '2024-01-08',
      lastUpdate: '2024-01-12'
    },
    {
      id: 3,
      title: 'Digital Marketing 2024',
      instructor: 'Lê Văn C',
      category: 'Marketing',
      status: 'hidden',
      students: 156,
      revenue: 15600000,
      rating: 3.8,
      reports: 5,
      publishDate: '2024-01-05',
      lastUpdate: '2024-01-14'
    },
    {
      id: 4,
      title: 'Photoshop CC 2024',
      instructor: 'Phạm Thị D',
      category: 'Thiết kế',
      status: 'published',
      students: 234,
      revenue: 11700000,
      rating: 4.7,
      reports: 0,
      publishDate: '2024-01-12',
      lastUpdate: '2024-01-16'
    }
  ]);

  const [filteredCourses, setFilteredCourses] = useState(courses);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [actionType, setActionType] = useState('');

  const categories = ['all', 'Lập trình', 'Marketing', 'Thiết kế', 'Kinh doanh'];

  useEffect(() => {
    let filtered = courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });

    setFilteredCourses(filtered);
  }, [courses, searchTerm, statusFilter, categoryFilter]);

  const handleStatusChange = (courseId, newStatus) => {
    setCourses(prev => 
      prev.map(course => 
        course.id === courseId 
          ? { ...course, status: newStatus, lastUpdate: new Date().toISOString().split('T')[0] }
          : course
      )
    );
  };

  const handleDeleteCourse = (courseId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khóa học này?')) {
      setCourses(prev => prev.filter(course => course.id !== courseId));
    }
  };

  const handleViewReports = (course) => {
    setSelectedCourse(course);
    setActionType('reports');
  };

  const handleViewDetails = (course) => {
    setSelectedCourse(course);
    setActionType('details');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      published: { label: 'Đang hoạt động', className: 'published' },
      hidden: { label: 'Đã ẩn', className: 'hidden' },
      suspended: { label: 'Tạm dừng', className: 'suspended' }
    };
    
    const config = statusConfig[status] || { label: 'Unknown', className: 'unknown' };
    return <span className={`${styles.statusBadge} ${styles[config.className]}`}>{config.label}</span>;
  };

  return (
    <div className={styles.courseManagement}>
      <div className={styles.header}>
        <h2>Quản Lý Khóa Học</h2>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span>Tổng khóa học: {courses.length}</span>
          </div>
          <div className={styles.statItem}>
            <span>Đang hoạt động: {courses.filter(c => c.status === 'published').length}</span>
          </div>
          <div className={styles.statItem}>
            <span>Bị báo cáo: {courses.filter(c => c.reports > 0).length}</span>
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
            {filteredCourses.map(course => (
              <tr key={course.id} className={course.reports > 0 ? styles.reportedRow : ''}>
                <td>
                  <div className={styles.courseInfo}>
                    <strong>{course.title}</strong>
                    <small>Cập nhật: {new Date(course.lastUpdate).toLocaleDateString('vi-VN')}</small>
                  </div>
                </td>
                <td>{course.instructor}</td>
                <td>{course.category}</td>
                <td>{getStatusBadge(course.status)}</td>
                <td>{course.students}</td>
                <td>{course.revenue.toLocaleString('vi-VN')} ₫</td>
                <td>
                  <div className={styles.rating}>
                    ⭐ {course.rating}
                  </div>
                </td>
                <td>
                  <div className={styles.reports}>
                    {course.reports > 0 ? (
                      <span className={styles.reportCount} onClick={() => handleViewReports(course)}>
                        ⚠️ {course.reports}
                      </span>
                    ) : (
                      <span className={styles.noReports}>✅ 0</span>
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
                      value={course.status}
                      onChange={(e) => handleStatusChange(course.id, e.target.value)}
                      className={styles.statusSelect}
                    >
                      <option value="published">Hoạt động</option>
                      <option value="hidden">Ẩn</option>
                      <option value="suspended">Tạm dừng</option>
                    </select>
                    
                    <button 
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteCourse(course.id)}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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
              <p><strong>Giảng viên:</strong> {selectedCourse.instructor}</p>
              <p><strong>Danh mục:</strong> {selectedCourse.category}</p>
              <p><strong>Trạng thái:</strong> {getStatusBadge(selectedCourse.status)}</p>
              <p><strong>Số học viên:</strong> {selectedCourse.students}</p>
              <p><strong>Doanh thu:</strong> {selectedCourse.revenue.toLocaleString('vi-VN')} ₫</p>
              <p><strong>Đánh giá:</strong> ⭐ {selectedCourse.rating}</p>
              
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
                    <div className={styles.reportItem}>
                      <p><strong>Loại:</strong> Vi phạm bản quyền</p>
                      <p><strong>Người báo cáo:</strong> instructor456@email.com</p>
                      <p><strong>Lý do:</strong> Sử dụng tài liệu không được phép</p>
                      <p><strong>Ngày:</strong> 2024-01-13</p>
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
                        handleStatusChange(selectedCourse.id, 'suspended');
                        setSelectedCourse(null);
                      }}
                    >
                      Tạm dừng khóa học
                    </button>
                    <button 
                      className={styles.hideBtn}
                      onClick={() => {
                        handleStatusChange(selectedCourse.id, 'hidden');
                        setSelectedCourse(null);
                      }}
                    >
                      Ẩn khóa học
                    </button>
                  </div>
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
