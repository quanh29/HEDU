import styles from './Footer.module.css';

function Footer() {
  return (
    <footer className={styles.footerRoot}>
      <div className={styles.footerContainer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3>HEDU</h3>
            <p>Nền tảng học tập trực tuyến hàng đầu Việt Nam, mang đến những khóa học chất lượng cao với chi phí hợp lý.</p>
          </div>
          <div className={styles.footerSection}>
            <h3>Liên kết nhanh</h3>
            <ul>
              <li><a href="#home">Trang chủ</a></li>
              <li><a href="#courses">Khóa học</a></li>
              <li><a href="#about">Về chúng tôi</a></li>
              <li><a href="#contact">Liên hệ</a></li>
            </ul>
          </div>
          <div className={styles.footerSection}>
            <h3>Hỗ trợ</h3>
            <ul>
              <li><a href="#">Câu hỏi thường gặp</a></li>
              <li><a href="#">Hướng dẫn sử dụng</a></li>
              <li><a href="#">Chính sách bảo mật</a></li>
              <li><a href="#">Điều khoản dịch vụ</a></li>
            </ul>
          </div>
          <div className={styles.footerSection}>
            <h3>Liên hệ</h3>
            <ul>
              <li>📧 contact@hedu.vn</li>
              <li>📞 0123 456 789</li>
              <li>📍 Hà Nội, Việt Nam</li>
            </ul>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; 2025 HEDU. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;