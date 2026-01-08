import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Clock, 
  Users, 
  GraduationCap, 
  DollarSign, 
  Headphones, 
  Ticket,
  CheckCircle,
  Info,
  AlertTriangle,
  XCircle,
  PartyPopper,
  FileText,
  UserPlus,
  BarChart3
} from 'lucide-react';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCourses: 156,
    pendingApprovals: 23,
    totalUsers: 2847,
    totalInstructors: 89,
    monthlyRevenue: 45600000,
    supportTickets: 12,
    activePromotions: 8
  });

  const recentActivities = [
    { id: 1, type: 'course_approval', message: 'Khóa học "React Advanced" đã được phê duyệt', time: '2 giờ trước', status: 'approved' },
    { id: 2, type: 'user_register', message: 'Người dùng mới đăng ký: nguyen.van.a@email.com', time: '3 giờ trước', status: 'info' },
    { id: 3, type: 'support_ticket', message: 'Ticket hỗ trợ mới từ học viên', time: '4 giờ trước', status: 'warning' },
    { id: 4, type: 'course_violation', message: 'Khóa học "Basic HTML" bị báo cáo vi phạm', time: '5 giờ trước', status: 'danger' },
    { id: 5, type: 'promotion', message: 'Mã giảm giá SALE20 đã được kích hoạt', time: '6 giờ trước', status: 'success' }
  ];

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardHeader}>
        <h2>Dashboard Tổng Quan</h2>
        <div className={styles.dateInfo}>
          <span>Cập nhật: {new Date().toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <BookOpen size={32} />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.totalCourses}</h3>
            <p>Tổng khóa học</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Clock size={32} />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.pendingApprovals}</h3>
            <p>Chờ phê duyệt</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Users size={32} />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.totalUsers}</h3>
            <p>Tổng học viên</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <GraduationCap size={32} />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.totalInstructors}</h3>
            <p>Giảng viên</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <DollarSign size={32} />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.monthlyRevenue.toLocaleString('vi-VN')} ₫</h3>
            <p>Doanh thu tháng</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Headphones size={32} />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.supportTickets}</h3>
            <p>Ticket hỗ trợ</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Ticket size={32} />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.activePromotions}</h3>
            <p>Khuyến mãi</p>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className={styles.recentActivities}>
        <h3>Hoạt động gần đây</h3>
        <div className={styles.activitiesList}>
          {recentActivities.map(activity => (
            <div key={activity.id} className={`${styles.activityItem} ${styles[activity.status]}`}>
              <div className={styles.activityContent}>
                <p className={styles.activityMessage}>{activity.message}</p>
                <span className={styles.activityTime}>{activity.time}</span>
              </div>
              <div className={styles.activityStatus}>
                {activity.status === 'approved' && <CheckCircle size={20} />}
                {activity.status === 'info' && <Info size={20} />}
                {activity.status === 'warning' && <AlertTriangle size={20} />}
                {activity.status === 'danger' && <XCircle size={20} />}
                {activity.status === 'success' && <PartyPopper size={20} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h3>Thao tác nhanh</h3>
        <div className={styles.actionButtons}>
          <button className={styles.actionBtn}>
            <FileText size={20} />
            Xem khóa học chờ duyệt
          </button>
          <button className={styles.actionBtn}>
            <Ticket size={20} />
            Tạo mã giảm giá mới
          </button>
          <button className={styles.actionBtn}>
            <UserPlus size={20} />
            Thêm Admin mới
          </button>
          <button className={styles.actionBtn}>
            <BarChart3 size={20} />
            Xem báo cáo chi tiết
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
