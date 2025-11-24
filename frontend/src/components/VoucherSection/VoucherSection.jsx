import React, { useState } from 'react';
import { Tag, X, Check } from 'lucide-react';
import styles from './VoucherSection.module.css';

const VoucherSection = ({ onApplyVoucher, onRemoveVoucher, appliedVoucher }) => {
  const [showForm, setShowForm] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Valid vouchers list
  const validVouchers = {
    'SALE20': 20,
    'SALE10': 10,
    'FREESHIP': 5,
    'NEWUSER': 15
  };

  const handleToggleForm = () => {
    setShowForm(!showForm);
    setMessage({ text: '', type: '' });
  };

  const handleApplyVoucher = () => {
    const code = voucherCode.trim().toUpperCase();

    if (code === '') {
      setMessage({ text: 'Vui lòng nhập mã voucher', type: 'error' });
      return;
    }

    if (validVouchers[code]) {
      onApplyVoucher(code, validVouchers[code]);
      setMessage({
        text: `Áp dụng mã thành công! Giảm ${validVouchers[code]}%`,
        type: 'success'
      });
    } else {
      setMessage({ text: 'Mã voucher không hợp lệ', type: 'error' });
      onRemoveVoucher();
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
                />
                <button className={styles.applyButton} onClick={handleApplyVoucher}>
                  Áp dụng
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