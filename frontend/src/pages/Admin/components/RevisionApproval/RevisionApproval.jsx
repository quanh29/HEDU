import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import styles from './RevisionApproval.module.css';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  AlertCircle,
  BookOpen,
  User,
  Calendar
} from 'lucide-react';

const RevisionApproval = () => {
  const { getToken } = useAuth();
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchPendingRevisions();
  }, []);

  const fetchPendingRevisions = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/admin/revisions/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setRevisions(response.data.revisions);
      }
    } catch (err) {
      console.error('Error fetching pending revisions:', err);
      setError('Không thể tải danh sách yêu cầu cập nhật');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (revisionId) => {
    if (!window.confirm('Bạn có chắc chắn muốn phê duyệt cập nhật này?')) {
      return;
    }

    try {
      setActionLoading(true);
      const token = await getToken();
      
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/admin/revisions/${revisionId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert('Đã phê duyệt cập nhật thành công!');
      setShowModal(false);
      setSelectedRevision(null);
      fetchPendingRevisions();
    } catch (err) {
      console.error('Error approving revision:', err);
      alert('Có lỗi xảy ra khi phê duyệt: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (revisionId) => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn từ chối cập nhật này?')) {
      return;
    }

    try {
      setActionLoading(true);
      const token = await getToken();
      
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/admin/revisions/${revisionId}/reject`,
        { reason: rejectReason },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert('Đã từ chối cập nhật!');
      setShowModal(false);
      setSelectedRevision(null);
      setRejectReason('');
      fetchPendingRevisions();
    } catch (err) {
      console.error('Error rejecting revision:', err);
      alert('Có lỗi xảy ra khi từ chối: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetail = (revision) => {
    setSelectedRevision(revision);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRevision(null);
    setRejectReason('');
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Đang tải danh sách yêu cầu cập nhật...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <AlertCircle size={48} />
        <p>{error}</p>
        <button onClick={fetchPendingRevisions} className={styles.retryButton}>
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Duyệt cập nhật khóa học</h1>
        <p>Có {revisions.length} yêu cầu cập nhật đang chờ duyệt</p>
      </div>

      {revisions.length === 0 ? (
        <div className={styles.emptyState}>
          <CheckCircle size={64} />
          <h3>Không có yêu cầu cập nhật nào</h3>
          <p>Tất cả yêu cầu cập nhật đã được xử lý</p>
        </div>
      ) : (
        <div className={styles.revisionList}>
          {revisions.map((revision) => (
            <div key={revision._id} className={styles.revisionCard}>
              <div className={styles.cardHeader}>
                <div className={styles.courseInfo}>
                  <BookOpen size={20} />
                  <div>
                    <h3>{revision.title}</h3>
                    <p className={styles.subtitle}>{revision.subtitle}</p>
                  </div>
                </div>
                <span className={styles.badge}>
                  <Clock size={14} />
                  Chờ duyệt
                </span>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.infoRow}>
                  <User size={16} />
                  <span>Giảng viên: {revision.currentCourse?.fName} {revision.currentCourse?.lName}</span>
                </div>
                <div className={styles.infoRow}>
                  <Calendar size={16} />
                  <span>Gửi lúc: {new Date(revision.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.version}>Phiên bản: {revision.version}</span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button 
                  onClick={() => handleViewDetail(revision)}
                  className={styles.viewButton}
                >
                  <Eye size={16} />
                  Xem chi tiết
                </button>
                <div className={styles.actions}>
                  <button 
                    onClick={() => handleApprove(revision._id)}
                    className={styles.approveButton}
                    disabled={actionLoading}
                  >
                    <CheckCircle size={16} />
                    Phê duyệt
                  </button>
                  <button 
                    onClick={() => handleViewDetail(revision)}
                    className={styles.rejectButton}
                    disabled={actionLoading}
                  >
                    <XCircle size={16} />
                    Từ chối
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal chi tiết revision */}
      {showModal && selectedRevision && (
        <div className={styles.modal} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Chi tiết cập nhật khóa học</h2>
              <button onClick={closeModal} className={styles.closeButton}>×</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.section}>
                <h3>Thông tin khóa học</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <label>Tiêu đề:</label>
                    <p>{selectedRevision.title}</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Phụ đề:</label>
                    <p>{selectedRevision.subtitle}</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Mô tả:</label>
                    <p>{selectedRevision.description}</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Giá gốc:</label>
                    <p>{selectedRevision.originalPrice?.toLocaleString('vi-VN')} VNĐ</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Giá hiện tại:</label>
                    <p>{selectedRevision.currentPrice?.toLocaleString('vi-VN')} VNĐ</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Số chương:</label>
                    <p>{selectedRevision.sections?.length || 0}</p>
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <h3>Lý do từ chối (nếu từ chối)</h3>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do từ chối..."
                  className={styles.rejectTextarea}
                  rows={4}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                onClick={() => handleApprove(selectedRevision._id)}
                className={styles.approveButton}
                disabled={actionLoading}
              >
                <CheckCircle size={16} />
                {actionLoading ? 'Đang xử lý...' : 'Phê duyệt'}
              </button>
              <button 
                onClick={() => handleReject(selectedRevision._id)}
                className={styles.rejectButton}
                disabled={actionLoading || !rejectReason.trim()}
              >
                <XCircle size={16} />
                {actionLoading ? 'Đang xử lý...' : 'Từ chối'}
              </button>
              <button onClick={closeModal} className={styles.cancelButton}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevisionApproval;
