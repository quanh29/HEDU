import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  BarChart3, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  PlayCircle, 
  FileText, 
  Settings,
  TrendingUp,
  DollarSign,
  Clock,
  Award,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';
import axios from 'axios';

import { useUser } from '@clerk/clerk-react';
import styles from './Instructor.module.css';

const Instructor = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null); // Chi tiết khóa học đang xem
  const [courseContent, setCourseContent] = useState(null); // Nội dung chi tiết của khóa học
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    totalHours: 0
  });
  const [loading, setLoading] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const { user, isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  // Redirect to /auth if not signed in
  // useEffect(() => {
  //   if (isLoaded && !isSignedIn) {
  //     navigate('/auth', { replace: true });
  //   }
  // }, [isLoaded, isSignedIn, navigate]);

  // Fetch data when component mounts
  useEffect(() => {
    // Tạm thời bỏ check user?.id để test với user_id cố định
    fetchInstructorData();
  }, []);

  // Refresh data when window gets focus (user comes back from creating course)
  useEffect(() => {
    const handleFocus = () => {
      fetchInstructorData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchInstructorData = async () => {
    // Tạm thời dùng user_id cố định để test
    const instructorId = '98f7f734-aaa8-11f0-8462-581122e62853';
    
    setLoading(true);
    try {
      // Fetch courses từ backend - sử dụng route instructor
      const coursesRes = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/course/instructor/${instructorId}`);
      const courseData = coursesRes.data || [];
      
      console.log('Fetched courses from API:', courseData);
      console.log('First course _id:', courseData[0]?._id);
      
      // Transform data để phù hợp với UI
      const transformedCourses = courseData.map(course => {
        console.log('Mapping course:', course.course_id || course._id, course.title);
        return {
          id: course.course_id || course._id, // Hỗ trợ cả MySQL (course_id) và MongoDB (_id)
          title: course.title,
          subtitle: course.subtitle,
          thumbnail: course.thumbnail,
          description: course.description,
          originalPrice: course.originalPrice || course.original_price, // MySQL uses original_price
          level: course.level,
          language: course.language,
          tags: course.tags,
          status: course.status || course.course_status, // MySQL uses course_status
          students: course.enrollmentCount || 0,
          rating: course.averageRating || 0,
          revenue: (course.enrollmentCount || 0) * (course.originalPrice || course.original_price || 0),
          createdAt: course.createdAt || course.created_at,
          updatedAt: course.updatedAt || course.updated_at,
          sections: course.sections
        };
      });
      
      console.log('Transformed courses:', transformedCourses);
      console.log('First transformed course id:', transformedCourses[0]?.id);
      
      setCourses(transformedCourses);
      
      // Calculate stats
      setStats({
        totalCourses: transformedCourses.length,
        totalStudents: transformedCourses.reduce((sum, course) => sum + course.students, 0),
        totalRevenue: transformedCourses.reduce((sum, course) => sum + course.revenue, 0),
        totalHours: 0 // TODO: Calculate total hours from sections/lessons
      });
      
      // Mock students data for now (TODO: implement actual student fetching)
      setStudents([
        { id: 1, name: 'Nguyen Van A', email: 'a@example.com', progress: 75, enrolledDate: '2024-01-15' },
        { id: 2, name: 'Tran Thi B', email: 'b@example.com', progress: 45, enrolledDate: '2024-02-20' },
        { id: 3, name: 'Le Van C', email: 'c@example.com', progress: 90, enrolledDate: '2024-01-10' }
      ]);
      
    } catch (error) {
      console.error('Error fetching instructor data:', error);
      // Fallback to empty data
      setCourses([]);
      setStats({
        totalCourses: 0,
        totalStudents: 0,
        totalRevenue: 0,
        totalHours: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchInstructorData();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const deleteCourse = async (courseId) => {
    if (!confirm('Bạn có chắc muốn xóa khóa học này? Hành động này không thể hoàn tác.')) return;
    try {
      setLoading(true);
      await axios.delete(`${BASE_URL}/api/course/${courseId}`);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      alert('Xóa thành công!');
      setMenuOpenId(null);
    } catch (err) {
      console.error('Error deleting course:', err);
      alert('Xóa thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // View course details - navigate to view mode
  const viewCourse = (courseId) => {
    console.log('Viewing course with ID:', courseId);
    if (!courseId) {
      alert('Không tìm thấy ID khóa học');
      return;
    }
    navigate(`/instructor/view-course/${courseId}`);
  };

  // Edit course - navigate to edit mode
  const editCourse = (courseId) => {
    console.log('Editing course with ID:', courseId);
    if (!courseId) {
      alert('Không tìm thấy ID khóa học');
      return;
    }
    navigate(`/instructor/update-course/${courseId}`);
  };

  // Dashboard Component
  const Dashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Tổng khóa học</h3>
            <BookOpen size={20} style={{ color: '#3b82f6' }} />
          </div>
          <p style={{ fontSize: '32px', fontWeight: '700', color: '#111827' }}>{stats.totalCourses}</p>
          <p style={{ fontSize: '12px', color: '#10b981' }}>+2 tháng này</p>
        </div>

        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Tổng học viên</h3>
            <Users size={20} style={{ color: '#8b5cf6' }} />
          </div>
          <p style={{ fontSize: '32px', fontWeight: '700', color: '#111827' }}>{stats.totalStudents}</p>
          <p style={{ fontSize: '12px', color: '#10b981' }}>+15% so với tháng trước</p>
        </div>

        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Doanh thu</h3>
            <DollarSign size={20} style={{ color: '#10b981' }} />
          </div>
          <p style={{ fontSize: '32px', fontWeight: '700', color: '#111827' }}>{formatPrice(stats.totalRevenue)}</p>
          <p style={{ fontSize: '12px', color: '#10b981' }}>+8% so với tháng trước</p>
        </div>

        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Tổng giờ học</h3>
            <Clock size={20} style={{ color: '#f59e0b' }} />
          </div>
          <p style={{ fontSize: '32px', fontWeight: '700', color: '#111827' }}>{stats.totalHours}h</p>
          <p style={{ fontSize: '12px', color: '#10b981' }}>+3h tuần này</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Hoạt động gần đây</h3>
        <div className="space-y-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
            <span style={{ fontSize: '14px', color: '#374151' }}>Học viên mới đăng ký khóa "React for Beginners"</span>
            <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: 'auto' }}>2 giờ trước</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div>
            <span style={{ fontSize: '14px', color: '#374151' }}>Khóa học "Advanced JavaScript" được phê duyệt</span>
            <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: 'auto' }}>1 ngày trước</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></div>
            <span style={{ fontSize: '14px', color: '#374151' }}>Đánh giá 5 sao cho khóa "Node.js Masterclass"</span>
            <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: 'auto' }}>3 ngày trước</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Course Management Component
  const CourseManagement = () => (
    <div className="space-y-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600' }}>Quản lý khóa học</h2>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#3b82f6',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
          onClick={() => navigate('/instructor/create-course')}
        >
          <Plus size={16} />
          Tạo khóa học mới
        </button>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#6b7280' }} />
              <input
                type="text"
                placeholder="Tìm kiếm khóa học..."
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f9fafb',
              border: '1px solid #d1d5db',
              padding: '12px 16px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              <Filter size={16} />
              Bộ lọc
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Khóa học</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Học viên</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Đánh giá</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Doanh thu</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Trạng thái</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course, index) => (
                <tr key={course.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '500', color: '#111827', marginBottom: '4px' }}>{course.title}</div>
                  </td>
                  <td style={{ padding: '16px', color: '#6b7280' }}>{course.students}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#f59e0b' }}>★</span>
                      <span style={{ color: '#6b7280' }}>{course.rating}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#6b7280' }}>{formatPrice(course.revenue)}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: 
                        course.status === 'approved' ? '#dcfce7' :
                        course.status === 'pending' ? '#dbeafe' :
                        course.status === 'rejected' ? '#fecaca' :
                        '#fef3c7',
                      color: 
                        course.status === 'approved' ? '#166534' :
                        course.status === 'pending' ? '#1e40af' :
                        course.status === 'rejected' ? '#dc2626' :
                        '#92400e'
                    }}>
                      {course.status === 'approved' ? 'Đã duyệt' :
                       course.status === 'pending' ? 'Chờ duyệt' :
                       course.status === 'rejected' ? 'Từ chối' :
                       'Bản nháp'}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => viewCourse(course.id)}
                        style={{ padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                        title="Xem chi tiết"
                      >
                        <Eye size={16} style={{ color: '#6b7280' }} />
                      </button>
                      <button 
                        onClick={() => editCourse(course.id)}
                        style={{ padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                        title="Chỉnh sửa"
                      >
                        <Edit3 size={16} style={{ color: '#6b7280' }} />
                      </button>

                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setMenuOpenId(menuOpenId === course.id ? null : course.id)}
                          style={{ padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                          title="Thêm"
                        >
                          <MoreVertical size={16} style={{ color: '#6b7280' }} />
                        </button>

                        {menuOpenId === course.id && (
                          <div style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            marginTop: '6px',
                            background: 'white',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            borderRadius: '8px',
                            padding: '6px',
                            zIndex: 50,
                            minWidth: '120px'
                          }}>
                            <button
                              onClick={() => {
                                alert('Chức năng ẩn khóa học');
                                setMenuOpenId(null);
                              }}
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px',
                                color: '#374151',
                                background: 'transparent',
                                border: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              Ẩn khóa học
                            </button>
                            
                            {course.status === 'draft' && (
                              <button
                                onClick={() => deleteCourse(course.id)}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  padding: '8px',
                                  color: '#dc2626',
                                  background: 'transparent',
                                  border: 'none',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  borderTop: '1px solid #e5e7eb',
                                  marginTop: '4px',
                                  paddingTop: '8px'
                                }}
                              >
                                Xóa
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Student Management Component
  const StudentManagement = () => (
    <div className="space-y-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600' }}>Quản lý học viên</h2>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#6b7280' }} />
              <input
                type="text"
                placeholder="Tìm kiếm học viên..."
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f9fafb',
              border: '1px solid #d1d5db',
              padding: '12px 16px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              <Filter size={16} />
              Bộ lọc
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Học viên</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Email</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Tiến độ</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Ngày đăng ký</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}>
                        {student.name.charAt(0)}
                      </div>
                      <div style={{ fontWeight: '500', color: '#111827' }}>{student.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#6b7280' }}>{student.email}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '60px',
                        height: '8px',
                        background: '#e5e7eb',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${student.progress}%`,
                          height: '100%',
                          background: '#10b981'
                        }}></div>
                      </div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>{student.progress}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#6b7280' }}>{formatDate(student.enrolledDate)}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <Eye size={16} style={{ color: '#6b7280' }} />
                      </button>
                      <button style={{ padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <MoreVertical size={16} style={{ color: '#6b7280' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Course Detail Component - Hiển thị chi tiết nội dung khóa học
  const CourseDetail = () => {
    if (!courseContent || !selectedCourse) return null;

    return (
      <div className="space-y-6">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <button
            onClick={() => {
              setActiveTab('courses');
              setCourseContent(null);
              setSelectedCourse(null);
            }}
            style={{
              padding: '8px 16px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Quay lại
          </button>
          <h2 style={{ fontSize: '24px', fontWeight: '600' }}>{selectedCourse.title}</h2>
        </div>

        {/* Course Info */}
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Thông tin khóa học</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Trạng thái: </span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{selectedCourse.status}</span>
            </div>
            <div>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Học viên: </span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{selectedCourse.students}</span>
            </div>
            <div>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Đánh giá: </span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>⭐ {selectedCourse.rating}</span>
            </div>
            <div>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Giá: </span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{formatPrice(selectedCourse.originalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Nội dung khóa học ({courseContent.sections?.length || 0} sections)
          </h3>
          
          {courseContent.sections && courseContent.sections.map((section, sectionIndex) => (
            <div key={section._id} style={{ marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                {sectionIndex + 1}. {section.title}
              </h4>
              
              {/* Videos */}
              {section.videos && section.videos.length > 0 && (
                <div style={{ marginLeft: '20px', marginBottom: '12px' }}>
                  <h5 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>
                    📹 Videos ({section.videos.length})
                  </h5>
                  {section.videos.map((video, videoIndex) => (
                    <div key={video._id} style={{ padding: '8px 0', fontSize: '14px', color: '#374151' }}>
                      {sectionIndex + 1}.{videoIndex + 1} {video.title}
                      {video.duration && <span style={{ color: '#6b7280', marginLeft: '8px' }}>({Math.round(video.duration / 60)} phút)</span>}
                      {video.status && <span style={{ 
                        marginLeft: '8px', 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px',
                        background: video.status === 'ready' ? '#dcfce7' : '#fef3c7',
                        color: video.status === 'ready' ? '#166534' : '#92400e'
                      }}>
                        {video.status}
                      </span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Materials */}
              {section.materials && section.materials.length > 0 && (
                <div style={{ marginLeft: '20px', marginBottom: '12px' }}>
                  <h5 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>
                    📄 Materials ({section.materials.length})
                  </h5>
                  {section.materials.map((material, materialIndex) => (
                    <div key={material._id} style={{ padding: '8px 0', fontSize: '14px', color: '#374151' }}>
                      {sectionIndex + 1}.{materialIndex + 1} {material.title}
                    </div>
                  ))}
                </div>
              )}

              {/* Quizzes */}
              {section.quizzes && section.quizzes.length > 0 && (
                <div style={{ marginLeft: '20px' }}>
                  <h5 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>
                    📝 Quizzes ({section.quizzes.length})
                  </h5>
                  {section.quizzes.map((quiz, quizIndex) => (
                    <div key={quiz._id} style={{ padding: '8px 0', fontSize: '14px', color: '#374151' }}>
                      {sectionIndex + 1}.{quizIndex + 1} {quiz.title}
                      {quiz.questions && <span style={{ color: '#6b7280', marginLeft: '8px' }}>({quiz.questions.length} câu hỏi)</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {(!courseContent.sections || courseContent.sections.length === 0) && (
            <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', padding: '20px' }}>
              Chưa có nội dung nào trong khóa học này
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.instructorContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Bảng điều khiển giảng viên</h1>
          <div className={styles.headerActions}>
            <button className={styles.settingsButton}>
              <Settings size={16} />
              Cài đặt
            </button>
          </div>
        </div>
      </div>

      <div className={styles.mainContainer}>
        <div className={styles.layoutContainer}>
          {/* Sidebar */}
          <div className={styles.sidebar}>
            <nav className={styles.sidebarNav}>
              <div>
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                  { id: 'courses', label: 'Quản lý khóa học', icon: BookOpen },
                  { id: 'students', label: 'Quản lý học viên', icon: Users }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`${styles.navButton} ${activeTab === item.id ? styles.active : ''}`}
                    >
                      <Icon size={18} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className={styles.mainContent}>
            {loading ? (
              <div className={styles.loading}>
                Đang tải dữ liệu...
              </div>
            ) : (
              <>
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'courses' && <CourseManagement />}
                {activeTab === 'students' && <StudentManagement />}
                {activeTab === 'courseDetail' && <CourseDetail />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instructor;
