import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Search, 
  Filter,
  UserPlus,
  Shield,
  CheckCircle,
  XCircle,
  Calendar,
  Mail,
  User as UserIcon,
  X
} from 'lucide-react';
import styles from './AdminManagement.module.css';

const AdminManagement = ({ isSuperAdmin = false }) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [processingUserId, setProcessingUserId] = useState(null);
  
  const [newAdmin, setNewAdmin] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin'
  });

  const baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await axios.get(`${baseURL}/api/admin/users`, {
        params: {
          status: statusFilter,
          role: roleFilter,
          search: searchTerm
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to fetch users: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [statusFilter, roleFilter, searchTerm]);

  // Toggle user status
  const handleToggleStatus = async (userId, currentStatus, targetUser) => {
    // Check if superadmin is trying to deactivate themselves
    if (isSuperAdmin && user?.id === userId && currentStatus === true) {
      alert('Superadmin không thể vô hiệu hóa chính mình');
      return;
    }

    // Check if current user has permission
    if (!isSuperAdmin && (targetUser.is_admin || targetUser.is_superadmin)) {
      alert('Chỉ có Superadmin mới có thể vô hiệu hóa/kích hoạt Admin hoặc Superadmin khác');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn ${currentStatus ? 'vô hiệu hóa' : 'kích hoạt'} người dùng này?`)) {
      return;
    }

    try {
      setProcessingUserId(userId);
      const token = await getToken();
      const response = await axios.patch(
        `${baseURL}/api/admin/users/${userId}/status`,
        { is_active: !currentStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        alert(response.data.message);
        fetchUsers();
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Failed to update user status: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessingUserId(null);
    }
  };

  // Create admin user
  const handleCreateAdmin = async () => {
    // Validate
    if (!newAdmin.full_name || !newAdmin.email || !newAdmin.password || !newAdmin.confirmPassword) {
      alert('Please fill in all fields');
      return;
    }

    if (newAdmin.password !== newAdmin.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (newAdmin.password.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    try {
      const token = await getToken();
      const response = await axios.post(
        `${baseURL}/api/admin/users/create-admin`,
        {
          full_name: newAdmin.full_name,
          email: newAdmin.email,
          password: newAdmin.password,
          role: newAdmin.role
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        alert('Admin user created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchUsers();
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      alert('Failed to create admin: ' + (error.response?.data?.message || error.message));
    }
  };

  const resetForm = () => {
    setNewAdmin({
      full_name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'admin'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const filteredUsers = users;

  return (
    <div className={styles.adminManagement}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Users className={styles.headerIcon} />
          <h2>User Management</h2>
        </div>
        {isSuperAdmin && (
          <button 
            className={styles.createBtn}
            onClick={() => setShowCreateModal(true)}
          >
            <UserPlus size={18} />
            Tạo Admin
          </button>
        )}
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Users size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>{users.length}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <UserCheck size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>{users.filter(u => u.is_active).length}</h3>
            <p>Active Users</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Shield size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>{users.filter(u => u.is_admin).length}</h3>
            <p>Admin Users</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
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
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Tất cả vai trò</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : filteredUsers.length === 0 ? (
          <div className={styles.noData}>No users found</div>
        ) : (
          <table className={styles.usersTable}>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Họ và tên</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Ngày tham gia</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(targetUser => (
                <tr key={targetUser._id}>
                  <td>
                    <div className={styles.userId}>
                      {targetUser._id.substring(0, 8)}...
                    </div>
                  </td>
                  <td>
                    <div className={styles.userInfo}>
                      {targetUser.profile_image_url ? (
                        <img 
                          src={targetUser.profile_image_url} 
                          alt={targetUser.full_name}
                          className={styles.avatar}
                        />
                      ) : (
                        <div className={styles.avatarPlaceholder}>
                          <UserIcon size={18} />
                        </div>
                      )}
                      <span>{targetUser.full_name}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.email}>
                      <Mail size={14} />
                      {targetUser.email}
                    </div>
                  </td>
                  <td>
                    {targetUser.is_superadmin ? (
                      <span className={`${styles.badge} ${styles.superadminBadge}`}>
                        <Shield size={14} />
                        Super Admin
                      </span>
                    ) : targetUser.is_admin ? (
                      <span className={`${styles.badge} ${styles.adminBadge}`}>
                        <Shield size={14} />
                        Admin
                      </span>
                    ) : (
                      <span className={`${styles.badge} ${styles.userBadge}`}>
                        <UserIcon size={14} />
                        User
                      </span>
                    )}
                  </td>
                  <td>
                    <div className={styles.date}>
                      <Calendar size={14} />
                      {formatDate(targetUser.createdAt)}
                    </div>
                  </td>
                  <td>
                    {targetUser.is_active ? (
                      <span className={`${styles.badge} ${styles.activeBadge}`}>
                        <CheckCircle size={14} />
                        Active
                      </span>
                    ) : (
                      <span className={`${styles.badge} ${styles.inactiveBadge}`}>
                        <XCircle size={14} />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className={targetUser.is_active ? styles.deactivateBtn : styles.activateBtn}
                      onClick={() => handleToggleStatus(targetUser._id, targetUser.is_active, targetUser)}
                      disabled={
                        processingUserId === targetUser._id || 
                        (!isSuperAdmin && (targetUser.is_admin || targetUser.is_superadmin)) ||
                        (isSuperAdmin && targetUser.is_active && targetUser._id === user?.id)
                      }
                      title={
                        (!isSuperAdmin && (targetUser.is_admin || targetUser.is_superadmin)) 
                          ? 'Chỉ Superadmin mới có thể thay đổi trạng thái Admin/Superadmin' 
                          : (isSuperAdmin && targetUser.is_active && targetUser._id === user?.id)
                          ? 'Không thể vô hiệu hóa chính mình'
                          : ''
                      }
                    >
                      {processingUserId === targetUser._id ? (
                        'Đang xử lý...'
                      ) : targetUser.is_active ? (
                        <>
                          <UserX size={14} />
                          Vô hiệu hóa
                        </>
                      ) : (
                        <>
                          <UserCheck size={14} />
                          Kích hoạt
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className={styles.modal} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                <UserPlus size={20} />
                Create New Admin
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
              <form className={styles.adminForm} onSubmit={(e) => e.preventDefault()}>
                <div className={styles.formGroup}>
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={newAdmin.full_name}
                    onChange={(e) => setNewAdmin({...newAdmin, full_name: e.target.value})}
                    placeholder="John Doe"
                    className={styles.formInput}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Email *</label>
                  <input
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                    placeholder="admin@example.com"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Vai trò *</label>
                  <select
                    value={newAdmin.role}
                    onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
                    className={styles.formInput}
                  >
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Password *</label>
                  <input
                    type="password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                    placeholder="Minimum 8 characters"
                    className={styles.formInput}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Confirm Password *</label>
                  <input
                    type="password"
                    value={newAdmin.confirmPassword}
                    onChange={(e) => setNewAdmin({...newAdmin, confirmPassword: e.target.value})}
                    placeholder="Re-enter password"
                    className={styles.formInput}
                  />
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
                    Cancel
                  </button>
                  <button 
                    type="button"
                    className={styles.saveBtn}
                    onClick={handleCreateAdmin}
                  >
                    <UserPlus size={16} />
                    Create Admin
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
