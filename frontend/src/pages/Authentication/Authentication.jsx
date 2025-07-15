

import { useLocation } from 'react-router-dom';
import styles from './Authentication.module.css';
import LoginForm from '../../components/LoginForm/LoginForm';
import SignupForm from '../../components/SignupForm/SignupForm';

export default function Authentication() {
    const location = useLocation();
    const isLoginPage = location.pathname === '/auth/login';
    const isSignupPage = location.pathname === '/auth/signup';

    return (
        <div className={styles.container}>
            <div className={styles.leftImage}>
                <img className={styles.leftImageImg} src="/src/assets/6 SCENE.svg" alt="leftSideImage" />
            </div>
            <div className={styles.rightContent}>
                {isLoginPage && <LoginForm />}
                {isSignupPage && <SignupForm />}
                {!isLoginPage && !isSignupPage && <LoginForm />}
            </div>
        </div>
    );
}