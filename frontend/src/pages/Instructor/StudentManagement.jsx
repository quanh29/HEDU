import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Eye } from 'lucide-react';
import axios from 'axios';
import { useUser, useAuth } from '@clerk/clerk-react';
import useDocumentTitle from '../../hooks/useDocumentTitle';


const StudentManagement = () => {
  useDocumentTitle('Quản lý học viên - Giảng viên');
  
  const navigate = useNavigate();
  const { user, isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [studentsByCourse, setStudentsByCourse] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourseForStudents, setSelectedCourseForStudents] = useState(null);
  const [loading, setLoading] = useState(false);
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/auth/login', { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  useEffect(() => {
    if (isLoaded && isSignedIn && user?.id) {
      fetchStudents();
    }
  }, [isLoaded, isSignedIn, user?.id]);

  const fetchStudents = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const token = await getToken();
      const studentsRes = await axios.get(
        `${BASE_URL}/api/enrollment/instructor/${user.id}/students`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (studentsRes.data.success) {
        setStudentsByCourse(studentsRes.data.data);
        
        // Flatten all students for display
        const allStudents = studentsRes.data.data.flatMap(courseData => 
          courseData.students.map(student => ({
            id: student.userId,
            userId: student.userId,
            name: student.full_name,
            email: student.email,
            profile_image_url: student.profile_image_url,
            progress: student.progress,
            enrolledDate: student.enrolledDate,
            completedLessons: student.completedLessons,
            totalLessons: student.totalLessons,
            courseId: courseData.courseId,
            courseTitle: courseData.courseTitle
          }))
        );
        setStudents(allStudents);
      }
    } catch (error) {
      console.error('Error fetching students data:', error);
      setStudents([]);
      setStudentsByCourse([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudentProfile = (userId) => {
    navigate(`/user/${userId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (!isLoaded || loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: '#6b7280' }}>
          {!isLoaded ? 'Đang xác thực...' : 'Đang tải dữ liệu...'}
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="space-y-6" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600' }}>Quản lý học viên</h2>
      </div>

      {/* Filter by course */}
      {studentsByCourse.length > 0 && (
        <div style={{
          background: 'white',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '24px'
        }}>
          <label style={{ fontSize: '14px', fontWeight: '500', marginRight: '12px', color: '#374151' }}>
            Lọc theo khóa học:
          </label>
          <select
            value={selectedCourseForStudents || ''}
            onChange={(e) => setSelectedCourseForStudents(e.target.value || null)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              minWidth: '250px',
              cursor: 'pointer'
            }}
          >
            <option value="">Tất cả khóa học</option>
            {studentsByCourse.map(courseData => (
              <option key={courseData.courseId} value={courseData.courseId}>
                {courseData.courseTitle} ({courseData.totalStudents} học viên)
              </option>
            ))}
          </select>
        </div>
      )}

      {studentsByCourse.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          padding: '48px',
          textAlign: 'center'
        }}>
          <Users size={48} style={{ color: '#9ca3af', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '16px', color: '#6b7280' }}>Chưa có học viên nào đăng ký khóa học của bạn</p>
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Học viên</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Email</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Khóa học</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Tiến độ</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Ngày đăng ký</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {students
                  .filter(student => !selectedCourseForStudents || student.courseId === selectedCourseForStudents)
                  .map((student) => (
                    <tr key={`${student.userId}-${student.courseId}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {student.profile_image_url ? (
                            <img
                              src={student.profile_image_url}
                              alt={student.name}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
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
                          )}
                          <div style={{ fontWeight: '500', color: '#111827' }}>{student.name}</div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#6b7280' }}>{student.email}</td>
                      <td style={{ padding: '16px', color: '#6b7280', fontSize: '13px' }}>{student.courseTitle}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '80px',
                            height: '8px',
                            background: '#e5e7eb',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${student.progress}%`,
                              height: '100%',
                              background: student.progress === 100 ? '#10b981' : student.progress >= 50 ? '#3b82f6' : '#f59e0b'
                            }}></div>
                          </div>
                          <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                            {student.progress}%
                          </span>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                            ({student.completedLessons}/{student.totalLessons})
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#6b7280' }}>{formatDate(student.enrolledDate)}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleViewStudentProfile(student.userId)}
                            style={{
                              padding: '6px 12px',
                              border: '1px solid #d1d5db',
                              background: 'white',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '13px',
                              color: '#374151',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = '#f9fafb';
                              e.currentTarget.style.borderColor = '#9ca3af';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.borderColor = '#d1d5db';
                            }}
                            title="Xem trang cá nhân"
                          >
                            <Eye size={14} />
                            Xem
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
