import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useCart } from '../../context/CartContext';
import OrderSummary from '../../components/OrderSummary/OrderSummary';
import VoucherSection from '../../components/VoucherSection/VoucherSection';
import PaymentMethods from '../../components/PaymentMethods/PaymentMethods';
import styles from './Checkout.module.css';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const Checkout = () => {
  useDocumentTitle('Thanh toán');
  
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/auth/login');
      return;
    }

    if (isLoaded && cartItems.length === 0) {
      navigate('/');
    }
  }, [isLoaded, isSignedIn, cartItems, navigate]);

  const handleApplyVoucher = (code, percent) => {
    setDiscountPercent(percent);
    setAppliedVoucher(code);
  };

  const handleRemoveVoucher = () => {
    setDiscountPercent(0);
    setAppliedVoucher(null);
  };

  const calculateSubtotal = () => {
    return getTotalPrice();
  };

  const calculateDiscount = () => {
    return calculateSubtotal() * (discountPercent / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const handleCheckout = async () => {
    if (!selectedPayment) {
      alert('Vui lòng chọn phương thức thanh toán!');
      return;
    }

    // Validate payment method specific requirements
    if (selectedPayment === 'card') {
      // Card validation would go here
      alert('Chức năng thanh toán bằng thẻ đang được phát triển!');
      return;
    }

    if (selectedPayment === 'banking') {
      // Banking validation would go here
      alert('Chức năng thanh toán qua ngân hàng đang được phát triển!');
      return;
    }

    if (selectedPayment === 'momo') {
      // Momo payment
      const success = confirm(`Xác nhận thanh toán ${calculateTotal().toLocaleString('vi-VN')}₫ qua Ví MoMo?`);
      if (success) {
        // Here you would integrate with actual payment API
        await clearCart();
        alert('Thanh toán thành công! Cảm ơn bạn đã đăng ký khóa học.');
        navigate('/my-learning');
      }
    }
  };

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className={styles.checkoutContainer}>
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Thanh Toán Khóa Học</h1>

        <div className={styles.checkoutWrapper}>
          {/* Left Section: Order Summary */}
          <div className={styles.leftSection}>
            <OrderSummary
              cartItems={cartItems}
              subtotal={calculateSubtotal()}
              discount={calculateDiscount()}
              total={calculateTotal()}
              discountPercent={discountPercent}
            />
          </div>

          {/* Right Section: Payment */}
          <div className={styles.rightSection}>
            <VoucherSection
              onApplyVoucher={handleApplyVoucher}
              onRemoveVoucher={handleRemoveVoucher}
              appliedVoucher={appliedVoucher}
            />

            <PaymentMethods
              selectedPayment={selectedPayment}
              onSelectPayment={setSelectedPayment}
            />

            <button
              className={styles.checkoutButton}
              onClick={handleCheckout}
              disabled={!selectedPayment || cartItems.length === 0}
            >
              Thanh Toán Ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;