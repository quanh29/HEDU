import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, Calendar, User, BookOpen, Loader } from 'lucide-react';
import axios from 'axios';
import styles from './CertificateView.module.css';
import useDocumentTitle from '../../hooks/useDocumentTitle';

function CertificateView() {
    const { certificateId } = useParams();
    const navigate = useNavigate();
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useDocumentTitle(certificate ? `Chứng chỉ - ${certificate.course.title}` : 'Chứng chỉ');

    useEffect(() => {
        const fetchCertificate = async () => {
            try {
                setLoading(true);
                const response = await axios.get(
                    `${import.meta.env.VITE_BASE_URL}/api/certificates/${certificateId}`
                );

                if (response.data.success) {
                    setCertificate(response.data.certificate);
                } else {
                    setError('Không thể tải chứng chỉ');
                }
            } catch (err) {
                console.error('Error fetching certificate:', err);
                setError(err.response?.data?.message || 'Không tìm thấy chứng chỉ');
            } finally {
                setLoading(false);
            }
        };

        if (certificateId) {
            fetchCertificate();
        }
    }, [certificateId]);

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('vi-VN', options);
    };

    const handleCourseLinkClick = () => {
        if (certificate && certificate.course) {
            navigate(`/course/${certificate.course.id}`);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingContainer}>
                    <Loader className={styles.spinner} size={48} />
                    <p>Đang tải chứng chỉ...</p>
                </div>
            </div>
        );
    }

    if (error || !certificate) {
        return (
            <div className={styles.container}>
                <div className={styles.errorContainer}>
                    <Award size={64} className={styles.errorIcon} />
                    <h2>Không tìm thấy chứng chỉ</h2>
                    <p>{error || 'Chứng chỉ không tồn tại hoặc đã bị xóa'}</p>
                    <button 
                        className={styles.homeButton}
                        onClick={() => navigate('/')}
                    >
                        Về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.certificateWrapper}>
                {/* Header with action buttons */}
                <div className={styles.headerActions}>
                    <button 
                        className={styles.printButton}
                        onClick={handlePrint}
                    >
                        In chứng chỉ
                    </button>
                </div>

                {/* Certificate Card */}
                <div className={styles.certificateCard}>
                    {/* Decorative Border */}
                    <div className={styles.decorativeBorder}>
                        <div className={styles.innerBorder}>
                            {/* Award Icon */}
                            <div className={styles.awardIcon}>
                                <Award size={64} />
                            </div>

                            {/* Certificate Title */}
                            <h1 className={styles.certificateTitle}>
                                CHỨNG CHỈ HOÀN THÀNH
                            </h1>
                            <div className={styles.divider}></div>

                            {/* Student Name */}
                            <div className={styles.studentSection}>
                                <p className={styles.certifiedText}>Chứng nhận rằng</p>
                                <h2 className={styles.studentName}>{certificate.student.name}</h2>
                            </div>

                            {/* Course Info */}
                            <div className={styles.courseSection}>
                                <p className={styles.completionText}>đã hoàn thành khóa học</p>
                                <h3 
                                    className={styles.courseName}
                                    onClick={handleCourseLinkClick}
                                >
                                    {certificate.course.title}
                                </h3>
                            </div>

                            {/* Course Thumbnail */}
                            {certificate.course.thumbnail && (
                                <div className={styles.thumbnailContainer}>
                                    <img 
                                        src={certificate.course.thumbnail} 
                                        alt={certificate.course.title}
                                        className={styles.courseThumbnail}
                                    />
                                </div>
                            )}

                            {/* Details */}
                            <div className={styles.detailsSection}>
                                <div className={styles.detailItem}>
                                    <Calendar size={20} />
                                    <div>
                                        <span className={styles.detailLabel}>Ngày hoàn thành:</span>
                                        <span className={styles.detailValue}>
                                            {formatDate(certificate.issuedAt)}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.detailItem}>
                                    <User size={20} />
                                    <div>
                                        <span className={styles.detailLabel}>Giảng viên:</span>
                                        <span className={styles.detailValue}>
                                            {certificate.instructor.name}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.detailItem}>
                                    <BookOpen size={20} />
                                    <div>
                                        <span className={styles.detailLabel}>Mã chứng chỉ:</span>
                                        <span className={styles.detailValue}>
                                            {certificate.certificateId}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Signature Section */}
                            <div className={styles.signatureSection}>
                                <div className={styles.signature}>
                                    {certificate.instructor.profileImage && (
                                        <img 
                                            src={certificate.instructor.profileImage} 
                                            alt={certificate.instructor.name}
                                            className={styles.instructorImage}
                                        />
                                    )}
                                    <div className={styles.signatureLine}></div>
                                    <p className={styles.signatureName}>{certificate.instructor.name}</p>
                                    <p className={styles.signatureTitle}>Giảng viên</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className={styles.footerInfo}>
                    <p>
                        Chứng chỉ này xác nhận rằng học viên đã hoàn thành tất cả các bài học 
                        và đáp ứng các yêu cầu của khóa học.
                    </p>
                    <p className={styles.verifyText}>
                        Để xác minh tính hợp lệ của chứng chỉ này, vui lòng truy cập: 
                        <br />
                        <span className={styles.verifyLink}>
                            {window.location.href}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default CertificateView;
