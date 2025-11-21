import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import styles from './Cart.module.css';

const Cart = () => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();
  const { cartItems, loading, removeFromCart, getTotalPrice } = useCart();
  const [showCartMenu, setShowCartMenu] = useState(false);
  const cartMenuRef = useRef(null);

  // Close cart menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cartMenuRef.current && !cartMenuRef.current.contains(event.target)) {
        setShowCartMenu(false);
      }
    };

    if (showCartMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCartMenu]);

  const handleCartMenuToggle = () => {
    setShowCartMenu(!showCartMenu);
  };

  const handleRemoveFromCart = async (courseId) => {
    const success = await removeFromCart(courseId);
    if (!success) {
      console.error('Failed to remove item from cart');
    }
  };

  const handleViewCart = () => {
    setShowCartMenu(false);
    navigate('/cart');
  };

  const handleCheckout = () => {
    setShowCartMenu(false);
    navigate('/checkout');
  };

  // Don't render if user is not signed in
  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className={styles.cartWrapper} ref={cartMenuRef}>
      <button
        className={styles.cartButton}
        onClick={handleCartMenuToggle}
        aria-label="Giỏ hàng"
      >
        <ShoppingCart size={20} />
        {cartItems.length > 0 && (
          <span className={styles.cartBadge}>{cartItems.length}</span>
        )}
      </button>
      {showCartMenu && (
        <div className={styles.cartDropdown}>
          <div className={styles.cartHeader}>
            <h3>Giỏ hàng ({cartItems.length})</h3>
          </div>
          <div className={styles.cartDivider}></div>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Đang tải...</p>
            </div>
          ) : cartItems.length > 0 ? (
            <>
              <div className={styles.cartItems}>
                {cartItems.map((item) => (
                  <div key={item.courseId} className={styles.cartItem}>
                    <img
                      src={item.course?.picture_url || 'https://via.placeholder.com/80x60?text=No+Image'}
                      alt={item.course?.title || 'Course'}
                      className={styles.cartItemImage}
                    />
                    <div className={styles.cartItemDetails}>
                      <h4 className={styles.cartItemTitle}>
                        {item.course?.title || 'Khóa học không tồn tại'}
                      </h4>
                      <p className={styles.cartItemInstructor}>
                        {item.course?.instructor_name || 'Giảng viên'}
                      </p>
                      <p className={styles.cartItemPrice}>
                        {item.course?.currentPrice ?
                          Number(item.course.currentPrice).toLocaleString('vi-VN') + '₫' :
                          'Liên hệ'
                        }
                      </p>
                    </div>
                    <button
                      className={styles.removeButton}
                      onClick={() => handleRemoveFromCart(item.courseId)}
                      aria-label="Xóa khỏi giỏ hàng"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className={styles.cartDivider}></div>
              <div className={styles.cartTotal}>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Tổng cộng:</span>
                  <span className={styles.totalPrice}>
                    {getTotalPrice().toLocaleString('vi-VN')}₫
                  </span>
                </div>
              </div>
              <div className={styles.cartDivider}></div>
              <div className={styles.cartActions}>
                <button
                  className={styles.viewCartBtn}
                  onClick={handleViewCart}
                >
                  Xem giỏ hàng
                </button>
                <button
                  className={styles.checkoutBtn}
                  onClick={handleCheckout}
                >
                  Thanh toán
                </button>
              </div>
            </>
          ) : (
            <div className={styles.emptyCart}>
              <ShoppingCart size={48} />
              <p>Giỏ hàng trống</p>
              <span>Thêm khóa học vào giỏ hàng để tiếp tục</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Cart;