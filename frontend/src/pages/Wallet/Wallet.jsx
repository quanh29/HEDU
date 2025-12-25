import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { 
  Wallet as WalletIcon, 
  TrendingUp, 
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  CheckCircle,
  XCircle,
  Search
} from 'lucide-react';
import styles from './Wallet.module.css';
import vietnamBanks from '../../data/vietnamBanks';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Wallet = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'momo',
    phone_number: '',
    account_name: '',
    bank_name: '',
    bank_code: '',
    account_number: ''
  });
  const [bankSearch, setBankSearch] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      // Fetch wallet info
      const walletResponse = await fetch(`${API_URL}/api/wallet`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!walletResponse.ok) {
        throw new Error('Không thể tải thông tin ví');
      }

      const walletData = await walletResponse.json();
      setWallet(walletData.data);

      // Fetch transactions
      const transactionsResponse = await fetch(`${API_URL}/api/wallet/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData.data || []);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    try {
      setProcessing(true);
      const token = await getToken();
      
      const response = await fetch(`${API_URL}/api/wallet/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parseFloat(amount) })
      });

      if (!response.ok) {
        throw new Error('Không thể nạp tiền');
      }

      const data = await response.json();
      
      // Redirect to payment gateway
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        alert('Nạp tiền thành công!');
        setShowDepositModal(false);
        setAmount('');
        fetchWalletData();
      }
    } catch (err) {
      console.error('Error depositing:', err);
      alert('Lỗi: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (parseFloat(amount) > wallet?.balance) {
      alert('Số dư không đủ');
      return;
    }

    if (!wallet?.payment_methods || wallet.payment_methods.length === 0) {
      alert('Vui lòng thêm phương thức thanh toán trước');
      setShowWithdrawModal(false);
      setShowPaymentMethodModal(true);
      return;
    }

    try {
      setProcessing(true);
      const token = await getToken();
      
      const response = await fetch(`${API_URL}/api/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          amount: parseFloat(amount),
          payment_method_index: selectedPaymentMethod
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể rút tiền');
      }

      const data = await response.json();
      alert(data.message || 'Yêu cầu rút tiền thành công!');
      setShowWithdrawModal(false);
      setAmount('');
      setSelectedPaymentMethod(null);
      fetchWalletData();
    } catch (err) {
      console.error('Error withdrawing:', err);
      alert('Lỗi: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      setProcessing(true);
      const token = await getToken();

      if (newPaymentMethod.type === 'momo' && !newPaymentMethod.phone_number) {
        alert('Vui lòng nhập số điện thoại MoMo');
        return;
      }

      if (newPaymentMethod.type === 'bank_transfer' && 
          (!newPaymentMethod.account_name || !newPaymentMethod.bank_name || !newPaymentMethod.account_number || !newPaymentMethod.bank_code)) {
        alert('Vui lòng nhập đầy đủ thông tin ngân hàng');
        return;
      }

      const response = await fetch(`${API_URL}/api/wallet/payment-methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPaymentMethod)
      });

      if (!response.ok) {
        throw new Error('Không thể thêm phương thức thanh toán');
      }

      alert('Thêm phương thức thanh toán thành công!');
      setShowPaymentMethodModal(false);
      setNewPaymentMethod({
        type: 'momo',
        phone_number: '',
        account_name: '',
        bank_name: '',
        bank_code: '',
        account_number: ''
      });
      setBankSearch('');
      setShowBankDropdown(false);
      fetchWalletData();
    } catch (err) {
      console.error('Error adding payment method:', err);
      alert('Lỗi: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRemovePaymentMethod = async (index) => {
    if (!confirm('Bạn có chắc muốn xóa phương thức thanh toán này?')) {
      return;
    }

    try {
      const token = await getToken();
      
      const response = await fetch(`${API_URL}/api/wallet/payment-methods/${index}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Không thể xóa phương thức thanh toán');
      }

      alert('Xóa phương thức thanh toán thành công!');
      fetchWalletData();
    } catch (err) {
      console.error('Error removing payment method:', err);
      alert('Lỗi: ' + err.message);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAccountNumber = (value) => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    // Add space every 4 digits
    return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
  };
  const handleAccountNameChange = (value) => {
    // Auto uppercase for Vietnamese names
    setNewPaymentMethod({ ...newPaymentMethod, account_name: value.toUpperCase() });
  };

  const handleAccountNumberChange = (value) => {
    const formatted = formatAccountNumber(value);
    setNewPaymentMethod({ ...newPaymentMethod, account_number: formatted });
  };

  const filteredBanks = vietnamBanks.filter(bank =>
    bank.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
    bank.shortName.toLowerCase().includes(bankSearch.toLowerCase()) ||
    bank.code.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const handleSelectBank = (bank) => {
    setNewPaymentMethod({ 
      ...newPaymentMethod, 
      bank_name: bank.shortName,
      bank_code: bank.code
    });
    setBankSearch(bank.shortName);
    setShowBankDropdown(false);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Đang tải thông tin ví...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <XCircle size={48} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <WalletIcon size={48} className={styles.headerIcon} />
        <h1 className={styles.title}>Ví Tiền</h1>
        <p className={styles.subtitle}>Quản lý số dư và giao dịch của bạn</p>
      </div>

      {/* Wallet Balance Card */}
      <div className={styles.balanceCard}>
        <div className={styles.balanceInfo}>
          <p className={styles.balanceLabel}>Số dư hiện tại</p>
          <h2 className={styles.balanceAmount}>{formatCurrency(wallet?.balance || 0)}</h2>
        </div>
        <div className={styles.actions}>
          <button 
            className={`${styles.actionBtn} ${styles.depositBtn}`}
            onClick={() => setShowDepositModal(true)}
          >
            <ArrowDownCircle size={20} />
            <span>Nạp tiền</span>
          </button>
          <button 
            className={`${styles.actionBtn} ${styles.withdrawBtn}`}
            onClick={() => setShowWithdrawModal(true)}
          >
            <ArrowUpCircle size={20} />
            <span>Rút tiền</span>
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className={styles.transactionSection}>
        <h2 className={styles.sectionTitle}>Lịch sử giao dịch</h2>
        
        {transactions.length === 0 ? (
          <div className={styles.emptyState}>
            <Clock size={64} className={styles.emptyIcon} />
            <p>Chưa có giao dịch nào</p>
          </div>
        ) : (
          <div className={styles.transactionList}>
            {transactions.map((transaction) => (
              <div key={transaction._id} className={styles.transactionItem}>
                <div className={styles.transactionIcon}>
                  {transaction.operation === 'credit' ? (
                    <TrendingUp size={24} className={styles.creditIcon} />
                  ) : (
                    <TrendingDown size={24} className={styles.debitIcon} />
                  )}
                </div>
                <div className={styles.transactionDetails}>
                  <p className={styles.transactionDesc}>{transaction.description}</p>
                  <p className={styles.transactionDate}>{formatDate(transaction.createdAt)}</p>
                </div>
                <div className={styles.transactionAmount}>
                  <p className={transaction.operation === 'credit' ? styles.creditAmount : styles.debitAmount}>
                    {transaction.operation === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                  <p className={styles.transactionBalance}>Số dư: {formatCurrency(transaction.balance)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Methods Section */}
      <div className={styles.paymentMethodsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Phương thức thanh toán</h2>
          <button 
            className={styles.addBtn}
            onClick={() => setShowPaymentMethodModal(true)}
          >
            + Thêm phương thức
          </button>
        </div>
        
        {!wallet?.payment_methods || wallet.payment_methods.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Chưa có phương thức thanh toán nào</p>
          </div>
        ) : (
          <div className={styles.paymentMethodsList}>
            {wallet.payment_methods.map((method, index) => (
              <div key={index} className={styles.paymentMethodItem}>
                <div className={styles.methodInfo}>
                  <div className={styles.methodType}>
                    {method.type === 'momo' ? '📱 MoMo' : '🏦 Ngân hàng'}
                    {method.is_default && <span className={styles.defaultBadge}>Mặc định</span>}
                  </div>
                  <div className={styles.methodDetails}>
                    {method.type === 'momo' ? (
                      <p>{method.phone_number}</p>
                    ) : (
                      <>
                        <p>{method.account_name}</p>
                        <p>{method.bank_name} - {method.account_number}</p>
                      </>
                    )}
                  </div>
                </div>
                <button 
                  className={styles.removeBtn}
                  onClick={() => handleRemovePaymentMethod(index)}
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className={styles.modal} onClick={() => setShowDepositModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Nạp tiền vào ví</h3>
            <div className={styles.inputGroup}>
              <label>Số tiền (VND)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Nhập số tiền"
                className={styles.input}
                min="10000"
                step="10000"
              />
            </div>
            <div className={styles.quickAmounts}>
              <button onClick={() => setAmount('100000')}>100,000</button>
              <button onClick={() => setAmount('500000')}>500,000</button>
              <button onClick={() => setAmount('1000000')}>1,000,000</button>
              <button onClick={() => setAmount('5000000')}>5,000,000</button>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelBtn}
                onClick={() => setShowDepositModal(false)}
                disabled={processing}
              >
                Hủy
              </button>
              <button 
                className={styles.confirmBtn}
                onClick={handleDeposit}
                disabled={processing}
              >
                {processing ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className={styles.modal} onClick={() => setShowWithdrawModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Rút tiền từ ví</h3>
            <p className={styles.modalInfo}>Số dư hiện tại: {formatCurrency(wallet?.balance || 0)}</p>
            
            {wallet?.payment_methods && wallet.payment_methods.length > 0 && (
              <div className={styles.inputGroup}>
                <label>Phương thức nhận tiền</label>
                <select
                  value={selectedPaymentMethod ?? ''}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value ? parseInt(e.target.value) : null)}
                  className={styles.input}
                >
                  {wallet.payment_methods.map((method, index) => (
                    <option key={index} value={index}>
                      {method.type === 'momo' 
                        ? `📱 MoMo - ${method.phone_number}${method.is_default ? ' (Mặc định)' : ''} - Nhanh chóng`
                        : `🏦 ${method.bank_name} - ${method.account_number}${method.is_default ? ' (Mặc định)' : ''} - 1-3 ngày`
                      }
                    </option>
                  ))}
                </select>
                {selectedPaymentMethod !== null && wallet.payment_methods[selectedPaymentMethod] && (
                  <div className={styles.withdrawInfo}>
                    {wallet.payment_methods[selectedPaymentMethod].type === 'momo' ? (
                      <p className={styles.infoMomo}>
                        ⚡ Rút tiền qua MoMo sẽ được xử lý tức thì và tiền về tài khoản trong vài phút
                      </p>
                    ) : (
                      <p className={styles.infoBank}>
                        ⏰ Rút tiền qua ngân hàng sẽ được xử lý trong 1-3 ngày làm việc
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className={styles.inputGroup}>
              <label>Số tiền (VND)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Nhập số tiền"
                className={styles.input}
                min="50000"
                step="10000"
                max={wallet?.balance || 0}
              />
            </div>
            <div className={styles.quickAmounts}>
              <button onClick={() => setAmount('100000')}>100,000</button>
              <button onClick={() => setAmount('500000')}>500,000</button>
              <button onClick={() => setAmount('1000000')}>1,000,000</button>
              <button onClick={() => setAmount(String(wallet?.balance || 0))}>Tất cả</button>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelBtn}
                onClick={() => setShowWithdrawModal(false)}
                disabled={processing}
              >
                Hủy
              </button>
              <button 
                className={styles.confirmBtn}
                onClick={handleWithdraw}
                disabled={processing}
              >
                {processing ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      {showPaymentMethodModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Thêm phương thức thanh toán</h3>
            
            <div className={styles.inputGroup}>
              <label>Loại phương thức</label>
              <select
                value={newPaymentMethod.type}
                onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, type: e.target.value })}
                className={styles.input}
              >
                <option value="momo">MoMo</option>
                <option value="bank_transfer">Chuyển khoản ngân hàng</option>
              </select>
            </div>

            {newPaymentMethod.type === 'momo' ? (
              <div className={styles.inputGroup}>
                <label>Số điện thoại MoMo</label>
                <input
                  type="tel"
                  value={newPaymentMethod.phone_number}
                  onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, phone_number: e.target.value })}
                  placeholder="0123456789"
                  className={styles.input}
                />
              </div>
            ) : (
              <>
                <div className={styles.inputGroup}>
                  <label>Tên chủ tài khoản</label>
                  <input
                    type="text"
                    value={newPaymentMethod.account_name}
                    onChange={(e) => handleAccountNameChange(e.target.value)}
                    placeholder="NGUYEN VAN A"
                    className={styles.input}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Ngân hàng</label>
                  <div className={styles.searchDropdown}>
                    <div className={styles.searchInputWrapper}>
                      <Search size={18} className={styles.searchIcon} />
                      <input
                        type="text"
                        value={bankSearch}
                        onChange={(e) => {
                          setBankSearch(e.target.value);
                          setShowBankDropdown(true);
                        }}
                        onFocus={() => setShowBankDropdown(true)}
                        placeholder="Tìm kiếm ngân hàng..."
                        className={styles.input}
                      />
                    </div>
                    {showBankDropdown && filteredBanks.length > 0 && (
                      <div className={styles.dropdownList}>
                        {filteredBanks.map((bank) => (
                          <div
                            key={bank.code}
                            className={styles.dropdownItem}
                            onClick={() => handleSelectBank(bank)}
                          >
                            <div className={styles.bankCode}>{bank.code}</div>
                            <div className={styles.bankName}>{bank.shortName}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label>Số tài khoản</label>
                  <input
                    type="text"
                    value={newPaymentMethod.account_number}
                    onChange={(e) => handleAccountNumberChange(e.target.value)}
                    placeholder="1234 5678 9012"
                    className={styles.input}
                    maxLength="23"
                  />
                </div>
                
              </>
            )}

            <div className={styles.modalActions}>
              <button 
                className={styles.cancelBtn}
                onClick={() => setShowPaymentMethodModal(false)}
                disabled={processing}
              >
                Hủy
              </button>
              <button 
                className={styles.confirmBtn}
                onClick={handleAddPaymentMethod}
                disabled={processing}
              >
                {processing ? 'Đang xử lý...' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
