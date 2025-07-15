import styles from './SignupForm.module.css';
import { Link } from 'react-router-dom';

export default function SignupForm() {
    return (
        <form className={styles.form}>
            <h2 className={styles.title}>Đăng ký</h2>
            <p className={styles.subtitle}>Chào mừng bạn! Hãy tạo tài khoản để bắt đầu</p>
            <button type="button" className={styles.googleBtn}>
                <img src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/googleLogo.svg" alt="googleLogo" />
            </button>
            <div className={styles.divider}>
                <div className={styles.dividerLine}></div>
                <p className={styles.dividerText}>Đăng ký với Email</p>
                <div className={styles.dividerLine}></div>
            </div>
            <div className={styles.inputGroup}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 8c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#6B7280"/>
                </svg>
                <input type="text" placeholder="Họ và tên" className={styles.input} required />                 
            </div>
            <div className={styles.inputGroup}>
                <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M0 .55.571 0H15.43l.57.55v9.9l-.571.55H.57L0 10.45zm1.143 1.138V9.9h13.714V1.69l-6.503 4.8h-.697zM13.749 1.1H2.25L8 5.356z" fill="#6B7280"/>
                </svg>
                <input type="email" placeholder="Email" className={styles.input} required />                 
            </div>
            <div className={styles.inputGroup}>
                <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280"/>
                </svg>
                <input type="password" placeholder="Mật khẩu" className={styles.input} required />
            </div>
            <div className={styles.inputGroup}>
                <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280"/>
                </svg>
                <input type="password" placeholder="Xác nhận mật khẩu" className={styles.input} required />
            </div>
            <div className={styles.options}>
                <div className={styles.checkboxGroup}>
                    <input className={styles.checkbox} type="checkbox" id="terms" />
                    <label className={styles.label} htmlFor="terms">Tôi đồng ý với <a href="#" className={styles.termsLink}>Điều khoản dịch vụ</a></label>
                </div>
            </div>
            <button type="submit" className={styles.signupBtn}>
                Đăng ký
            </button>
            <p className={styles.loginText}>Đã có tài khoản? <Link className={styles.loginLink} to="/auth/login">Đăng nhập</Link></p>
        </form>
    );
}
