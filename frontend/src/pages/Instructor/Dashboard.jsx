import React, { useState } from 'react';
import { 
  BookOpen, 
  Users, 
  DollarSign,
  Filter
} from 'lucide-react';

const Dashboard = ({ stats, formatPrice }) => {
  // Dummy data for charts and analytics
  const [timeFilter, setTimeFilter] = useState('month'); // 'week', 'month', 'quarter', 'year'
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');

  // Revenue over time data
  const revenueData = [
    { month: 'T1', revenue: 12500000, courses: 5 },
    { month: 'T2', revenue: 15800000, courses: 7 },
    { month: 'T3', revenue: 18200000, courses: 9 },
    { month: 'T4', revenue: 22500000, courses: 12 },
    { month: 'T5', revenue: 28900000, courses: 15 },
    { month: 'T6', revenue: 31200000, courses: 18 },
    { month: 'T7', revenue: 35600000, courses: 22 },
    { month: 'T8', revenue: 38400000, courses: 24 },
    { month: 'T9', revenue: 42100000, courses: 28 },
    { month: 'T10', revenue: 45800000, courses: 31 },
    { month: 'T11', revenue: 48200000, courses: 33 },
    { month: 'T12', revenue: 52500000, courses: 35 }
  ];

  // Revenue by course data
  const revenueByCourse = [
    { name: 'React Fundamentals', value: 15200000, color: '#3b82f6' },
    { name: 'Advanced JavaScript', value: 12800000, color: '#8b5cf6' },
    { name: 'Node.js Backend', value: 9500000, color: '#10b981' },
    { name: 'Python for Data Science', value: 8200000, color: '#f59e0b' },
    { name: 'Web Design Basics', value: 6800000, color: '#ef4444' }
  ];

  // Course ratings data
  const courseRatings = [
    { course: 'React Fundamentals', rating: 4.8, reviews: 245, students: 1200 },
    { course: 'Advanced JavaScript', rating: 4.6, reviews: 189, students: 980 },
    { course: 'Node.js Backend', rating: 4.9, reviews: 156, students: 850 },
    { course: 'Python for Data Science', rating: 4.7, reviews: 203, students: 1100 },
    { course: 'Web Design Basics', rating: 4.5, reviews: 134, students: 720 }
  ];

  // Recent activities data
  const recentActivities = [
    { 
      id: 1, 
      type: 'enrollment', 
      student: 'Nguyễn Văn A', 
      course: 'React Fundamentals', 
      time: '15 phút trước',
      icon: 'user-plus'
    },
    { 
      id: 2, 
      type: 'review', 
      student: 'Trần Thị B', 
      course: 'Node.js Backend', 
      rating: 5,
      comment: 'Khóa học rất chi tiết và dễ hiểu!',
      time: '1 giờ trước',
      icon: 'star'
    },
    { 
      id: 3, 
      type: 'enrollment', 
      student: 'Lê Văn C', 
      course: 'Advanced JavaScript', 
      time: '2 giờ trước',
      icon: 'user-plus'
    },
    { 
      id: 4, 
      type: 'review', 
      student: 'Phạm Thị D', 
      course: 'React Fundamentals', 
      rating: 4,
      comment: 'Nội dung tốt, giảng viên nhiệt tình',
      time: '3 giờ trước',
      icon: 'star'
    },
    { 
      id: 5, 
      type: 'enrollment', 
      student: 'Hoàng Văn E', 
      course: 'Python for Data Science', 
      time: '5 giờ trước',
      icon: 'user-plus'
    },
    { 
      id: 6, 
      type: 'review', 
      student: 'Đỗ Thị F', 
      course: 'Web Design Basics', 
      rating: 5,
      comment: 'Xuất sắc! Đúng những gì tôi cần',
      time: '6 giờ trước',
      icon: 'star'
    }
  ];

  // Stats with comparison
  const statsComparison = {
    courses: { current: 35, previous: 33, change: 6.1 },
    students: { current: 4850, previous: 4200, change: 15.5 },
    revenue: { current: 52500000, previous: 48200000, change: 8.9 }
  };

  const renderStatCard = (title, icon, current, previous, change, formatter = (v) => v) => {
    const isPositive = change >= 0;
    return (
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>{title}</h3>
          {icon}
        </div>
        <p style={{ fontSize: '32px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
          {formatter(current)}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: '600',
            color: isPositive ? '#10b981' : '#ef4444' 
          }}>
            {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
          </span>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            so với tháng trước
          </span>
        </div>
        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
          Tháng trước: {formatter(previous)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div style={{
        background: 'white',
        padding: '16px 24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} style={{ color: '#6b7280' }} />
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Bộ lọc:</span>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '14px', color: '#6b7280' }}>Thời gian:</label>
          <select 
            value={timeFilter} 
            onChange={(e) => setTimeFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              cursor: 'pointer',
              background: 'white'
            }}
          >
            <option value="week">7 ngày qua</option>
            <option value="month">30 ngày qua</option>
            <option value="quarter">3 tháng qua</option>
            <option value="year">12 tháng qua</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '14px', color: '#6b7280' }}>Khóa học:</label>
          <select 
            value={selectedCourseFilter} 
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              cursor: 'pointer',
              background: 'white'
            }}
          >
            <option value="all">Tất cả khóa học</option>
            <option value="react">React Fundamentals</option>
            <option value="javascript">Advanced JavaScript</option>
            <option value="nodejs">Node.js Backend</option>
            <option value="python">Python for Data Science</option>
            <option value="webdesign">Web Design Basics</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderStatCard(
          'Tổng khóa học',
          <BookOpen size={20} style={{ color: '#3b82f6' }} />,
          statsComparison.courses.current,
          statsComparison.courses.previous,
          statsComparison.courses.change
        )}
        {renderStatCard(
          'Tổng học viên',
          <Users size={20} style={{ color: '#8b5cf6' }} />,
          statsComparison.students.current,
          statsComparison.students.previous,
          statsComparison.students.change
        )}
        {renderStatCard(
          'Doanh thu tháng này',
          <DollarSign size={20} style={{ color: '#10b981' }} />,
          statsComparison.revenue.current,
          statsComparison.revenue.previous,
          statsComparison.revenue.change,
          formatPrice
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Over Time Chart */}
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>
            Doanh thu theo thời gian
          </h3>
          <div style={{ width: '100%', height: '300px', position: 'relative' }}>
            <svg width="100%" height="100%" viewBox="0 0 600 300" style={{ overflow: 'visible' }}>
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="50"
                  y1={50 + i * 50}
                  x2="580"
                  y2={50 + i * 50}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
              ))}
              
              {/* Y-axis labels */}
              {[50, 40, 30, 20, 10, 0].map((val, i) => (
                <text
                  key={i}
                  x="40"
                  y={50 + i * 50}
                  textAnchor="end"
                  fontSize="11"
                  fill="#6b7280"
                  dominantBaseline="middle"
                >
                  {val}M
                </text>
              ))}

              {/* Line chart */}
              <polyline
                points={revenueData.map((d, i) => {
                  const x = 70 + (i * 45);
                  const y = 250 - (d.revenue / 60000000 * 200);
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points with hover labels */}
              {revenueData.map((d, i) => {
                const x = 70 + (i * 45);
                const y = 250 - (d.revenue / 60000000 * 200);
                const revenueInMillion = (d.revenue / 1000000).toFixed(1);
                return (
                  <g key={i}>
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#3b82f6"
                    />
                    {/* Tooltip on hover */}
                    <g className="chart-label" style={{ opacity: 0, transition: 'opacity 0.2s' }}>
                      <rect
                        x={x - 35}
                        y={y - 45}
                        width="70"
                        height="35"
                        rx="4"
                        fill="#111827"
                        opacity="0.9"
                      />
                      <text
                        x={x}
                        y={y - 30}
                        textAnchor="middle"
                        fontSize="10"
                        fill="white"
                        fontWeight="600"
                      >
                        {d.month}
                      </text>
                      <text
                        x={x}
                        y={y - 18}
                        textAnchor="middle"
                        fontSize="9"
                        fill="white"
                      >
                        {revenueInMillion}M VND
                      </text>
                    </g>
                    {/* Hover area */}
                    <circle
                      cx={x}
                      cy={y}
                      r="12"
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => {
                        const label = e.currentTarget.previousSibling;
                        if (label) label.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        const label = e.currentTarget.previousSibling;
                        if (label) label.style.opacity = '0';
                      }}
                    />
                  </g>
                );
              })}

              {/* X-axis labels */}
              {revenueData.map((d, i) => (
                <text
                  key={i}
                  x={70 + (i * 45)}
                  y="280"
                  textAnchor="middle"
                  fontSize="11"
                  fill="#6b7280"
                >
                  {d.month}
                </text>
              ))}
              
              {/* Chart labels */}
              <text
                x="300"
                y="20"
                textAnchor="middle"
                fontSize="12"
                fill="#9ca3af"
                fontWeight="500"
              >
                Doanh thu (Triệu VND)
              </text>
              
              <text
                x="20"
                y="150"
                textAnchor="middle"
                fontSize="11"
                fill="#9ca3af"
                transform="rotate(-90, 20, 150)"
              >
                VND
              </text>
            </svg>
          </div>
        </div>

        {/* Revenue by Course Pie Chart */}
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>
            Cơ cấu doanh thu theo khóa học
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '300px' }}>
            {/* Pie Chart */}
            <div style={{ position: 'relative', width: '200px', height: '200px' }}>
              <svg width="200" height="200" viewBox="0 0 200 200">
                {(() => {
                  const total = revenueByCourse.reduce((sum, item) => sum + item.value, 0);
                  let currentAngle = -90;
                  
                  return revenueByCourse.map((item, index) => {
                    const percentage = (item.value / total) * 100;
                    const angle = (percentage / 100) * 360;
                    const startAngle = currentAngle;
                    const endAngle = currentAngle + angle;
                    
                    const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
                    const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
                    const x2 = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
                    const y2 = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);
                    
                    const largeArc = angle > 180 ? 1 : 0;
                    
                    const pathData = [
                      `M 100 100`,
                      `L ${x1} ${y1}`,
                      `A 80 80 0 ${largeArc} 1 ${x2} ${y2}`,
                      `Z`
                    ].join(' ');
                    
                    // Calculate label position (middle of the arc)
                    const midAngle = startAngle + angle / 2;
                    const labelRadius = 60;
                    const labelX = 100 + labelRadius * Math.cos((midAngle * Math.PI) / 180);
                    const labelY = 100 + labelRadius * Math.sin((midAngle * Math.PI) / 180);
                    
                    currentAngle = endAngle;
                    
                    return (
                      <g key={index}>
                        <path
                          d={pathData}
                          fill={item.color}
                          style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        />
                        {/* Percentage label inside slice */}
                        {percentage > 5 && (
                          <text
                            x={labelX}
                            y={labelY}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="12"
                            fontWeight="600"
                            fill="white"
                          >
                            {percentage.toFixed(0)}%
                          </text>
                        )}
                      </g>
                    );
                  });
                })()}
                {/* Center circle for donut effect */}
                <circle cx="100" cy="100" r="50" fill="white" />
                {/* Total label in center */}
                <text
                  x="100"
                  y="95"
                  textAnchor="middle"
                  fontSize="11"
                  fill="#6b7280"
                  fontWeight="500"
                >
                  Tổng doanh thu
                </text>
                <text
                  x="100"
                  y="110"
                  textAnchor="middle"
                  fontSize="13"
                  fill="#111827"
                  fontWeight="700"
                >
                  {formatPrice(revenueByCourse.reduce((sum, item) => sum + item.value, 0))}
                </text>
              </svg>
            </div>

            {/* Legend */}
            <div style={{ flex: 1, paddingLeft: '24px' }}>
              {revenueByCourse.map((item, index) => {
                const total = revenueByCourse.reduce((sum, i) => sum + i.value, 0);
                const percentage = ((item.value / total) * 100).toFixed(1);
                return (
                  <div 
                    key={index}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      marginBottom: '12px',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '2px',
                      background: item.color,
                      flexShrink: 0
                    }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: '#374151', fontWeight: '500' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>
                        {formatPrice(item.value)} ({percentage}%)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Course Ratings Table */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>
          Đánh giá khóa học
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Khóa học
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Số học viên
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Đánh giá TB
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Số đánh giá
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Đánh giá
                </th>
              </tr>
            </thead>
            <tbody>
              {courseRatings.map((course, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', fontWeight: '500' }}>
                    {course.course}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                    {course.students.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                        {course.rating}
                      </span>
                      <span style={{ color: '#f59e0b' }}>★</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                    {course.reviews} đánh giá
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span 
                          key={star}
                          style={{ 
                            color: star <= Math.round(course.rating) ? '#f59e0b' : '#d1d5db',
                            fontSize: '16px'
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activities */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>
          Hoạt động gần đây
        </h3>
        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <div 
              key={activity.id}
              style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '12px', 
                padding: '12px',
                borderRadius: '8px',
                background: '#f9fafb',
                border: '1px solid #f3f4f6'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: activity.type === 'enrollment' ? '#dbeafe' : '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {activity.type === 'enrollment' ? (
                  <Users size={18} style={{ color: '#3b82f6' }} />
                ) : (
                  <span style={{ color: '#f59e0b', fontSize: '18px' }}>★</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', color: '#111827', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600' }}>{activity.student}</span>
                  {activity.type === 'enrollment' ? (
                    <span> đã đăng ký khóa học </span>
                  ) : (
                    <span> đã đánh giá {activity.rating} sao cho </span>
                  )}
                  <span style={{ fontWeight: '500', color: '#3b82f6' }}>
                    {activity.course}
                  </span>
                </div>
                {activity.comment && (
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#6b7280',
                    fontStyle: 'italic',
                    marginTop: '4px',
                    paddingLeft: '12px',
                    borderLeft: '2px solid #e5e7eb'
                  }}>
                    "{activity.comment}"
                  </div>
                )}
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                  {activity.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
