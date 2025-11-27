import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import styles from './RevisionApproval.module.css';
import DraftIndicator from '../../../../components/DraftIndicator/DraftIndicator';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  AlertCircle,
  BookOpen,
  User,
  Calendar,
  Edit3,
  FileText,
  Video,
  File
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
      
      // Use new draft API instead of old revision API
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/course-draft/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setRevisions(response.data.data || []);
      } else {
        setError('Không thể tải danh sách cập nhật');
      }
    } catch (err) {
      console.error('Error fetching pending drafts:', err);
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách cập nhật');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (draftId) => {
    if (!window.confirm('Bạn có chắc chắn muốn phê duyệt cập nhật này?\n\nSau khi duyệt, nội dung từ bản nháp sẽ được cập nhật lên khóa học chính thức.')) {
      return;
    }

    try {
      setActionLoading(true);
      const token = await getToken();
      
      // Use new draft approve API
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/course-draft/${draftId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert('Đã phê duyệt và xuất bản cập nhật thành công! Nội dung từ bản nháp đã được cập nhật lên khóa học chính thức.');
      setShowModal(false);
      setSelectedRevision(null);
      fetchPendingRevisions();
    } catch (err) {
      console.error('Error approving draft:', err);
      alert('Có lỗi xảy ra khi phê duyệt: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (draftId) => {
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
      
      // Use new draft reject API
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/course-draft/${draftId}/reject`,
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
      console.error('Error rejecting draft:', err);
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
          {revisions.map((draft) => (
            <div key={draft._id} className={styles.revisionCard}>
              <div className={styles.cardHeader}>
                <div className={styles.courseInfo}>
                  <BookOpen size={20} />
                  <div>
                    <h3>{draft.title}</h3>
                    <p className={styles.subtitle}>{draft.subtitle}</p>
                  </div>
                </div>
                <DraftIndicator status={draft.status} isDraft={true} showText={true} />
              </div>

              <div className={styles.cardBody}>
                <div className={styles.infoRow}>
                  <User size={16} />
                  <span>Khóa học ID: {draft._id}</span>
                </div>
                <div className={styles.infoRow}>
                  <Calendar size={16} />
                  <span>Gửi lúc: {new Date(draft.submittedAt || draft.updatedAt).toLocaleString('vi-VN')}</span>
                </div>
                {/* Show change summary */}
                <div className={styles.infoRow}>
                  <Edit3 size={16} />
                  <span>
                    {draft.draftSections?.length || 0} chương, 
                    {' '}{draft.draftLessons?.length || 0} bài học,
                    {' '}{draft.draftVideos?.length || 0} video
                  </span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button 
                  onClick={() => handleViewDetail(draft)}
                  className={styles.viewButton}
                >
                  <Eye size={16} />
                  Xem chi tiết
                </button>
                <div className={styles.actions}>
                  <button 
                    onClick={() => handleApprove(draft._id)}
                    className={styles.approveButton}
                    disabled={actionLoading}
                  >
                    <CheckCircle size={16} />
                    Phê duyệt
                  </button>
                  <button 
                    onClick={() => handleViewDetail(draft)}
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
                    <p>{selectedRevision.draftSections?.length || 0}</p>
                  </div>
                </div>
              </div>

              {/* Change Summary */}
              <div className={styles.section}>
                <h3>Tổng quan thay đổi</h3>
                <div className={styles.changesSummary}>
                  <div className={styles.changeStat}>
                    <div className={styles.changeNumber}>
                      {selectedRevision.draftSections?.filter(s => s.changeType === 'new').length || 0}
                    </div>
                    <div className={styles.changeLabel}>Chương mới</div>
                  </div>
                  <div className={styles.changeStat}>
                    <div className={styles.changeNumber}>
                      {selectedRevision.draftLessons?.filter(l => l.changeType === 'modified').length || 0}
                    </div>
                    <div className={styles.changeLabel}>Bài học sửa</div>
                  </div>
                  <div className={styles.changeStat}>
                    <div className={styles.changeNumber}>
                      {selectedRevision.draftLessons?.filter(l => l.changeType === 'deleted').length || 0}
                    </div>
                    <div className={styles.changeLabel}>Bài học xóa</div>
                  </div>
                  <div className={styles.changeStat}>
                    <div className={styles.changeNumber}>
                      {(selectedRevision.draftVideos?.filter(v => v.changeType === 'new').length || 0) +
                       (selectedRevision.draftMaterials?.filter(m => m.changeType === 'new').length || 0) +
                       (selectedRevision.draftQuizzes?.filter(q => q.changeType === 'new').length || 0)}
                    </div>
                    <div className={styles.changeLabel}>Nội dung mới</div>
                  </div>
                </div>
              </div>

              {/* Change Log */}
              {selectedRevision.changeLog && Object.keys(selectedRevision.changeLog).length > 0 && (
                <div className={styles.section}>
                  <h3>Lịch sử thay đổi</h3>
                  <div className={styles.changeLog}>
                    {Object.entries(selectedRevision.changeLog)
                      .sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp))
                      .slice(0, 10)
                      .map(([key, change]) => (
                        <div key={key} className={styles.changeLogItem}>
                          <div className={styles.changeLogTime}>
                            {new Date(change.timestamp).toLocaleString('vi-VN')}
                          </div>
                          <div className={styles.changeLogContent}>
                            <strong>{change.type}</strong>: {change.action}
                            {change.details && <span className={styles.changeLogDetails}> - {change.details}</span>}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

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
