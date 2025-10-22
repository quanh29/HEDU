import React, { useState, useEffect } from 'react';
import { FileText, Video, CheckSquare, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { useParams } from 'react-router-dom';
import styles from './CourseContent.module.css';
import axios from 'axios';

function CourseContent() {
	const { courseId } = useParams();
	const [course, setCourse] = useState(null);
	const [sections, setSections] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [expandedSections, setExpandedSections] = useState({});

	// Fetch dữ liệu khóa học
	useEffect(() => {
		const fetchCourseContent = async () => {
			try {
				setLoading(true);
				// const response = await fetch(`http://localhost:3000/api/course/${courseId}/content`);
				// use env variable for base URL
				const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/course/${courseId}/content`);
				
				if (response.status !== 200) {
					throw new Error('Failed to fetch course content');
				}

				const data = response.data;
				setCourse(data.course);
				setSections(data.sections);
				
				// Mở rộng tất cả section mặc định
				const initial = {};
				data.sections.forEach(section => { 
					initial[section.sectionId] = true; 
				});
				setExpandedSections(initial);
				
				setLoading(false);
			} catch (err) {
				console.error('Error fetching course content:', err);
				setError(err.message);
				setLoading(false);
			}
		};

		if (courseId) {
			fetchCourseContent();
		}
	}, [courseId]);

	const toggleSection = (sectionId) => {
		setExpandedSections(prev => ({
			...prev,
			[sectionId]: !prev[sectionId]
		}));
	};

	// Hiển thị biểu tượng bài học dựa trên loại
	const renderLessonIcon = (type) => {
		switch (type) {
			case 'video':
				return <Video className={styles.videoIcon} />;
			case 'document':
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
				return <span className={styles.lessonMeta}>{lesson.duration}</span>;
			case 'document':
				return (
					<div className={styles.documentMeta}>
						<span className={styles.fileInfo}>{lesson.fileType?.toUpperCase()} · {lesson.fileSize}</span>
						<Download className={styles.downloadIcon} />
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
				<div className={styles.error}>Lỗi: {error}</div>
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
								{section.lessons.map((lesson, lidx) => (
									<li 
										key={lesson.lessonId || section.sectionId}
										className={styles.lessonItem}
									>
										<div className={styles.lessonContent}>
											<div className={styles.iconContainer}>
												{renderLessonIcon(lesson.type)}
											</div>
											<div className={styles.lessonDetails}>
												<div className={styles.titleRow}>
													<h3 className={`${styles.lessonTitle} ${lesson.completed ? styles.lessonTitleCompleted : ''}`}>
														{lesson.title || `Bài học ${lidx + 1}`}
													</h3>
													{lesson.completed && (
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
								))}
							</ul>
						)}
					</div>
				))}
			</div>
		</div>
	);
}

export default CourseContent;