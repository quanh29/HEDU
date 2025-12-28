import React, { useState, useEffect, useRef } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { User, Mail, Lock, Calendar, Briefcase, FileText, Save, Loader2, Camera, Shield, Smartphone, Key, CheckCircle, XCircle, Upload } from 'lucide-react';
import styles from './Profile.module.css';
import toast from 'react-hot-toast';

const Profile = () => {
  const { getToken } = useAuth();
  const { user: clerkUser, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'security', or 'twoFactor'
  const avatarInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    is_male: true,
    dob: '',
    headline: '',
    bio: '',
    profile_image_url: ''
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load user profile
  useEffect(() => {
    if (isLoaded) {
      loadProfile();
      checkTwoFactorStatus();
    }
  }, [isLoaded]);

  const checkTwoFactorStatus = async () => {
    try {
      // Check if user has TOTP enabled in Clerk
      const totpEnabled = clerkUser?.twoFactorEnabled || false;
      setTwoFactorEnabled(totpEnabled);
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const data = await response.json();
      
      setFormData({
        full_name: data.data.full_name || '',
        email: data.data.clerkEmail || '',
        is_male: data.data.is_male !== undefined ? data.data.is_male : true,
        dob: data.data.dob ? new Date(data.data.dob).toISOString().split('T')[0] : '',
        headline: data.data.headline || '',
        bio: data.data.bio || '',
        profile_image_url: data.data.clerkImageUrl || clerkUser?.imageUrl || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Không thể tải thông tin tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'radio') {
      setFormData(prev => ({
        ...prev,
        [name]: value === 'true'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSecurityChange = (e) => {
    const { name, value } = e.target;
    setSecurityData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const token = await getToken();
      
      // Split full_name into firstName and lastName for Clerk
      const nameParts = formData.full_name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          is_male: formData.is_male,
          dob: formData.dob || null,
          headline: formData.headline,
          bio: formData.bio,
          firstName,
          lastName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      toast.success('Cập nhật thông tin thành công!');
      
      // Reload Clerk user to get updated info
      await clerkUser?.reload();
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Không thể cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error('Mật khẩu mới không khớp!');
      return;
    }

    if (securityData.newPassword.length < 8) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự!');
      return;
    }

    try {
      setSaving(true);
      
      // Verify current password using Clerk client-side
      try {
        await clerkUser?.updatePassword({
          currentPassword: securityData.currentPassword,
          newPassword: securityData.newPassword,
          signOutOfOtherSessions: false
        });

        toast.success('Đổi mật khẩu thành công!');
        
        // Clear form
        setSecurityData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
      } catch (clerkError) {
        console.error('Error changing password with Clerk:', clerkError);
        
        // Handle Clerk-specific errors
        if (clerkError.errors?.[0]?.code === 'form_password_incorrect') {
          toast.error('Mật khẩu hiện tại không đúng!');
        } else if (clerkError.errors?.[0]?.message) {
          toast.error(clerkError.errors[0].message);
        } else {
          toast.error('Không thể đổi mật khẩu. Vui lòng thử lại.');
        }
      }
      
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    try {
      setUploadingAvatar(true);
      const token = await getToken();
      
      const formDataUpload = new FormData();
      formDataUpload.append('avatar', file);

      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/user/profile/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      const data = await response.json();
      
      // Update form data with new avatar URL
      setFormData(prev => ({
        ...prev,
        profile_image_url: data.data.profile_image_url
      }));

      toast.success('Cập nhật ảnh đại diện thành công!');
      
      // Reload Clerk user
      await clerkUser?.reload();
      setAvatarPreview(null);
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Không thể tải lên ảnh đại diện');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      setTwoFactorLoading(true);
      
      // Use Clerk's built-in 2FA flow
      const totp = await clerkUser?.createTOTP();
      
      if (totp) {
        // Show QR code and secret
        const qrCode = totp.qrCode;
        const secret = totp.secret;
        
        // Create modal to show QR code
        const modal = document.createElement('div');
        modal.className = styles.modal;
        modal.innerHTML = `
          <div class="${styles.modalContent}">
            <h3>Quét mã QR này bằng ứng dụng xác thực</h3>
            <img src="${qrCode}" alt="QR Code" style="max-width: 300px; margin: 20px auto;" />
            <p style="margin: 16px 0; font-size: 14px;">Hoặc nhập mã thủ công:</p>
            <code style="background: #f3f4f6; padding: 8px 12px; border-radius: 6px; font-family: monospace;">${secret}</code>
            <p style="margin: 16px 0; font-size: 13px; color: #6b7280;">
              Sử dụng Google Authenticator, Authy, hoặc ứng dụng TOTP khác
            </p>
            <input 
              type="text" 
              placeholder="Nhập mã 6 chữ số từ ứng dụng" 
              id="totpCode"
              style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; margin: 16px 0; font-size: 16px; text-align: center; letter-spacing: 4px;"
            />
            <div style="display: flex; gap: 12px; margin-top: 20px;">
              <button id="verify2FA" style="flex: 1; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                Xác nhận
              </button>
              <button id="cancel2FA" style="flex: 1; padding: 12px; background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                Hủy
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        
        // Handle verify
        document.getElementById('verify2FA').onclick = async () => {
          const code = document.getElementById('totpCode').value;
          if (!code || code.length !== 6) {
            toast.error('Vui lòng nhập mã 6 chữ số');
            return;
          }
          
          try {
            await clerkUser?.verifyTOTP({ code });
            toast.success('Xác thực 2 yếu tố đã được bật!');
            setTwoFactorEnabled(true);
            document.body.removeChild(modal);
          } catch (error) {
            toast.error('Mã xác thực không đúng');
          }
        };
        
        // Handle cancel
        document.getElementById('cancel2FA').onclick = () => {
          document.body.removeChild(modal);
        };
      }
      
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      toast.error('Không thể bật xác thực 2 yếu tố');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn tắt xác thực 2 yếu tố?')) {
      return;
    }
    
    try {
      setTwoFactorLoading(true);
      await clerkUser?.disableTOTP();
      toast.success('Xác thực 2 yếu tố đã được tắt!');
      setTwoFactorEnabled(false);
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast.error('Không thể tắt xác thực 2 yếu tố');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  if (loading || !isLoaded) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Thông tin tài khoản</h1>
      </div>

      <div className={styles.content}>
        {/* Avatar Section */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper}>
            <img 
              src={avatarPreview || formData.profile_image_url || '/default-avatar.png'} 
              alt="Avatar"
              className={styles.avatar}
            />
            {uploadingAvatar && (
              <div className={styles.avatarLoading}>
                <Loader2 className={styles.spinner} size={24} />
              </div>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            <button 
              className={styles.avatarButton}
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
              title="Thay đổi ảnh đại diện"
            >
              {uploadingAvatar ? <Loader2 className={styles.spinner} size={18} /> : <Camera size={18} />}
            </button>
          </div>
          <div className={styles.avatarInfo}>
            <h3>{formData.full_name || 'Người dùng'}</h3>
            <p>{formData.email}</p>
            <span className={styles.note}>
              <Upload size={14} />
              Nhấn vào biểu tượng camera để tải lên ảnh mới
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'general' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <User size={18} />
            Thông tin chung
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'security' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Lock size={18} />
            Mật khẩu
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'twoFactor' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('twoFactor')}
          >
            <Shield size={18} />
            Xác thực 2 yếu tố
          </button>
        </div>

        {/* General Info Tab */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveProfile} className={styles.form}>
            <div className={styles.formGrid}>
              {/* Full Name */}
              <div className={styles.formGroup}>
                <label htmlFor="full_name">
                  <User size={16} />
                  Họ và tên
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>

              {/* Email (Read only) */}
              <div className={styles.formGroup}>
                <label htmlFor="email">
                  <Mail size={16} />
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className={styles.disabledInput}
                />
                <span className={styles.helperText}>
                  Email không thể thay đổi (thực ra đổi được nhưng do hiện tại chưa làm nên tạm thời khóa lại 😄)
                </span>
              </div>

              {/* Gender */}
              <div className={styles.formGroup}>
                <label>
                  <User size={16} />
                  Giới tính
                </label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="is_male"
                      value="true"
                      checked={formData.is_male === true}
                      onChange={handleInputChange}
                    />
                    <span>Nam</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="is_male"
                      value="false"
                      checked={formData.is_male === false}
                      onChange={handleInputChange}
                    />
                    <span>Nữ</span>
                  </label>
                </div>
              </div>

              {/* Date of Birth */}
              <div className={styles.formGroup}>
                <label htmlFor="dob">
                  <Calendar size={16} />
                  Ngày sinh
                </label>
                <input
                  type="date"
                  id="dob"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                />
              </div>

              {/* Headline */}
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label htmlFor="headline">
                  <Briefcase size={16} />
                  Tiêu đề
                </label>
                <input
                  type="text"
                  id="headline"
                  name="headline"
                  value={formData.headline}
                  onChange={handleInputChange}
                  placeholder="VD: Giảng viên lập trình, Chuyên gia thiết kế..."
                  maxLength={100}
                />
              </div>

              {/* Bio */}
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label htmlFor="bio">
                  <FileText size={16} />
                  Giới thiệu
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Giới thiệu về bản thân..."
                  rows={4}
                  maxLength={500}
                />
                <span className={styles.charCount}>
                  {formData.bio.length}/500 ký tự
                </span>
              </div>
            </div>

            <div className={styles.formActions}>
              <button 
                type="submit" 
                className={styles.saveButton}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className={styles.spinner} size={18} />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className={styles.form}>
            <div className={styles.securityInfo}>
              <Lock size={24} />
              <h3>Đổi mật khẩu</h3>
              <p>Đảm bảo tài khoản của bạn an toàn bằng cách sử dụng mật khẩu mạnh</p>
            </div>

            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label htmlFor="currentPassword">
                  <Lock size={16} />
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={securityData.currentPassword}
                  onChange={handleSecurityChange}
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label htmlFor="newPassword">
                  <Lock size={16} />
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={securityData.newPassword}
                  onChange={handleSecurityChange}
                  placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                  required
                  minLength={8}
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label htmlFor="confirmPassword">
                  <Lock size={16} />
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={securityData.confirmPassword}
                  onChange={handleSecurityChange}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button 
                type="submit" 
                className={styles.saveButton}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className={styles.spinner} size={18} />
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Đổi mật khẩu
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Two Factor Authentication Tab */}
        {activeTab === 'twoFactor' && (
          <div className={styles.form}>
            <div className={styles.twoFactorSection}>
              <div className={styles.twoFactorHeader}>
                <Shield size={48} color={twoFactorEnabled ? '#10b981' : '#6b7280'} />
                <h3>Xác thực 2 yếu tố (2FA)</h3>
                <p>
                  Thêm một lớp bảo mật bổ sung cho tài khoản của bạn bằng cách yêu cầu 
                  mã xác thực từ ứng dụng di động khi đăng nhập.
                </p>
              </div>

              <div className={styles.twoFactorStatus}>
                <div className={styles.statusBadge} data-enabled={twoFactorEnabled}>
                  {twoFactorEnabled ? (
                    <>
                      <CheckCircle size={20} />
                      <span>Đang bật</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={20} />
                      <span>Đang tắt</span>
                    </>
                  )}
                </div>
                
                {twoFactorEnabled ? (
                  <p className={styles.statusText}>
                    Tài khoản của bạn được bảo vệ bởi xác thực 2 yếu tố
                  </p>
                ) : (
                  <p className={styles.statusText}>
                    Bật xác thực 2 yếu tố để tăng cường bảo mật
                  </p>
                )}
              </div>

              {!twoFactorEnabled && (
                <div className={styles.twoFactorSteps}>
                  <h4>Cách bật 2FA:</h4>
                  <ol>
                    <li>
                      <Smartphone size={16} />
                      <span>Tải ứng dụng xác thực như Google Authenticator hoặc Authy</span>
                    </li>
                    <li>
                      <Key size={16} />
                      <span>Quét mã QR hoặc nhập mã thủ công vào ứng dụng</span>
                    </li>
                    <li>
                      <CheckCircle size={16} />
                      <span>Nhập mã 6 chữ số để xác nhận</span>
                    </li>
                  </ol>
                </div>
              )}

              <div className={styles.formActions}>
                {twoFactorEnabled ? (
                  <button 
                    type="button"
                    onClick={handleDisable2FA}
                    className={`${styles.saveButton} ${styles.dangerButton}`}
                    disabled={twoFactorLoading}
                  >
                    {twoFactorLoading ? (
                      <>
                        <Loader2 className={styles.spinner} size={18} />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <XCircle size={18} />
                        Tắt xác thực 2 yếu tố
                      </>
                    )}
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={handleEnable2FA}
                    className={styles.saveButton}
                    disabled={twoFactorLoading}
                  >
                    {twoFactorLoading ? (
                      <>
                        <Loader2 className={styles.spinner} size={18} />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Shield size={18} />
                        Bật xác thực 2 yếu tố
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
