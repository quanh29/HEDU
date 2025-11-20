import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser, useAuth, useClerk } from '@clerk/clerk-react';
import axios from 'axios';
import styles from './Admin.module.css';
import { 
  Home, 
  BookOpen, 
  Users, 
  BarChart3, 
  HelpCircle, 
  Settings,
  Search,
  Bell,
  Mail,
  ChevronRight,
  Menu,
  LogOut
} from 'lucide-react';
import Dashboard from './components/Dashboard/Dashboard';
import CourseApproval from './components/CourseApproval/CourseApproval';
import CourseManagement from './components/CourseManagement/CourseManagement';
import PromotionManagement from './components/PromotionManagement/PromotionManagement';
import AdminManagement from './components/AdminManagement/AdminManagement';
import SupportTickets from './components/SupportTickets/SupportTickets';

const Admin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [adminInfo, setAdminInfo] = useState({
    name: 'Admin',
    role: 'Admin',
    initials: 'A'
  });

  // Sync activeTab with URL
  useEffect(() => {
    const path = location.pathname;
    if (path === '/admin/dashboard') setActiveTab('dashboard');
    else if (path === '/admin/courses') setActiveTab('course-management');
    else if (path === '/admin/users') setActiveTab('admin-management');
    else if (path === '/admin/statistics') setActiveTab('promotions');
    else if (path === '/admin/support') setActiveTab('support-tickets');
    else if (path === '/admin/settings') setActiveTab('settings');
  }, [location.pathname]);

  // Verify admin access via backend
  useEffect(() => {
    const verifyAdminAccess = async () => {
      if (!isLoaded) return;

      if (!isSignedIn) {
        // Not signed in, redirect to admin login
        navigate('/login-admin');
        return;
      }

      try {
        setVerifying(true);
        const token = await getToken();
        
        // Call backend to verify admin role
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/admin/verify`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          // User is admin, set admin info
          const firstName = user.firstName || '';
          const lastName = user.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim() || 'Admin';
          const initials = firstName && lastName 
            ? `${firstName[0]}${lastName[0]}`.toUpperCase()
            : fullName.substring(0, 2).toUpperCase();

          setAdminInfo({
            name: fullName,
            role: 'Admin',
            initials: initials
          });
        }
      } catch (error) {
        console.error('Admin verification failed:', error);
        
        // User is signed in but not admin, force sign out
        await signOut();
        
        // Redirect to admin login with error message
        alert('Bạn không có quyền truy cập trang quản trị. Bạn đã được đăng xuất. Vui lòng đăng nhập bằng tài khoản admin.');
        navigate('/login-admin');
      } finally {
        setVerifying(false);
      }
    };

    verifyAdminAccess();
  }, [isLoaded, isSignedIn, user, getToken, signOut, navigate]);

  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      try {
        await signOut({ redirectUrl: null });
        navigate('/login-admin');
      } catch (error) {
        console.error('Logout error:', error);
        alert('Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại.');
      }
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: Home, path: '/admin/dashboard' },
    { id: 'course-management', label: 'Khóa học', icon: BookOpen, path: '/admin/courses' },
    { id: 'admin-management', label: 'Người dùng', icon: Users, path: '/admin/users' },
    { id: 'promotions', label: 'Thống kê', icon: BarChart3, path: '/admin/statistics' },
    { id: 'support-tickets', label: 'Hỗ trợ', icon: HelpCircle, path: '/admin/support' },
    { id: 'settings', label: 'Cài đặt', icon: Settings, path: '/admin/settings' }
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
      case 'settings':
        return <div className={styles.settingsPlaceholder}>Cài đặt hệ thống</div>;
      default:
        return <Dashboard />;
    }
  };

  // Show loading while verifying admin access
  if (!isLoaded || verifying) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Đang xác thực quyền truy cập...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      {/* Menu Toggle Button for Mobile */}
      <button 
        className={styles.menuToggle}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarLogo}>
          <div className={styles.logoText}>EduCommerce</div>
          <div className={styles.logoSubtitle}>Admin Dashboard</div>
        </div>
        
        <nav className={styles.sidebarMenu}>
          {menuItems.map(item => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                className={`${styles.menuItem} ${activeTab === item.id ? styles.active : ''}`}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
              >
                <IconComponent className={styles.menuIcon} size={20} />
                <span className={styles.menuLabel}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={styles.sidebarUser}>
          <div className={styles.userAvatar}>{adminInfo.initials}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{adminInfo.name}</div>
            <div className={styles.userRole}>{adminInfo.role}</div>
          </div>
          <button 
            className={styles.logoutButton}
            onClick={handleLogout}
            title="Đăng xuất"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} size={20} />
          <input type="text" placeholder="Tìm kiếm khóa học, người dùng..." />
        </div>

        <div className={styles.headerActions}>
          <button className={styles.iconButton}>
            <Bell size={20} />
            <span className={styles.badge}></span>
          </button>
          <button className={styles.iconButton}>
            <Mail size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Admin;
