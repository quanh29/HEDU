import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { isSignedIn, isLoaded } = useUser();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch wishlist items
  const fetchWishlistItems = async () => {
    if (!isLoaded || !isSignedIn) {
      setWishlistItems([]);
      return;
    }

    try {
      setLoading(true);
      const token = await window.Clerk.session.getToken();
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/wishlist`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setWishlistItems(response.data.data.items || []);
      }
    } catch (error) {
      console.error('Error fetching wishlist items:', error);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Check if course is in wishlist
  const isInWishlist = (courseId) => {
    return wishlistItems.some(item => item.courseId === courseId);
  };

  // Add item to wishlist
  const addToWishlist = async (courseId) => {
    if (!isSignedIn) {
      toast.error('Vui lòng đăng nhập để thêm vào danh sách yêu thích');
      return false;
    }

    try {
      const token = await window.Clerk.session.getToken();
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/wishlist`,
        { courseId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Refresh wishlist items to get updated data
        await fetchWishlistItems();
        toast.success('Đã thêm vào danh sách yêu thích!');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      
      // Check various error messages
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already in wishlist')) {
        toast.error('Khóa học đã có trong danh sách yêu thích');
      } else if (error.response?.status === 400 && error.response?.data?.message?.includes('free')) {
        toast.error('Không thể thêm khóa học miễn phí vào danh sách yêu thích');
      } else {
        toast.error('Có lỗi xảy ra khi thêm vào danh sách yêu thích');
      }
      return false;
    }
  };

  // Remove item from wishlist
  const removeFromWishlist = async (courseId) => {
    if (!isSignedIn) return false;

    try {
      const token = await window.Clerk.session.getToken();
      await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/api/wishlist/${courseId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Refresh wishlist items
      await fetchWishlistItems();
      toast.success('Đã xóa khỏi danh sách yêu thích');
      return true;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Có lỗi xảy ra khi xóa khỏi danh sách yêu thích');
      return false;
    }
  };

  // Toggle wishlist (add if not in, remove if in)
  const toggleWishlist = async (courseId) => {
    if (isInWishlist(courseId)) {
      return await removeFromWishlist(courseId);
    } else {
      return await addToWishlist(courseId);
    }
  };

  // Get wishlist item count
  const getWishlistItemCount = () => {
    return wishlistItems.length;
  };

  useEffect(() => {
    fetchWishlistItems();
  }, [isLoaded, isSignedIn]);

  const value = {
    wishlistItems,
    loading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    getWishlistItemCount,
    fetchWishlistItems
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
