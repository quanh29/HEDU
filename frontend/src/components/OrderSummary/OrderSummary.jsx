import React from 'react';
import { Trash2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import styles from './OrderSummary.module.css';

const OrderSummary = ({ cartItems, subtotal, discount, total }) => {
  const { removeFromCart } = useCart();

  const handleRemoveCourse = async (courseId, courseName) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa "${courseName}" khỏi giỏ hàng?`);
    if (confirmed) {
      await removeFromCart(courseId);
    }
  };

  return (
    <div className={styles.orderSection}>
      <h2 className={styles.sectionTitle}>Đơn Hàng Của Bạn</h2>

      <div className={styles.courseList}>
        {cartItems.map((item) => (
          <div key={item.courseId} className={styles.courseItem}>
            <img
              src={item.course?.picture_url || 'https://via.placeholder.com/100x75?text=No+Image'}
              alt={item.course?.title || 'Course'}
              className={styles.courseImage}
            />
            <div className={styles.courseInfo}>
              <div className={styles.courseName}>
                {item.course?.title || 'Khóa học không tồn tại'}
              </div>
              <div className={styles.courseInstructor}>
                {item.course?.instructor_name || 'Giảng viên'}
              </div>
              <div className={styles.coursePrice}>
                {item.course?.currentPrice
                  ? Number(item.course.currentPrice).toLocaleString('vi-VN') + '₫'
                  : 'Liên hệ'}
              </div>
            </div>
            <button
              className={styles.removeButton}
              onClick={() => handleRemoveCourse(item.courseId, item.course?.title)}
              aria-label="Xóa khỏi giỏ hàng"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className={styles.summarySection}>
        <div className={styles.summaryRow}>
          <span>Tạm tính:</span>
          <span>{subtotal.toLocaleString('vi-VN')}₫</span>
        </div>

        {discount > 0 && (
          <div className={`${styles.summaryRow} ${styles.discount}`}>
            <span>Giảm giá:</span>
            <span>-{Math.round(discount).toLocaleString('vi-VN')}₫</span>
          </div>
        )}

        <div className={`${styles.summaryRow} ${styles.total}`}>
          <span>Tổng thanh toán:</span>
          <span>{Math.round(total).toLocaleString('vi-VN')}₫</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;