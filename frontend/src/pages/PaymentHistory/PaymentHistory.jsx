import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { Receipt, Calendar, CreditCard, ChevronLeft, ChevronRight, ShoppingBag, X, Wallet } from 'lucide-react';
import styles from './PaymentHistory.module.css';

const PaymentHistory = () => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded, user } = useUser();
  const { getToken } = useAuth();
  
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 10;

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/auth/login');
    }
  }, [isLoaded, isSignedIn, navigate]);

  // Fetch payment history
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (!isSignedIn) return;

      try {
        setLoading(true);
        const token = await getToken();
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/order/history?page=${currentPage}&limit=${itemsPerPage}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        setPayments(response.data.orders || []);
        setTotalPages(response.data.pagination?.totalPages || 0);
        setTotalRecords(response.data.pagination?.totalRecords || 0);
        setError(null);
      } catch (err) {
        console.error('Error fetching payment history:', err);
        setError('Không thể tải lịch sử thanh toán. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentHistory();
  }, [isSignedIn, getToken, currentPage]);

  // Fetch order details
  const fetchOrderDetails = async (orderId) => {
    try {
      setLoadingDetails(true);
      const token = await getToken();
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/order/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setOrderDetails(response.data);
    } catch (err) {
      console.error('Error fetching order details:', err);
      alert('Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    fetchOrderDetails(order.orderId);
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setOrderDetails(null);
  };

  const handleCourseClick = (courseId) => {
    navigate(`/course/${courseId}`);
    closeModal();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Translate status
  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Đang xử lý',
      'success': 'Thành công',
      'failed': 'Thất bại'
    };
    return statusMap[status] || status;
  };

  // Translate payment method
  const getMethodText = (method) => {
    const methodMap = {
      'momo': 'MoMo',
      'wallet': 'Ví Nội Bộ',
      'card': 'Thẻ tín dụng',
      'banking': 'Chuyển khoản',
      'cash': 'Tiền mặt'
    };
    return methodMap[method] || method;
  };

  // Get payment method icon
  const getMethodIcon = (method) => {
    switch (method) {
      case 'wallet':
        return <Wallet size={16} />;
      case 'momo':
        // return MoMo logo image and size it appropriately
        return <img src="src/assets/MOMO-Logo-App.png" alt="MoMo" style={{ width: 16, height: 16 }} />;
      case 'card':
      case 'banking':
      default:
        return <CreditCard size={16} />;
    }
  };

  // Get status CSS class
  const getStatusClass = (status) => {
    switch (status) {
      case 'success':
        return styles.statusSuccess;
      case 'failed':
        return styles.statusFailed;
      case 'pending':
        return styles.statusPending;
      default:
        return '';
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isLoaded || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Đang tải lịch sử thanh toán...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Receipt className={styles.headerIcon} size={40} />
        <h1 className={styles.title}>Lịch sử thanh toán</h1>
        <p className={styles.subtitle}>Xem tất cả các giao dịch và đơn hàng của bạn</p>
      </div>

      {payments.length === 0 ? (
        <div className={styles.emptyState}>
          <ShoppingBag className={styles.emptyIcon} size={80} />
          <h2 className={styles.emptyTitle}>Chưa có lịch sử thanh toán</h2>
          <p className={styles.emptyText}>
            Bạn chưa có giao dịch thành công nào. Hãy khám phá các khóa học tuyệt vời và bắt đầu học ngay!
          </p>
          <button 
            className={styles.browseButton}
            onClick={() => navigate('/course/search')}
          >
            Khám phá khóa học
          </button>
        </div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.paymentTable}>
              <thead>
                <tr>
                  <th>Ngày thanh toán</th>
                  <th>Phương thức</th>
                  <th>Tổng cộng</th>
                  <th>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.orderId}
                    className={styles.paymentRow}
                  >
                    <td>{formatDate(payment.createdAt)}</td>
                    <td>
                      <div className={styles.methodCell}>
                        {getMethodIcon(payment.paymentMethod)}
                        <span>{getMethodText(payment.paymentMethod)}</span>
                      </div>
                    </td>
                    <td className={styles.totalCell}>{formatCurrency(payment.totalAmount)}</td>
                    <td>
                      <button
                        className={styles.detailButton}
                        onClick={() => handleOrderClick(payment)}
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageButton}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={20} />
                Trước
              </button>
              
              <div className={styles.pageNumbers}>
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        className={`${styles.pageNumber} ${
                          currentPage === pageNumber ? styles.activePage : ''
                        }`}
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return <span key={pageNumber} className={styles.ellipsis}>...</span>;
                  }
                  return null;
                })}
              </div>
              
              <button
                className={styles.pageButton}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Sau
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={closeModal}>
              <X size={24} />
            </button>

            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Chi tiết đơn hàng</h2>
              <p className={styles.modalOrderId}>
                Mã đơn hàng: #{selectedOrder.orderId}
              </p>
            </div>

            {loadingDetails ? (
              <div className={styles.modalLoading}>
                <div className={styles.spinner}></div>
                <p>Đang tải chi tiết...</p>
              </div>
            ) : orderDetails ? (
              <div className={styles.modalContent}>
                <div className={styles.orderInfo}>
                  <div className={styles.infoGroup}>
                    <label>Phương thức thanh toán:</label>
                    <span>{getMethodText(orderDetails.order.paymentMethod || selectedOrder.paymentMethod)}</span>
                  </div>
                  
                  <div className={styles.infoGroup}>
                    <label>Thời gian:</label>
                    <span>{formatDate(selectedOrder.createdAt)}</span>
                  </div>

                  {orderDetails.order.voucherCode && (
                    <div className={styles.infoGroup}>
                      <label>Mã giảm giá:</label>
                      <span className={styles.voucherCode}>{orderDetails.order.voucherCode}</span>
                    </div>
                  )}
                </div>

                <div className={styles.divider}></div>

                <div className={styles.courseList}>
                  <h3 className={styles.sectionTitle}>Khóa học đã mua</h3>
                  {orderDetails.items.map((item) => (
                    <div 
                      key={item.courseId} 
                      className={styles.courseItem}
                      onClick={() => handleCourseClick(item.courseId)}
                    >
                      <div className={styles.courseInfo}>
                        <h4 className={styles.courseTitle}>{item.title}</h4>
                        <p className={styles.coursePrice}>{formatCurrency(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.divider}></div>

                <div className={styles.summarySection}>
                  <h3 className={styles.sectionTitle}>Tóm tắt đơn hàng</h3>
                  <div className={styles.summaryRow}>
                    <span>Tạm tính:</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className={styles.summaryRow}>
                      <span>Giảm giá:</span>
                      <span className={styles.discountAmount}>-{formatCurrency(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                    <span>Tổng cộng:</span>
                    <span className={styles.totalAmount}>
                      {formatCurrency(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.modalError}>
                <p>Không thể tải chi tiết đơn hàng</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
