import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

/**
 * Modal for adding or editing sections
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {string} props.mode - 'add' or 'edit'
 * @param {string} props.initialTitle - Initial section title (for edit mode)
 * @param {Function} props.onSubmit - Callback when form is submitted (title) => void
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {boolean} props.loading - Whether form is submitting
 */
const SectionModal = ({ isOpen, mode = 'add', initialTitle = '', onSubmit, onClose, loading = false }) => {
  const [title, setTitle] = useState(initialTitle);
  const [error, setError] = useState('');

  // Reset form when modal opens/closes or initialTitle changes
  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setError('');
    }
  }, [isOpen, initialTitle]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề chương');
      return;
    }

    if (title.trim().length < 3) {
      setError('Tiêu đề chương phải có ít nhất 3 ký tự');
      return;
    }

    // Call onSubmit callback
    onSubmit(title.trim());
  };

  const handleClose = () => {
    if (loading) return; // Prevent closing while submitting
    if (title.trim() !== initialTitle && title.trim() !== '') {
      if (!confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn đóng?')) {
        return;
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {mode === 'add' ? 'Thêm chương mới' : 'Chỉnh sửa chương'}
          </h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            disabled={loading}
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label htmlFor="sectionTitle" className={styles.label}>
              Tiêu đề chương <span className={styles.required}>*</span>
            </label>
            <input
              id="sectionTitle"
              type="text"
              className={styles.input}
              placeholder="Ví dụ: Giới thiệu về React"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError('');
              }}
              disabled={loading}
              autoFocus
              maxLength={200}
            />
            {error && <span className={styles.error}>{error}</span>}
            <span className={styles.hint}>
              {title.length}/200 ký tự
            </span>
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : mode === 'add' ? 'Thêm chương' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SectionModal;
