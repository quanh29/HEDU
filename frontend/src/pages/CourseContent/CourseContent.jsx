import React, { useState } from 'react';
import { FileText, Video, CheckSquare, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { useParams } from 'react-router-dom';
import styles from './CourseContent.module.css';

// Dữ liệu mẫu cho sections và lessons
const sampleSections = [
	{
		sectionId: 's1',
		title: 'Giới thiệu',
		courseTitle: 'Lập trình Web từ cơ bản đến nâng cao',
		lessons: [
			{ lessonId: 'l1', title: 'Chào mừng', type: 'video', duration: '5:00', completed: true },
			{ lessonId: 'l2', title: 'Tổng quan khóa học', type: 'document', fileType: 'pdf', fileSize: '1MB', fileName: 'overview.pdf', completed: false },
		]
	},
	{
		sectionId: 's2',
		title: 'Cơ bản',
		courseTitle: 'Lập trình Web từ cơ bản đến nâng cao',
		lessons: [
			{ lessonId: 'l3', title: 'Bài học 1', type: 'video', duration: '12:30', completed: false },
			{ lessonId: 'l4', title: 'Quiz kiểm tra', type: 'quiz', questionCount: 10, completed: false },
		]
	}
];

function CourseContent() {
	const { courseId, courseTitle } = useParams();
	const [expandedSections, setExpandedSections] = useState(() => {
		// Mở rộng tất cả section mặc định
		const initial = {};
		sampleSections.forEach(section => { initial[section.sectionId] = true; });
		return initial;
	});

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

	return (
		<div className={styles.courseContainer}>
			<h1 className={styles.courseTitle}>Nội dung khóa học: {courseTitle || 'Tên khóa học'} (ID: {courseId})</h1>
			<div className={styles.sectionsContainer}>
				{sampleSections.map((section, idx) => (
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