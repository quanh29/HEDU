import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    const target = document.querySelector(targetId);
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleLoginClick = () => {
    navigate('/auth/login');
    // window.location.href = "/auth/login";
  };
  const handleSignupClick = () => {
    navigate('/auth/signup');
    // window.location.href = "/auth/signup";
  };

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.navContainer}>
        <div className={styles.navLeft}>
          <Link 
            to="/" 
            className={styles.logo}
          >
            HEDU
          </Link>
          <div className={styles.navDiscover}>
            <span>Khám phá</span>
            <span className={styles.dropdownArrow}>▼</span>
            <div className={styles.dropdownMenu}>
              <div className={styles.dropdownCategory}>
                <Link to="/programming" className={styles.dropdownCategoryLink}>
                  <div className={styles.dropdownCategoryTitle}>
                    Lập trình
                    <span className={styles.categoryArrow}>▶</span>
                  </div>
                  <div className={styles.dropdownCategoryDesc}>Web, Mobile, Desktop Development</div>
                </Link>
                <div className={styles.subMenu}>
                  <Link to="/web" className={styles.subMenuItem}>Lập trình Web</Link>
                  <Link to="/mobile" className={styles.subMenuItem}>Lập trình Mobile</Link>
                  <Link to="/desktop" className={styles.subMenuItem}>Lập trình Desktop</Link>
                  <Link to="/backend" className={styles.subMenuItem}>Backend Development</Link>
                  <Link to="/frontend" className={styles.subMenuItem}>Frontend Development</Link>
                  <Link to="/fullstack" className={styles.subMenuItem}>Full Stack Development</Link>
                  <Link to="/devops" className={styles.subMenuItem}>DevOps</Link>
                </div>
              </div>
              <div className={styles.dropdownCategory}>
                <Link to="/design" className={styles.dropdownCategoryLink}>
                  <div className={styles.dropdownCategoryTitle}>
                    Thiết kế
                    <span className={styles.categoryArrow}>▶</span>
                  </div>
                  <div className={styles.dropdownCategoryDesc}>UI/UX, Graphic Design, Video</div>
                </Link>
                <div className={styles.subMenu}>
                  <Link to="/uiux" className={styles.subMenuItem}>UI/UX Design</Link>
                  <Link to="/graphic" className={styles.subMenuItem}>Graphic Design</Link>
                  <Link to="/video" className={styles.subMenuItem}>Video Editing</Link>
                  <Link to="/motion" className={styles.subMenuItem}>Motion Graphics</Link>
                  <Link to="/illustration" className={styles.subMenuItem}>Illustration</Link>
                  <Link to="/photography" className={styles.subMenuItem}>Photography</Link>
                </div>
              </div>
              <div className={styles.dropdownCategory}>
                <Link to="/business" className={styles.dropdownCategoryLink}>
                  <div className={styles.dropdownCategoryTitle}>
                    Kinh doanh
                    <span className={styles.categoryArrow}>▶</span>
                  </div>
                  <div className={styles.dropdownCategoryDesc}>Marketing, Management, Finance</div>
                </Link>
                <div className={styles.subMenu}>
                  <Link to="/marketing" className={styles.subMenuItem}>Digital Marketing</Link>
                  <Link to="/management" className={styles.subMenuItem}>Project Management</Link>
                  <Link to="/finance" className={styles.subMenuItem}>Finance & Accounting</Link>
                  <Link to="/sales" className={styles.subMenuItem}>Sales</Link>
                  <Link to="/startup" className={styles.subMenuItem}>Entrepreneurship</Link>
                  <Link to="/strategy" className={styles.subMenuItem}>Business Strategy</Link>
                </div>
              </div>
              <div className={styles.dropdownCategory}>
                <Link to="/data" className={styles.dropdownCategoryLink}>
                  <div className={styles.dropdownCategoryTitle}>
                    Dữ liệu
                    <span className={styles.categoryArrow}>▶</span>
                  </div>
                  <div className={styles.dropdownCategoryDesc}>Data Science, Analytics, AI</div>
                </Link>
                <div className={styles.subMenu}>
                  <Link to="/datascience" className={styles.subMenuItem}>Data Science</Link>
                  <Link to="/analytics" className={styles.subMenuItem}>Data Analytics</Link>
                  <Link to="/ai" className={styles.subMenuItem}>Artificial Intelligence</Link>
                  <Link to="/ml" className={styles.subMenuItem}>Machine Learning</Link>
                  <Link to="/bigdata" className={styles.subMenuItem}>Big Data</Link>
                  <Link to="/visualization" className={styles.subMenuItem}>Data Visualization</Link>
                </div>
              </div>
              <div className={styles.dropdownCategory}>
                <Link to="/language" className={styles.dropdownCategoryLink}>
                  <div className={styles.dropdownCategoryTitle}>
                    Ngoại ngữ
                    <span className={styles.categoryArrow}>▶</span>
                  </div>
                  <div className={styles.dropdownCategoryDesc}>English, Chinese, Japanese</div>
                </Link>
                <div className={styles.subMenu}>
                  <Link to="/english" className={styles.subMenuItem}>Tiếng Anh</Link>
                  <Link to="/chinese" className={styles.subMenuItem}>Tiếng Trung</Link>
                  <Link to="/japanese" className={styles.subMenuItem}>Tiếng Nhật</Link>
                  <Link to="/korean" className={styles.subMenuItem}>Tiếng Hàn</Link>
                  <Link to="/french" className={styles.subMenuItem}>Tiếng Pháp</Link>
                  <Link to="/german" className={styles.subMenuItem}>Tiếng Đức</Link>
                </div>
              </div>
              <div className={styles.dropdownCategory}>
                <Link to="/skills" className={styles.dropdownCategoryLink}>
                  <div className={styles.dropdownCategoryTitle}>
                    Kỹ năng mềm
                    <span className={styles.categoryArrow}>▶</span>
                  </div>
                  <div className={styles.dropdownCategoryDesc}>Communication, Leadership, Time Management</div>
                </Link>
                <div className={styles.subMenu}>
                  <Link to="/communication" className={styles.subMenuItem}>Communication</Link>
                  <Link to="/leadership" className={styles.subMenuItem}>Leadership</Link>
                  <Link to="/timemanagement" className={styles.subMenuItem}>Time Management</Link>
                  <Link to="/teamwork" className={styles.subMenuItem}>Teamwork</Link>
                  <Link to="/presentation" className={styles.subMenuItem}>Presentation Skills</Link>
                  <Link to="/negotiation" className={styles.subMenuItem}>Negotiation</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.searchBar}>
          <input type="text" placeholder="Tìm kiếm khóa học..." />
          <button className={styles.searchBtn}>
            <img src="/src/assets/search-svgrepo-com.svg" alt="Search" width="16" height="16" />
          </button>
        </div>
        
        <ul className={styles.navLinks}>
          <li>
            <Link 
              to="/teaching" 
              onClick={(e) => handleSmoothScroll(e, '#teaching')}
            >
              Giảng dạy
            </Link>
          </li>
          <li>
            <Link 
              to="/about" 
              onClick={(e) => handleSmoothScroll(e, '#about')}
            >
              Về chúng tôi
            </Link>
          </li>
          <li>
            <Link 
              to="/contact" 
              onClick={(e) => handleSmoothScroll(e, '#contact')}
            >
              Liên hệ
            </Link>
          </li>
        </ul>
        
        <div className={styles.authButtons}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleLoginClick}>
            Đăng nhập
          </button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSignupClick}>
            Đăng ký
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
