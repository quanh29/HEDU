import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useClerk, useSignIn } from '@clerk/clerk-react';
import axios from 'axios';
import styles from './AdminLogin.module.css';
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { signOut } = useClerk();
  const { signIn, setActive } = useSignIn();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is already signed in
  useEffect(() => {
    const checkExistingAuth = async () => {
      if (!isLoaded) return;
      
      setCheckingAuth(true);
      
      if (isSignedIn) {
        try {
          const token = await getToken();
          
          // Verify if current user is admin
          const response = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/api/admin/verify`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          if (response.data.success) {
            // User is admin, redirect to dashboard
            navigate('/admin/dashboard');
          }
        } catch (error) {
          // User is signed in but not admin, force sign out
          console.log('Current user is not admin, signing out...');
          await signOut({ redirectUrl: null });
          setError('Bạn đã đăng xuất khỏi tài khoản thường. Vui lòng đăng nhập bằng tài khoản admin.');
        }
      }
      
      setCheckingAuth(false);
    };

    checkExistingAuth();
  }, [isLoaded, isSignedIn, getToken, navigate, signOut]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!signIn) {
        setError('Hệ thống đăng nhập chưa sẵn sàng. Vui lòng thử lại.');
        setLoading(false);
        return;
      }

      // Sign in with Clerk
      const result = await signIn.create({
        identifier: email,
        password: password,
      });

      if (result.status === 'complete') {
        // Temporarily set the session to get token for verification
        await setActive({ session: result.createdSessionId });
        
        // Get token after successful sign in
        const token = await getToken();

        // Verify admin role via backend BEFORE completing login
        try {
          const verifyResponse = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/api/admin/verify`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          if (verifyResponse.data.success) {
            // User is admin, allow login and redirect to dashboard
            navigate('/admin/dashboard');
          } else {
            // Not admin, abort login
            await signOut({ redirectUrl: null });
            setError('Bạn không có quyền truy cập trang quản trị. Tài khoản này không phải là admin.');
            setEmail('');
            setPassword('');
          }
        } catch (verifyError) {
          // Not an admin or verification failed, sign out immediately
          await signOut({ redirectUrl: null });
          
          if (verifyError.response?.status === 401) {
            setError('Bạn không có quyền truy cập trang quản trị. Chỉ tài khoản admin mới có thể đăng nhập.');
          } else {
            setError('Không thể xác thực quyền admin. Vui lòng thử lại.');
          }
          
          setEmail('');
          setPassword('');
        }
      } else {
        setError('Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle different error cases
      if (err.errors && err.errors.length > 0) {
        const errorCode = err.errors[0].code;
        
        switch (errorCode) {
          case 'form_identifier_not_found':
            setError('Email không tồn tại trong hệ thống.');
            break;
          case 'form_password_incorrect':
            setError('Mật khẩu không chính xác.');
            break;
          case 'session_exists':
            setError('Phiên đăng nhập đã tồn tại.');
            break;
          default:
            setError(err.errors[0].message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        }
      } else {
        setError('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking existing auth
  if (checkingAuth) {
    return (
      <div className={styles.adminLoginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Đang kiểm tra xác thực...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminLoginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <div className={styles.logoSection}>
            <div className={styles.iconWrapper}>
              <Shield size={40} className={styles.shieldIcon} />
              <Lock size={20} className={styles.lockIcon} />
            </div>
            <h1 className={styles.title}>Admin Portal</h1>
            <p className={styles.subtitle}>Hệ thống quản trị EduCommerce</p>
          </div>
        </div>

        <form className={styles.loginForm} onSubmit={handleSubmit}>
          {error && (
            <div className={styles.errorAlert}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              <Mail size={16} />
              Email
            </label>
            <input
              id="email"
              type="email"
              className={styles.input}
              placeholder="Nhập Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              <Lock size={16} />
              Mật khẩu
            </label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={styles.input}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className={styles.buttonSpinner}></div>
                Đang đăng nhập...
              </>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>

        <div className={styles.securityNotice}>
          <Lock size={14} />
          <span>Chỉ dành cho quản trị viên có thẩm quyền</span>
        </div>
      </div>

      <div className={styles.backgroundDecoration}>
        <div className={styles.circle}></div>
        <div className={styles.circle}></div>
        <div className={styles.circle}></div>
      </div>
    </div>
  );
};

export default AdminLogin;
