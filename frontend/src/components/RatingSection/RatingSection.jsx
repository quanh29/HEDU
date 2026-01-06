import React, { useState, useEffect } from 'react';
import { Star, Edit2, Trash2, Check, X, MessageSquare } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { getAuthConfigFromHook } from '../../utils/clerkAuth';
import styles from './RatingSection.module.css';

function RatingSection({ courseId, isOpen, onClose }) {
    const { getToken, isLoaded, isSignedIn, userId } = useAuth();
    const [userRating, setUserRating] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingRating, setEditingRating] = useState(false);
    
    // Form state
    const [selectedRating, setSelectedRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Fetch user's rating when modal opens
    useEffect(() => {
        if (isOpen && isLoaded && courseId) {
            if (isSignedIn) {
                fetchUserRating();
            } else {
                setLoading(false);
            }
        }
    }, [isOpen, courseId, isLoaded, isSignedIn]);

    const fetchUserRating = async () => {
        try {
            setLoading(true);
            const authConfig = await getAuthConfigFromHook(getToken);
            const response = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/api/rating/course/${courseId}/user`,
                authConfig
            );
            if (response.data.success && response.data.rating) {
                setUserRating(response.data.rating);
                // Set form values to existing rating
                setSelectedRating(response.data.rating.rating);
                setComment(response.data.rating.user_comment || '');
            } else {
                // No rating yet, reset form
                setUserRating(null);
                setSelectedRating(0);
                setComment('');
            }
        } catch (error) {
            console.error('Error fetching user rating:', error);
            setUserRating(null);
            setSelectedRating(0);
            setComment('');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitRating = async (e) => {
        e.preventDefault();
        
        if (selectedRating === 0) {
            alert('Vui lòng chọn số sao đánh giá');
            return;
        }

        try {
            setSubmitting(true);
            const authConfig = await getAuthConfigFromHook(getToken);
            
            const response = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/api/rating/course/${courseId}`,
                {
                    rating: selectedRating,
                    comment: comment
                },
                authConfig
            );

            if (response.data.success) {
                // Refresh rating
                await fetchUserRating();
                
                // Close modal and reset editing state
                setEditingRating(false);
                
                alert('Đánh giá của bạn đã được gửi thành công!');
                
                // Close modal after successful submission
                setTimeout(() => {
                    onClose();
                }, 500);
            }
        } catch (error) {
            console.error('Error submitting rating:', error);
            alert('Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditRating = () => {
        setEditingRating(true);
    };

    const handleDeleteRating = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
            return;
        }

        try {
            const authConfig = await getAuthConfigFromHook(getToken);
            const response = await axios.delete(
                `${import.meta.env.VITE_BASE_URL}/api/rating/${userRating.rating_id}`,
                authConfig
            );

            if (response.data.success) {
                await fetchUserRating();
                setUserRating(null);
                setSelectedRating(0);
                setComment('');
                alert('Đã xóa đánh giá thành công!');
                
                // Close modal after deletion
                setTimeout(() => {
                    onClose();
                }, 500);
            }
        } catch (error) {
            console.error('Error deleting rating:', error);
            alert('Có lỗi xảy ra khi xóa đánh giá. Vui lòng thử lại.');
        }
    };

    const handleCancelEdit = () => {
        if (userRating) {
            // Reset to existing rating values
            setSelectedRating(userRating.rating);
            setComment(userRating.user_comment || '');
        }
        setEditingRating(false);
    };

    const renderStars = (rating, interactive = false) => {
        return (
            <div className={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`${styles.star} ${
                            star <= (interactive ? (hoverRating || selectedRating) : rating)
                                ? styles.starFilled
                                : styles.starEmpty
                        } ${interactive ? styles.starInteractive : ''}`}
                        onClick={interactive ? () => setSelectedRating(star) : undefined}
                        onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
                        onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
                    />
                ))}
            </div>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Không xác định';
        
        const date = new Date(dateString);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Không xác định';
        }
        
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!isOpen) {
        return null;
    }

    return (
        <>
            {/* Modal Overlay */}
            <div className={styles.modalOverlay} onClick={onClose}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                    {/* Close button */}
                    <button className={styles.closeButton} onClick={onClose}>
                        <X size={24} />
                    </button>

                    {loading ? (
                        <div className={styles.loading}>Đang tải đánh giá...</div>
                    ) : (
                        <div className={styles.ratingSection}>
                            <div className={styles.header}>
                                <h2 className={styles.title}>
                                    {userRating && !editingRating ? 'Đánh giá của bạn' : 'Đánh giá khóa học'}
                                </h2>
                            </div>

                            {isSignedIn ? (
                                <>
                                    {userRating && !editingRating ? (
                                        // Show existing rating with edit/delete buttons
                                        <div className={styles.userRatingCard}>
                                            <div className={styles.ratingDisplay}>
                                                {renderStars(userRating.rating)}
                                                {userRating.user_comment && (
                                                    <p className={styles.userComment}>{userRating.user_comment}</p>
                                                )}
                                                <span className={styles.ratingDate}>
                                                    Đánh giá vào {formatDate(userRating.createdAt || userRating.created_at)}
                                                </span>
                                            </div>
                                            <div className={styles.userRatingActions}>
                                                <button
                                                    className={styles.editButton}
                                                    onClick={handleEditRating}
                                                >
                                                    <Edit2 size={16} />
                                                    Chỉnh sửa
                                                </button>
                                                <button
                                                    className={styles.deleteButton}
                                                    onClick={handleDeleteRating}
                                                >
                                                    <Trash2 size={16} />
                                                    Xóa
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // Show rating form (for new rating or editing)
                                        <form className={styles.ratingForm} onSubmit={handleSubmitRating}>
                                            <div className={styles.formGroup}>
                                                <label>Đánh giá sao</label>
                                                {renderStars(selectedRating, true)}
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label>Nhận xét (tùy chọn)</label>
                                                <textarea
                                                    className={styles.commentInput}
                                                    value={comment}
                                                    onChange={(e) => setComment(e.target.value)}
                                                    placeholder="Chia sẻ trải nghiệm của bạn về khóa học..."
                                                    rows={4}
                                                />
                                            </div>

                                            <div className={styles.formActions}>
                                                {editingRating && (
                                                    <button
                                                        type="button"
                                                        className={styles.cancelButton}
                                                        onClick={handleCancelEdit}
                                                        disabled={submitting}
                                                    >
                                                        <X size={16} />
                                                        Hủy
                                                    </button>
                                                )}
                                                <button
                                                    type="submit"
                                                    className={styles.submitButton}
                                                    disabled={submitting || selectedRating === 0}
                                                >
                                                    <Check size={16} />
                                                    {submitting ? 'Đang gửi...' : (editingRating ? 'Cập nhật đánh giá' : 'Gửi đánh giá')}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </>
                            ) : (
                                <div className={styles.notSignedIn}>
                                    Vui lòng đăng nhập để đánh giá khóa học
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default RatingSection;
