import React from 'react';
import styles from './SkeletonCard.module.css';

const SkeletonCard = () => {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonImage}></div>
      <div className={styles.skeletonContent}>
        <div className={styles.skeletonTitle}></div>
        <div className={styles.skeletonText}></div>
        <div className={styles.skeletonRating}>
          <div className={styles.skeletonStars}></div>
          <div className={styles.skeletonCount}></div>
        </div>
        <div className={styles.skeletonPrice}>
          <div className={styles.skeletonCurrentPrice}></div>
          <div className={styles.skeletonOriginalPrice}></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
