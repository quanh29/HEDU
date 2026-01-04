import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { 
  BookOpen, 
  Users, 
  DollarSign,
  Filter
} from 'lucide-react';

const API_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

const Dashboard = ({ stats, formatPrice }) => {
  const { getToken, user } = useAuth();
  const [timeFilter, setTimeFilter] = useState('all');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  
  // State for dashboard data
  const [dashboardStats, setDashboardStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [revenueByCourse, setRevenueByCourse] = useState([]);
  const [courseRatings, setCourseRatings] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [instructorCourses, setInstructorCourses] = useState([]);
  const [topCoursesByStudents, setTopCoursesByStudents] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null); // State để lưu period được chọn

  useEffect(() => {
    if (!hasLoadedRef.current) {
      fetchDashboardData();
      hasLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (hasLoadedRef.current) {
      fetchDashboardData();
    }
  }, [timeFilter, selectedCourseFilter, selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      // Build filter params
      let filterParam = selectedCourseFilter !== 'all' ? `?courseFilter=${selectedCourseFilter}` : '';
      if (selectedPeriod) {
        filterParam += (filterParam ? '&' : '?') + `month=${selectedPeriod.month}&year=${selectedPeriod.year}`;
      }

      // Fetch all dashboard data in parallel
      const [statsRes, revenueByRes, ratingsRes, activitiesRes, coursesRes, topCoursesRes, yearsRes] = await Promise.all([
        fetch(`${API_URL}/api/dashboard/instructor/stats${filterParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/dashboard/instructor/revenue-by-course${filterParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/dashboard/instructor/course-ratings${filterParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/dashboard/instructor/recent-activities${filterParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/course/instructor/${user?.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/dashboard/instructor/top-courses-by-students${filterParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/dashboard/instructor/available-years${filterParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setDashboardStats(data.data);
      }

      if (revenueByRes.ok) {
        const data = await revenueByRes.json();
        setRevenueByCourse(data.data);
      }

      if (ratingsRes.ok) {
        const data = await ratingsRes.json();
        setCourseRatings(data.data);
      }

      if (activitiesRes.ok) {
        const data = await activitiesRes.json();
        setRecentActivities(data.data);
      }

      if (coursesRes.ok) {
        const data = await coursesRes.json();
        console.log('Instructor courses:', data);
        // Fix: API returns data.courses, not data.data.courses
        const coursesList = data.courses || data.data?.courses || [];
        setInstructorCourses(coursesList);
      }

      if (topCoursesRes.ok) {
        const data = await topCoursesRes.json();
        setTopCoursesByStudents(data.data);
      }

      if (yearsRes.ok) {
        const data = await yearsRes.json();
        setAvailableYears(data.data || []);
      }

      // Fetch revenue chart separately
      await fetchRevenueChart();

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueChart = async () => {
    try {
      const token = await getToken();
      let filterParam = selectedCourseFilter !== 'all' ? `&courseFilter=${selectedCourseFilter}` : '';
      if (selectedPeriod) {
        filterParam += `&month=${selectedPeriod.month}&year=${selectedPeriod.year}`;
      }
      const res = await fetch(`${API_URL}/api/dashboard/instructor/revenue-chart?timeFilter=${timeFilter}${filterParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setRevenueData(data.data);
      }
    } catch (error) {
      console.error('Error fetching revenue chart:', error);
    }
  };

  // Handler khi click vào điểm trên đồ thị
  const handleChartPointClick = (dataPoint) => {
    setSelectedPeriod({
      month: dataPoint.monthNumber,
      year: dataPoint.year
    });
  };

  // Handler để clear selected period
  const clearSelectedPeriod = () => {
    setSelectedPeriod(null);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  // Stats with comparison (using real data)
  const statsComparison = {
    courses: { current: dashboardStats?.totalCourses || 0, previous: dashboardStats?.totalCourses || 0, change: 0 },
    students: { 
      current: dashboardStats?.thisMonthStudents || 0, 
      previous: dashboardStats?.lastMonthStudents || 0, 
      change: dashboardStats?.studentsChange || 0 
    },
    revenue: { 
      current: dashboardStats?.thisMonthRevenue || 0, 
      previous: dashboardStats?.lastMonthRevenue || 0, 
      change: dashboardStats?.revenueChange || 0 
    }
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
            <option value="all">Tất cả</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
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
            {instructorCourses.map(course => (
              <option key={course.course_id} value={course.course_id}>{course.title}</option>
            ))}
          </select>
        </div>

        {/* Selected Period Badge */}
        {selectedPeriod && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: '#dbeafe',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#1e40af',
            fontWeight: '500'
          }}>
            <span>Đã chọn: Tháng {selectedPeriod.month}/{selectedPeriod.year}</span>
            <button
              onClick={clearSelectedPeriod}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#1e40af',
                cursor: 'pointer',
                fontSize: '16px',
                lineHeight: 1,
                padding: '0 4px'
              }}
              title="Xóa lọc theo tháng"
            >
              ×
            </button>
          </div>
        )}
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
          selectedCourseFilter === 'all' ? 'Tổng doanh thu' : 'Doanh thu tháng này',
          <DollarSign size={20} style={{ color: '#10b981' }} />,
          statsComparison.revenue.current,
          statsComparison.revenue.previous,
          statsComparison.revenue.change,
          formatPrice
        )}
      </div>

      {/* Charts Row */}
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
          <div style={{ width: '100%', height: '400px', position: 'relative' }}>
            <svg width="100%" height="100%" viewBox="0 0 900 400" style={{ overflow: 'visible' }}>
              {/* Grid lines */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <line
                  key={i}
                  x1="80"
                  y1={60 + i * 55}
                  x2="880"
                  y2={60 + i * 55}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
              ))}
              
              {/* Y-axis labels */}
              {(() => {
                const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1);
                const step = Math.ceil(maxRevenue / 5000000) * 1000000;
                return [5, 4, 3, 2, 1, 0].map((val, i) => {
                  const value = (val * step / 1000000).toFixed(0);
                  return (
                    <text
                      key={i}
                      x="70"
                      y={60 + i * 55}
                      textAnchor="end"
                      fontSize="14"
                      fill="#6b7280"
                      dominantBaseline="middle"
                      fontWeight="500"
                    >
                      {value}M
                    </text>
                  );
                });
              })()}

              {/* Line chart */}
              {revenueData.length > 0 && (() => {
                const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1);
                const chartHeight = 275;
                const chartWidth = 800;
                const spacing = chartWidth / Math.max(revenueData.length - 1, 1);
                
                return (
                  <polyline
                    points={revenueData.map((d, i) => {
                      const x = 90 + (i * spacing);
                      const y = 335 - (d.revenue / maxRevenue * chartHeight);
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })()}

              {/* Data points with hover labels */}
              {revenueData.map((d, i) => {
                const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1);
                const chartHeight = 275;
                const chartWidth = 800;
                const spacing = chartWidth / Math.max(revenueData.length - 1, 1);
                const x = 90 + (i * spacing);
                const y = 335 - (d.revenue / maxRevenue * chartHeight);
                const revenueInMillion = (d.revenue / 1000000).toFixed(1);
                const isSelected = selectedPeriod && 
                  selectedPeriod.month === d.monthNumber && 
                  selectedPeriod.year === d.year;
                
                return (
                  <g key={i}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? "8" : "6"}
                      fill={isSelected ? "#1e40af" : "#3b82f6"}
                      style={{ transition: 'all 0.3s ease' }}
                    />
                    {/* Selection ring */}
                    {isSelected && (
                      <circle
                        cx={x}
                        cy={y}
                        r="12"
                        fill="none"
                        stroke="#1e40af"
                        strokeWidth="2"
                        opacity="0.5"
                      />
                    )}
                    {/* Tooltip on hover */}
                    <g className="chart-label" style={{ opacity: 0, transition: 'opacity 0.2s' }}>
                      <rect
                        x={x - 50}
                        y={y - 65}
                        width="100"
                        height="55"
                        rx="6"
                        fill="#111827"
                        opacity="0.95"
                      />
                      <text
                        x={x}
                        y={y - 45}
                        textAnchor="middle"
                        fontSize="13"
                        fill="white"
                        fontWeight="600"
                      >
                        {d.month} {d.year}
                      </text>
                      <text
                        x={x}
                        y={y - 28}
                        textAnchor="middle"
                        fontSize="12"
                        fill="white"
                      >
                        {revenueInMillion}M VND
                      </text>
                      <text
                        x={x}
                        y={y - 13}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#60a5fa"
                        fontStyle="italic"
                      >
                        Click để xem chi tiết
                      </text>
                    </g>
                    {/* Hover and click area */}
                    <circle
                      cx={x}
                      cy={y}
                      r="15"
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
                      onClick={() => handleChartPointClick(d)}
                    />
                  </g>
                );
              })}

              {/* X-axis labels */}
              {revenueData.map((d, i) => {
                const chartWidth = 800;
                const spacing = chartWidth / Math.max(revenueData.length - 1, 1);
                const x = 90 + (i * spacing);
                
                // Check if we need to show year label (when year changes or first item)
                const showYearLabel = i === 0 || (i > 0 && d.year !== revenueData[i - 1].year);
                
                return (
                  <g key={i}>
                    {/* Month label */}
                    <text
                      x={x}
                      y="370"
                      textAnchor="middle"
                      fontSize="14"
                      fill="#6b7280"
                      fontWeight="500"
                    >
                      {d.month}
                    </text>
                    
                    {/* Year label (shown when year changes) */}
                    {showYearLabel && d.year && timeFilter !== 'all' && (
                      <text
                        x={x}
                        y="390"
                        textAnchor="middle"
                        fontSize="12"
                        fill="#9ca3af"
                        fontWeight="600"
                      >
                        {d.year}
                      </text>
                    )}
                  </g>
                );
              })}
              
              {/* Chart labels */}
              <text
                x="450"
                y="30"
                textAnchor="middle"
                fontSize="15"
                fill="#6b7280"
                fontWeight="600"
              >
                Doanh thu (Triệu VND)
              </text>
              
              <text
                x="25"
                y="200"
                textAnchor="middle"
                fontSize="14"
                fill="#6b7280"
                fontWeight="500"
                transform="rotate(-90, 25, 200)"
              >
                VND
              </text>
            </svg>
          </div>
        </div>

      {/* Revenue and Top Students Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Top Courses by Students */}
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>
            Top khóa học theo học viên
          </h3>
          <div style={{ height: '300px', position: 'relative' }}>
            {topCoursesByStudents.length > 0 ? (
              <svg width="100%" height="100%" viewBox="0 0 500 300" style={{ overflow: 'visible' }}>
                {/* Y-axis labels */}
                {(() => {
                  const maxStudents = Math.max(...topCoursesByStudents.map(c => c.value), 1);
                  const step = Math.ceil(maxStudents / 5);
                  return [5, 4, 3, 2, 1, 0].map((val, i) => {
                    const value = val * step;
                    const y = 30 + (i * 40);
                    return (
                      <text
                        key={i}
                        x="35"
                        y={y}
                        textAnchor="end"
                        fontSize="11"
                        fill="#6b7280"
                        dominantBaseline="middle"
                      >
                        {value}
                      </text>
                    );
                  });
                })()}

                {/* Column chart */}
                {topCoursesByStudents.map((course, index) => {
                  const maxStudents = Math.max(...topCoursesByStudents.map(c => c.value), 1);
                  const columnWidth = 60;
                  const spacing = 15;
                  const chartHeight = 200;
                  const x = 60 + (index * (columnWidth + spacing));
                  const columnHeight = (course.value / maxStudents) * chartHeight;
                  const y = 230 - columnHeight;
                  
                  return (
                    <g key={index}>
                      {/* Column */}
                      <rect
                        x={x}
                        y={y}
                        width={columnWidth}
                        height={columnHeight}
                        fill={course.color}
                        rx="4"
                        style={{ 
                          cursor: 'pointer', 
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      />
                      {/* Value label on top of column */}
                      <text
                        x={x + columnWidth / 2}
                        y={y - 5}
                        textAnchor="middle"
                        fontSize="12"
                        fill="#374151"
                        fontWeight="600"
                      >
                        {course.value.toLocaleString()}
                      </text>
                      {/* Course name label (rotated) */}
                      <text
                        x={x + columnWidth / 2}
                        y="245"
                        textAnchor="start"
                        fontSize="10"
                        fill="#374151"
                        fontWeight="500"
                        transform={`rotate(45, ${x + columnWidth / 2}, 245)`}
                      >
                        {course.name.length > 20 ? course.name.substring(0, 20) + '...' : course.name}
                      </text>
                    </g>
                  );
                })}

                {/* Y-axis line */}
                <line
                  x1="45"
                  y1="30"
                  x2="45"
                  y2="230"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />

                {/* X-axis line */}
                <line
                  x1="45"
                  y1="230"
                  x2="480"
                  y2="230"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />

                {/* Y-axis label */}
                <text
                  x="20"
                  y="130"
                  textAnchor="middle"
                  fontSize="12"
                  fill="#6b7280"
                  fontWeight="500"
                  transform="rotate(-90, 20, 130)"
                >
                  Số học viên
                </text>
              </svg>
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: '#9ca3af',
                fontSize: '14px'
              }}>
                Chưa có dữ liệu
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Ratings Table - Full Width Row */}
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
