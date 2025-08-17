import { useState, useEffect } from 'react';
import styles from './AdminManagement.module.css';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([
    {
      id: 1,
      name: 'Nguyễn Văn Admin',
      email: 'admin@hedu.com',
      role: 'super-admin',
      permissions: ['all'],
      status: 'active',
      lastLogin: '2024-01-17T10:30:00',
      createdDate: '2023-06-15',
      avatar: '/api/placeholder/60/60'
    },
    {
      id: 2,
      name: 'Trần Thị Moderator',
      email: 'mod@hedu.com',
      role: 'admin',
      permissions: ['course_management', 'user_support', 'promotions'],
      status: 'active',
      lastLogin: '2024-01-16T15:45:00',
      createdDate: '2023-08-20',
      avatar: '/api/placeholder/60/60'
    },
    {
      id: 3,
      name: 'Lê Văn Support',
      email: 'support@hedu.com',
      role: 'sub-admin',
      permissions: ['user_support', 'tickets'],
      status: 'active',
      lastLogin: '2024-01-17T09:15:00',
      createdDate: '2023-10-10',
      avatar: '/api/placeholder/60/60'
    },
    {
      id: 4,
      name: 'Phạm Thị Content',
      email: 'content@hedu.com',
      role: 'sub-admin',
      permissions: ['course_approval', 'course_management'],
      status: 'inactive',
      lastLogin: '2024-01-10T14:20:00',
      createdDate: '2023-12-01',
      avatar: '/api/placeholder/60/60'
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    role: 'sub-admin',
    permissions: [],
    password: '',
    confirmPassword: ''
  });

  const rolePermissions = {
    'super-admin': {
      label: 'Super Admin',
      description: 'Toàn quyền hệ thống',
      permissions: ['all']
    },
    'admin': {
      label: 'Admin',
      description: 'Quản lý chính',
      permissions: ['course_management', 'user_support', 'promotions', 'course_approval', 'analytics']
    },
    'sub-admin': {
      label: 'Sub Admin',
      description: 'Quản lý theo chuyên môn',
      permissions: []
    }
  };

  const availablePermissions = [
    { id: 'course_approval', label: 'Duyệt khóa học', icon: '✅' },
    { id: 'course_management', label: 'Quản lý khóa học', icon: '📚' },
    { id: 'user_support', label: 'Hỗ trợ người dùng', icon: '🎧' },
    { id: 'promotions', label: 'Quản lý khuyến mãi', icon: '🎫' },
    { id: 'analytics', label: 'Xem báo cáo', icon: '📊' },
    { id: 'tickets', label: 'Xử lý ticket', icon: '🎪' },
    { id: 'admin_management', label: 'Quản lý admin', icon: '👥' }
  ];

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || admin.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreateAdmin = () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password || !newAdmin.confirmPassword) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    if (newAdmin.password !== newAdmin.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }

    if (admins.some(admin => admin.email === newAdmin.email)) {
      alert('Email này đã được sử dụng!');
      return;
    }

    const admin = {
      ...newAdmin,
      id: Date.now(),
      status: 'active',
      createdDate: new Date().toISOString().split('T')[0],
      lastLogin: null,
      avatar: '/api/placeholder/60/60',
      permissions: newAdmin.role === 'super-admin' ? ['all'] : 
                  newAdmin.role === 'admin' ? rolePermissions.admin.permissions : 
                  newAdmin.permissions
    };

    setAdmins(prev => [admin, ...prev]);
    resetForm();
    setShowCreateModal(false);
  };

  const handleEditAdmin = (admin) => {
    setEditingAdmin(admin);
    setNewAdmin({
      ...admin,
      password: '',
      confirmPassword: ''
    });
    setShowCreateModal(true);
  };

  const handleUpdateAdmin = () => {
    if (!newAdmin.name || !newAdmin.email) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    if (newAdmin.password && newAdmin.password !== newAdmin.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }

    const updatedAdmin = {
      ...newAdmin,
      permissions: newAdmin.role === 'super-admin' ? ['all'] : 
                  newAdmin.role === 'admin' ? rolePermissions.admin.permissions : 
                  newAdmin.permissions
    };

    setAdmins(prev =>
      prev.map(a =>
        a.id === editingAdmin.id ? updatedAdmin : a
      )
    );
    
    resetForm();
    setEditingAdmin(null);
    setShowCreateModal(false);
  };

  const handleToggleStatus = (adminId) => {
    setAdmins(prev =>
      prev.map(admin =>
        admin.id === adminId
          ? { ...admin, status: admin.status === 'active' ? 'inactive' : 'active' }
          : admin
      )
    );
  };

  const handleDeleteAdmin = (adminId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa admin này?')) {
      setAdmins(prev => prev.filter(admin => admin.id !== adminId));
    }
  };

  const resetForm = () => {
    setNewAdmin({
      name: '',
      email: '',
      role: 'sub-admin',
      permissions: [],
      password: '',
      confirmPassword: ''
    });
  };

  const getStatusBadge = (status) => {
    return status === 'active' 
      ? <span className={`${styles.statusBadge} ${styles.active}`}>Hoạt động</span>
      : <span className={`${styles.statusBadge} ${styles.inactive}`}>Tạm dừng</span>;
  };

  const getRoleBadge = (role) => {
    const config = rolePermissions[role];
    return <span className={`${styles.roleBadge} ${styles[role]}`}>{config.label}</span>;
  };

  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return 'Chưa đăng nhập';
    const date = new Date(lastLogin);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className={styles.adminManagement}>
      <div className={styles.header}>
        <h2>Quản Lý Tài Khoản Admin</h2>
        <button 
          className={styles.createBtn}
          onClick={() => setShowCreateModal(true)}
        >
          Thêm Admin mới
        </button>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statInfo}>
            <h3>{admins.length}</h3>
            <p>Tổng Admin</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statInfo}>
            <h3>{admins.filter(a => a.status === 'active').length}</h3>
            <p>Hoạt động</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🔒</div>
          <div className={styles.statInfo}>
            <h3>{admins.filter(a => a.role === 'super-admin').length}</h3>
            <p>Super Admin</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <select 
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">Tất cả vai trò</option>
          <option value="super-admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="sub-admin">Sub Admin</option>
        </select>
      </div>

      {/* Admins List */}
      <div className={styles.adminsList}>
        {filteredAdmins.map(admin => (
          <div key={admin.id} className={styles.adminCard}>
            <div className={styles.adminInfo}>
              <div className={styles.adminAvatar}>
                <img src={admin.avatar} alt={admin.name} />
                {getStatusBadge(admin.status)}
              </div>
              
              <div className={styles.adminDetails}>
                <div className={styles.adminName}>
                  <h3>{admin.name}</h3>
                  {getRoleBadge(admin.role)}
                </div>
                
                <p className={styles.adminEmail}>{admin.email}</p>
                
                <div className={styles.adminMeta}>
                  <span>Lần cuối: {formatLastLogin(admin.lastLogin)}</span>
                  <span>Tạo: {new Date(admin.createdDate).toLocaleDateString('vi-VN')}</span>
                </div>
                
                <div className={styles.permissions}>
                  <strong>Quyền hạn:</strong>
                  {admin.permissions.includes('all') ? (
                    <span className={styles.allPermissions}>Toàn quyền</span>
                  ) : (
                    <div className={styles.permissionTags}>
                      {admin.permissions.map(permission => {
                        const permConfig = availablePermissions.find(p => p.id === permission);
                        return permConfig ? (
                          <span key={permission} className={styles.permissionTag}>
                            {permConfig.icon} {permConfig.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.adminActions}>
              <button 
                className={styles.editBtn}
                onClick={() => handleEditAdmin(admin)}
              >
                Sửa
              </button>
              <button 
                className={styles.toggleBtn}
                onClick={() => handleToggleStatus(admin.id)}
              >
                {admin.status === 'active' ? 'Tạm dừng' : 'Kích hoạt'}
              </button>
              {admin.role !== 'super-admin' && (
                <button 
                  className={styles.deleteBtn}
                  onClick={() => handleDeleteAdmin(admin.id)}
                >
                  Xóa
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editingAdmin ? 'Chỉnh sửa Admin' : 'Thêm Admin mới'}</h3>
              <button 
                className={styles.closeBtn}
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAdmin(null);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <form className={styles.adminForm}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Họ và tên *</label>
                    <input
                      type="text"
                      value={newAdmin.name}
                      onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                      placeholder="Nguyễn Văn A"
                      className={styles.formInput}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Email *</label>
                    <input
                      type="email"
                      value={newAdmin.email}
                      onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                      placeholder="admin@hedu.com"
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Vai trò *</label>
                  <select
                    value={newAdmin.role}
                    onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value, permissions: []})}
                    className={styles.formSelect}
                  >
                    <option value="sub-admin">Sub Admin</option>
                    <option value="admin">Admin</option>
                    <option value="super-admin">Super Admin</option>
                  </select>
                  <small className={styles.roleDescription}>
                    {rolePermissions[newAdmin.role].description}
                  </small>
                </div>

                {newAdmin.role === 'sub-admin' && (
                  <div className={styles.formGroup}>
                    <label>Quyền hạn *</label>
                    <div className={styles.permissionsGrid}>
                      {availablePermissions.filter(p => p.id !== 'admin_management').map(permission => (
                        <label key={permission.id} className={styles.permissionCheckbox}>
                          <input
                            type="checkbox"
                            checked={newAdmin.permissions.includes(permission.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewAdmin({
                                  ...newAdmin,
                                  permissions: [...newAdmin.permissions, permission.id]
                                });
                              } else {
                                setNewAdmin({
                                  ...newAdmin,
                                  permissions: newAdmin.permissions.filter(p => p !== permission.id)
                                });
                              }
                            }}
                          />
                          <span>{permission.icon} {permission.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Mật khẩu {editingAdmin ? '' : '*'}</label>
                    <input
                      type="password"
                      value={newAdmin.password}
                      onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                      placeholder={editingAdmin ? "Để trống nếu không đổi" : "Mật khẩu mới"}
                      className={styles.formInput}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Xác nhận mật khẩu {editingAdmin ? '' : '*'}</label>
                    <input
                      type="password"
                      value={newAdmin.confirmPassword}
                      onChange={(e) => setNewAdmin({...newAdmin, confirmPassword: e.target.value})}
                      placeholder="Nhập lại mật khẩu"
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button 
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingAdmin(null);
                      resetForm();
                    }}
                  >
                    Hủy
                  </button>
                  <button 
                    type="button"
                    className={styles.saveBtn}
                    onClick={editingAdmin ? handleUpdateAdmin : handleCreateAdmin}
                  >
                    {editingAdmin ? 'Cập nhật' : 'Tạo Admin'}
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

export default AdminManagement;
