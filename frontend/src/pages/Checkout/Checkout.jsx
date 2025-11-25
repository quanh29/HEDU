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
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherType, setVoucherType] = useState(null);
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

  const handleApplyVoucher = (code, amount, type) => {
    setVoucherDiscount(amount);
    setVoucherType(type);
    setAppliedVoucher(code);
  };

  const handleRemoveVoucher = () => {
    setVoucherDiscount(0);
    setVoucherType(null);
    setAppliedVoucher(null);
  };

  const calculateSubtotal = () => {
    return getTotalPrice();
  };

  const calculateDiscount = () => {
    if (voucherType === 'percentage') {
      return calculateSubtotal() * (voucherDiscount / 100);
    } else if (voucherType === 'absolute') {
      return voucherDiscount;
    }
    return 0;
  };

  const calculateTotal = () => {
    return Math.max(0, calculateSubtotal() - calculateDiscount());
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
      try {
        // Get Clerk token
        const token = await window.Clerk.session.getToken();
        
        // Step 1: Create order from cart
        const orderResponse = await fetch(`${import.meta.env.VITE_BASE_URL}/api/order/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            voucherCode: appliedVoucher || null
          })
        });

        if (!orderResponse.ok) {
          const errorData = await orderResponse.json();
          alert(errorData.message || 'Lỗi khi tạo đơn hàng');
          return;
        }

        const orderData = await orderResponse.json();
        const { orderId, totalAmount } = orderData;

        // Step 2: Initiate MoMo payment
        const paymentResponse = await fetch(`${import.meta.env.VITE_BASE_URL}/api/payment/momo/initiate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ orderId })
        });

        if (!paymentResponse.ok) {
          const errorData = await paymentResponse.json();
          alert(errorData.message || 'Lỗi khi khởi tạo thanh toán MoMo');
          return;
        }

        const paymentData = await paymentResponse.json();

        // Step 3: Redirect to MoMo payment page
        if (paymentData.success && paymentData.paymentUrl) {
          window.location.href = paymentData.paymentUrl;
        } else {
          alert('Không thể khởi tạo thanh toán MoMo. Vui lòng thử lại.');
        }

      } catch (error) {
        console.error('Error during checkout:', error);
        alert('Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.');
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