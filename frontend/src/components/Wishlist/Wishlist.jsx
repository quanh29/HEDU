import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Heart } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import styles from './Wishlist.module.css';

const Wishlist = () => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();
  const { wishlistItems, loading, removeFromWishlist } = useWishlist();
  const [showWishlistMenu, setShowWishlistMenu] = useState(false);
  const wishlistMenuRef = useRef(null);

  // Close wishlist menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wishlistMenuRef.current && !wishlistMenuRef.current.contains(event.target)) {
        setShowWishlistMenu(false);
      }
    };

    if (showWishlistMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showWishlistMenu]);

  const handleWishlistMenuToggle = () => {
    setShowWishlistMenu(!showWishlistMenu);
  };

  const handleRemoveFromWishlist = async (courseId) => {
    const success = await removeFromWishlist(courseId);
    if (!success) {
      console.error('Failed to remove item from wishlist');
    }
  };

  const handleCourseClick = (courseId) => {
    setShowWishlistMenu(false);
    navigate(`/course/${courseId}`);
  };

  // Don't render if user is not signed in
  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className={styles.wishlistWrapper} ref={wishlistMenuRef}>
      <button
        className={styles.wishlistButton}
        onClick={handleWishlistMenuToggle}
        aria-label="Danh sách yêu thích"
      >
        <Heart size={20} />
        {wishlistItems.length > 0 && (
          <span className={styles.wishlistBadge}>{wishlistItems.length}</span>
        )}
      </button>
      {showWishlistMenu && (
        <div className={styles.wishlistDropdown}>
          <div className={styles.wishlistHeader}>
            <h3>Yêu thích ({wishlistItems.length})</h3>
          </div>
          <div className={styles.wishlistDivider}></div>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Đang tải...</p>
            </div>
          ) : wishlistItems.length > 0 ? (
            <div className={styles.wishlistItems}>
              {wishlistItems.map((item) => (
                <div key={item.courseId} className={styles.wishlistItem}>
                  <div 
                    className={styles.wishlistItemContent}
                    onClick={() => handleCourseClick(item.courseId)}
                  >
                    <img
                      src={item.image || 'https://via.placeholder.com/80x60?text=No+Image'}
                      alt={item.title || 'Course'}
                      className={styles.wishlistItemImage}
                    />
                    <div className={styles.wishlistItemDetails}>
                      <h4 className={styles.wishlistItemTitle}>
                        {item.title || 'Khóa học không tồn tại'}
                      </h4>
                      <p className={styles.wishlistItemPrice}>
                        {item.currentPrice ?
                          Number(item.currentPrice).toLocaleString('vi-VN') + '₫' :
                          'Liên hệ'
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    className={styles.removeButton}
                    onClick={() => handleRemoveFromWishlist(item.courseId)}
                    aria-label="Xóa khỏi danh sách yêu thích"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyWishlist}>
              <Heart size={48} />
              <p>Chưa có khóa học yêu thích</p>
              <span>Thêm khóa học vào danh sách để theo dõi</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
