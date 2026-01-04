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
import toast from 'react-hot-toast';

import { useUser, useAuth } from '@clerk/clerk-react';
import { useLocation, Outlet } from 'react-router-dom';
import styles from './Instructor.module.css';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import Dashboard from './Dashboard';
import StudentManagement from './StudentManagement';

const Instructor = ({ activeTab: propActiveTab }) => {
  useDocumentTitle('Quản lý giảng dạy');
  
  const location = useLocation();
  
  // Determine active tab from route or prop
  const getActiveTabFromPath = () => {
    if (propActiveTab) return propActiveTab;
    if (location.pathname.includes('/instructor/courses')) return 'courses';
    if (location.pathname.includes('/instructor/students')) return 'students';
    if (location.pathname.includes('/instructor/dashboard')) return 'dashboard';
    return 'dashboard';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());
  const [courses, setCourses] = useState([]);
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
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [tempPrice, setTempPrice] = useState('');
  const { user, isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  // Update activeTab when location changes
  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [location.pathname]);

  // Redirect to /auth if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('../auth/login', { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  // Fetch data when component mounts and user is loaded
  useEffect(() => {
    if (isLoaded && isSignedIn && user?.id) {
      fetchInstructorData();
    }
  }, [isLoaded, isSignedIn, user?.id]);

  // Refresh data when window gets focus (user comes back from creating course)
  // useEffect(() => {
  //   const handleFocus = () => {
  //     if (isLoaded && isSignedIn && user?.id) {
  //       refreshData();
  //     }
  //   };

  //   window.addEventListener('focus', handleFocus);
  //   return () => window.removeEventListener('focus', handleFocus);
  // }, [isLoaded, isSignedIn, user?.id]);

  const fetchInstructorData = async () => {
    // Kiểm tra user đã load và có userId
    if (!user?.id) {
      console.warn('User not loaded or no user ID');
      setLoading(false);
      return;
    }

    const instructorId = user.id;
    console.log('Fetching data for instructor:', instructorId);
    
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
          original_price: course.originalPrice || course.original_price || 0, // Giá gốc
          current_price: course.currentPrice || course.current_price || 0, // Giá hiện tại
          level: course.level,
          language: course.language,
          tags: course.tags,
          status: course.status || course.course_status, // MySQL uses course_status
          hasPendingRevision: course.hasPendingRevision || false,
          pendingRevisionId: course.pendingRevisionId || null,
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

  const toggleCourseVisibility = async (courseId, hide) => {
    const action = hide ? 'ẩn' : 'bỏ ẩn';
    if (!confirm(`Bạn có chắc muốn ${action} khóa học này?`)) return;
    
    try {
      setLoading(true);
      const token = await getToken();
      await axios.patch(`${BASE_URL}/api/course/${courseId}/visibility`, 
        { hide },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      // Refresh data sau khi toggle
      await fetchInstructorData();
      toast.success(`${hide ? 'Ẩn' : 'Bỏ ẩn'} khóa học thành công!`);
      setMenuOpenId(null);
    } catch (err) {
      console.error('Error toggling course visibility:', err);
      toast.error(`${action.charAt(0).toUpperCase() + action.slice(1)} thất bại. Vui lòng thử lại: ` + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = async (courseId) => {
    if (!confirm('Bạn có chắc muốn xóa khóa học này? Hành động này không thể hoàn tác.')) return;
    try {
      setLoading(true);
      const token = await getToken();
      await axios.delete(`${BASE_URL}/api/course/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Refresh data sau khi xóa
      await fetchInstructorData();
      toast.success('Xóa khóa học thành công!');
      setMenuOpenId(null);
    } catch (err) {
      console.error('Error deleting course:', err);
      toast.error('Xóa thất bại. Vui lòng thử lại: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // View course details - navigate to view mode
  const viewCourse = (courseId) => {
    console.log('Viewing course with ID:', courseId);
    if (!courseId) {
      toast.error('Không tìm thấy ID khóa học');
      return;
    }
    navigate(`/instructor/view-course/${courseId}`);
  };

  // Edit course - navigate to edit mode
  const editCourse = (courseId) => {
    console.log('Editing course with ID:', courseId);
    if (!courseId) {
      toast.error('Không tìm thấy ID khóa học');
      return;
    }
    navigate(`/instructor/update-course/${courseId}`);
  };

  // Update course price
  const updateCoursePrice = async (courseId, newPrice, originalPrice) => {
    // Parse và format số
    const priceString = newPrice.toString().replace(/[^0-9]/g, '');
    const price = parseFloat(priceString);
    
    if (isNaN(price) || price < 0) {
      alert('Giá không hợp lệ');
      return;
    }
    
    if (price > originalPrice) {
      alert(`Giá hiện tại không thể cao hơn giá gốc (${formatPrice(originalPrice)})`);
      return;
    }

    try {
      const token = await getToken();
      const response = await axios.patch(
        `${BASE_URL}/api/course/${courseId}/price`,
        { current_price: price },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Update local state
        setCourses(courses.map(course => 
          course.id === courseId 
            ? { ...course, current_price: price }
            : course
        ));
        setEditingPriceId(null);
        setTempPrice('');
        toast.success('Cập nhật giá thành công!');
      }
    } catch (error) {
      console.error('Error updating price:', error);
      alert('Cập nhật giá thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  const startEditPrice = (course) => {
    setEditingPriceId(course.id);
    setTempPrice(course.current_price.toString());
  };

  const handlePriceInputChange = (value) => {
    // Chỉ cho phép nhập số
    const numericValue = value.replace(/[^0-9]/g, '');
    setTempPrice(numericValue);
  };

  const cancelEditPrice = () => {
    setEditingPriceId(null);
    setTempPrice('');
  };

  // Create new draft course
  const createNewCourse = async () => {
    if (!user?.id) {
      toast.error('Vui lòng đăng nhập để tạo khóa học');
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      
      // Create draft course with minimal data
      const response = await axios.post(
        `${BASE_URL}/api/course`,
        {
          title: 'Khóa học mới',
          instructor_id: user.id
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success && response.data.course_id) {
        console.log('✅ Created draft course:', response.data.course_id);
        // Navigate to edit page with the new course ID
        navigate(`/instructor/update-course/${response.data.course_id}`);
      } else {
        console.error('Response data:', response.data);
        throw new Error('Failed to get course ID from response');
      }
    } catch (error) {
      console.error('Error creating draft course:', error);
      toast.error('Không thể tạo khóa học. Vui lòng thử lại: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

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
          onClick={createNewCourse}
          disabled={loading}
        >
          <Plus size={16} />
          {loading ? 'Đang tạo...' : 'Tạo khóa học mới'}
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
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Giá gốc</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Giá hiện tại</th>
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
                  <td style={{ padding: '16px', color: '#6b7280' }}>{formatPrice(course.original_price)}</td>
                  <td style={{ padding: '16px' }}>
                    {editingPriceId === course.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="text"
                          value={tempPrice}
                          onChange={(e) => handlePriceInputChange(e.target.value)}
                          placeholder="Nhập giá"
                          autoFocus
                          style={{
                            width: '150px',
                            padding: '6px 8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateCoursePrice(course.id, tempPrice, course.original_price);
                            } else if (e.key === 'Escape') {
                              cancelEditPrice();
                            }
                          }}
                        />
                        <button
                          onClick={() => updateCoursePrice(course.id, tempPrice, course.original_price)}
                          style={{
                            padding: '6px 12px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Lưu
                        </button>
                        <button
                          onClick={cancelEditPrice}
                          style={{
                            padding: '6px 12px',
                            background: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          cursor: 'pointer',
                          color: '#111827',
                          fontWeight: '500'
                        }}
                        onClick={() => startEditPrice(course)}
                      >
                        <span>{formatPrice(course.current_price)}</span>
                        <Edit3 size={14} style={{ color: '#6b7280' }} />
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: 
                        course.hasPendingRevision ? '#fef3c7' :
                        course.status === 'inactive' ? '#f3f4f6' :
                        course.status === 'approved' ? '#dcfce7' :
                        course.status === 'pending' ? '#dbeafe' :
                        course.status === 'rejected' ? '#fecaca' :
                        '#fef3c7',
                      color: 
                        course.hasPendingRevision ? '#92400e' :
                        course.status === 'inactive' ? '#6b7280' :
                        course.status === 'approved' ? '#166534' :
                        course.status === 'pending' ? '#1e40af' :
                        course.status === 'rejected' ? '#dc2626' :
                        '#92400e'
                    }}>
                      {course.hasPendingRevision ? 'Chờ duyệt cập nhật' :
                       course.status === 'inactive' ? 'Đã ẩn' :
                       course.status === 'approved' ? 'Đã duyệt' :
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
                            minWidth: '140px'
                          }}>
                            <button
                              onClick={() => {
                                const isHidden = course.status === 'inactive';
                                toggleCourseVisibility(course.id, !isHidden);
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
                              {course.status === 'inactive' ? 'Bỏ ẩn khóa học' : 'Ẩn khóa học'}
                            </button>
                            
                            {(course.status === 'draft' || course.status === 'rejected') && (
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

  // Loading state - hiển thị khi đang load Clerk hoặc fetch data
  if (!isLoaded || loading) {
    return (
      <div className={styles.instructorContainer}>
        <div className={styles.loading}>
          {!isLoaded ? 'Đang xác thực...' : 'Đang tải dữ liệu...'}
        </div>
      </div>
    );
  }

  // Not signed in - đã được redirect bởi useEffect
  if (!isSignedIn) {
    return null;
  }

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
                  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/instructor/dashboard' },
                  { id: 'courses', label: 'Quản lý khóa học', icon: BookOpen, path: '/instructor/courses' },
                  { id: 'students', label: 'Quản lý học viên', icon: Users, path: '/instructor/students' }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        navigate(item.path);
                      }}
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
            {activeTab === 'dashboard' && <Dashboard stats={stats} formatPrice={formatPrice} />}
            {activeTab === 'courses' && <CourseManagement />}
            {activeTab === 'students' && <StudentManagement />}
            {activeTab === 'courseDetail' && <CourseDetail />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instructor;
