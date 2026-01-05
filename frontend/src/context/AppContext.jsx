import { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth, useUser, useClerk } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

export const AppContext = createContext();

export const AppProvider = ({ children }) => {

  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Use ref instead of state to prevent multiple toasts
  const deactivationHandledRef = useRef(false);

  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const location  = useLocation();
  const navigate = useNavigate();

  // Setup axios interceptor to handle account deactivation
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error?.response?.status === 403 && 
            error?.response?.data?.message?.includes('deactivated') &&
            !deactivationHandledRef.current) {
          
          // Prevent multiple toast notifications using ref
          deactivationHandledRef.current = true;
          
          // Dismiss all existing toasts first
          toast.dismiss();
          
          // Show toast with action button
          toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontWeight: '500' }}>
                ⚠️ Tài khoản của bạn đã bị vô hiệu hóa
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Vui lòng liên hệ hỗ trợ để biết thêm chi tiết
              </div>
              <button
                onClick={async () => {
                  toast.dismiss(t.id);
                  try {
                    await signOut();
                    setIsUserAuthenticated(false);
                    setIsAdmin(false);
                    setUserProfile(null);
                    navigate('/auth/login');
                    // Reset flag after navigation
                    setTimeout(() => {
                      deactivationHandledRef.current = false;
                    }, 2000);
                  } catch (signOutError) {
                    console.error('Error signing out:', signOutError);
                    deactivationHandledRef.current = false;
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: '#250fbaff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '550'
                }}
              >
                Xác nhận
              </button>
            </div>
          ), {
            duration: Infinity,
            position: 'top-center',
            style: {
              minWidth: '350px',
              padding: '16px'
            }
          });
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [signOut, navigate]);

  // Fetch user authentication status and profile
  const fetchUserAuthenticationStatus = async () => {
    // Wait for Clerk to load before proceeding
    if (!isUserLoaded) {
      setLoading(true);
      return;
    }

    if (!user || !isSignedIn) {
      setIsUserAuthenticated(false);
      setIsAdmin(false);
      setUserProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // User is authenticated via Clerk
      setIsUserAuthenticated(true);

      // Check admin status via backend API
      try {
        const token = await getToken();
        const response = await axios.get('/api/admin/is-admin', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const adminRole = response.data.success && response.data.isAdmin;
        console.log('✅ [AppContext] Admin check from backend:', { adminRole, userId: user.id });
        setIsAdmin(adminRole);
      } catch (adminError) {
        // If account is deactivated, handled by interceptor
        if (adminError?.response?.status === 403 && 
            adminError?.response?.data?.message?.includes('deactivated')) {
          // Don't show additional error here, interceptor will handle it
          setIsUserAuthenticated(false);
          setIsAdmin(false);
          setUserProfile(null);
          setLoading(false);
          return;
        }
        
        // If API call fails or user is not admin, set to false
        console.log('⚠️ [AppContext] Not admin or API error:', adminError?.response?.data?.message);
        setIsAdmin(false);
      }

      // Set user profile
      setUserProfile({
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        fullName: user.fullName,
        imageUrl: user.imageUrl,
        role: isAdmin ? 'admin' : 'user'
      });

    } catch (error) {
      console.error("Error fetching user authentication status:", error);
      setIsUserAuthenticated(false);
      setIsAdmin(false);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has access to a specific route
  const checkRouteAccess = (routePath) => {
    // Public routes
    const publicRoutes = ['/', '/course/search', '/course/', '/auth/'];
    
    // Check if route is public
    if (publicRoutes.some(route => routePath.startsWith(route))) {
      return true;
    }

    // Protected routes that require authentication
    const protectedRoutes = ['/my-learning', '/checkout', '/payment-history', 
                            '/refund-history', '/wallet', '/messages', '/profile'];
    
    if (protectedRoutes.some(route => routePath.startsWith(route))) {
      return isUserAuthenticated;
    }

    // Instructor routes
    if (routePath.startsWith('/instructor')) {
      return isUserAuthenticated;
    }

    // Admin routes
    if (routePath.startsWith('/admin')) {
      return isAdmin;
    }

    return true;
  };

  // Redirect user based on authentication status
  const requireAuth = (redirectTo = '/auth/login') => {
    if (!isUserAuthenticated && !loading) {
      toast.error("Bạn cần đăng nhập để truy cập trang này.");
      navigate(redirectTo);
      return false;
    }
    return true;
  };

  // Require admin access
  const requireAdmin = (redirectTo = '/') => {
    if (!isAdmin && !loading) {
      toast.error("Bạn không có quyền truy cập trang này.");
      navigate(redirectTo);
      return false;
    }
    return true;
  };

  useEffect(() => {
    fetchUserAuthenticationStatus();
  }, [user, isSignedIn, isUserLoaded]);

  // Auto-redirect for protected routes
  useEffect(() => {
    // Wait for Clerk to load and our loading state to finish
    if (!isUserLoaded || loading) return;

    const path = location.pathname;

    // Skip redirect for login pages
    if (path.startsWith('/auth/') || path === '/login-admin') {
      return;
    }

    // Handle admin routes
    if (path.startsWith('/admin')) {
      if (!isUserAuthenticated) {
        // Not logged in, redirect to admin login
        navigate('/login-admin', { state: { from: path } });
        return;
      } else if (!isAdmin) {
        // Logged in but not admin, redirect to home
        toast.error("Bạn không có quyền truy cập trang này.");
        navigate('/');
        return;
      }
      // User is admin, allow access
      return;
    }

    // Redirect to login if accessing protected routes without authentication
    const protectedRoutes = ['/my-learning', '/checkout', '/payment-history', 
                            '/refund-history', '/wallet', '/messages', '/profile', '/instructor'];
    
    if (protectedRoutes.some(route => path.startsWith(route)) && !isUserAuthenticated) {
      toast.error("Bạn cần đăng nhập để truy cập trang này.");
      navigate('/auth/login', { state: { from: path } });
      return;
    }
  }, [location.pathname, isUserAuthenticated, isAdmin, loading, navigate]);

  const value = {    
    axios,
    fetchUserAuthenticationStatus,
    user, 
    getToken, 
    navigate, 
    isUserAuthenticated,
    isAdmin,
    userProfile,
    loading,
    checkRouteAccess,
    requireAuth,
    requireAdmin
};

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
