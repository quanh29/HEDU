import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useCart } from '../../context/CartContext';
import axios from 'axios';

const Card = ({ 
  courseId, // Thêm courseId prop
  title, 
  instructors = [], 
  rating, 
  reviewCount, 
  originalPrice, 
  currentPrice, 
  image // Thay đổi từ icon thành image
}) => {
  const hasDiscount = originalPrice && currentPrice && originalPrice !== currentPrice;
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  
  const handleStarHover = (e, isEntering) => {
    if (isEntering) {
      e.target.style.transform = 'scale(1.2)';
      e.target.style.transition = 'transform 0.2s ease';
    } else {
      e.target.style.transform = 'scale(1)';
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === '') return '';
    const num = Number(price);
    if (Number.isNaN(num)) return price + '₫';
    return new Intl.NumberFormat('en-US').format(num) + '₫';
  };

  // Hàm tạo slug từ title
  const createSlug = (str) => {
    if (!str) return '';
    
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu tiếng Việt
      .replace(/đ/g, 'd') // Xử lý chữ đ
      .replace(/Đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '') // Loại bỏ ký tự đặc biệt
      .replace(/\s+/g, '-') // Thay thế khoảng trắng bằng dấu gạch ngang
      .replace(/-+/g, '-') // Loại bỏ dấu gạch ngang liên tiếp
      .replace(/^-+|-+$/g, ''); // Loại bỏ dấu gạch ngang ở đầu/cuối
  };

  // Xử lý click để chuyển trang (chỉ dùng courseId)
  const handleCardClick = (e) => {
    e.preventDefault();

    if (courseId) {
      const url = `/course/${encodeURIComponent(courseId)}`;
      console.log('Navigating to:', url); // Debug log
      navigate(url);
    } else {
      console.warn('Missing courseId:', { courseId, title });
    }
  };

  // Xử lý thêm vào giỏ hàng
  const handleAddToCart = async (e) => {
    e.stopPropagation(); // Ngăn click event bubbling lên card

    if (!isSignedIn) {
      // Nếu chưa đăng nhập, chuyển đến trang login
      navigate('/auth/login');
      return;
    }

    if (!courseId) {
      console.warn('Missing courseId for cart addition');
      return;
    }

    await addToCart(courseId);
    // Toast is now shown in CartContext
  };

  return (
    <div 
      className="course-card" 
      onClick={handleCardClick}
      style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        width: 'calc(25% - 15px)',
        flexShrink: 0,
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        position: 'relative',
        cursor: 'pointer',
        border: '1px solid #e0e0e0'
      }}
      onMouseEnter={(e) => {
        setIsHovered(true);
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
      }}
    >
      <div 
        className="course-image"
        style={{
          width: '100%',
          height: '180px',
          position: 'relative',
          overflow: 'hidden',
          background: '#f7fafc'
        }}
      >
        {image ? (
          <img 
            src={image} 
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
            }}
            onError={(e) => {
              // Fallback nếu ảnh không load được
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        
        {/* Fallback placeholder nếu không có ảnh hoặc ảnh lỗi */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: image ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: 'white'
          }}
        >
          <div 
            style={{
              fontSize: '40px',
              marginBottom: '8px',
              opacity: 0.9
            }}
          >
            📚
          </div>
          <div 
            style={{
              fontSize: '12px',
              opacity: 0.8,
              textAlign: 'center',
              padding: '0 20px'
            }}
          >
            Khóa học
          </div>
        </div>

        {/* Overlay gradient để text dễ đọc hơn nếu cần */}
        <div 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60px',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.3))',
            pointerEvents: 'none'
          }}
        />

        {/* Glare Hover Effect với buttons */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isHovered
              ? 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 50%, rgba(255,255,255,0.06) 100%)'
              : 'transparent',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            opacity: isHovered ? 1 : 0,
            transition: 'all 0.25s ease',
            backdropFilter: isHovered ? 'blur(3px)' : 'none',
            width: '100%'
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation(); // Ngăn click event bubbling lên card
              
              if (!isSignedIn) {
                navigate('/auth/login');
                return;
              }

              if (!courseId) {
                console.warn('Missing courseId for purchase');
                return;
              }

              // Navigate to checkout with single course, bypassing cart
              navigate('/checkout', {
                state: {
                  buyNow: true,
                  course: {
                    courseId: courseId,
                    title: title,
                    picture_url: image,
                    instructor_name: instructors?.[0]?.fullName || instructors?.[0] || 'Giảng viên',
                    currentPrice: currentPrice,
                    originalPrice: originalPrice
                  }
                }
              });
            }}
            style={{
              padding: '12px 0',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              background: 'rgba(51, 51, 51, 0.9)',
              color: 'white',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              transform: isHovered ? 'translateY(0)' : 'translateY(20px)',
              opacity: isHovered ? 1 : 0,
              width: '60%',
              maxWidth: '220px',
              minWidth: '120px',
              boxSizing: 'border-box'
            }}
            onMouseEnter={e => {
              e.target.style.background = 'rgba(85, 85, 85, 0.9)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.target.style.background = 'rgba(51, 51, 51, 0.9)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            Mua ngay
          </button>
          <button
            onClick={handleAddToCart}
            style={{
              padding: '12px 0',
              border: '2px solid rgba(255,255,255,0.8)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              transform: isHovered ? 'translateY(0)' : 'translateY(20px)',
              opacity: isHovered ? 1 : 0,
              transitionDelay: '0.1s',
              width: '60%',
              maxWidth: '220px',
              minWidth: '120px',
              boxSizing: 'border-box'
            }}
            onMouseEnter={e => {
              e.target.style.background = 'rgba(255,255,255,0.2)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.target.style.background = 'rgba(255,255,255,0.1)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            Thêm vào giỏ
          </button>
        </div>
      </div>
      
      <div style={{ padding: '20px' }}>
        <h3 
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#2d3748',
            marginBottom: '12px',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.8em', // 2 dòng với lineHeight 1.4 và fontSize 16px
            maxHeight: '2.8em',
            textOverflow: 'ellipsis'
          }}
        >
          {title}
          {/* Nếu title ngắn, thêm khoảng trắng để luôn chiếm 2 dòng */}
          {title && title.length < 40 && (
            <span style={{ opacity: 0 }}>
              {' '.repeat(40 - title.length)}
            </span>
          )}
        </h3>
        
        <div 
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginBottom: '12px'
          }}
        >
          {instructors.map((instructor, index) => {
            // Handle both object with fullName property and direct string
            const displayName = typeof instructor === 'object' && instructor !== null
              ? (instructor.fullName || 'Giảng viên')
              : (instructor || 'Giảng viên');
            
            return (
              <span 
                key={index}
                style={{
                  background: '#333333',
                  color: 'white',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 500,
                  whiteSpace: 'nowrap'
                }}
              >
                {displayName}
              </span>
            );
          })}
        </div>
        
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}
        >
          <span 
            style={{
              fontSize: '13px',
              color: '#4a5568',
              fontWeight: 500
            }}
          >
            {rating} <span 
              style={{
                width: '14px',
                height: '14px',
                color: '#ffd700',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => handleStarHover(e, true)}
              onMouseLeave={(e) => handleStarHover(e, false)}
            >
              ★
            </span> ({reviewCount?.toLocaleString('vi-VN')})
          </span>
        </div>
        
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '12px'
          }}
        >
          {hasDiscount && (
            <span 
              style={{
                fontSize: '14px',
                color: '#a0aec0',
                textDecoration: 'line-through',
                fontWeight: 500
              }}
            >
              {formatPrice(originalPrice)}
            </span>
          )}
          <span 
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#000000'
            }}
          >
            {formatPrice(currentPrice || originalPrice)}
          </span>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1200px) {
          .course-card {
            width: calc(33.333% - 14px) !important;
          }
        }

        @media (max-width: 1024px) {
          .course-card {
            width: calc(50% - 10px) !important;
          }
        }

        @media (max-width: 768px) {
          .course-card {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Card;