import React, { useState, useEffect, useRef } from 'react';
import Card from '../Card/Card.jsx';
import SkeletonCard from '../SkeletonCard/SkeletonCard.jsx';
import styles from './Carousel.module.css';

const Carousel = ({ courses = [], title = "Khóa Học Nổi Bật", loading = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(4);
  const trackRef = useRef(null);
  const containerRef = useRef(null);

  const totalCards = courses.length;
  const maxIndex = Math.max(0, totalCards - cardsPerView);

  // Update cards per view based on screen size
  const updateCardsPerView = () => {
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.offsetWidth;
    let newCardsPerView;
    
    if (containerWidth < 768) {
      newCardsPerView = 1;
    } else if (containerWidth < 1024) {
      newCardsPerView = 2;
    } else if (containerWidth < 1200) {
      newCardsPerView = 3;
    } else {
      newCardsPerView = 4;
    }
    
    setCardsPerView(newCardsPerView);
    setCurrentIndex(prev => Math.min(prev, Math.max(0, totalCards - newCardsPerView)));
  };

  // Handle window resize
  useEffect(() => {
    updateCardsPerView();
    
    const handleResize = () => {
      updateCardsPerView();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [totalCards]);

  // Navigation functions
  const prev = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const next = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  // Update carousel position
  useEffect(() => {
    if (!trackRef.current || !containerRef.current) return;
    
    const containerWidth = containerRef.current.offsetWidth;
    const cardWidth = containerWidth / cardsPerView;
    const translateX = -currentIndex * cardWidth;
    
    trackRef.current.style.transform = `translateX(${translateX}px)`;
  }, [currentIndex, cardsPerView]);

  // Touch/Swipe handlers
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    trackRef.current.startX = touch.clientX;
  };

  const handleTouchMove = (e) => {
    if (!trackRef.current.startX) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    trackRef.current.currentX = touch.clientX;
  };

  const handleTouchEnd = () => {
    if (!trackRef.current.startX || !trackRef.current.currentX) return;
    
    const diff = trackRef.current.startX - trackRef.current.currentX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        next();
      } else {
        prev();
      }
    }
    
    trackRef.current.startX = null;
    trackRef.current.currentX = null;
  };

  const handleCardClick = (course, index) => {
    console.log('Card clicked:', course.title, 'at index:', index);
    // Add your card click logic here
  };

  // Render skeleton cards when loading
  const renderSkeletonCards = () => {
    return Array.from({ length: cardsPerView }).map((_, index) => (
      <SkeletonCard key={`skeleton-${index}`} />
    ));
  };

  return (
    <div style={{ background: 'rgba(244, 241, 237, 0.75)', width: '100%' }}>
      <div className={styles.carouselRoot}>
        <h1 className={styles.carouselTitle}>{title}</h1>
        <div className={styles.carouselWrapper}>
          {/* Previous Button */}
          <button
            onClick={prev}
            disabled={currentIndex === 0}
            className={styles.carouselNav}
          >
            &#x2039;
          </button>
          
          {/* Carousel Container */}
          <div 
            ref={containerRef}
            className={styles.carouselContainer}
          >
            <div 
              ref={trackRef}
              className={styles.carouselTrack}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {loading ? (
                renderSkeletonCards()
              ) : (
                courses.map((course, index) => (
                  <Card
                    key={index}
                    courseId={course.courseId}
                    title={course.title}
                    instructors={course.instructors}
                    rating={course.rating}
                    reviewCount={course.reviewCount}
                    originalPrice={course.originalPrice}
                    currentPrice={course.currentPrice}
                    image={course.image}
                    onClick={() => handleCardClick(course, index)}
                  />
                ))
              )}
            </div>
          </div>
          
          {/* Next Button */}
          <button
            onClick={next}
            disabled={currentIndex >= maxIndex}
            className={styles.carouselNav}
          >
            &#x203A;
          </button>
        </div>
      </div>
    </div>
  );
};

export default Carousel;