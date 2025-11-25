import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './PaymentStatus.module.css';

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, failed
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get all query parameters from MoMo redirect
        const params = {};
        searchParams.forEach((value, key) => {
          params[key] = value;
        });

        // Call backend to verify payment
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/payment/momo/return?${searchParams.toString()}`
        );

        const data = await response.json();
        
        setPaymentInfo(data);

        if (data.success && data.resultCode === '0') {
          setStatus('success');
        } else {
          setStatus('failed');
        }

      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('failed');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleContinue = () => {
    if (status === 'success') {
      navigate('/my-learning');
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.statusCard}>
          <div className={styles.spinner}></div>
          <h2>Đang xử lý thanh toán...</h2>
          <p>Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.statusCard}>
        {status === 'success' ? (
          <>
            <div className={styles.iconSuccess}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className={styles.title}>Thanh Toán Thành Công!</h1>
            <p className={styles.message}>
              Cảm ơn bạn đã đăng ký khóa học. Bạn có thể bắt đầu học ngay bây giờ.
            </p>
            {paymentInfo && (
              <div className={styles.paymentDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Mã đơn hàng:</span>
                  <span className={styles.value}>{paymentInfo.orderId?.substring(0, 8)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Số tiền:</span>
                  <span className={styles.value}>
                    {paymentInfo.amount?.toLocaleString('vi-VN')}₫
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Trạng thái:</span>
                  <span className={`${styles.value} ${styles.statusSuccess}`}>
                    Thành công
                  </span>
                </div>
              </div>
            )}
            <button className={styles.buttonSuccess} onClick={handleContinue}>
              Bắt Đầu Học Ngay
            </button>
          </>
        ) : (
          <>
            <div className={styles.iconFailed}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className={styles.title}>Thanh Toán Thất Bại</h1>
            <p className={styles.message}>
              {paymentInfo?.message || 'Giao dịch không thành công. Vui lòng thử lại sau.'}
            </p>
            {paymentInfo && (
              <div className={styles.paymentDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Mã đơn hàng:</span>
                  <span className={styles.value}>{paymentInfo.orderId?.substring(0, 8)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Trạng thái:</span>
                  <span className={`${styles.value} ${styles.statusFailed}`}>
                    Thất bại
                  </span>
                </div>
              </div>
            )}
            <button className={styles.buttonFailed} onClick={handleContinue}>
              Quay Về Trang Chủ
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus;
