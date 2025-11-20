import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, SignIn } from '@clerk/clerk-react';
import styles from './AdminLogin.module.css';
import { Shield, Lock } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      // User is signed in, redirect to admin dashboard
      // Backend will verify if user is admin
      navigate('/admin/dashboard');
    }
  }, [isLoaded, isSignedIn, navigate]);

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

        <div className={styles.clerkWrapper}>
          <SignIn
            appearance={{
              elements: {
                rootBox: styles.clerkRoot,
                card: styles.clerkCard,
                headerTitle: styles.clerkTitle,
                headerSubtitle: styles.clerkSubtitle,
                socialButtonsBlockButton: styles.clerkSocialButton,
                formButtonPrimary: styles.clerkPrimaryButton,
                footerActionLink: styles.clerkLink,
                identityPreviewText: styles.clerkPreviewText,
                formFieldInput: styles.clerkInput,
              },
            }}
            redirectUrl="/admin/dashboard"
            signUpUrl="/sign-up"
          />
        </div>

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
