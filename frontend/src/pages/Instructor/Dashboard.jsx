import React from 'react';
import { BookOpen, Users, DollarSign, Clock } from 'lucide-react';

const Dashboard = ({ stats = { totalCourses: 0, totalStudents: 0, totalRevenue: 0, totalHours: 0 } }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
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
};

export default Dashboard;
