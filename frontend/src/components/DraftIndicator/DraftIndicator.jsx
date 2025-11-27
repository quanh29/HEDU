import React from 'react';
import { Clock, CheckCircle, XCircle, Edit3, AlertTriangle } from 'lucide-react';
import styles from './DraftIndicator.module.css';

/**
 * DraftIndicator - Shows draft status badge and information
 * @param {string} status - draft | pending | approved | rejected
 * @param {boolean} isDraft - Whether this is a draft entity
 * @param {string} changeType - new | modified | deleted | unchanged
 * @param {string} size - small | medium | large
 * @param {boolean} showText - Show text label next to icon
 */
const DraftIndicator = ({ 
  status = 'draft', 
  isDraft = false,
  changeType = null,
  size = 'medium',
  showText = true 
}) => {
  if (!isDraft && !status) return null;

  const getBadgeConfig = () => {
    // Priority: status > changeType > default draft
    if (status === 'pending') {
      return {
        icon: Clock,
        text: 'Chờ duyệt',
        className: styles.pending,
        color: '#f59e0b'
      };
    }
    
    if (status === 'approved') {
      return {
        icon: CheckCircle,
        text: 'Đã duyệt',
        className: styles.approved,
        color: '#10b981'
      };
    }
    
    if (status === 'rejected') {
      return {
        icon: XCircle,
        text: 'Từ chối',
        className: styles.rejected,
        color: '#ef4444'
      };
    }

    // Change type indicators
    if (changeType === 'new') {
      return {
        icon: AlertTriangle,
        text: 'Mới',
        className: styles.new,
        color: '#3b82f6'
      };
    }

    if (changeType === 'modified') {
      return {
        icon: Edit3,
        text: 'Đã sửa',
        className: styles.modified,
        color: '#8b5cf6'
      };
    }

    if (changeType === 'deleted') {
      return {
        icon: XCircle,
        text: 'Đã xóa',
        className: styles.deleted,
        color: '#ef4444'
      };
    }

    // Default draft
    return {
      icon: Edit3,
      text: 'Bản nháp',
      className: styles.draft,
      color: '#6b7280'
    };
  };

  const config = getBadgeConfig();
  const Icon = config.icon;
  const sizeClass = styles[size] || styles.medium;

  return (
    <div className={`${styles.badge} ${config.className} ${sizeClass}`}>
      <Icon size={size === 'small' ? 12 : size === 'large' ? 20 : 16} />
      {showText && <span>{config.text}</span>}
    </div>
  );
};

/**
 * DraftBanner - Shows draft mode warning banner at top of page
 */
export const DraftBanner = ({ 
  courseName, 
  onSubmit, 
  onCancel, 
  status = 'draft',
  changeCount = 0 
}) => {
  if (status === 'approved') return null;

  return (
    <div className={`${styles.banner} ${styles[`banner-${status}`]}`}>
      <div className={styles.bannerContent}>
        <div className={styles.bannerLeft}>
          <Edit3 size={20} />
          <div>
            <h4 className={styles.bannerTitle}>
              {status === 'pending' ? 'Đang chờ duyệt' : 'Chế độ chỉnh sửa bản nháp'}
            </h4>
            <p className={styles.bannerText}>
              {status === 'pending' 
                ? 'Bản nháp của bạn đang chờ admin phê duyệt. Bạn có thể tiếp tục chỉnh sửa.'
                : `Bạn đang chỉnh sửa bản nháp của "${courseName}". ${changeCount > 0 ? `${changeCount} thay đổi` : 'Chưa có thay đổi'}.`
              }
            </p>
          </div>
        </div>
        <div className={styles.bannerActions}>
          {status === 'draft' && (
            <>
              <button 
                onClick={onSubmit}
                className={styles.submitButton}
                disabled={changeCount === 0}
              >
                <CheckCircle size={16} />
                Gửi phê duyệt
              </button>
              <button 
                onClick={onCancel}
                className={styles.cancelButton}
              >
                <XCircle size={16} />
                Hủy bản nháp
              </button>
            </>
          )}
          {status === 'pending' && (
            <button 
              onClick={onCancel}
              className={styles.cancelButton}
            >
              <XCircle size={16} />
              Thu hồi yêu cầu
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * ChangeIndicator - Shows what changed in a draft item
 */
export const ChangeIndicator = ({ changeType, fieldName, oldValue, newValue }) => {
  if (changeType === 'unchanged') return null;

  return (
    <div className={styles.changeIndicator}>
      <DraftIndicator changeType={changeType} size="small" showText={true} />
      {fieldName && (
        <div className={styles.changeDetail}>
          <span className={styles.fieldName}>{fieldName}:</span>
          {oldValue && <span className={styles.oldValue}>{oldValue}</span>}
          <span className={styles.arrow}>→</span>
          <span className={styles.newValue}>{newValue}</span>
        </div>
      )}
    </div>
  );
};

export default DraftIndicator;
