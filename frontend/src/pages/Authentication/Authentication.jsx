

import { useLocation, Navigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import styles from './Authentication.module.css';
import LoginForm from '../../components/LoginForm/LoginForm.jsx';
import SignupForm from '../../components/SignupForm/SignupForm.jsx';
import ResetPassword from '../../components/ResetPassword/ResetPassword.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle';

export default function Authentication() {
    const location = useLocation();
    const { isSignedIn, isLoaded } = useUser();
    const isLoginPage = location.pathname === '/auth/login';
    const isSignupPage = location.pathname === '/auth/signup';
    const isResetPage = location.pathname === '/auth/reset';

    // Dynamic title based on auth page
    useDocumentTitle(
        isLoginPage ? 'Đăng nhập' : 
        isSignupPage ? 'Đăng ký' : 
        isResetPage ? 'Đặt lại mật khẩu' : 
        'Xác thực'
    );

    // Show loading while Clerk is initializing
    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    // Redirect to home if user is already signed in
    if (isSignedIn) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className={styles.container}>
            <div className={styles.leftImage}>
                <img className={styles.leftImageImg} src="/src/assets/6 SCENE.svg" alt="leftSideImage" />
            </div>
            <div className={styles.rightContent}>
                {isLoginPage && <LoginForm />}
                {isSignupPage && <SignupForm />}
                {isResetPage && <ResetPassword />}
                {!isLoginPage && !isSignupPage && !isResetPage && <LoginForm />}
            </div>
        </div>
    );
}