import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useCart } from '../../context/CartContext';
import styles from './Cart.module.css';

const CartPage = () => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();
  const { cartItems, loading, removeFromCart, clearCart, getTotalPrice } = useCart();
  const [removingItems, setRemovingItems] = useState(new Set());

  const handleRemoveFromCart = async (courseId) => {
    setRemovingItems(prev => new Set(prev).add(courseId));

    const success = await removeFromCart(courseId);

    setRemovingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(courseId);
      return newSet;
    });

    if (!success) {
      console.error('Failed to remove item from cart');
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Bạn có chắc muốn xóa tất cả khóa học khỏi giỏ hàng?')) {
      return;
    }

    const success = await clearCart();
    if (!success) {
      console.error('Failed to clear cart');
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (!isLoaded) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Giỏ hàng của bạn</h1>
        <p className={styles.subtitle}>
          {cartItems.length} khóa học trong giỏ hàng
        </p>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Đang tải giỏ hàng...</p>
        </div>
      ) : cartItems.length === 0 ? (
        <div className={styles.emptyCart}>
          <div className={styles.emptyIcon}>🛒</div>
          <h2>Giỏ hàng trống</h2>
          <p>Chưa có khóa học nào trong giỏ hàng của bạn</p>
          <button
            className={styles.exploreBtn}
            onClick={() => navigate('/courses')}
          >
            Khám phá khóa học
          </button>
        </div>
      ) : (
        <div className={styles.cartContent}>
          <div className={styles.cartItems}>
            {cartItems.map((item) => (
              <div key={item.courseId} className={styles.cartItem}>
                <div className={styles.itemImage}>
                  <img
                    src={item.course?.picture_url || 'https://via.placeholder.com/200x150?text=No+Image'}
                    alt={item.course?.title || 'Course'}
                  />
                </div>
                <div className={styles.itemDetails}>
                  <h3 className={styles.itemTitle}>
                    {item.course?.title || 'Khóa học không tồn tại'}
                  </h3>
                  <p className={styles.itemInstructor}>
                    Giảng viên: {item.course?.instructor_name || 'Chưa xác định'}
                  </p>
                  <div className={styles.itemPricing}>
                    <span className={styles.currentPrice}>
                      {item.course?.currentPrice ?
                        item.course.currentPrice.toLocaleString('vi-VN') + '₫' :
                        'Liên hệ'
                      }
                    </span>
                    {item.course?.originalPrice && item.course.originalPrice > item.course.currentPrice && (
                      <span className={styles.originalPrice}>
                        {item.course.originalPrice.toLocaleString('vi-VN')}₫
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.itemActions}>
                  <button
                    className={styles.removeBtn}
                    onClick={() => handleRemoveFromCart(item.courseId)}
                    disabled={removingItems.has(item.courseId)}
                  >
                    {removingItems.has(item.courseId) ? 'Đang xóa...' : 'Xóa'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.cartSummary}>
            <div className={styles.summaryHeader}>
              <h3>Tóm tắt đơn hàng</h3>
            </div>
            <div className={styles.summaryContent}>
              <div className={styles.summaryRow}>
                <span>{cartItems.length} khóa học</span>
                <span>{getTotalPrice().toLocaleString('vi-VN')}₫</span>
              </div>
              <div className={styles.summaryDivider}></div>
              <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <span>Tổng cộng</span>
                <span>{getTotalPrice().toLocaleString('vi-VN')}₫</span>
              </div>
            </div>
            <div className={styles.summaryActions}>
              <button
                className={styles.clearCartBtn}
                onClick={handleClearCart}
              >
                Xóa tất cả
              </button>
              <button
                className={styles.checkoutBtn}
                onClick={handleCheckout}
              >
                Thanh toán
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;