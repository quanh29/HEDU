import React, { useState } from 'react';
import { Tag, X, Check } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import styles from './VoucherSection.module.css';

const VoucherSection = ({ onApplyVoucher, onRemoveVoucher, appliedVoucher }) => {
  const { getToken } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isValidating, setIsValidating] = useState(false);

  const handleToggleForm = () => {
    setShowForm(!showForm);
    setMessage({ text: '', type: '' });
  };

  const handleApplyVoucher = async () => {
    const code = voucherCode.trim().toUpperCase();

    if (code === '') {
      setMessage({ text: 'Vui lòng nhập mã voucher', type: 'error' });
      return;
    }

    try {
      setIsValidating(true);
      const token = await getToken();
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/voucher/validate`,
        { voucherCode: code },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.valid) {
        const { voucher } = response.data;
        const discountText = voucher.type === 'percentage' 
          ? `${voucher.amount}%` 
          : `${voucher.amount.toLocaleString('vi-VN')}₫`;
        
        onApplyVoucher(code, voucher.amount, voucher.type);
        setMessage({
          text: `Áp dụng mã thành công! Giảm ${discountText}`,
          type: 'success'
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Mã giảm giá không hợp lệ';
      setMessage({ text: errorMessage, type: 'error' });
      onRemoveVoucher();
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveVoucher = () => {
    setVoucherCode('');
    setMessage({ text: '', type: '' });
    onRemoveVoucher();
  };

  return (
    <div className={styles.voucherContainer}>
      <h2 className={styles.sectionTitle}>Mã Giảm Giá</h2>

      {!appliedVoucher ? (
        <>
          <button className={styles.voucherButton} onClick={handleToggleForm}>
            <Tag size={18} />
            <span>Nhập mã voucher</span>
          </button>

          {showForm && (
            <div className={styles.voucherForm}>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Nhập mã voucher"
                  className={styles.voucherInput}
                  disabled={isValidating}
                />
                <button 
                  className={styles.applyButton} 
                  onClick={handleApplyVoucher}
                  disabled={isValidating}
                >
                  {isValidating ? 'Đang kiểm tra...' : 'Áp dụng'}
                </button>
              </div>

              {message.text && (
                <div className={`${styles.message} ${styles[message.type]}`}>
                  {message.type === 'success' ? <Check size={16} /> : <X size={16} />}
                  <span>{message.text}</span>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className={styles.appliedVoucher}>
          <div className={styles.voucherInfo}>
            <Tag size={18} />
            <div className={styles.voucherDetails}>
              <div className={styles.voucherCode}>{appliedVoucher}</div>
              <div className={styles.voucherMessage}>{message.text}</div>
            </div>
          </div>
          <button className={styles.removeVoucherButton} onClick={handleRemoveVoucher}>
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default VoucherSection;