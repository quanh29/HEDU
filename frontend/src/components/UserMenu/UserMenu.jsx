import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { LogOut, MessageCircle } from 'lucide-react';
import styles from './UserMenu.module.css';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';

const UserMenu = () => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const { unreadCount } = useUnreadMessages();

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleUserMenuToggle = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleMenuItemClick = (path) => {
    setShowUserMenu(false);
    navigate(path);
  };

  const handleSignOut = async () => {
    setShowUserMenu(false);
    await signOut();
    navigate('/');
  };

  // Don't render if user is not signed in
  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className={styles.userMenuWrapper} ref={userMenuRef}>
      <div className={styles.avatarWrapper}>
        <img
          src={user?.imageUrl || '/default-avatar.png'}
          alt="User Avatar"
          className={styles.userAvatar}
          onClick={handleUserMenuToggle}
        />
        {unreadCount > 0 && (
          <div className={styles.unreadBadge}>{unreadCount > 99 ? '99+' : unreadCount}</div>
        )}
      </div>
      {showUserMenu && (
        <div className={styles.userDropdown}>
          <div className={styles.userInfo}>
            <img
              src={user?.imageUrl || '/default-avatar.png'}
              alt="User Avatar"
              className={styles.userDropdownAvatar}
              onClick={() => handleMenuItemClick(`/user/${user?.id}`)}
              style={{ cursor: 'pointer' }}
            />
            <div className={styles.userDetails}>
              <div 
                className={styles.userName}
                onClick={() => handleMenuItemClick(`/user/${user?.id}`)}
                style={{ cursor: 'pointer' }}
              >
                {user?.fullName || user?.firstName || 'User'}
              </div>
              <div className={styles.userEmail}>
                {user?.primaryEmailAddress?.emailAddress}
              </div>
            </div>
          </div>
          <div className={styles.menuDivider}></div>
          <ul className={styles.userMenuList}>
            <li onClick={() => handleMenuItemClick('/messages')}>
              <span className={styles.menuItemWithIcon}>
                Tin nhắn
                {unreadCount > 0 && (
                  <span className={styles.menuBadge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </span>
            </li>
            <li onClick={() => handleMenuItemClick('/profile')}>
              <span>Thông tin tài khoản</span>
            </li>
            <li onClick={() => handleMenuItemClick('/wallet')}>
              <span>Ví tiền</span>
            </li>
            <li onClick={() => handleMenuItemClick('/my-learning')}>
              <span>Khóa học của tôi</span>
            </li>
            <li onClick={() => handleMenuItemClick('/refund-history')}>
              <span>Lịch sử hoàn tiền</span>
            </li>
            <li onClick={() => handleMenuItemClick('/payment-history')}>
              <span>Lịch sử thanh toán</span>
            </li>
            <li onClick={() => handleMenuItemClick('/support')}>
              <span>Hỗ trợ</span>
            </li>
          </ul>
          <div className={styles.menuDivider}></div>
          <button className={styles.signOutBtn} onClick={handleSignOut}>
            <span className={styles.menuIcon}><LogOut size={16} /></span>
            <span>Đăng xuất</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;