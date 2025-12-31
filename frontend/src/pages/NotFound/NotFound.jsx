import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';
import styles from './NotFound.module.css';

function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 404 Illustration */}
        <div className={styles.illustration}>
          <div className={styles.number404}>
            <span className={styles.digit}>4</span>
            <span className={styles.digitMiddle}>0</span>
            <span className={styles.digit}>4</span>
          </div>
          <div className={styles.shadow}></div>
        </div>

        {/* Message */}
        <div className={styles.message}>
          <h1 className={styles.title}>Không tìm thấy trang</h1>
          <p className={styles.description}>
            Rất tiếc, trang bạn đang tìm kiếm không tồn tại.
          </p>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Link to="/" className={styles.primaryButton}>
            <Home size={20} />
            <span>Về trang chủ</span>
          </Link>
          <Link to="/course/search" className={styles.secondaryButton}>
            <Search size={20} />
            <span>Khám phá khóa học</span>
          </Link>
        </div>

        {/* Back Link */}
        <button 
          onClick={() => window.history.back()} 
          className={styles.backLink}
        >
          <ArrowLeft size={18} />
          <span>Quay lại trang trước</span>
        </button>

        {/* Help Section */}
        <div className={styles.helpSection}>
          <p className={styles.helpText}>Cần hỗ trợ?</p>
          <div className={styles.helpLinks}>
            <Link to="/messages">Liên hệ hỗ trợ</Link>
            <span className={styles.separator}>•</span>
            <a href="#faq">Câu hỏi thường gặp</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
