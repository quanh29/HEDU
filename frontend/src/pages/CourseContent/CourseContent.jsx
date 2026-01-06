import React, { useState, useEffect } from 'react';
import { FileText, Video, CheckSquare, ChevronDown, ChevronRight, Download, Star, Award } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import styles from './CourseContent.module.css';
import axios from 'axios';
import { getAuthConfigFromHook } from '../../utils/clerkAuth';
import RatingSection from '../../components/RatingSection/RatingSection';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

function CourseContent() {
	const { courseId } = useParams();
	const navigate = useNavigate();
	const { getToken, isLoaded, isSignedIn } = useAuth();
	const [course, setCourse] = useState(null);
	
	// Dynamic title based on course name
	useDocumentTitle(course?.title || 'Nội dung khóa học');

	const [sections, setSections] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [expandedSections, setExpandedSections] = useState({});
	const [downloading, setDownloading] = useState({});
	const [completedLessons, setCompletedLessons] = useState([]);
	const [updatingProgress, setUpdatingProgress] = useState(false);
	const [showRatingModal, setShowRatingModal] = useState(false);
	const [certificateData, setCertificateData] = useState(null);
	const [creatingCertificate, setCreatingCertificate] = useState(false);

	// Helper function để format duration từ giây thành MM:SS
	const formatDuration = (seconds) => {
		if (!seconds || seconds === 0) return '00:00';
		
		// Làm tròn thành giá trị nguyên
		const totalSeconds = Math.round(seconds);
		const minutes = Math.floor(totalSeconds / 60);
		const remainingSeconds = totalSeconds % 60;
		
		return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
	};

	// Fetch enrollment progress
	const fetchEnrollmentProgress = async () => {
		try {
			const authConfig = await getAuthConfigFromHook(getToken);
			const response = await axios.get(
				`${import.meta.env.VITE_BASE_URL}/api/enrollment/check/${courseId}`,
				authConfig
			);
			
			if (response.data.success && response.data.data) {
				setCompletedLessons(response.data.data.completedLessons || []);
			}
		} catch (error) {
			console.error('Error fetching enrollment progress:', error);
		}
	};

	// Check if user has certificate
	const checkCertificate = async () => {
		try {
			const authConfig = await getAuthConfigFromHook(getToken);
			const response = await axios.get(
				`${import.meta.env.VITE_BASE_URL}/api/certificates/check/${courseId}`,
				authConfig
			);
			
			if (response.data.success && response.data.hasCertificate) {
				setCertificateData(response.data.certificate);
			}
		} catch (error) {
			console.error('Error checking certificate:', error);
		}
	};

	// Create certificate
	const handleCreateCertificate = async () => {
		try {
			setCreatingCertificate(true);
			const authConfig = await getAuthConfigFromHook(getToken);
			
			const response = await axios.post(
				`${import.meta.env.VITE_BASE_URL}/api/certificates/create`,
				{ courseId },
				authConfig
			);
			
			if (response.data.success) {
				toast.success('Chứng chỉ đã được tạo thành công!');
				setCertificateData(response.data.certificate);
			}
		} catch (error) {
			console.error('Error creating certificate:', error);
			const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi tạo chứng chỉ';
			toast.error(errorMessage);
		} finally {
			setCreatingCertificate(false);
		}
	};

	// View certificate in new tab
	const handleViewCertificate = () => {
		if (certificateData && certificateData.certificateId) {
			window.open(`/certificate/${certificateData.certificateId}`, '_blank');
		}
	};

	// Toggle lesson complete status
	const toggleLessonComplete = async (e, lessonId) => {
		e.stopPropagation(); // Prevent lesson click event
		
		if (updatingProgress) return;
		
		try {
			setUpdatingProgress(true);
			const authConfig = await getAuthConfigFromHook(getToken);
			
			// Check current status
			const wasCompleted = completedLessons.includes(lessonId);
			
			// Optimistically update UI
			if (wasCompleted) {
				// Remove from completed
				setCompletedLessons(prev => prev.filter(id => id !== lessonId));
			} else {
				// Add to completed
				setCompletedLessons(prev => [...prev, lessonId]);
			}
			
			// Call API to update
			await axios.put(
				`${import.meta.env.VITE_BASE_URL}/api/enrollment/${courseId}/complete-lesson`,
				{ 
					lessonId,
					action: wasCompleted ? 'uncomplete' : 'complete'
				},
				authConfig
			);
		} catch (error) {
			console.error('Error updating lesson progress:', error);
			// Revert on error
			await fetchEnrollmentProgress();
		} finally {
			setUpdatingProgress(false);
		}
	};

	// Calculate progress percentage
	const calculateProgress = () => {
		// Lấy tất cả lesson IDs có trong khóa học
		const allLessonIds = sections.flatMap(section => 
			section.lessons.map(lesson => lesson.lessonId)
		);
		
		const totalLessons = allLessonIds.length;
		if (totalLessons === 0) return 0;
		
		// Chỉ đếm những completed lessons thực sự tồn tại trong khóa học
		const validCompletedCount = completedLessons.filter(
			lessonId => allLessonIds.includes(lessonId)
		).length;
		
		return Math.round((validCompletedCount / totalLessons) * 100);
	};

	// Helper function to get valid completed lessons count
	const getValidCompletedCount = () => {
		const allLessonIds = sections.flatMap(section => 
			section.lessons.map(lesson => lesson.lessonId)
		);
		
		return completedLessons.filter(
			lessonId => allLessonIds.includes(lessonId)
		).length;
	};

	// Fetch dữ liệu khóa học
	useEffect(() => {
		const fetchCourseContent = async () => {
			// Wait for Clerk to be loaded
			if (!isLoaded) {
				return;
			}

			// Check if user is signed in
			if (!isSignedIn) {
				setError('Vui lòng đăng nhập để truy cập nội dung khóa học');
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				setError(null);
				
				// Lấy auth config từ Clerk hook
				const authConfig = await getAuthConfigFromHook(getToken);
				
				// Gọi API với authentication header
				const response = await axios.get(
					`${import.meta.env.VITE_BASE_URL}/api/course/${courseId}/content`,
					authConfig
				);
				
				if (response.status !== 200) {
					throw new Error('Failed to fetch course content');
				}

				const data = response.data;
				console.log('📚 Course data:', data.course);
				console.log('🎓 Has certificate:', data.course?.hasCertificate);
				console.log('📋 Full response:', data);
				setCourse(data.course);
				setSections(data.sections);
				
				// Fetch enrollment để lấy completed lessons
				await fetchEnrollmentProgress();
				
				// Check certificate status
				await checkCertificate();
				
				// Mở rộng tất cả section mặc định
				const initial = {};
				data.sections.forEach(section => { 
					initial[section.sectionId] = true; 
				});
				setExpandedSections(initial);
				
				setLoading(false);
			} catch (err) {
				console.error('Error fetching course content:', err);
				
				// Xử lý các loại lỗi khác nhau
				if (err.response?.status === 401) {
					setError('Vui lòng đăng nhập để truy cập nội dung khóa học');
				} else if (err.response?.status === 403) {
					setError('Bạn chưa đăng ký khóa học này. Vui lòng đăng ký để truy cập nội dung.');
				} else {
					setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải nội dung khóa học');
				}
				
				setLoading(false);
			}
		};

		if (courseId) {
			fetchCourseContent();
		}
	}, [courseId, isLoaded, isSignedIn, getToken]);

	const toggleSection = (sectionId) => {
		setExpandedSections(prev => ({
			...prev,
			[sectionId]: !prev[sectionId]
		}));
	};

	// Handle click vào lesson để navigate
	const handleLessonClick = (lesson) => {
		console.log('Lesson clicked:', lesson); // Debug log
		
		if (lesson.type === 'video' && lesson.videoId) {
			// Navigate sang VideoSection với videoId
			console.log('Navigating to video:', lesson.videoId); // Debug log
			navigate(`/course/${courseId}/content/video?videoId=${lesson.videoId}`);
		} else if (lesson.type === 'video') {
			console.warn('Video lesson missing videoId:', lesson);
		} else if (lesson.type === 'quiz' && lesson.quizId) {
			// Navigate đến quiz với courseId
			console.log('Navigating to quiz:', lesson.quizId);
			navigate(`/course/${courseId}/content/quiz?quizId=${lesson.quizId}&view=intro`);
		} else if (lesson.type === 'material') {
			// Download material (use materialId from lesson)
			handleDocumentDownload(lesson);
		}
	};

	// Handle download document
	const handleDocumentDownload = async (lesson) => {
		try {
			console.log('Starting document download:', lesson);
			console.log('Material ID:', lesson.materialId);
			
			// Validate materialId exists
			if (!lesson.materialId) {
				console.error('Material ID is missing:', lesson);
				alert('Không tìm thấy ID tài liệu. Vui lòng thử lại sau.');
				return;
			}
			
			// Set downloading state
			setDownloading(prev => ({ ...prev, [lesson.lessonId]: true }));

			// Lấy auth config từ Clerk hook
			const authConfig = await getAuthConfigFromHook(getToken);

			// Get signed URL from backend using materialId
			const response = await axios.post(
				`${import.meta.env.VITE_BASE_URL}/api/material/${lesson.materialId}/signed-url?courseId=${courseId}`,
				{ expiresIn: 3600 }, // URL expires in 1 hour
				{
					headers: {
						'Content-Type': 'application/json',
						...authConfig.headers
					}
				}
			);

			console.log('Response from server:', response.data);

			if (response.data.success) {
				const { signedUrl, filename } = response.data;
				
				// Create temporary link and trigger download
				const link = document.createElement('a');
				link.href = signedUrl;
				link.download = filename || 'document';
				link.target = '_blank';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);

				console.log('Download started successfully');
			} else {
				throw new Error('Failed to get signed URL');
			}
		} catch (error) {
			console.error('Error downloading document:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			
			let errorMessage = 'Không thể tải tài liệu. Vui lòng thử lại sau.';
			
			if (error.response?.status === 401) {
				errorMessage = 'Vui lòng đăng nhập để tải tài liệu';
			} else if (error.response?.status === 403) {
				errorMessage = 'Bạn không có quyền tải tài liệu này';
			} else if (error.response?.data?.message) {
				errorMessage = error.response.data.message;
			}
			
			alert(errorMessage);
		} finally {
			// Clear downloading state
			setDownloading(prev => ({ ...prev, [lesson.lessonId]: false }));
		}
	};

	// Hiển thị biểu tượng bài học dựa trên loại
	const renderLessonIcon = (type) => {
		switch (type) {
			case 'video':
				return <Video className={styles.videoIcon} />;
			case 'material':
				return <FileText className={styles.documentIcon} />;
			case 'quiz':
				return <CheckSquare className={styles.quizIcon} />;
			default:
				return null;
		}
	};

	// Hiển thị metadata của bài học dựa trên loại
	const renderLessonMeta = (lesson) => {
		switch (lesson.type) {
			case 'video':
				return <span className={styles.lessonMeta}>{formatDuration(lesson.duration)}</span>;
			case 'material':
				return (
					<div className={styles.documentMeta}>
						<span className={styles.fileInfo}>{lesson.fileType?.toUpperCase()} · {lesson.fileSize}</span>
						{downloading[lesson.lessonId] ? (
							<span className={styles.downloadingText}>Đang tải...</span>
						) : (
							<Download className={styles.downloadIcon} />
						)}
					</div>
				);
			case 'quiz':
				return <span className={styles.lessonMeta}>{lesson.questionCount} câu hỏi</span>;
			default:
				return null;
		}
	};

	// Loading state
	if (loading) {
		return (
			<div className={styles.courseContainer}>
				<div className={styles.loading}>Đang tải nội dung khóa học...</div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className={styles.courseContainer}>
				<div className={styles.error}>
					<h2 style={{ marginBottom: '1rem', color: '#e74c3c' }}>Không thể truy cập khóa học</h2>
					<p style={{ marginBottom: '1.5rem' }}>{error}</p>
					{error.includes('đăng nhập') && (
						<button 
							onClick={() => navigate('/auth/sign-in')}
							style={{
								padding: '0.75rem 1.5rem',
								background: '#333',
								color: 'white',
								border: 'none',
								borderRadius: '8px',
								cursor: 'pointer',
								fontSize: '1rem'
							}}
						>
							Đăng nhập
						</button>
					)}
					{error.includes('đăng ký khóa học') && (
						<button 
							onClick={() => navigate(`/course/${courseId}`)}
							style={{
								padding: '0.75rem 1.5rem',
								background: '#333',
								color: 'white',
								border: 'none',
								borderRadius: '8px',
								cursor: 'pointer',
								fontSize: '1rem',
								marginRight: '1rem'
							}}
						>
							Xem thông tin khóa học
						</button>
					)}
					<button 
						onClick={() => navigate('/')}
						style={{
							padding: '0.75rem 1.5rem',
							background: 'transparent',
							color: '#333',
							border: '2px solid #333',
							borderRadius: '8px',
							cursor: 'pointer',
							fontSize: '1rem'
						}}
					>
						Về trang chủ
					</button>
				</div>
			</div>
		);
	}

	// No data
	if (!course || !sections) {
		return (
			<div className={styles.courseContainer}>
				<div className={styles.noData}>Không tìm thấy nội dung khóa học</div>
			</div>
		);
	}

	return (
		<div className={styles.courseContainer}>
			<h1 className={styles.courseTitle}>
				Nội dung khóa học: {course.title || 'Tên khóa học'}
			</h1>
			
			{/* Action buttons */}
			<div className={styles.actionButtons}>
				{/* Rating Button */}
				<button 
					className={styles.ratingButton}
					onClick={() => setShowRatingModal(true)}
				>
					<Star size={20} />
					Đánh giá khóa học
				</button>

				{/* Certificate Button - Only show if course has certificate */}
				{course.hasCertificate && (
					<>					{console.log('✅ Rendering certificate button - hasCertificate:', course.hasCertificate, 'certificateData:', certificateData)}						{certificateData ? (
							// If certificate exists, show "View Certificate" button
							<button 
								className={styles.certificateButton}
								onClick={handleViewCertificate}
							>
								<Award size={20} />
								Xem chứng chỉ
							</button>
						) : (
							// If no certificate, show "Get Certificate" button
							<button 
								className={`${styles.certificateButton} ${calculateProgress() < 100 ? styles.disabled : ''}`}
								onClick={handleCreateCertificate}
								disabled={calculateProgress() < 100 || creatingCertificate}
								title={calculateProgress() < 100 ? 'Hoàn thành 100% khóa học để nhận chứng chỉ' : 'Nhận chứng chỉ'}
							>
								<Award size={20} />
								{creatingCertificate ? 'Đang tạo...' : 'Nhận chứng chỉ'}
							</button>
						)}
					</>
				)}
			</div>

			{/* Certificate note - Show only if course has certificate and not completed */}
			{course.hasCertificate && !certificateData && calculateProgress() < 100 && (
				<div className={styles.certificateNote}>
					<Award size={16} />
					<span>Hoàn thành 100% bài học để nhận chứng chỉ</span>
				</div>
			)}

			{/* Progress Bar */}
			<div className={styles.progressSection}>
				<div className={styles.progressHeader}>
					<span className={styles.progressLabel}>Tiến độ học tập</span>
					<span className={styles.progressPercentage}>{calculateProgress()}%</span>
				</div>
				<div className={styles.progressBarContainer}>
					<div 
						className={styles.progressBarFill} 
						style={{ width: `${calculateProgress()}%` }}
					></div>
				</div>
				<div className={styles.progressStats}>
					<span>{getValidCompletedCount()} / {sections.reduce((sum, s) => sum + s.lessons.length, 0)} bài học đã hoàn thành</span>
				</div>
			</div>

			<div className={styles.sectionsContainer}>
				{sections.map((section, idx) => (
					<div key={section.sectionId} className={styles.section}>
						<div 
							className={styles.sectionHeader}
							onClick={() => toggleSection(section.sectionId)}
						>
							<h2 className={styles.sectionTitle}>
								{expandedSections[section.sectionId] ? 
									<ChevronDown className={styles.chevronIcon} /> : 
									<ChevronRight className={styles.chevronIcon} />
								}
								Chương {idx + 1}: {section.title}
							</h2>
							<span className={styles.lessonCount}>
								{section.lessons.length} bài học
							</span>
						</div>
						{expandedSections[section.sectionId] && (
							<ul className={styles.lessonsList}>
								{section.lessons.map((lesson, lidx) => {
									const isCompleted = completedLessons.includes(lesson.lessonId);
									return (
										<li 
											key={lesson.lessonId || `${section.sectionId}-${lidx}`}
											className={`${styles.lessonItem} ${
												(lesson.type === 'video' || lesson.type === 'material' || lesson.type === 'quiz') 
												? styles.clickable 
												: ''
											} ${downloading[lesson.lessonId] ? styles.downloading : ''}`}
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												console.log('Li clicked for lesson:', lesson.title); // Debug
												handleLessonClick(lesson);
											}}
										>
											<div className={styles.lessonContent}>
												{/* Checkbox */}
												<div className={styles.checkboxContainer}>
													<input
														type="checkbox"
														className={styles.lessonCheckbox}
														checked={isCompleted}
														onChange={(e) => toggleLessonComplete(e, lesson.lessonId)}
														onClick={(e) => e.stopPropagation()}
													/>
												</div>
												
												<div className={styles.iconContainer}>
													{renderLessonIcon(lesson.type)}
												</div>
												<div className={styles.lessonDetails}>
													<div className={styles.titleRow}>
														<h3 className={`${styles.lessonTitle} ${isCompleted ? styles.lessonTitleCompleted : ''}`}>
															{lesson.title || `Bài học ${lidx + 1}`}
														</h3>
														{isCompleted && (
															<span className={styles.completedBadge}>
																Đã hoàn thành
															</span>
														)}
													</div>
													<div className={styles.metaContainer}>
														{renderLessonMeta(lesson)}
													</div>
												</div>
											</div>
										</li>
									);
								})}
							</ul>
						)}
					</div>
				))}
			</div>

			{/* Rating Modal */}
			<RatingSection 
				courseId={courseId} 
				isOpen={showRatingModal}
				onClose={() => setShowRatingModal(false)}
			/>
		</div>
	);
}

export default CourseContent;