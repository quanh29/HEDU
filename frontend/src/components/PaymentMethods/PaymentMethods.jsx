import React, { useState } from 'react';
import momoLogo from '../../assets/MOMO-Logo-App.png';
import cardLogo from '../../assets/card.png';
import bankLogo from '../../assets/bank.png';
import styles from './PaymentMethods.module.css';

const PaymentMethods = ({ selectedPayment, onSelectPayment }) => {
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });
  const [selectedBank, setSelectedBank] = useState('');

  const handleSelectPayment = (method) => {
    onSelectPayment(method);
  };

  return (
    <div className={styles.paymentMethods}>
      <h2 className={styles.sectionTitle}>Phương Thức Thanh Toán</h2>

      {/* Credit Card */}
      <div
        className={`${styles.paymentOption} ${selectedPayment === 'card' ? styles.selected : ''}`}
        onClick={() => handleSelectPayment('card')}
      >
        <input
          type="radio"
          name="payment"
          id="paymentCard"
          value="card"
          checked={selectedPayment === 'card'}
          onChange={() => {}}
        />
        <img src={cardLogo} alt="Card" className={styles.cardIcon} />
        <label htmlFor="paymentCard">Thẻ Visa/MasterCard</label>
      </div>

      {selectedPayment === 'card' && (
        <div className={styles.paymentDetails}>
          <div className={styles.formGroup}>
            <label>Số thẻ</label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              maxLength="19"
              value={cardDetails.cardNumber}
              onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Tên chủ thẻ</label>
            <input
              type="text"
              placeholder="NGUYEN VAN A"
              value={cardDetails.cardName}
              onChange={(e) => setCardDetails({ ...cardDetails, cardName: e.target.value })}
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Ngày hết hạn</label>
              <input
                type="text"
                placeholder="MM/YY"
                maxLength="5"
                value={cardDetails.expiryDate}
                onChange={(e) => setCardDetails({ ...cardDetails, expiryDate: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>CVV</label>
              <input
                type="text"
                placeholder="123"
                maxLength="3"
                value={cardDetails.cvv}
                onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* MoMo Wallet */}
      <div
        className={`${styles.paymentOption} ${selectedPayment === 'momo' ? styles.selected : ''}`}
        onClick={() => handleSelectPayment('momo')}
      >
        <input
          type="radio"
          name="payment"
          id="paymentMomo"
          value="momo"
          checked={selectedPayment === 'momo'}
          onChange={() => {}}
        />
        <img src={momoLogo} alt="MoMo" className={styles.momoIcon} />
        <label htmlFor="paymentMomo">Ví MoMo</label>
      </div>

      {selectedPayment === 'momo' && (
        <div className={styles.paymentDetails}>
          <div className={styles.walletInfo}>
            <img src={momoLogo} alt="MoMo" className={styles.walletIcon} />
            <p className={styles.walletText}>
              Bạn sẽ được chuyển đến trang thanh toán của Ví MoMo
            </p>
          </div>
        </div>
      )}

      {/* Online Banking */}
      <div
        className={`${styles.paymentOption} ${selectedPayment === 'banking' ? styles.selected : ''}`}
        onClick={() => handleSelectPayment('banking')}
      >
        <input
          type="radio"
          name="payment"
          id="paymentBanking"
          value="banking"
          checked={selectedPayment === 'banking'}
          onChange={() => {}}
        />
        <img src={bankLogo} alt="Ngân hàng" className={styles.bankIcon} />
        <label htmlFor="paymentBanking">Ngân Hàng Trực Tuyến</label>
      </div>

      {selectedPayment === 'banking' && (
        <div className={styles.paymentDetails}>
          <div className={styles.formGroup}>
            <label>Chọn ngân hàng</label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
            >
              <option value="">-- Chọn ngân hàng --</option>
              <option value="vcb">Vietcombank</option>
              <option value="tcb">Techcombank</option>
              <option value="mbbank">MB Bank</option>
              <option value="acb">ACB</option>
              <option value="bidv">BIDV</option>
              <option value="vib">VIB</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethods;