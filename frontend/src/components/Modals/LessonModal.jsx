import React, { useState, useEffect } from 'react';
import { X, Video, FileText, HelpCircle } from 'lucide-react';
import styles from './Modal.module.css';

/**
 * Modal for adding or editing lessons
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {string} props.mode - 'add' or 'edit'
 * @param {string} props.initialTitle - Initial lesson title (for edit mode)
 * @param {string} props.initialContentType - Initial content type (for edit mode)
 * @param {Function} props.onSubmit - Callback when form is submitted (title, contentType) => void
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {boolean} props.loading - Whether form is submitting
 */
const LessonModal = ({ 
  isOpen, 
  mode = 'add', 
  initialTitle = '', 
  initialContentType = 'video',
  onSubmit, 
  onClose, 
  loading = false 
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [contentType, setContentType] = useState(initialContentType);
  const [error, setError] = useState('');

  // Reset form when modal opens/closes or initial values change
  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setContentType(initialContentType || 'video');
      setError('');
    }
  }, [isOpen, initialTitle, initialContentType]);

  const contentTypeOptions = [
    { value: 'video', label: 'Video bài giảng', icon: Video, description: 'Upload video bài học' },
    { value: 'material', label: 'Tài liệu', icon: FileText, description: 'Tài liệu PDF, DOCX, PPTX...' },
    { value: 'quiz', label: 'Bài kiểm tra', icon: HelpCircle, description: 'Câu hỏi trắc nghiệm' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề bài học');
      return;
    }

    if (title.trim().length < 3) {
      setError('Tiêu đề bài học phải có ít nhất 3 ký tự');
      return;
    }

    if (!contentType) {
      setError('Vui lòng chọn loại nội dung');
      return;
    }

    // Call onSubmit callback
    onSubmit(title.trim(), contentType);
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
            {mode === 'add' ? 'Thêm bài học mới' : 'Chỉnh sửa bài học'}
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
            <label htmlFor="lessonTitle" className={styles.label}>
              Tiêu đề bài học <span className={styles.required}>*</span>
            </label>
            <input
              id="lessonTitle"
              type="text"
              className={styles.input}
              placeholder="Ví dụ: Giới thiệu về Components"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError('');
              }}
              disabled={loading}
              autoFocus
              maxLength={200}
            />
            <span className={styles.hint}>
              {title.length}/200 ký tự
            </span>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Loại nội dung <span className={styles.required}>*</span>
            </label>
            <div className={styles.contentTypeGrid}>
              {contentTypeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.contentTypeCard} ${contentType === option.value ? styles.selected : ''}`}
                    onClick={() => {
                      if (mode === 'edit' && contentType !== option.value) {
                        // Warn user about content deletion
                        const confirmed = confirm(
                          `⚠️ Thay đổi loại nội dung sẽ xóa nội dung hiện tại của bài học.\n\nBạn có chắc chắn muốn thay đổi từ "${contentTypeOptions.find(o => o.value === contentType)?.label}" sang "${option.label}"?`
                        );
                        if (confirmed) {
                          setContentType(option.value);
                        }
                      } else {
                        setContentType(option.value);
                      }
                    }}
                    disabled={loading}
                  >
                    <Icon size={24} />
                    <div className={styles.contentTypeInfo}>
                      <span className={styles.contentTypeLabel}>{option.label}</span>
                      <span className={styles.contentTypeDescription}>{option.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {mode === 'edit' && contentType !== initialContentType && (
              <span className={styles.hint} style={{ color: '#ef4444' }}>
                ⚠️ Nội dung hiện tại sẽ bị xóa khi bạn lưu thay đổi
              </span>
            )}
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

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
              {loading ? 'Đang xử lý...' : mode === 'add' ? 'Thêm bài học' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonModal;
