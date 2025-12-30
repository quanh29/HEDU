import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';
import { useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { LogOut } from 'lucide-react';
import Cart from '../Cart/Cart.jsx';
import Wishlist from '../Wishlist/Wishlist.jsx';
import NotificationIcon from '../NotificationIcon/NotificationIcon.jsx';
import UserMenu from '../UserMenu/UserMenu.jsx';
import axios from 'axios';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [headings, setHeadings] = useState([]);
  const navigate = useNavigate();
  const { isSignedIn, isLoaded, user } = useUser();
  const { signOut } = useClerk();

  // Fetch headings with categories
  useEffect(() => {
    const fetchHeadings = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/headings`);
        setHeadings(response.data);
      } catch (error) {
        console.error('Error fetching headings:', error);
      }
    };
    fetchHeadings();
  }, []);

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
      // const slug = createSlug(searchValue.trim());
      navigate(`/course/search?title=${searchValue.trim()}`);
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
              {headings.map((heading) => (
                <div key={heading.heading_id} className={styles.dropdownCategory}>
                  <div className={styles.dropdownCategoryLink}>
                    <div className={styles.dropdownCategoryTitle}>
                      {heading.title}
                      <span className={styles.categoryArrow}>▶</span>
                    </div>
                    <div className={styles.dropdownCategoryDesc}>{heading.sub_title}</div>
                  </div>
                  <div className={styles.subMenu}>
                    {heading.categories.map((category) => (
                      <Link 
                        key={category.category_id} 
                        to={`/course/search?category=${encodeURIComponent(category.title)}`} 
                        className={styles.subMenuItem}
                      >
                        {category.title}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
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
              to="/instructor"
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

        {/* Wishlist and Cart Icons - only show when user is signed in */}
        {isLoaded && isSignedIn && (
          <>
            <NotificationIcon />
            <Wishlist />
            <Cart />
          </>
        )}
        
        <div className={styles.authButtons}>
          {!isLoaded ? (
            // Show loading state while Clerk is initializing
            <div className={styles.loading}>Loading...</div>
          ) : isSignedIn ? (
            // Show custom user menu when user is signed in
            <UserMenu />
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
