import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useCart } from '../../context/CartContext';
import OrderSummary from '../../components/OrderSummary/OrderSummary';
import VoucherSection from '../../components/VoucherSection/VoucherSection';
import PaymentMethods from '../../components/PaymentMethods/PaymentMethods';
import toast from 'react-hot-toast';
import styles from './Checkout.module.css';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const Checkout = () => {
  useDocumentTitle('Thanh toán');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn, isLoaded } = useUser();
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherType, setVoucherType] = useState(null);
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);

  // Check if this is a "buy now" checkout with single course
  const buyNowMode = location.state?.buyNow || false;
  const buyNowCourse = location.state?.course || null;

  // Debug: Log when voucher state changes
  useEffect(() => {
    // console.log('Voucher state changed:', { voucherDiscount, voucherType, appliedVoucher });
  }, [voucherDiscount, voucherType, appliedVoucher]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/auth/login');
      return;
    }

    // If not buy now mode and cart is empty, redirect to home
    if (isLoaded && !buyNowMode && cartItems.length === 0) {
      navigate('/');
    }

    // Fetch wallet balance
    if (isLoaded && isSignedIn) {
      fetchWalletBalance();
    }
  }, [isLoaded, isSignedIn, cartItems, navigate]);

  const fetchWalletBalance = async () => {
    try {
      setWalletLoading(true);
      const token = await window.Clerk.session.getToken();
      
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/wallet`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data.data.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleApplyVoucher = (code, amount, type) => {
    // console.log('Applying voucher:', { code, amount, type });
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
    if (buyNowMode && buyNowCourse) {
      return Number(buyNowCourse.currentPrice || 0);
    }
    return getTotalPrice();
  };

  const subtotal = useMemo(() => calculateSubtotal(), [buyNowMode, buyNowCourse, getTotalPrice]);

  const discount = useMemo(() => {
    // console.log('Calculating discount:', { voucherType, voucherDiscount, subtotal });
    
    if (voucherType === 'percentage') {
      const calculatedDiscount = subtotal * (voucherDiscount / 100);
      // console.log('Percentage discount:', calculatedDiscount);
      return calculatedDiscount;
    } else if (voucherType === 'absolute' || voucherType === 'fixed') {
      // console.log('Fixed discount:', voucherDiscount);
      return voucherDiscount;
    }
    // console.log('No discount applied');
    return 0;
  }, [voucherType, voucherDiscount, subtotal]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discount);
  }, [subtotal, discount]);

  const handleCheckout = async () => {
    if (!selectedPayment) {
      toast.error('Vui lòng chọn phương thức thanh toán!');
      return;
    }

    // Check wallet balance if wallet payment is selected
    if (selectedPayment === 'wallet') {
      if (walletBalance < total) {
        toast.error(`Số dư không đủ! Bạn cần thêm ${new Intl.NumberFormat('vi-VN').format(total - walletBalance)} ₫ để thanh toán.`);
        return;
      }

      try {
        // Get Clerk token
        const token = await window.Clerk.session.getToken();
        
        // Prepare request body based on mode
        const requestBody = buyNowMode && buyNowCourse
          ? {
              courseIds: [buyNowCourse.courseId],
              voucherCode: appliedVoucher || null
            }
          : {
              voucherCode: appliedVoucher || null
            };
        
        // Create order and pay with wallet
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/payment/wallet/pay`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorData = await response.json();
          toast.error(errorData.message || 'Lỗi khi thanh toán');
          return;
        }

        const data = await response.json();
        toast.success('Thanh toán thành công!');
        if (!buyNowMode) {
          clearCart();
        }
        navigate('/my-learning');
      } catch (error) {
        console.error('Error during wallet payment:', error);
        toast.error('Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.');
      }
      return;
    }

    // Validate payment method specific requirements
    if (selectedPayment === 'card') {
      // Card validation would go here
      toast('Chức năng thanh toán bằng thẻ đang được phát triển!');
      return;
    }

    if (selectedPayment === 'banking') {
      // Banking validation would go here
      toast('Chức năng thanh toán qua ngân hàng đang được phát triển!');
      return;
    }

    if (selectedPayment === 'momo') {
      try {
        // Get Clerk token
        const token = await window.Clerk.session.getToken();
        
        // Prepare request body based on mode
        const requestBody = buyNowMode && buyNowCourse
          ? {
              courseIds: [buyNowCourse.courseId],
              voucherCode: appliedVoucher || null
            }
          : {
              voucherCode: appliedVoucher || null
            };
        
        // Step 1: Create order from cart or single course
        const orderResponse = await fetch(`${import.meta.env.VITE_BASE_URL}/api/order/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });

        if (!orderResponse.ok) {
          const errorData = await orderResponse.json();
          toast.error(errorData.message || 'Lỗi khi tạo đơn hàng');
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
          toast.error(errorData.message || 'Lỗi khi khởi tạo thanh toán MoMo');
          return;
        }

        const paymentData = await paymentResponse.json();

        // Step 3: Redirect to MoMo payment page
        if (paymentData.success && paymentData.paymentUrl) {
          window.location.href = paymentData.paymentUrl;
        } else {
          toast.error('Không thể khởi tạo thanh toán MoMo. Vui lòng thử lại.');
        }
      } catch (error) {
        console.error('Error during MoMo payment:', error);
        toast.error('Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.');
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
              cartItems={buyNowMode ? [{ courseId: buyNowCourse?.courseId, course: buyNowCourse }] : cartItems}
              subtotal={subtotal}
              discount={discount}
              total={total}
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
              walletBalance={walletBalance}
              walletLoading={walletLoading}
            />

            {selectedPayment === 'wallet' && walletBalance < total && (
              <div className={styles.warningBox}>
                Số dư không đủ để thanh toán. Vui lòng nạp thêm{' '}
                {new Intl.NumberFormat('vi-VN').format(total - walletBalance)} ₫
              </div>
            )}

            <button
              className={styles.checkoutButton}
              onClick={handleCheckout}
              disabled={!selectedPayment || (!buyNowMode && cartItems.length === 0) || (buyNowMode && !buyNowCourse) || (selectedPayment === 'wallet' && walletBalance < total)}
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