import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';
import { useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();

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

  // Function to convert Vietnamese text to slug
  const createSlug = (text) => {
    const vietnameseMap = {
      'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a', 'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
      'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
      'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
      'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o', 'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
      'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u', 'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
      'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
      'đ': 'd',
      'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A', 'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
      'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',
      'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I',
      'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',
      'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',
      'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y',
      'Đ': 'D'
    };

    return text
      .toLowerCase()
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
      .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
      .replace(/[ìíịỉĩ]/g, 'i')
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
      .replace(/[ùúụủũưừứựửữ]/g, 'u')
      .replace(/[ỳýỵỷỹ]/g, 'y')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      const slug = createSlug(searchValue.trim());
      navigate(`/course/search?title=${slug}`);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
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
          <input
            type="text"
            placeholder="Tìm kiếm khóa học..."
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onKeyPress={handleSearchKeyPress}
          />
          <button
            className={`${styles.searchBtn} ${!searchValue ? styles.notAllowed : ''}`}
            disabled={!searchValue}
            onClick={handleSearch}
          >
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
          {!isLoaded ? (
            // Show loading state while Clerk is initializing
            <div className={styles.loading}>Loading...</div>
          ) : isSignedIn ? (
            // Show UserButton when user is signed in
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: {
                    height: '40px',
                    width: '40px'
                  }
                }
              }}
            />
          ) : (
            // Show login/signup buttons when user is not signed in
            <>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleLoginClick}>
                Đăng nhập
              </button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSignupClick}>
                Đăng ký
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
