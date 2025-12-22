import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import styles from './RefundManagement.module.css';
import { DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const RefundManagement = () => {
  const { getToken } = useAuth();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    totalAmount: 0
  });
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchRefunds();
    fetchStats();
  }, [activeFilter, currentPage]);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/refund/all`,
        {
          params: {
            status: activeFilter,
            page: currentPage,
            limit: 10
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setRefunds(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching refunds:', error);
      toast.error('Không thể tải danh sách hoàn tiền');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/refund/stats`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching refund stats:', error);
    }
  };

  const handleProcessRefund = async (refundId, status, adminNote = '') => {
    if (!window.confirm(`Bạn có chắc chắn muốn ${status === 'approved' ? 'chấp nhận' : 'từ chối'} yêu cầu hoàn tiền này?`)) {
      return;
    }

    try {
      setProcessingId(refundId);
      const token = await getToken();
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/refund/process/${refundId}`,
        { status, adminNote },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success(`Yêu cầu đã được ${status === 'approved' ? 'chấp nhận' : 'từ chối'}`);
        fetchRefunds();
        fetchStats();
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error(error.response?.data?.message || 'Không thể xử lý yêu cầu hoàn tiền');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: '#f59e0b', bg: '#fef3c7', label: 'Chờ xử lý' };
      case 'approved':
        return { icon: CheckCircle, color: '#10b981', bg: '#d1fae5', label: 'Đã chấp nhận' };
      case 'rejected':
        return { icon: XCircle, color: '#ef4444', bg: '#fee2e2', label: 'Đã từ chối' };
      case 'completed':
        return { icon: CheckCircle, color: '#8b5cf6', bg: '#ede9fe', label: 'Hoàn thành' };
      default:
        return { icon: AlertCircle, color: '#6b7280', bg: '#f3f4f6', label: 'Không xác định' };
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Quản lý hoàn tiền</h1>
        <p className={styles.subtitle}>Xử lý các yêu cầu hoàn tiền từ học viên</p>
      </div>

      {/* Stats Cards */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#dbeafe' }}>
            <DollarSign size={24} color="#3b82f6" />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Tổng yêu cầu</p>
            <h3 className={styles.statValue}>{stats.total}</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#fef3c7' }}>
            <Clock size={24} color="#f59e0b" />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Chờ xử lý</p>
            <h3 className={styles.statValue}>{stats.pending}</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#d1fae5' }}>
            <CheckCircle size={24} color="#10b981" />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Đã chấp nhận</p>
            <h3 className={styles.statValue}>{stats.approved}</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#fee2e2' }}>
            <XCircle size={24} color="#ef4444" />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Đã từ chối</p>
            <h3 className={styles.statValue}>{stats.rejected}</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#ede9fe' }}>
            <DollarSign size={24} color="#8b5cf6" />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Tổng tiền hoàn</p>
            <h3 className={styles.statValue}>{formatCurrency(stats.totalAmount)}</h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {['all', 'pending', 'approved', 'rejected', 'completed'].map(filter => (
          <button
            key={filter}
            className={`${styles.filterBtn} ${activeFilter === filter ? styles.active : ''}`}
            onClick={() => {
              setActiveFilter(filter);
              setCurrentPage(1);
            }}
          >
            {filter === 'all' ? 'Tất cả' : getStatusInfo(filter).label}
          </button>
        ))}
      </div>

      {/* Refunds List */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Đang tải...</p>
        </div>
      ) : refunds.length === 0 ? (
        <div className={styles.empty}>
          <AlertCircle size={48} color="#9ca3af" />
          <p>Không có yêu cầu hoàn tiền nào</p>
        </div>
      ) : (
        <div className={styles.refundsList}>
          {refunds.map(refund => {
            const statusInfo = getStatusInfo(refund.status);
            const StatusIcon = statusInfo.icon;

            return (
              <div key={refund._id} className={styles.refundCard}>
                <div className={styles.refundHeader}>
                  <div className={styles.refundCourse}>
                    <h3>{refund.course?.title || 'Khóa học đã bị xóa'}</h3>
                    <p className={styles.refundId}>ID: {refund._id}</p>
                  </div>
                  <div 
                    className={styles.statusBadge}
                    style={{ 
                      backgroundColor: statusInfo.bg,
                      color: statusInfo.color 
                    }}
                  >
                    <StatusIcon size={16} />
                    <span>{statusInfo.label}</span>
                  </div>
                </div>

                <div className={styles.refundDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Học viên:</span>
                    <span className={styles.detailValue}>{refund.userId}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Số tiền:</span>
                    <span className={styles.detailValue}>{formatCurrency(refund.amount)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Ngày yêu cầu:</span>
                    <span className={styles.detailValue}>{formatDate(refund.requestDate)}</span>
                  </div>
                  {refund.processedDate && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Ngày xử lý:</span>
                      <span className={styles.detailValue}>{formatDate(refund.processedDate)}</span>
                    </div>
                  )}
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Lý do:</span>
                    <span className={styles.detailValue}>{refund.reason}</span>
                  </div>
                  {refund.adminNote && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Ghi chú admin:</span>
                      <span className={styles.detailValue}>{refund.adminNote}</span>
                    </div>
                  )}
                </div>

                {refund.status === 'pending' && (
                  <div className={styles.actions}>
                    <button
                      className={styles.approveBtn}
                      onClick={() => handleProcessRefund(refund._id, 'approved')}
                      disabled={processingId === refund._id}
                    >
                      <CheckCircle size={16} />
                      {processingId === refund._id ? 'Đang xử lý...' : 'Chấp nhận'}
                    </button>
                    <button
                      className={styles.rejectBtn}
                      onClick={() => {
                        const note = prompt('Nhập lý do từ chối (không bắt buộc):');
                        handleProcessRefund(refund._id, 'rejected', note || '');
                      }}
                      disabled={processingId === refund._id}
                    >
                      <XCircle size={16} />
                      {processingId === refund._id ? 'Đang xử lý...' : 'Từ chối'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Trước
          </button>
          <span className={styles.pageInfo}>
            Trang {currentPage} / {totalPages}
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
};

export default RefundManagement;
