import styles from './ResetPassword.module.css';
import { useSignIn } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {

    const { signIn, isLoaded, setActive } = useSignIn();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [code, setCode] = useState('');
    const [successfulCreation, setSuccessfulCreation] = useState(false);
    const [secondFactor, setSecondFactor] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Nếu đã đăng nhập thì chuyển hướng về trang chủ hoặc trang login
        // (tuỳ vào logic app, ở đây chuyển về login)
        // Không có useAuth như Next.js nên bỏ qua
    }, []);

    if (!isLoaded) {
        return null;
    }

    // Gửi mã reset về email
    async function handleSendEmail(e) {
        e.preventDefault();
        if (!signIn || isLoading) return;
        setIsLoading(true);
        setError('');
        try {
            await signIn.create({
                strategy: 'reset_password_email_code',
                identifier: email,
            });
            setSuccessfulCreation(true);
        } catch (err) {
            setError(err?.errors?.[0]?.longMessage || err.message || 'Có lỗi xảy ra khi gửi mã reset.');
        } finally {
            setIsLoading(false);
        }
    }

    // Reset password với mã code và mật khẩu mới
    async function handleResetPassword(e) {
        e.preventDefault();
        if (!signIn || isLoading) return;
        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp!');
            return;
        }
        if (password.length < 8) {
            setError('Mật khẩu phải có ít nhất 8 ký tự!');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const result = await signIn.attemptFirstFactor({
                strategy: 'reset_password_email_code',
                code,
                password,
            });
            if (result.status === 'needs_second_factor') {
                setSecondFactor(true);
            } else if (result.status === 'complete') {
                // Đăng nhập luôn sau khi reset thành công
                await setActive({ session: result.createdSessionId });
                alert('Mật khẩu đã được thay đổi thành công!');
                navigate('/auth/login');
            } else {
                setError('Có lỗi xảy ra.');
            }
        } catch (err) {
            setError(err?.errors?.[0]?.longMessage || err.message || 'Có lỗi xảy ra khi reset mật khẩu.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div>
            {!successfulCreation ? (
                <form className={styles.form} onSubmit={handleSendEmail}>
                    <h2 className={styles.title}>Quên mật khẩu</h2>
                    <p className={styles.subtitle}>Nhập email của bạn để nhận mã reset mật khẩu</p>
                    <div className={styles.inputGroup}>
                        <input
                            type="email"
                            placeholder="Email"
                            className={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className={styles.loginBtn} disabled={isLoading}>
                        {isLoading ? 'Đang gửi...' : 'Gửi mã reset'}
                    </button>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    <p className={styles.signupText}>
                        <button
                            type="button"
                            className={styles.signupLink}
                            onClick={() => navigate('/auth/login')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            Quay lại đăng nhập
                        </button>
                    </p>
                </form>
            ) : (
                <form className={styles.form} onSubmit={handleResetPassword}>
                    <h2 className={styles.title}>Đặt lại mật khẩu</h2>
                    <p className={styles.subtitle}>Nhập mật khẩu mới và mã xác thực đã gửi về email {email}</p>
                    <div className={styles.inputGroup}>
                        {/* SVG icon for code */}
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm3.5 6L7.1 10.4c-.2.2-.4.3-.7.3s-.5-.1-.7-.3L3.5 8.2c-.4-.4-.4-1 0-1.4s1-.4 1.4 0L6.4 8.3 10.1 4.6c.4-.4 1-.4 1.4 0s.4 1 0 1.4z" fill="#6B7280"/>
                        </svg>
                        <input
                            type="text"
                            placeholder="Mã xác thực"
                            className={styles.input}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        {/* SVG icon for password */}
                        <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280"/>
                        </svg>
                        <input
                            type="password"
                            placeholder="Mật khẩu mới"
                            className={styles.input}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        {/* SVG icon for password confirm */}
                        <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280"/>
                        </svg>
                        <input
                            type="password"
                            placeholder="Xác nhận mật khẩu mới"
                            className={styles.input}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className={styles.loginBtn} disabled={isLoading}>
                        {isLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                    </button>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    {secondFactor && <p>2FA được yêu cầu, nhưng UI này chưa hỗ trợ.</p>}
                    <p className={styles.signupText}>
                        <button
                            type="button"
                            className={styles.signupLink}
                            onClick={() => navigate('/auth/login')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            Quay lại đăng nhập
                        </button>
                    </p>
                </form>
            )}
        </div>
    );
}
