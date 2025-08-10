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
import styles from './Instructor.module.css';

import { useUser } from '@clerk/clerk-react';

const Instructor = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    totalHours: 0
  });
  const [loading, setLoading] = useState(false);
  const { isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();

  // Redirect to /auth if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/auth', { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  // Fetch data when component mounts
  useEffect(() => {
    fetchInstructorData();
  }, []);

  const fetchInstructorData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API endpoints
      // const coursesRes = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/instructor/courses`);
      // const studentsRes = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/instructor/students`);
      // const statsRes = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/instructor/stats`);
      
      // Mock data for now
      setCourses([
        { id: 1, title: 'React for Beginners', students: 150, rating: 4.5, revenue: 15000000, status: 'published' },
        { id: 2, title: 'Advanced JavaScript', students: 89, rating: 4.8, revenue: 12000000, status: 'draft' },
        { id: 3, title: 'Node.js Masterclass', students: 234, rating: 4.6, revenue: 25000000, status: 'published' }
      ]);
      
      setStudents([
        { id: 1, name: 'Nguyen Van A', email: 'a@example.com', progress: 75, enrolledDate: '2024-01-15' },
        { id: 2, name: 'Tran Thi B', email: 'b@example.com', progress: 45, enrolledDate: '2024-02-20' },
        { id: 3, name: 'Le Van C', email: 'c@example.com', progress: 90, enrolledDate: '2024-01-10' }
      ]);
      
      setStats({
        totalCourses: 3,
        totalStudents: 473,
        totalRevenue: 52000000,
        totalHours: 45
      });
    } catch (error) {
      console.error('Error fetching instructor data:', error);
    } finally {
      setLoading(false);
    }
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

  // ...existing code...
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
          onClick={() => navigate('/manage-course')}
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
                      background: course.status === 'published' ? '#dcfce7' : '#fef3c7',
                      color: course.status === 'published' ? '#166534' : '#92400e'
                    }}>
                      {course.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <Eye size={16} style={{ color: '#6b7280' }} />
                      </button>
                      <button style={{ padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <Edit3 size={16} style={{ color: '#6b7280' }} />
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instructor;
