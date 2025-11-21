import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { LogOut } from 'lucide-react';
import styles from './UserMenu.module.css';

const UserMenu = () => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

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
      <img
        src={user?.imageUrl || '/default-avatar.png'}
        alt="User Avatar"
        className={styles.userAvatar}
        onClick={handleUserMenuToggle}
      />
      {showUserMenu && (
        <div className={styles.userDropdown}>
          <div className={styles.userInfo}>
            <img
              src={user?.imageUrl || '/default-avatar.png'}
              alt="User Avatar"
              className={styles.userDropdownAvatar}
            />
            <div className={styles.userDetails}>
              <div className={styles.userName}>
                {user?.fullName || user?.firstName || 'User'}
              </div>
              <div className={styles.userEmail}>
                {user?.primaryEmailAddress?.emailAddress}
              </div>
            </div>
          </div>
          <div className={styles.menuDivider}></div>
          <ul className={styles.userMenuList}>
            <li onClick={() => handleMenuItemClick('/notifications')}>
              <span>Thông báo</span>
            </li>
            <li onClick={() => handleMenuItemClick('/profile')}>
              <span>Thông tin tài khoản</span>
            </li>
            <li onClick={() => handleMenuItemClick('/my-learning')}>
              <span>Khóa học của tôi</span>
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