import React, { useState, useEffect } from 'react';
import { X, Star, Filter, User as UserIcon } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './RatingListModal.module.css';

function RatingListModal({ courseId, isOpen, onClose, totalRatings, averageRating }) {
    const [ratings, setRatings] = useState([]);
    const [filteredRatings, setFilteredRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [starFilter, setStarFilter] = useState('all'); // 'all', '5', '4', '3', '2', '1'
    const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest'
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen && courseId) {
            fetchRatings();
        }
    }, [isOpen, courseId]);

    useEffect(() => {
        applyFilters();
    }, [ratings, starFilter, sortOrder]);

    const fetchRatings = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/api/rating/course/${courseId}`
            );
            
            if (response.data.success) {
                setRatings(response.data.ratings);
            }
        } catch (error) {
            console.error('Error fetching ratings:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...ratings];

        // Filter by star rating
        if (starFilter !== 'all') {
            const filterStar = parseInt(starFilter);
            filtered = filtered.filter(rating => rating.rating === filterStar);
        }

        // Sort by date
        filtered.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        setFilteredRatings(filtered);
    };

    const renderStars = (rating) => {
        return (
            <div className={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`${styles.star} ${
                            star <= rating ? styles.starFilled : styles.starEmpty
                        }`}
                        size={16}
                    />
                ))}
            </div>
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    };

    const getStarCount = (star) => {
        return ratings.filter(r => r.rating === star).length;
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h2 className={styles.title}>Đánh giá của học viên</h2>
                        <div className={styles.ratingOverview}>
                            <div className={styles.averageRating}>
                                <span className={styles.averageNumber}>{averageRating || '0.0'}</span>
                                <div className={styles.averageStars}>
                                    {renderStars(Math.round(averageRating))}
                                </div>
                            </div>
                            <span className={styles.totalCount}>{totalRatings} đánh giá</span>
                        </div>
                    </div>
                    <button className={styles.closeButton} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Filters */}
                <div className={styles.filters}>
                    <div className={styles.filterGroup}>
                        <Filter size={18} />
                        <span className={styles.filterLabel}>Lọc theo:</span>
                        
                        {/* Star Filter */}
                        <div className={styles.starFilters}>
                            <button
                                className={`${styles.filterButton} ${starFilter === 'all' ? styles.active : ''}`}
                                onClick={() => setStarFilter('all')}
                            >
                                Tất cả ({ratings.length})
                            </button>
                            {[5, 4, 3, 2, 1].map((star) => (
                                <button
                                    key={star}
                                    className={`${styles.filterButton} ${starFilter === star.toString() ? styles.active : ''}`}
                                    onClick={() => setStarFilter(star.toString())}
                                >
                                    {star} <Star size={14} className={styles.filterStar} /> ({getStarCount(star)})
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sort Order */}
                    <div className={styles.sortGroup}>
                        <span className={styles.filterLabel}>Sắp xếp:</span>
                        <select
                            className={styles.sortSelect}
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                        >
                            <option value="newest">Mới nhất</option>
                            <option value="oldest">Cũ nhất</option>
                        </select>
                    </div>
                </div>

                {/* Ratings List */}
                <div className={styles.ratingsList}>
                    {loading ? (
                        <div className={styles.loading}>Đang tải đánh giá...</div>
                    ) : filteredRatings.length === 0 ? (
                        <div className={styles.noRatings}>
                            {starFilter === 'all' 
                                ? 'Chưa có đánh giá nào cho khóa học này'
                                : `Không có đánh giá ${starFilter} sao`
                            }
                        </div>
                    ) : (
                        filteredRatings.map((rating) => (
                            <div key={rating._id} className={styles.ratingCard}>
                                <div className={styles.ratingHeader}>
                                    <div 
                                        className={styles.userInfo}
                                        onClick={() => {
                                            if (rating.user_id?._id) {
                                                navigate(`/user/${rating.user_id._id}`);
                                            }
                                        }}
                                        style={{ cursor: rating.user_id?._id ? 'pointer' : 'default' }}
                                    >
                                        {rating.user_id?.profile_image_url ? (
                                            <img
                                                src={rating.user_id.profile_image_url}
                                                alt={rating.user_id?.full_name || 'User'}
                                                className={styles.userAvatar}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : (
                                            <div className={styles.avatarPlaceholder}>
                                                <UserIcon size={20} />
                                            </div>
                                        )}
                                        <div className={styles.userDetails}>
                                            <div className={styles.userName} style={{ color: rating.user_id?._id ? '#3b82f6' : 'inherit' }}>
                                                {rating.user_id?.full_name || 'Học viên'}
                                            </div>
                                            <div className={styles.ratingMeta}>
                                                {renderStars(rating.rating)}
                                                <span className={styles.ratingDate}>
                                                    • {formatDate(rating.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {rating.comment && (
                                    <p className={styles.ratingComment}>{rating.comment}</p>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer with count */}
                {!loading && filteredRatings.length > 0 && (
                    <div className={styles.footer}>
                        Hiển thị {filteredRatings.length} trong tổng số {ratings.length} đánh giá
                    </div>
                )}
            </div>
        </div>
    );
}

export default RatingListModal;
