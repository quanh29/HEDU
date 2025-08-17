import { useState, useEffect } from 'react';
import styles from './PromotionManagement.module.css';

const PromotionManagement = () => {
  const [promotions, setPromotions] = useState([
    {
      id: 1,
      code: 'SALE20',
      type: 'percentage',
      value: 20,
      description: 'Giảm giá 20% cho tất cả khóa học',
      minOrder: 100000,
      maxDiscount: 500000,
      usageLimit: 1000,
      usedCount: 245,
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      status: 'active',
      applicableCategories: ['all']
    },
    {
      id: 2,
      code: 'NEWUSER50',
      type: 'fixed',
      value: 50000,
      description: 'Giảm 50k cho người dùng mới',
      minOrder: 200000,
      maxDiscount: 50000,
      usageLimit: 500,
      usedCount: 89,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      status: 'active',
      applicableCategories: ['Lập trình', 'Thiết kế']
    },
    {
      id: 3,
      code: 'EXPIRED2023',
      type: 'percentage',
      value: 30,
      description: 'Mã giảm giá đã hết hạn',
      minOrder: 150000,
      maxDiscount: 300000,
      usageLimit: 200,
      usedCount: 200,
      startDate: '2023-12-01',
      endDate: '2023-12-31',
      status: 'expired',
      applicableCategories: ['Marketing']
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [newPromotion, setNewPromotion] = useState({
    code: '',
    type: 'percentage',
    value: '',
    description: '',
    minOrder: '',
    maxDiscount: '',
    usageLimit: '',
    startDate: '',
    endDate: '',
    applicableCategories: ['all']
  });

  const categories = ['all', 'Lập trình', 'Marketing', 'Thiết kế', 'Kinh doanh'];

  const filteredPromotions = promotions.filter(promotion => {
    const matchesSearch = promotion.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         promotion.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || promotion.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreatePromotion = () => {
    if (!newPromotion.code || !newPromotion.value || !newPromotion.startDate || !newPromotion.endDate) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    const promotion = {
      ...newPromotion,
      id: Date.now(),
      usedCount: 0,
      status: 'active'
    };

    setPromotions(prev => [promotion, ...prev]);
    setNewPromotion({
      code: '',
      type: 'percentage',
      value: '',
      description: '',
      minOrder: '',
      maxDiscount: '',
      usageLimit: '',
      startDate: '',
      endDate: '',
      applicableCategories: ['all']
    });
    setShowCreateModal(false);
  };

  const handleEditPromotion = (promotion) => {
    setEditingPromotion(promotion);
    setNewPromotion(promotion);
    setShowCreateModal(true);
  };

  const handleUpdatePromotion = () => {
    setPromotions(prev => 
      prev.map(p => 
        p.id === editingPromotion.id ? { ...newPromotion } : p
      )
    );
    setEditingPromotion(null);
    setNewPromotion({
      code: '',
      type: 'percentage',
      value: '',
      description: '',
      minOrder: '',
      maxDiscount: '',
      usageLimit: '',
      startDate: '',
      endDate: '',
      applicableCategories: ['all']
    });
    setShowCreateModal(false);
  };

  const handleToggleStatus = (promotionId) => {
    setPromotions(prev =>
      prev.map(p =>
        p.id === promotionId
          ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' }
          : p
      )
    );
  };

  const handleDeletePromotion = (promotionId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mã khuyến mãi này?')) {
      setPromotions(prev => prev.filter(p => p.id !== promotionId));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Hoạt động', className: 'active' },
      inactive: { label: 'Tạm dừng', className: 'inactive' },
      expired: { label: 'Hết hạn', className: 'expired' }
    };
    
    const config = statusConfig[status] || { label: 'Unknown', className: 'unknown' };
    return <span className={`${styles.statusBadge} ${styles[config.className]}`}>{config.label}</span>;
  };

  return (
    <div className={styles.promotionManagement}>
      <div className={styles.header}>
        <h2>Quản Lý Khuyến Mãi & Voucher</h2>
        <button 
          className={styles.createBtn}
          onClick={() => setShowCreateModal(true)}
        >
          Tạo mã mới
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Tìm kiếm mã khuyến mãi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Tạm dừng</option>
          <option value="expired">Hết hạn</option>
        </select>
      </div>

      {/* Promotions List */}
      <div className={styles.promotionsList}>
        {filteredPromotions.map(promotion => (
          <div key={promotion.id} className={styles.promotionCard}>
            <div className={styles.promotionHeader}>
              <div className={styles.promotionCode}>
                <h3>{promotion.code}</h3>
                {getStatusBadge(promotion.status)}
              </div>
              <div className={styles.promotionActions}>
                <button 
                  className={styles.editBtn}
                  onClick={() => handleEditPromotion(promotion)}
                >
                  Sửa
                </button>
                <button 
                  className={styles.toggleBtn}
                  onClick={() => handleToggleStatus(promotion.id)}
                >
                  {promotion.status === 'active' ? 'Tạm dừng' : 'Kích hoạt'}
                </button>
                <button 
                  className={styles.deleteBtn}
                  onClick={() => handleDeletePromotion(promotion.id)}
                >
                  Xóa
                </button>
              </div>
            </div>

            <div className={styles.promotionInfo}>
              <p className={styles.description}>{promotion.description}</p>
              
              <div className={styles.promotionDetails}>
                <div className={styles.detailItem}>
                  <strong>Loại:</strong> 
                  {promotion.type === 'percentage' 
                    ? `Giảm ${promotion.value}%` 
                    : `Giảm ${promotion.value.toLocaleString('vi-VN')} ₫`
                  }
                </div>
                
                <div className={styles.detailItem}>
                  <strong>Đơn tối thiểu:</strong> {promotion.minOrder?.toLocaleString('vi-VN')} ₫
                </div>
                
                {promotion.maxDiscount && (
                  <div className={styles.detailItem}>
                    <strong>Giảm tối đa:</strong> {promotion.maxDiscount.toLocaleString('vi-VN')} ₫
                  </div>
                )}
                
                <div className={styles.detailItem}>
                  <strong>Sử dụng:</strong> {promotion.usedCount}/{promotion.usageLimit}
                </div>
                
                <div className={styles.detailItem}>
                  <strong>Thời gian:</strong> 
                  {new Date(promotion.startDate).toLocaleDateString('vi-VN')} - 
                  {new Date(promotion.endDate).toLocaleDateString('vi-VN')}
                </div>
              </div>

              <div className={styles.usageProgress}>
                <div className={styles.progressLabel}>
                  Tỷ lệ sử dụng: {Math.round((promotion.usedCount / promotion.usageLimit) * 100)}%
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${(promotion.usedCount / promotion.usageLimit) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editingPromotion ? 'Chỉnh sửa mã khuyến mãi' : 'Tạo mã khuyến mãi mới'}</h3>
              <button 
                className={styles.closeBtn}
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingPromotion(null);
                  setNewPromotion({
                    code: '',
                    type: 'percentage',
                    value: '',
                    description: '',
                    minOrder: '',
                    maxDiscount: '',
                    usageLimit: '',
                    startDate: '',
                    endDate: '',
                    applicableCategories: ['all']
                  });
                }}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <form className={styles.promotionForm}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Mã khuyến mãi *</label>
                    <input
                      type="text"
                      value={newPromotion.code}
                      onChange={(e) => setNewPromotion({...newPromotion, code: e.target.value.toUpperCase()})}
                      placeholder="VD: SALE20"
                      className={styles.formInput}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Loại giảm giá *</label>
                    <select
                      value={newPromotion.type}
                      onChange={(e) => setNewPromotion({...newPromotion, type: e.target.value})}
                      className={styles.formSelect}
                    >
                      <option value="percentage">Phần trăm (%)</option>
                      <option value="fixed">Số tiền cố định (₫)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Giá trị giảm *</label>
                    <input
                      type="number"
                      value={newPromotion.value}
                      onChange={(e) => setNewPromotion({...newPromotion, value: e.target.value})}
                      placeholder={newPromotion.type === 'percentage' ? '20' : '50000'}
                      className={styles.formInput}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Đơn hàng tối thiểu</label>
                    <input
                      type="number"
                      value={newPromotion.minOrder}
                      onChange={(e) => setNewPromotion({...newPromotion, minOrder: e.target.value})}
                      placeholder="100000"
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Giảm tối đa (cho % giảm giá)</label>
                    <input
                      type="number"
                      value={newPromotion.maxDiscount}
                      onChange={(e) => setNewPromotion({...newPromotion, maxDiscount: e.target.value})}
                      placeholder="500000"
                      className={styles.formInput}
                      disabled={newPromotion.type === 'fixed'}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Số lượng sử dụng *</label>
                    <input
                      type="number"
                      value={newPromotion.usageLimit}
                      onChange={(e) => setNewPromotion({...newPromotion, usageLimit: e.target.value})}
                      placeholder="1000"
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Ngày bắt đầu *</label>
                    <input
                      type="date"
                      value={newPromotion.startDate}
                      onChange={(e) => setNewPromotion({...newPromotion, startDate: e.target.value})}
                      className={styles.formInput}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Ngày kết thúc *</label>
                    <input
                      type="date"
                      value={newPromotion.endDate}
                      onChange={(e) => setNewPromotion({...newPromotion, endDate: e.target.value})}
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Mô tả</label>
                  <textarea
                    value={newPromotion.description}
                    onChange={(e) => setNewPromotion({...newPromotion, description: e.target.value})}
                    placeholder="Mô tả chi tiết về mã khuyến mãi..."
                    className={styles.formTextarea}
                    rows={3}
                  />
                </div>

                <div className={styles.formActions}>
                  <button 
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingPromotion(null);
                    }}
                  >
                    Hủy
                  </button>
                  <button 
                    type="button"
                    className={styles.saveBtn}
                    onClick={editingPromotion ? handleUpdatePromotion : handleCreatePromotion}
                  >
                    {editingPromotion ? 'Cập nhật' : 'Tạo mã'}
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

export default PromotionManagement;
