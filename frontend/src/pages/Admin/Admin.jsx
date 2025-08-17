import { useState, useEffect } from 'react';
import styles from './Admin.module.css';
import Dashboard from './components/Dashboard/Dashboard';
import CourseApproval from './components/CourseApproval/CourseApproval';
import CourseManagement from './components/CourseManagement/CourseManagement';
import PromotionManagement from './components/PromotionManagement/PromotionManagement';
import AdminManagement from './components/AdminManagement/AdminManagement';
import SupportTickets from './components/SupportTickets/SupportTickets';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminInfo, setAdminInfo] = useState({
    name: 'Admin User',
    role: 'super-admin', // super-admin, admin, sub-admin
    permissions: ['all']
  });

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'course-approval', label: 'Duyệt khóa học', icon: '✅' },
    { id: 'course-management', label: 'Quản lý khóa học', icon: '📚' },
    { id: 'promotions', label: 'Khuyến mãi & Voucher', icon: '🎫' },
    { id: 'admin-management', label: 'Quản lý Admin', icon: '👥' },
    { id: 'support-tickets', label: 'Hỗ trợ khách hàng', icon: '🎧' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'course-approval':
        return <CourseApproval />;
      case 'course-management':
        return <CourseManagement />;
      case 'promotions':
        return <PromotionManagement />;
      case 'admin-management':
        return <AdminManagement />;
      case 'support-tickets':
        return <SupportTickets />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={styles.adminContainer}>
      {/* Header */}
      <header className={styles.adminHeader}>
        <div className={styles.headerLeft}>
          <h1>Admin Panel</h1>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.adminProfile}>
            <span className={styles.adminName}>{adminInfo.name}</span>
            <span className={styles.adminRole}>({adminInfo.role})</span>
            <button className={styles.logoutBtn}>Đăng xuất</button>
          </div>
        </div>
      </header>

      <div className={styles.adminBody}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <nav className={styles.sidebarNav}>
            {menuItems.map(item => (
              <button
                key={item.id}
                className={`${styles.navItem} ${activeTab === item.id ? styles.active : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Admin;
