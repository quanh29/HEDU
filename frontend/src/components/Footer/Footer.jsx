import { Link } from 'react-router-dom';
import { BookOpen, Mail, Phone, MapPin, Facebook, Twitter, Youtube, Linkedin } from 'lucide-react';
import styles from './Footer.module.css';

function Footer() {
  return (
    <footer className={styles.footerRoot}>
      <div className={styles.footerContainer}>
        {/* Main Footer Content */}
        <div className={styles.footerContent}>
          {/* Company Info */}
          <div className={styles.footerSection}>
            <div className={styles.brandSection}>
              <div className={styles.logo}>
                <img src='/logo.png' alt="HEDU Logo" className={styles.logoImage} />
                <h3>HEDU</h3>
              </div>
              <p className={styles.description}>
                Nền tảng học tập trực tuyến hàng đầu Việt Nam, mang đến những khóa học chất lượng cao với chi phí hợp lý.
              </p>
              {/* Social Media */}
              <div className={styles.socialLinks}>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <Facebook size={20} />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <Twitter size={20} />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                  <Youtube size={20} />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <Linkedin size={20} />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className={styles.footerSection}>
            <h3>Khám phá</h3>
            <ul>
              <li><Link to="/">Trang chủ</Link></li>
              <li><Link to="/course/search">Khóa học</Link></li>
              <li><Link to="/my-learning">Khóa học của tôi</Link></li>
              <li><Link to="/instructor/dashboard">Giảng dạy trên HEDU</Link></li>
              <li><Link to="/messages">Tin nhắn</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className={styles.footerSection}>
            <h3>Hỗ trợ</h3>
            <ul>
              <li><Link to="/payment-history">Lịch sử thanh toán</Link></li>
              <li><Link to="/refund-history">Lịch sử hoàn tiền</Link></li>
              <li><Link to="/wallet">Ví của tôi</Link></li>
              <li><a href="#faq">Câu hỏi thường gặp</a></li>
              <li><a href="#privacy">Chính sách bảo mật</a></li>
              <li><a href="#terms">Điều khoản dịch vụ</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className={styles.footerSection}>
            <h3>Liên hệ</h3>
            <ul className={styles.contactList}>
              <li>
                <Mail size={18} />
                <a href="mailto:contact@hedu.vn">contact@hedu.vn</a>
              </li>
              <li>
                <Phone size={18} />
                <a href="tel:+84123456789">0123 456 789</a>
              </li>
              <li>
                <MapPin size={18} />
                <span>Hà Nội, Việt Nam</span>
              </li>
            </ul>

            {/* Government Notification */}
            <div className={styles.govNotification}>
              <a 
                href="https://moit.gov.vn/" 
                target="_blank" 
                rel="noopener noreferrer"
                title="Đã thông báo Bộ Công Thương"
              >
                <img 
                  src="http://online.gov.vn/Content/EndUser/LogoCCDVSaleNoti/logoSaleNoti.png" 
                  alt="Đã thông báo Bộ Công Thương" 
                  className={styles.govLogo}
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className={styles.footerBottom}>
        <div className={styles.footerBottomContainer}>
          <div className={styles.footerBottomContent}>
            <p>&copy; 2025 HEDU. Tất cả quyền được bảo lưu.</p>
            <div className={styles.footerLinks}>
              <a href="#privacy">Chính sách bảo mật</a>
              <span className={styles.separator}>•</span>
              <a href="#terms">Điều khoản sử dụng</a>
              <span className={styles.separator}>•</span>
              <a href="#sitemap">Sơ đồ trang</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;