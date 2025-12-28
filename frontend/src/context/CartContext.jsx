import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { isSignedIn, isLoaded } = useUser();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch cart items
  const fetchCartItems = async () => {
    if (!isLoaded || !isSignedIn) {
      setCartItems([]);
      return;
    }

    try {
      setLoading(true);
      const token = await window.Clerk.session.getToken();
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/cart`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setCartItems(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (courseId) => {
    if (!isSignedIn) return false;

    try {
      const token = await window.Clerk.session.getToken();
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/cart`,
        { courseId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Refresh cart items to get updated data
        await fetchCartItems();
        toast.success('Đã thêm khóa học vào giỏ hàng!');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding to cart:', error);
      
      // Check if course is already in cart
      if (error.response?.status === 400 && error.response?.data?.message?.includes('đã có')) {
        toast.error('Khóa học đã có trong giỏ hàng');
      } else if (error.response?.status === 400 && error.response?.data?.message?.includes('enrolled')) {
        toast.error('Bạn đã đăng ký khóa học này rồi');
      } else {
        toast.error('Có lỗi xảy ra khi thêm vào giỏ hàng');
      }
      return false;
    }
  };

  // Remove item from cart
  const removeFromCart = async (courseId) => {
    if (!isSignedIn) return false;

    try {
      const token = await window.Clerk.session.getToken();
      await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/api/cart/${courseId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Refresh cart items
      await fetchCartItems();
      return true;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return false;
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!isSignedIn) return false;

    try {
      const token = await window.Clerk.session.getToken();
      await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/api/cart`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setCartItems([]);
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
  };

  // Calculate total price
  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = Number(item.course?.currentPrice);
      return total + (isNaN(price) ? 0 : price);
    }, 0);
  };

  // Get cart item count
  const getCartItemCount = () => {
    return cartItems.length;
  };

  useEffect(() => {
    fetchCartItems();
  }, [isLoaded, isSignedIn]);

  const value = {
    cartItems,
    loading,
    addToCart,
    removeFromCart,
    clearCart,
    fetchCartItems,
    getTotalPrice,
    getCartItemCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};