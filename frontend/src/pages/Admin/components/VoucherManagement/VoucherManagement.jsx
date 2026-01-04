import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { 
  Ticket, 
  Plus, 
  Search, 
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  Percent,
  DollarSign,
  Hash,
  X,
  AlertTriangle
} from 'lucide-react';
import styles from './VoucherManagement.module.css';

const VoucherManagement = () => {
  const { getToken } = useAuth();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [processingVoucherId, setProcessingVoucherId] = useState(null);
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    expired: 0,
    totalUsage: 0
  });
  
  const [voucherForm, setVoucherForm] = useState({
    voucher_code: '',
    discount_type: 'percentage',
    amount: '',
    expiration_date: '',
    usage_limit: 0,
    is_active: true
  });

  const [editingVoucher, setEditingVoucher] = useState(null);

  const baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

  // Fetch vouchers
  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await axios.get(`${baseURL}/api/admin/vouchers`, {
        params: {
          status: statusFilter,
          search: searchTerm
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setVouchers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      alert('Failed to fetch vouchers: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`${baseURL}/api/admin/vouchers/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  useEffect(() => {
    fetchVouchers();
    fetchStatistics();
  }, [statusFilter, searchTerm]);

  // Toggle voucher status
  const handleToggleStatus = async (voucherId, currentStatus) => {
    if (!confirm(`Bạn có chắc muốn ${currentStatus ? 'vô hiệu hóa' : 'kích hoạt'} voucher này?`)) {
      return;
    }

    try {
      setProcessingVoucherId(voucherId);
      const token = await getToken();
      const response = await axios.patch(
        `${baseURL}/api/admin/vouchers/${voucherId}/status`,
        { is_active: !currentStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        alert(response.data.message);
        fetchVouchers();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error toggling voucher status:', error);
      alert('Failed to update voucher status: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessingVoucherId(null);
    }
  };

  // Create voucher
  const handleCreateVoucher = async () => {
    // Validate
    if (!voucherForm.voucher_code || !voucherForm.amount || !voucherForm.expiration_date) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (voucherForm.amount <= 0) {
      alert('Số tiền giảm giá phải lớn hơn 0');
      return;
    }

    if (voucherForm.discount_type === 'percentage' && voucherForm.amount > 100) {
      alert('Phần trăm giảm giá không được vượt quá 100%');
      return;
    }

    try {
      const token = await getToken();
      const response = await axios.post(
        `${baseURL}/api/admin/vouchers`,
        voucherForm,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        alert('Voucher đã được tạo thành công');
        setShowCreateModal(false);
        resetForm();
        fetchVouchers();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error creating voucher:', error);
      alert('Tạo voucher thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  // Update voucher
  const handleUpdateVoucher = async () => {
    // Validate
    if (!voucherForm.voucher_code || !voucherForm.amount || !voucherForm.expiration_date) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (voucherForm.amount <= 0) {
      alert('Số tiền giảm giá phải lớn hơn 0');
      return;
    }

    if (voucherForm.discount_type === 'percentage' && voucherForm.amount > 100) {
      alert('Phần trăm giảm giá không được vượt quá 100%');
      return;
    }

    try {
      const token = await getToken();
      const response = await axios.put(
        `${baseURL}/api/admin/vouchers/${editingVoucher._id}`,
        voucherForm,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        alert('Voucher đã được cập nhật thành công');
        setShowEditModal(false);
        setEditingVoucher(null);
        resetForm();
        fetchVouchers();
      }
    } catch (error) {
      console.error('Error updating voucher:', error);
      alert('Cập nhật voucher thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  // Delete voucher
  const handleDeleteVoucher = async (voucherId, usageCount) => {
    if (usageCount > 0) {
      alert('Không thể xóa voucher đã được sử dụng. Vui lòng vô hiệu hóa nó thay vì xóa.');
      return;
    }

    if (!confirm('Bạn có chắc chắn muốn xóa voucher này? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      const token = await getToken();
      const response = await axios.delete(
        `${baseURL}/api/admin/vouchers/${voucherId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        alert('Voucher đã được xóa thành công');
        fetchVouchers();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error deleting voucher:', error);
      alert('Xóa voucher thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  const openEditModal = (voucher) => {
    setEditingVoucher(voucher);
    setVoucherForm({
      voucher_code: voucher.voucher_code,
      discount_type: voucher.discount_type,
      amount: voucher.amount,
      expiration_date: new Date(voucher.expiration_date).toISOString().split('T')[0],
      usage_limit: voucher.usage_limit,
      is_active: voucher.is_active
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setVoucherForm({
      voucher_code: '',
      discount_type: 'percentage',
      amount: '',
      expiration_date: '',
      usage_limit: 0,
      is_active: true
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const isExpired = (expirationDate) => {
    return new Date(expirationDate) < new Date();
  };

  return (
    <div className={styles.voucherManagement}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Ticket className={styles.headerIcon} />
          <h2>Quản lý Voucher</h2>
        </div>
        <button 
          className={styles.createBtn}
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={18} />
          Tạo Voucher
        </button>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Ticket size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>{statistics.total}</h3>
            <p>Tổng voucher</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <CheckCircle size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>{statistics.active}</h3>
            <p>Đang kích hoạt</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <XCircle size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>{statistics.expired}</h3>
            <p>Đã hết hạn</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Hash size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>{statistics.totalUsage}</h3>
            <p>Lượt sử dụng</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã voucher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterGroup}>
          <Filter size={18} />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang kích hoạt</option>
            <option value="inactive">Đã vô hiệu hóa</option>
          </select>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loading}>Đang tải...</div>
        ) : vouchers.length === 0 ? (
          <div className={styles.noData}>Không tìm thấy voucher</div>
        ) : (
          <table className={styles.vouchersTable}>
            <thead>
              <tr>
                <th>Mã voucher</th>
                <th>Thể loại</th>
                <th>Giá trị</th>
                <th>Giới hạn</th>
                <th>Đã dùng</th>
                <th>Hạn sử dụng</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map(voucher => (
                <tr key={voucher._id}>
                  <td>
                    <div className={styles.voucherCode}>
                      <Ticket size={16} />
                      <strong>{voucher.voucher_code}</strong>
                    </div>
                  </td>
                  <td>
                    {voucher.discount_type === 'percentage' ? (
                      <span className={`${styles.badge} ${styles.percentageBadge}`}>
                        <Percent size={14} />
                        Phần trăm
                      </span>
                    ) : (
                      <span className={`${styles.badge} ${styles.absoluteBadge}`}>
                        <DollarSign size={14} />
                        Số tiền
                      </span>
                    )}
                  </td>
                  <td>
                    <strong>
                      {voucher.discount_type === 'percentage' 
                        ? `${voucher.amount}%` 
                        : formatCurrency(voucher.amount)
                      }
                    </strong>
                  </td>
                  <td>
                    <div className={styles.usageLimit}>
                      {voucher.usage_limit === 0 ? 'Không giới hạn' : voucher.usage_limit}
                    </div>
                  </td>
                  <td>
                    <div className={styles.usageCount}>
                      <Hash size={14} />
                      {voucher.usage_count || 0}
                    </div>
                  </td>
                  <td>
                    <div className={`${styles.date} ${isExpired(voucher.expiration_date) ? styles.expired : ''}`}>
                      <Calendar size={14} />
                      {formatDate(voucher.expiration_date)}
                      {isExpired(voucher.expiration_date) && (
                        <span className={styles.expiredLabel}>(Hết hạn)</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {voucher.is_active ? (
                      <span className={`${styles.badge} ${styles.activeBadge}`}>
                        <CheckCircle size={14} />
                        Kích hoạt
                      </span>
                    ) : (
                      <span className={`${styles.badge} ${styles.inactiveBadge}`}>
                        <XCircle size={14} />
                        Vô hiệu
                      </span>
                    )}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.editBtn}
                        onClick={() => openEditModal(voucher)}
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className={voucher.is_active ? styles.deactivateBtn : styles.activateBtn}
                        onClick={() => handleToggleStatus(voucher._id, voucher.is_active)}
                        disabled={processingVoucherId === voucher._id}
                        title={voucher.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                      >
                        {processingVoucherId === voucher._id ? (
                          '...'
                        ) : voucher.is_active ? (
                          <XCircle size={14} />
                        ) : (
                          <CheckCircle size={14} />
                        )}
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteVoucher(voucher._id, voucher.usage_count)}
                        title="Xóa"
                        disabled={voucher.usage_count > 0}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Voucher Modal */}
      {showCreateModal && (
        <div className={styles.modal} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                <Plus size={20} />
                Tạo voucher mới
              </h3>
              <button 
                className={styles.closeBtn}
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <form className={styles.voucherForm} onSubmit={(e) => e.preventDefault()}>
                <div className={styles.formGroup}>
                  <label>Mã voucher *</label>
                  <input
                    type="text"
                    value={voucherForm.voucher_code}
                    onChange={(e) => setVoucherForm({...voucherForm, voucher_code: e.target.value.toUpperCase()})}
                    placeholder="VD: SUMMER2024"
                    className={styles.formInput}
                  />
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Loại giảm giá *</label>
                    <select
                      value={voucherForm.discount_type}
                      onChange={(e) => setVoucherForm({...voucherForm, discount_type: e.target.value})}
                      className={styles.formInput}
                    >
                      <option value="percentage">Phần trăm (%)</option>
                      <option value="absolute">Số tiền (VNĐ)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Giá trị *</label>
                    <input
                      type="number"
                      value={voucherForm.amount}
                      onChange={(e) => setVoucherForm({...voucherForm, amount: parseFloat(e.target.value)})}
                      placeholder={voucherForm.discount_type === 'percentage' ? '10' : '50000'}
                      className={styles.formInput}
                      min="0"
                      max={voucherForm.discount_type === 'percentage' ? '100' : undefined}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Hạn sử dụng *</label>
                    <input
                      type="date"
                      value={voucherForm.expiration_date}
                      onChange={(e) => setVoucherForm({...voucherForm, expiration_date: e.target.value})}
                      className={styles.formInput}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Giới hạn số lần dùng</label>
                    <input
                      type="number"
                      value={voucherForm.usage_limit}
                      onChange={(e) => setVoucherForm({...voucherForm, usage_limit: parseInt(e.target.value)})}
                      placeholder="0 = Không giới hạn"
                      className={styles.formInput}
                      min="0"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={voucherForm.is_active}
                      onChange={(e) => setVoucherForm({...voucherForm, is_active: e.target.checked})}
                    />
                    Kích hoạt voucher ngay
                  </label>
                </div>

                <div className={styles.formActions}>
                  <button 
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                  >
                    Hủy
                  </button>
                  <button 
                    type="button"
                    className={styles.saveBtn}
                    onClick={handleCreateVoucher}
                  >
                    <Plus size={16} />
                    Tạo voucher
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Voucher Modal */}
      {showEditModal && (
        <div className={styles.modal} onClick={() => setShowEditModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                <Edit2 size={20} />
                Chỉnh sửa voucher
              </h3>
              <button 
                className={styles.closeBtn}
                onClick={() => {
                  setShowEditModal(false);
                  setEditingVoucher(null);
                  resetForm();
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {editingVoucher && editingVoucher.usage_count > 0 && (
                <div className={styles.warningBox}>
                  <AlertTriangle size={18} />
                  <p>Voucher này đã được sử dụng {editingVoucher.usage_count} lần. Hãy cẩn thận khi chỉnh sửa.</p>
                </div>
              )}
              
              <form className={styles.voucherForm} onSubmit={(e) => e.preventDefault()}>
                <div className={styles.formGroup}>
                  <label>Mã voucher *</label>
                  <input
                    type="text"
                    value={voucherForm.voucher_code}
                    onChange={(e) => setVoucherForm({...voucherForm, voucher_code: e.target.value.toUpperCase()})}
                    placeholder="VD: SUMMER2024"
                    className={styles.formInput}
                  />
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Loại giảm giá *</label>
                    <select
                      value={voucherForm.discount_type}
                      onChange={(e) => setVoucherForm({...voucherForm, discount_type: e.target.value})}
                      className={styles.formInput}
                    >
                      <option value="percentage">Phần trăm (%)</option>
                      <option value="absolute">Số tiền (VNĐ)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Giá trị *</label>
                    <input
                      type="number"
                      value={voucherForm.amount}
                      onChange={(e) => setVoucherForm({...voucherForm, amount: parseFloat(e.target.value)})}
                      placeholder={voucherForm.discount_type === 'percentage' ? '10' : '50000'}
                      className={styles.formInput}
                      min="0"
                      max={voucherForm.discount_type === 'percentage' ? '100' : undefined}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Hạn sử dụng *</label>
                    <input
                      type="date"
                      value={voucherForm.expiration_date}
                      onChange={(e) => setVoucherForm({...voucherForm, expiration_date: e.target.value})}
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Giới hạn số lần dùng</label>
                    <input
                      type="number"
                      value={voucherForm.usage_limit}
                      onChange={(e) => setVoucherForm({...voucherForm, usage_limit: parseInt(e.target.value)})}
                      placeholder="0 = Không giới hạn"
                      className={styles.formInput}
                      min="0"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={voucherForm.is_active}
                      onChange={(e) => setVoucherForm({...voucherForm, is_active: e.target.checked})}
                    />
                    Kích hoạt voucher
                  </label>
                </div>

                <div className={styles.formActions}>
                  <button 
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingVoucher(null);
                      resetForm();
                    }}
                  >
                    Hủy
                  </button>
                  <button 
                    type="button"
                    className={styles.saveBtn}
                    onClick={handleUpdateVoucher}
                  >
                    <Edit2 size={16} />
                    Cập nhật
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherManagement;
