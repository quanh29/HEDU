import styles from './LoginForm.module.css';
import { Link, useNavigate } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import { useState } from 'react';

function LoginForm() {
    const { signIn, setActive } = useSignIn();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!signIn || isLoading) return;

        setIsLoading(true);
        setError('');
        try {
            const signInAttempt = await signIn.create({
                identifier: email,
                password,
            });

            if (signInAttempt.status === 'complete') {
                await setActive({ session: signInAttempt.createdSessionId });
                navigate('/');
            }
        } catch (error) {
            console.error('Error during sign in:', error);
            setError('Email hoặc mật khẩu không đúng');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        if (!signIn || isLoading) return;

        setIsLoading(true);
        try {
            await signIn.authenticateWithRedirect({
                strategy: 'oauth_google',
                redirectUrl: '/sso-callback',
                redirectUrlComplete: '/auth/complete-profile',
            });
        } catch (error) {
            console.error('Error during Google sign in:', error);
            setIsLoading(false);
        }
    };

    const handleFacebookSignIn = async () => {
        if (!signIn || isLoading) return;

        setIsLoading(true);
        try {
            await signIn.authenticateWithRedirect({
                strategy: 'oauth_facebook',
                redirectUrl: '/sso-callback',
                redirectUrlComplete: '/auth/complete-profile',
            });
        } catch (error) {
            console.error('Error during Facebook sign in:', error);
            setIsLoading(false);
        }
    };

    return (
        <div>
            <form className={styles.form} onSubmit={handleSubmit}>
                    <h2 className={styles.title}>Đăng nhập</h2>
                    <p className={styles.subtitle}>Chào mừng bạn trở lại! Hãy đăng nhập để tiếp tục</p>
                    <div className={styles.socialRow}>
                        <button type="button" className={styles.googleBtn} onClick={handleGoogleSignIn} disabled={isLoading}>
                            <img src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/googleLogo.svg" alt="googleLogo" />
                        </button>
                        <button type="button" className={styles.facebookBtn} onClick={handleFacebookSignIn} disabled={isLoading}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="white"/>
                            </svg>
                            Facebook
                        </button>
                    </div>
                    <div className={styles.divider}>
                        <div className={styles.dividerLine}></div>
                        <p className={styles.dividerText}>Hoặc đăng nhập với Email</p>
                        <div className={styles.dividerLine}></div>
                    </div>
                    <div className={styles.inputGroup}>
                        <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M0 .55.571 0H15.43l.57.55v9.9l-.571.55H.57L0 10.45zm1.143 1.138V9.9h13.714V1.69l-6.503 4.8h-.697zM13.749 1.1H2.25L8 5.356z" fill="#6B7280"/>
                        </svg>
                        <input 
                            type="email" 
                            placeholder="Email" 
                            className={styles.input} 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                        />                 
                    </div>
                    <div className={styles.inputGroup} style={{marginTop: '1.5rem'}}>
                        <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280"/>
                        </svg>
                        <input 
                            type="password" 
                            placeholder="Password" 
                            className={styles.input} 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                        />
                    </div>
                    <div className={styles.options}>
                        <div className={styles.checkboxGroup}>
                            <input className={styles.checkbox} type="checkbox" id="checkbox" />
                            <label className={styles.label} htmlFor="checkbox">Ghi nhớ tôi</label>
                        </div>
                        <button 
                            type="button" 
                            className={styles.forgot} 
                            onClick={() => navigate('/auth/reset')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            Quên mật khẩu?
                        </button>
                    </div>
                    <div id="clerk-captcha"></div>
                    {error && (
                        <div style={{
                            color: '#dc2626',
                            fontSize: '14px',
                            padding: '10px',
                            backgroundColor: '#fee2e2',
                            borderRadius: '6px',
                            marginBottom: '16px',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}
                    <button type="submit" className={styles.loginBtn} disabled={isLoading}>
                        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                    <p className={styles.signupText}>Không có tài khoản? <Link className={styles.signupLink} to="/auth/signup">Đăng ký</Link></p>
                </form>
            
        </div>
    );
}


export default LoginForm;