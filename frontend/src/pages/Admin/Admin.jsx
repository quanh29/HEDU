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
  LogOut,
  DollarSign,
  Ticket,
  Layers
} from 'lucide-react';
import Dashboard from './components/Dashboard/Dashboard';
import CourseApproval from './components/CourseApproval/CourseApproval';
import CourseManagement from './components/CourseManagement/CourseManagement';
import PromotionManagement from './components/PromotionManagement/PromotionManagement';
import AdminManagement from './components/UserManagement/AdminManagement';
import SupportTickets from './components/SupportTickets/SupportTickets';
import RevisionApproval from './components/RevisionApproval/RevisionApproval';
import RefundManagement from './components/RefundManagement/RefundManagement';
import VoucherManagement from './components/VoucherManagement/VoucherManagement';
import CategoryManagement from './components/CategoryManagement/CategoryManagement';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const Admin = () => {
  useDocumentTitle('Quản trị hệ thống');
  
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
    isSuperAdmin: false,
    initials: 'A',
    avatarUrl: null
  });

  // Sync activeTab with URL
  useEffect(() => {
    const path = location.pathname;
    if (path === '/admin/dashboard') setActiveTab('dashboard');
    else if (path === '/admin/courses') setActiveTab('course-management');
    else if (path === '/admin/revisions') setActiveTab('revision-approval');
    else if (path === '/admin/refunds') setActiveTab('refund-management');
    else if (path === '/admin/vouchers') setActiveTab('voucher-management');
    else if (path === '/admin/categories') setActiveTab('category-management');
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
          `${import.meta.env.VITE_BASE_URL}/api/admin/is-admin`,
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

          const isSuperAdmin = response.data.isSuperAdmin || false;
          const roleLabel = isSuperAdmin ? 'Super Admin' : 'Admin';

          setAdminInfo({
            name: fullName,
            role: roleLabel,
            isSuperAdmin: isSuperAdmin,
            initials: initials,
            avatarUrl: null
          });
          // Fetch public profile to get avatar and full_name mapping
          try {
            const pub = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/admin/profile/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
            );
            if (pub.data?.success && pub.data.data?.user) {
              const u = pub.data.data.user;
              setAdminInfo(prev => ({
                ...prev,
                name: u.full_name || prev.name,
                avatarUrl: u.profile_image_url || prev.avatarUrl
              }));
            }
          } catch (pfErr) {
            console.warn('Failed to fetch public profile for sidebar:', pfErr?.message || pfErr);
          }
        }
      } catch (error) {
        console.error('Admin verification failed:', error);
        
        // User is signed in but not admin, force sign out
        await signOut();
        
        // Redirect to admin login with error message that looks like account doesn't exist
        alert('Tài khoản không tồn tại hoặc không có quyền truy cập. Vui lòng kiểm tra lại thông tin đăng nhập.');
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
    { id: 'revision-approval', label: 'Duyệt cập nhật', icon: Bell, path: '/admin/revisions' },
    { id: 'refund-management', label: 'Hoàn tiền', icon: DollarSign, path: '/admin/refunds' },
    { id: 'voucher-management', label: 'Voucher', icon: Ticket, path: '/admin/vouchers' },
    { id: 'category-management', label: 'Danh mục', icon: Layers, path: '/admin/categories' },
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
      case 'revision-approval':
        return <RevisionApproval />;
      case 'refund-management':
        return <RefundManagement />;
      case 'voucher-management':
        return <VoucherManagement />;
      case 'category-management':
        return <CategoryManagement />;
      case 'promotions':
        return <PromotionManagement />;
      case 'admin-management':
        return <AdminManagement isSuperAdmin={adminInfo.isSuperAdmin} />;
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
          <div className={styles.logoText}>HEDU</div>
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
          {adminInfo.avatarUrl ? (
            <img src={adminInfo.avatarUrl} alt={adminInfo.name} className={styles.userAvatarImage} />
          ) : (
            <div className={styles.userAvatar}>{adminInfo.initials}</div>
          )}
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
