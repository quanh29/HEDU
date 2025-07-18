import styles from './SignupForm.module.css';
import { Link, useNavigate } from 'react-router-dom';
import { useSignUp } from '@clerk/clerk-react';
import { useState } from 'react';

export default function SignupForm() {
    const { signUp, setActive } = useSignUp();
    const navigate = useNavigate();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [code, setCode] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!signUp || isLoading) return;

        if (password !== confirmPassword) {
            alert('Mật khẩu xác nhận không khớp!');
            return;
        }

        if (fullName.trim().length < 4) {
            alert('Họ và tên phải có ít nhất 4 ký tự!');
            return;
        }

        if (fullName.trim().length > 64) {
            alert('Họ và tên không được vượt quá 64 ký tự!');
            return;
        }

        if (!agreedToTerms) {
            alert('Bạn phải đồng ý với Điều khoản dịch vụ để đăng ký!');
            return;
        }

        setIsLoading(true);
        try {
            const signUpAttempt = await signUp.create({
                emailAddress: email,
                password,
                firstName: fullName,
            });

            if (signUpAttempt.status === 'complete') {
                await setActive({ session: signUpAttempt.createdSessionId });
                navigate('/');
            } else {
                // Gửi mã xác thực email ngay lần đầu
                await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
                setVerifying(true);
            }
        } catch (error) {
            console.error('Error during sign up:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerification = async (e) => {
        e.preventDefault();
        if (!signUp || isLoading) return;

        setIsLoading(true);
        try {
            const signUpAttempt = await signUp.attemptEmailAddressVerification({
                code,
            });

            if (signUpAttempt.status === 'complete') {
                await setActive({ session: signUpAttempt.createdSessionId });
                navigate('/');
            } else {
                console.error('Verification failed');
                alert('Mã xác thực không đúng. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Error during verification:', error);
            alert('Xác thực thất bại: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const resendVerificationCode = async () => {
        if (!signUp || isLoading) return;

        setIsLoading(true);
        try {
            await signUp.prepareEmailAddressVerification({
                strategy: 'email_code',
            });
            alert('Mã xác thực đã được gửi lại!');
        } catch (error) {
            console.error('Error resending verification code:', error);
            alert('Không thể gửi lại mã xác thực. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        if (!signUp || isLoading) return;

        setIsLoading(true);
        try {
            await signUp.authenticateWithRedirect({
                strategy: 'oauth_google',
                redirectUrl: '/sso-callback',
                redirectUrlComplete: '/',
            });
        } catch (error) {
            console.error('Error during Google sign up:', error);
            setIsLoading(false);
        }
    };

    const handleFacebookSignUp = async () => {
        if (!signUp || isLoading) return;

        setIsLoading(true);
        try {
            await signUp.authenticateWithRedirect({
                strategy: 'oauth_facebook',
                redirectUrl: '/sso-callback',
                redirectUrlComplete: '/',
            });
        } catch (error) {
            console.error('Error during Facebook sign up:', error);
            setIsLoading(false);
        }
    };

    return (
        <div>
            {!verifying ? (
                <form className={styles.form} onSubmit={handleSubmit}>
                    <h2 className={styles.title}>Đăng ký</h2>
                    <p className={styles.subtitle}>Chào mừng bạn! Hãy tạo tài khoản để bắt đầu</p>
                    <div className={styles.socialRow}>
                        <button type="button" className={styles.googleBtn} onClick={handleGoogleSignUp} disabled={isLoading}>
                            <img src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/googleLogo.svg" alt="googleLogo" />
                        </button>
                        <button type="button" className={styles.facebookBtn} onClick={handleFacebookSignUp} disabled={isLoading}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="white"/>
                            </svg>
                            Facebook
                        </button>
                    </div>
                    <div className={styles.divider}>
                        <div className={styles.dividerLine}></div>
                        <p className={styles.dividerText}>Hoặc đăng ký với Email</p>
                        <div className={styles.dividerLine}></div>
                    </div>
                    <div className={styles.inputGroup}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 8c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#6B7280"/>
                        </svg>
                        <input 
                            type="text" 
                            placeholder="Họ và tên" 
                            className={styles.input} 
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required 
                        />                 
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
                    <div className={styles.inputGroup}>
                        <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280"/>
                        </svg>
                        <input 
                            type="password" 
                            placeholder="Mật khẩu" 
                            className={styles.input} 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280"/>
                        </svg>
                        <input 
                            type="password" 
                            placeholder="Xác nhận mật khẩu" 
                            className={styles.input} 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required 
                        />
                    </div>
                    <div className={styles.options}>
                        <div className={styles.checkboxGroup}>
                            <input
                                className={styles.checkbox}
                                type="checkbox"
                                id="terms"
                                checked={agreedToTerms}
                                onChange={e => setAgreedToTerms(e.target.checked)}
                                required
                            />
                            <label className={styles.label} htmlFor="terms">Tôi đồng ý với <a href="#" className={styles.termsLink}>Điều khoản dịch vụ</a></label>
                        </div>
                    </div>
                    <div id="clerk-captcha"></div>
                    <button type="submit" className={styles.signupBtn} disabled={isLoading}>
                        {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
                    </button>
                    <p className={styles.loginText}>Đã có tài khoản? <Link className={styles.loginLink} to="/auth/login">Đăng nhập</Link></p>
                </form>
            ) : (
                <form className={styles.form} onSubmit={handleVerification}>
                    <h2 className={styles.title}>Xác thực Email</h2>
                    <p className={styles.subtitle}>Chúng tôi đã gửi mã xác thực đến email {email}</p>
                    <div className={styles.inputGroup}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm3.5 6L7.1 10.4c-.2.2-.4.3-.7.3s-.5-.1-.7-.3L3.5 8.2c-.4-.4-.4-1 0-1.4s1-.4 1.4 0L6.4 8.3 10.1 4.6c.4-.4 1-.4 1.4 0s.4 1 0 1.4z" fill="#6B7280"/>
                        </svg>
                        <input 
                            type="text" 
                            placeholder="Nhập mã xác thực" 
                            className={styles.input} 
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required 
                        />
                    </div>
                    <button type="submit" className={styles.signupBtn} disabled={isLoading}>
                        {isLoading ? 'Đang xác thực...' : 'Xác thực'}
                    </button>
                    <p className={styles.loginText}>
                        Chưa nhận được mã? 
                        <button 
                            type="button" 
                            className={styles.loginLink} 
                            onClick={resendVerificationCode}
                            disabled={isLoading}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '5px' }}
                        >
                            Gửi lại
                        </button>
                        {' | '}
                        <button 
                            type="button" 
                            className={styles.loginLink} 
                            onClick={() => setVerifying(false)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            Quay lại
                        </button>
                    </p>
                </form>
            )}
        </div>
    );
}