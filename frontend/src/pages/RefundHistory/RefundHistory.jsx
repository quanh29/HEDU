import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { Clock, CheckCircle, XCircle, RefreshCw, ChevronLeft, ChevronRight, DollarSign, X } from 'lucide-react';
import styles from './RefundHistory.module.css';
import useDocumentTitle from '../../hooks/useDocumentTitle';

function RefundHistory() {
  useDocumentTitle('Lịch sử hoàn tiền');
  
  const navigate = useNavigate();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedRefund, setSelectedRefund] = useState(null);

  // Redirect to login if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/auth/login');
    }
  }, [isLoaded, isSignedIn, navigate]);

  // Fetch refund history
  useEffect(() => {
    const fetchRefunds = async () => {
      if (!isLoaded || !isSignedIn) return;

      try {
        setLoading(true);
        const token = await getToken();
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/refund/history`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.success) {
          setRefunds(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching refund history:', err);
        setError('Không thể tải lịch sử hoàn tiền. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchRefunds();
  }, [isLoaded, isSignedIn, getToken]);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Đang xử lý',
          icon: Clock,
          color: '#f59e0b',
          bgColor: '#fef3c7'
        };
      case 'approved':
        return {
          label: 'Đã duyệt',
          icon: CheckCircle,
          color: '#10b981',
          bgColor: '#dcfce7'
        };
      case 'rejected':
        return {
          label: 'Từ chối',
          icon: XCircle,
          color: '#ef4444',
          bgColor: '#fecaca'
        };
      case 'completed':
        return {
          label: 'Hoàn thành',
          icon: CheckCircle,
          color: '#3b82f6',
          bgColor: '#dbeafe'
        };
      default:
        return {
          label: status,
          icon: RefreshCw,
          color: '#6b7280',
          bgColor: '#f3f4f6'
        };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const filteredRefunds = refunds.filter(refund => {
    if (filter === 'all') return true;
    return refund.status === filter;
  });

  const stats = {
    total: refunds.length,
    pending: refunds.filter(r => r.status === 'pending').length,
    approved: refunds.filter(r => r.status === 'approved' || r.status === 'completed').length,
    rejected: refunds.filter(r => r.status === 'rejected').length
  };

  const handleRefundClick = (refund) => {
    setSelectedRefund(refund);
  };

  const closeModal = () => {
    setSelectedRefund(null);
  };

  const getStatusClass = (status) => {
    const statusInfo = getStatusInfo(status);
    return statusInfo.color;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Đang tải lịch sử hoàn tiền...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>❌ {error}</p>
          <button onClick={() => window.location.reload()} className={styles.retryBtn}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <DollarSign className={styles.headerIcon} size={40} />
        <h1 className={styles.title}>Lịch sử hoàn tiền</h1>
        <p className={styles.subtitle}>Xem tất cả các yêu cầu hoàn tiền của bạn</p>
      </div>

      {refunds.length === 0 ? (
        <div className={styles.emptyState}>
          <DollarSign className={styles.emptyIcon} size={80} />
          <h2 className={styles.emptyTitle}>Chưa có yêu cầu hoàn tiền nào</h2>
          <p className={styles.emptyText}>
            Các yêu cầu hoàn tiền của bạn sẽ được hiển thị tại đây
          </p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#dbeafe' }}>
                <RefreshCw size={24} style={{ color: '#3b82f6' }} />
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statNumber}>{stats.total}</h3>
                <p className={styles.statLabel}>Tổng yêu cầu</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#fef3c7' }}>
                <Clock size={24} style={{ color: '#f59e0b' }} />
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statNumber}>{stats.pending}</h3>
                <p className={styles.statLabel}>Đang xử lý</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#dcfce7' }}>
                <CheckCircle size={24} style={{ color: '#10b981' }} />
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statNumber}>{stats.approved}</h3>
                <p className={styles.statLabel}>Đã duyệt</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#fecaca' }}>
                <XCircle size={24} style={{ color: '#ef4444' }} />
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statNumber}>{stats.rejected}</h3>
                <p className={styles.statLabel}>Từ chối</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className={styles.filters}>
            <button 
              className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
              onClick={() => setFilter('all')}
            >
              Tất cả ({stats.total})
            </button>
            <button 
              className={`${styles.filterBtn} ${filter === 'pending' ? styles.active : ''}`}
              onClick={() => setFilter('pending')}
            >
              Đang xử lý ({stats.pending})
            </button>
            <button 
              className={`${styles.filterBtn} ${filter === 'approved' ? styles.active : ''}`}
              onClick={() => setFilter('approved')}
            >
              Đã duyệt ({stats.approved})
            </button>
            <button 
              className={`${styles.filterBtn} ${filter === 'rejected' ? styles.active : ''}`}
              onClick={() => setFilter('rejected')}
            >
              Từ chối ({stats.rejected})
            </button>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.refundTable}>
              <thead>
                <tr>
                  <th>Khóa học</th>
                  <th>Ngày yêu cầu</th>
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                  <th>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {filteredRefunds.map((refund) => {
                  const statusInfo = getStatusInfo(refund.status);
                  const StatusIcon = statusInfo.icon;
                  return (
                    <tr key={refund._id} className={styles.refundRow}>
                      <td>{refund.course?.title || 'Khóa học không xác định'}</td>
                      <td>{formatDate(refund.requestDate)}</td>
                      <td className={styles.amountCell}>{formatCurrency(refund.amount || 0)}</td>
                      <td>
                        <div 
                          className={styles.statusBadge}
                          style={{ 
                            background: statusInfo.bgColor,
                            color: statusInfo.color 
                          }}
                        >
                          <StatusIcon size={16} />
                          <span>{statusInfo.label}</span>
                        </div>
                      </td>
                      <td>
                        <button
                          className={styles.detailButton}
                          onClick={() => handleRefundClick(refund)}
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Refund Details Modal */}
      {selectedRefund && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={closeModal}>
              <X size={24} />
            </button>

            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Chi tiết hoàn tiền</h2>
              <p className={styles.modalOrderId}>
                Mã yêu cầu: #{selectedRefund._id}
              </p>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.orderInfo}>
                <div className={styles.infoGroup}>
                  <label>Khóa học:</label>
                  <span>{selectedRefund.course?.title || 'Không xác định'}</span>
                </div>
                
                <div className={styles.infoGroup}>
                  <label>Ngày yêu cầu:</label>
                  <span>{formatDate(selectedRefund.requestDate)}</span>
                </div>

                {selectedRefund.processedDate && (
                  <div className={styles.infoGroup}>
                    <label>Ngày xử lý:</label>
                    <span>{formatDate(selectedRefund.processedDate)}</span>
                  </div>
                )}

                <div className={styles.infoGroup}>
                  <label>Trạng thái:</label>
                  <span className={styles.statusText} style={{ color: getStatusClass(selectedRefund.status) }}>
                    {getStatusInfo(selectedRefund.status).label}
                  </span>
                </div>
              </div>

              <div className={styles.divider}></div>

              <div className={styles.reasonSection}>
                <h3 className={styles.sectionTitle}>Lý do hoàn tiền</h3>
                <p className={styles.reasonText}>
                  {selectedRefund.reason || 'Không có lý do cụ thể'}
                </p>
              </div>

              {selectedRefund.adminNote && (
                <>
                  <div className={styles.divider}></div>
                  <div className={styles.adminNoteSection}>
                    <h3 className={styles.sectionTitle}>Ghi chú từ quản trị viên</h3>
                    <p className={styles.adminNoteText}>
                      {selectedRefund.adminNote}
                    </p>
                  </div>
                </>
              )}

              <div className={styles.divider}></div>

              <div className={styles.summarySection}>
                <h3 className={styles.sectionTitle}>Thông tin hoàn tiền</h3>
                <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                  <span>Số tiền hoàn:</span>
                  <span className={styles.totalAmount}>
                    {formatCurrency(selectedRefund.amount || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RefundHistory;
