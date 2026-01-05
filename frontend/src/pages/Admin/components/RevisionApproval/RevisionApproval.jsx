import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import styles from './RevisionApproval.module.css';
import MuxVideoPlayer from '../../../../components/MuxVideoPlayer/MuxVideoPlayer';
import MuxDraftVideoPlayer from '../../../../components/MuxVideoPlayer/MuxDraftVideoPlayer';
import DraftIndicator from '../../../../components/DraftIndicator/DraftIndicator';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  AlertCircle,
  BookOpen,
  User,
  Calendar,
  Edit3,
  FileText,
  Video,
  File,
  HelpCircle,
  Paperclip,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Edit,
  Info
} from 'lucide-react';

const RevisionApproval = () => {
  const { getToken } = useAuth();
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [originalCourse, setOriginalCourse] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [viewMode, setViewMode] = useState('changes'); // 'changes' or 'full'

  useEffect(() => {
    fetchPendingRevisions();
  }, []);

  const fetchPendingRevisions = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/course-draft/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('📥 Fetched pending revisions:', response.data);

      if (response.data.success) {
        const drafts = response.data.data || [];
        console.log('✅ Processed drafts:', drafts.map(d => ({
          id: d._id,
          title: d.title,
          sectionsCount: d.draftSections?.length,
          lessonsCount: d.draftLessons?.length
        })));
        setRevisions(drafts);
      } else {
        setError('Không thể tải danh sách cập nhật');
      }
    } catch (err) {
      console.error('Error fetching pending drafts:', err);
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách cập nhật');
    } finally {
      setLoading(false);
    }
  };

  const fetchOriginalCourse = async (courseId) => {
    try {
      const token = await getToken();
      // Use /full endpoint to get complete course data with sections and lessons
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/admin/courses/${courseId}/full`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('✅ Original course data:', response.data);
      
      if (response.data && response.data.course) {
        setOriginalCourse(response.data.course);
      } else if (response.data) {
        setOriginalCourse(response.data);
      }
    } catch (err) {
      console.error('Error fetching original course:', err);
    }
  };

  const handleApprove = async (draftId) => {
    if (!window.confirm('Bạn có chắc chắn muốn phê duyệt cập nhật này?\n\nSau khi duyệt, nội dung từ bản nháp sẽ được cập nhật lên khóa học chính thức.')) {
      return;
    }

    try {
      setActionLoading(true);
      const token = await getToken();
      
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/course-draft/${draftId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert('Đã phê duyệt và xuất bản cập nhật thành công! Nội dung từ bản nháp đã được cập nhật lên khóa học chính thức.');
      setShowModal(false);
      setSelectedRevision(null);
      setOriginalCourse(null);
      fetchPendingRevisions();
    } catch (err) {
      console.error('Error approving draft:', err);
      alert('Có lỗi xảy ra khi phê duyệt: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (draftId) => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn từ chối cập nhật này?')) {
      return;
    }

    try {
      setActionLoading(true);
      const token = await getToken();
      
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/course-draft/${draftId}/reject`,
        { 
          reason: rejectReason,
          status: 'draft'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert('Đã từ chối cập nhật!');
      setShowModal(false);
      setSelectedRevision(null);
      setOriginalCourse(null);
      setRejectReason('');
      fetchPendingRevisions();
    } catch (err) {
      console.error('Error rejecting draft:', err);
      alert('Có lỗi xảy ra khi từ chối: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetail = async (draft) => {
    console.log('🔍 View detail for draft:', {
      draftId: draft._id,
      title: draft.title,
      sectionsCount: draft.draftSections?.length,
      lessonsCount: draft.draftLessons?.length,
      sections: draft.draftSections
    });
    setSelectedRevision(draft);
    setShowModal(true);
    await fetchOriginalCourse(draft._id);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRevision(null);
    setOriginalCourse(null);
    setRejectReason('');
    setExpandedSections({});
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const getContentTypeIcon = (contentType) => {
    switch (contentType) {
      case 'video':
        return <Video size={16} />;
      case 'material':
        return <FileText size={16} />;
      case 'quiz':
        return <HelpCircle size={16} />;
      default:
        return <BookOpen size={16} />;
    }
  };

  const getContentTypeLabel = (contentType) => {
    switch (contentType) {
      case 'video':
        return 'Video';
      case 'material':
        return 'Tài liệu';
      case 'quiz':
        return 'Quiz';
      default:
        return 'Nội dung';
    }
  };

  const handleViewLesson = (lesson, isDraft = true, changeType = null, originalLesson = null) => {
    console.log('🔍 Opening lesson modal:', {
      lessonId: lesson._id,
      title: lesson.title,
      contentType: lesson.contentType,
      changeType: changeType,
      videoId: lesson.videoId,
      draftVideoId: lesson.draftVideoId,
      materialId: lesson.materialId,
      draftMaterialId: lesson.draftMaterialId,
      fileName: lesson.fileName,
      contentUrl: lesson.contentUrl,
      quizId: lesson.quizId,
      questions: lesson.questions?.length,
      originalLesson: originalLesson,
      fullLesson: lesson
    });
    
    // If deleted, use original lesson content instead
    const lessonToShow = (changeType === 'deleted' && originalLesson) ? originalLesson : lesson;
    
    setSelectedLesson({ 
      ...lessonToShow, 
      isDraft: changeType !== 'deleted', // Don't treat deleted items as drafts
      changeType: changeType,
      originalLesson: originalLesson
    });
    setShowLessonModal(true);
  };

  const closeLessonModal = () => {
    setShowLessonModal(false);
    setSelectedLesson(null);
  };

  const handleDownloadMaterial = async (materialId, fileName) => {
    try {
      console.log('🔽 [Download Material] Starting download...');
      console.log('   Material ID:', materialId);
      console.log('   File Name:', fileName);
      
      const token = await getToken();
      console.log('   Token obtained:', !!token);
      
      const url = `${import.meta.env.VITE_BASE_URL}/api/admin/materials/${materialId}/signed-url`;
      console.log('   Request URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expiresIn: 3600 })
      });

      console.log('   Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('   Error response:', errorData);
        throw new Error('Failed to generate download URL');
      }

      const data = await response.json();
      console.log('   Signed URL received:', !!data.signedUrl);
      
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
      console.log('✅ Material download initiated');
    } catch (error) {
      console.error('❌ Error downloading material:', error);
      alert('Không thể tải tài liệu. Vui lòng thử lại.');
    }
  };

  const getChangeType = (item) => {
    if (item.changeType) return item.changeType;
    if (item.isNew) return 'new';
    if (item.isModified) return 'modified';
    if (item.isDeleted) return 'deleted';
    return null;
  };

  const getChangeBadge = (changeType) => {
    switch (changeType) {
      case 'new':
        return <span className={`${styles.changeBadge} ${styles.new}`}><Plus size={12} /> Mới</span>;
      case 'modified':
        return <span className={`${styles.changeBadge} ${styles.modified}`}><Edit size={12} /> Sửa</span>;
      case 'deleted':
        return <span className={`${styles.changeBadge} ${styles.deleted}`}><Trash2 size={12} /> Xóa</span>;
      default:
        return null;
    }
  };

  const renderCourseContent = () => {
    if (!selectedRevision) return null;

    const draftSections = selectedRevision.draftSections || [];
    const originalSections = originalCourse?.sections || [];

    console.log('📊 Rendering course content:', {
      draftSectionsCount: draftSections.length,
      originalSectionsCount: originalSections.length,
      draftSections: draftSections.map(s => ({ 
        id: s._id, 
        title: s.title, 
        lessonsCount: s.lessons?.length,
        changeType: s.changeType,
        publishedSectionId: s.publishedSectionId
      })),
      originalSections: originalSections.map(s => ({ 
        id: s._id, 
        title: s.title, 
        lessonsCount: s.lessons?.length 
      }))
    });

    // Build sections comparison - group by publishedSectionId or _id
    const sectionComparisons = [];
    const processedOriginalIds = new Set();

    // Process draft sections
    draftSections.forEach(draftSection => {
      const originalId = draftSection.publishedSectionId;
      const originalSection = originalId ? originalSections.find(s => s._id === originalId.toString()) : null;
      
      if (originalId) {
        processedOriginalIds.add(originalId.toString());
      }

      sectionComparisons.push({
        draftSection,
        originalSection,
        changeType: draftSection.changeType || (originalSection ? 'modified' : 'new'),
        sectionId: originalId || draftSection._id
      });
    });

    // Add deleted sections (in original but not in draft)
    originalSections.forEach(originalSection => {
      if (!processedOriginalIds.has(originalSection._id.toString())) {
        sectionComparisons.push({
          draftSection: null,
          originalSection,
          changeType: 'deleted',
          sectionId: originalSection._id
        });
      }
    });

    // Filter based on view mode
    const filteredComparisons = viewMode === 'changes' 
      ? sectionComparisons.filter(comp => comp.changeType !== 'unchanged')
      : sectionComparisons;

    console.log('📊 Section comparisons:', {
      total: sectionComparisons.length,
      filtered: filteredComparisons.length,
      viewMode,
      comparisons: filteredComparisons.map(c => ({
        changeType: c.changeType,
        draftTitle: c.draftSection?.title,
        originalTitle: c.originalSection?.title
      }))
    });

    if (sectionComparisons.length === 0) {
      return (
        <div className={styles.courseContent}>
          <div className={styles.contentHeader}>
            <h5>Nội dung khóa học</h5>
          </div>
          <div className={styles.noContent}>
            <p>Khóa học chưa có nội dung</p>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.courseContent}>
        <div className={styles.contentHeader}>
          <h5>Nội dung khóa học</h5>
          <div className={styles.viewToggle}>
            <button 
              className={`${styles.toggleBtn} ${viewMode === 'changes' ? styles.active : ''}`}
              onClick={() => setViewMode('changes')}
            >
              <Edit3 size={16} /> Chỉ thay đổi
            </button>
            <button 
              className={`${styles.toggleBtn} ${viewMode === 'full' ? styles.active : ''}`}
              onClick={() => setViewMode('full')}
            >
              <BookOpen size={16} /> Toàn bộ
            </button>
          </div>
        </div>

        <div className={styles.contentStats}>
          <span><BookOpen size={16} /> {draftSections.length} chương</span>
          <span><Video size={16} /> {(selectedRevision.draftVideos || []).length} videos</span>
          <span><FileText size={16} /> {(selectedRevision.draftMaterials || []).length} tài liệu</span>
          <span><HelpCircle size={16} /> {(selectedRevision.draftQuizzes || []).length} quiz</span>
        </div>

        <div className={styles.sectionsList}>
          {filteredComparisons.map((comparison, index) => {
            const { draftSection, originalSection, changeType, sectionId } = comparison;
            const section = draftSection || originalSection;
            const isExpanded = expandedSections[sectionId];
            
            // Get lessons for comparison
            const draftLessons = draftSection?.lessons || [];
            const originalLessons = originalSection?.lessons || [];

            return (
              <div 
                key={sectionId} 
                className={`${styles.sectionItem} ${styles[changeType]}`}
              >
                <div 
                  className={styles.sectionHeader}
                  onClick={() => toggleSection(sectionId)}
                >
                  <div className={styles.sectionInfo}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    <div>
                      <h6>
                        Chương {section.order || index + 1}: {section.title}
                        {getChangeBadge(changeType)}
                      </h6>
                      {changeType !== 'new' && changeType !== 'deleted' && originalSection && draftSection && 
                       originalSection.title !== draftSection.title && (
                        <span className={styles.originalValue}>
                          <Info size={12} /> Gốc: {originalSection.title}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={styles.lessonCount}>
                    {draftLessons.length || originalLessons.length} bài học
                  </span>
                </div>

                {isExpanded && (
                  <div className={styles.lessonsList}>
                    {changeType === 'deleted' ? (
                      // Show original lessons for deleted sections
                      originalLessons.map((lesson, lessonIndex) => (
                        <div 
                          key={lesson._id} 
                          className={`${styles.lessonItem} ${styles.deleted}`}
                        >
                          <div className={styles.lessonInfo}>
                            <span className={styles.lessonIcon}>
                              {getContentTypeIcon(lesson.contentType)}
                            </span>
                            <div className={styles.lessonDetails}>
                              <span className={styles.lessonTitle}>
                                {lesson.order || lessonIndex + 1}. {lesson.title}
                                {getChangeBadge('deleted')}
                              </span>
                              <span className={styles.lessonType}>
                                {getContentTypeLabel(lesson.contentType)}
                              </span>
                            </div>
                            <button 
                              className={styles.viewLessonBtn}
                              onClick={() => handleViewLesson(lesson, false, 'deleted', lesson)}
                              title="Xem nội dung"
                            >
                              <Eye size={16} /> Xem
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      // Show draft lessons with comparison
                      renderLessonsComparison(draftLessons, originalLessons)
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLessonsComparison = (draftLessons, originalLessons) => {
    // Build lesson comparisons
    const lessonComparisons = [];
    const processedOriginalIds = new Set();

    draftLessons.forEach(draftLesson => {
      const originalId = draftLesson.publishedLessonId;
      const originalLesson = originalId ? originalLessons.find(l => l._id === originalId.toString()) : null;
      
      if (originalId) {
        processedOriginalIds.add(originalId.toString());
      }

      lessonComparisons.push({
        draftLesson,
        originalLesson,
        changeType: draftLesson.changeType || (originalLesson ? 'modified' : 'new')
      });
    });

    // Add deleted lessons
    originalLessons.forEach(originalLesson => {
      if (!processedOriginalIds.has(originalLesson._id.toString())) {
        lessonComparisons.push({
          draftLesson: null,
          originalLesson,
          changeType: 'deleted'
        });
      }
    });

    return lessonComparisons.map((comparison, lessonIndex) => {
      const { draftLesson, originalLesson, changeType } = comparison;
      const lesson = draftLesson || originalLesson;
      
      return (
        <div 
          key={lesson._id} 
          className={`${styles.lessonItem} ${styles[changeType]}`}
        >
          <div className={styles.lessonInfo}>
            <span className={styles.lessonIcon}>
              {getContentTypeIcon(lesson.contentType)}
            </span>
            <div className={styles.lessonDetails}>
              <span className={styles.lessonTitle}>
                {lesson.order || lessonIndex + 1}. {lesson.title}
                {getChangeBadge(changeType)}
              </span>
              {changeType === 'modified' && originalLesson && draftLesson && 
               originalLesson.title !== draftLesson.title && (
                <span className={styles.originalValue}>
                  <Info size={12} /> Gốc: {originalLesson.title}
                </span>
              )}
              <span className={styles.lessonType}>
                {getContentTypeLabel(lesson.contentType)}
              </span>
            </div>
            <button 
              className={styles.viewLessonBtn}
              onClick={() => handleViewLesson(
                draftLesson || originalLesson, 
                changeType !== 'deleted',
                changeType,
                originalLesson
              )}
              title="Xem nội dung"
            >
              <Eye size={16} /> Xem
            </button>
          </div>

          {lesson.contentType === 'video' && (
            <div className={styles.lessonMeta}>
              {lesson.duration && <span><Clock size={14} /> {lesson.duration}s</span>}
              {lesson.status && (
                <span className={`${styles.videoStatus} ${styles[lesson.status]}`}>
                  {lesson.status}
                </span>
              )}
            </div>
          )}

          {lesson.contentType === 'material' && lesson.fileName && (
            <div className={styles.lessonMeta}>
              <span><Paperclip size={14} /> {lesson.fileName}</span>
            </div>
          )}

          {lesson.contentType === 'quiz' && lesson.questions && (
            <div className={styles.lessonMeta}>
              <span><HelpCircle size={14} /> {lesson.questions.length} câu hỏi</span>
            </div>
          )}

          {lesson.description && (
            <div className={styles.lessonDescription}>
              {lesson.description}
            </div>
          )}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Đang tải danh sách yêu cầu cập nhật...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <AlertCircle size={48} />
        <p>{error}</p>
        <button onClick={fetchPendingRevisions} className={styles.retryButton}>
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Duyệt cập nhật khóa học</h1>
        <p>Có {revisions.length} yêu cầu cập nhật đang chờ duyệt</p>
      </div>

      {revisions.length === 0 ? (
        <div className={styles.emptyState}>
          <CheckCircle size={64} />
          <h3>Không có yêu cầu cập nhật nào</h3>
          <p>Tất cả yêu cầu cập nhật đã được xử lý</p>
        </div>
      ) : (
        <div className={styles.revisionList}>
          {revisions.map((draft) => (
            <div key={draft._id} className={styles.revisionCard}>
              <div className={styles.cardHeader}>
                <div className={styles.courseInfo}>
                  <BookOpen size={20} />
                  <div>
                    <h3>{draft.title}</h3>
                    <p className={styles.subtitle}>{draft.subtitle}</p>
                  </div>
                </div>
                <DraftIndicator status={draft.status} isDraft={true} showText={true} />
              </div>

              <div className={styles.cardBody}>
                <div className={styles.infoRow}>
                  <User size={16} />
                  <span>Khóa học ID: {draft._id}</span>
                </div>
                <div className={styles.infoRow}>
                  <Calendar size={16} />
                  <span>Gửi lúc: {new Date(draft.submittedAt || draft.updatedAt).toLocaleString('vi-VN')}</span>
                </div>
                <div className={styles.infoRow}>
                  <Edit3 size={16} />
                  <span>
                    {draft.draftSections?.length || 0} chương, 
                    {' '}{draft.draftLessons?.length || 0} bài học,
                    {' '}{draft.draftVideos?.length || 0} video
                  </span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button 
                  onClick={() => handleViewDetail(draft)}
                  className={styles.viewButton}
                >
                  <Eye size={16} />
                  Xem chi tiết
                </button>
                <div className={styles.actions}>
                  <button 
                    onClick={() => handleApprove(draft._id)}
                    className={styles.approveButton}
                    disabled={actionLoading}
                  >
                    <CheckCircle size={16} />
                    Phê duyệt
                  </button>
                  <button 
                    onClick={() => {
                      const reason = prompt('Nhập lý do từ chối (tùy chọn):') || 'Không có lý do cụ thể';
                      setRejectReason(reason);
                      handleReject(draft._id);
                    }}
                    className={styles.rejectButton}
                    disabled={actionLoading}
                  >
                    <XCircle size={16} />
                    Từ chối
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal chi tiết revision */}
      {showModal && selectedRevision && (
        <div className={styles.modal} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Chi tiết cập nhật khóa học</h2>
              <button onClick={closeModal} className={styles.closeButton}>×</button>
            </div>

            <div className={styles.modalBody}>
              {/* Course Info */}
              <div className={styles.section}>
                <h3>Thông tin khóa học</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <label>Tiêu đề:</label>
                    <p>{selectedRevision.title}</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Phụ đề:</label>
                    <p>{selectedRevision.subtitle}</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Mô tả:</label>
                    <p>{selectedRevision.description}</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Giá gốc:</label>
                    <p>{selectedRevision.originalPrice?.toLocaleString('vi-VN')} VNĐ</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Giá hiện tại:</label>
                    <p>{selectedRevision.currentPrice?.toLocaleString('vi-VN')} VNĐ</p>
                  </div>
                </div>
              </div>

              {/* Change Summary */}
              <div className={styles.section}>
                <h3>Tổng quan thay đổi</h3>
                <div className={styles.changesSummary}>
                  <div className={styles.changeStat}>
                    <div className={styles.changeNumber}>
                      {(selectedRevision.draftSections || []).filter(s => getChangeType(s) === 'new').length}
                    </div>
                    <div className={styles.changeLabel}>Chương mới</div>
                  </div>
                  <div className={styles.changeStat}>
                    <div className={styles.changeNumber}>
                      {(selectedRevision.draftLessons || []).filter(l => getChangeType(l) === 'modified').length}
                    </div>
                    <div className={styles.changeLabel}>Bài học sửa</div>
                  </div>
                  <div className={styles.changeStat}>
                    <div className={styles.changeNumber}>
                      {(selectedRevision.draftLessons || []).filter(l => getChangeType(l) === 'deleted').length}
                    </div>
                    <div className={styles.changeLabel}>Bài học xóa</div>
                  </div>
                  <div className={styles.changeStat}>
                    <div className={styles.changeNumber}>
                      {(selectedRevision.draftVideos || []).filter(v => getChangeType(v) === 'new').length +
                       (selectedRevision.draftMaterials || []).filter(m => getChangeType(m) === 'new').length +
                       (selectedRevision.draftQuizzes || []).filter(q => getChangeType(q) === 'new').length}
                    </div>
                    <div className={styles.changeLabel}>Nội dung mới</div>
                  </div>
                </div>
              </div>

              {/* Course Content with Changes */}
              {renderCourseContent()}

              {/* Reject Reason */}
              <div className={styles.section}>
                <h3>Lý do từ chối (nếu từ chối)</h3>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do từ chối..."
                  className={styles.rejectTextarea}
                  rows={4}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                onClick={() => handleApprove(selectedRevision._id)}
                className={styles.approveButton}
                disabled={actionLoading}
              >
                <CheckCircle size={16} />
                {actionLoading ? 'Đang xử lý...' : 'Phê duyệt'}
              </button>
              <button 
                onClick={() => handleReject(selectedRevision._id)}
                className={styles.rejectButton}
                disabled={actionLoading || !rejectReason.trim()}
              >
                <XCircle size={16} />
                {actionLoading ? 'Đang xử lý...' : 'Từ chối'}
              </button>
              <button onClick={closeModal} className={styles.cancelButton}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Content Modal */}
      {showLessonModal && selectedLesson && (
        <div className={styles.modal}>
          <div className={`${styles.modalContent} ${styles.lessonModalContent}`}>
            <div className={styles.modalHeader}>
              <h3>
                {getContentTypeIcon(selectedLesson.contentType)} {selectedLesson.title}
              </h3>
              <button 
                className={styles.closeButton}
                onClick={closeLessonModal}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {/* Video Player */}
              {selectedLesson.contentType === 'video' && (
                <div className={styles.videoPreview}>
                  {selectedLesson.draftVideoId || selectedLesson.videoId ? (
                    <div className={styles.muxPlayerWrapper}>
                      {selectedLesson.isDraft && selectedLesson.draftVideoId ? (
                        <MuxDraftVideoPlayer
                          videoId={selectedLesson.draftVideoId}
                          autoPlay={false}
                          onReady={(data) => {
                            console.log('Draft video ready:', data);
                          }}
                          onEnded={() => {
                            console.log('Draft video ended');
                          }}
                        />
                      ) : (
                        <MuxVideoPlayer
                          videoId={selectedLesson.videoId}
                          courseId={selectedRevision._id}
                          autoPlay={false}
                          onReady={(data) => {
                            console.log('Video ready:', data);
                          }}
                          onEnded={() => {
                            console.log('Video ended');
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className={styles.noContent}>
                      <p>Video chưa sẵn sàng để phát</p>
                      <p style={{ fontSize: '13px', color: '#999', marginTop: '8px' }}>
                        Debug: videoId={selectedLesson.videoId || 'null'}, 
                        draftVideoId={selectedLesson.draftVideoId || 'null'}
                      </p>
                      {selectedLesson.status && (
                        <span className={`${styles.videoStatus} ${styles[selectedLesson.status]}`}>
                          Status: {selectedLesson.status}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {selectedLesson.description && (
                    <div className={styles.contentDescription}>
                      <h4>Mô tả:</h4>
                      <p>{selectedLesson.description}</p>
                    </div>
                  )}
                  
                  <div className={styles.contentInfo}>
                    {selectedLesson.duration && (
                      <p><strong>Thời lượng:</strong> {selectedLesson.duration}s</p>
                    )}
                    {selectedLesson.assetId && (
                      <p><strong>Asset ID:</strong> {selectedLesson.assetId}</p>
                    )}
                    {selectedLesson.playbackId && (
                      <p><strong>Playback ID:</strong> {selectedLesson.playbackId}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Material Download */}
              {selectedLesson.contentType === 'material' && (
                <div className={styles.materialPreview}>
                  {selectedLesson.contentUrl ? (
                    <>
                      <div className={styles.materialInfo}>
                        <p><strong>Tên file:</strong> {selectedLesson.fileName || 'N/A'}</p>
                        <p><strong>Loại file:</strong> {selectedLesson.fileName ? selectedLesson.fileName.split('.').pop()?.toUpperCase() : 'N/A'}</p>
                        <p><strong>Public ID:</strong> {selectedLesson.contentUrl}</p>
                        <p style={{ fontSize: '12px', color: '#999' }}>
                          Debug: materialId={selectedLesson.materialId || 'null'}, 
                          draftMaterialId={selectedLesson.draftMaterialId || 'null'}
                        </p>
                      </div>
                      
                      <div className={styles.materialViewer}>
                        <div className={styles.downloadPrompt}>
                          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <FileText size={64} style={{ color: '#3b82f6', marginBottom: '15px' }} />
                            <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                              {selectedLesson.fileName}
                            </p>
                            <p style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}>
                              Định dạng: {selectedLesson.fileName ? selectedLesson.fileName.split('.').pop()?.toUpperCase() : 'File'}
                            </p>
                            {selectedLesson.description && (
                              <p style={{ fontSize: '14px', color: '#6c757d', marginTop: '10px', fontStyle: 'italic' }}>
                                {selectedLesson.description}
                              </p>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button 
                              onClick={() => {
                                const materialId = selectedLesson.isDraft 
                                  ? (selectedLesson.draftMaterialId || selectedLesson.materialId)
                                  : (selectedLesson.materialId || selectedLesson.draftMaterialId);
                                console.log('📥 Download button clicked:', {
                                  isDraft: selectedLesson.isDraft,
                                  materialId,
                                  draftMaterialId: selectedLesson.draftMaterialId,
                                  materialId: selectedLesson.materialId,
                                  fileName: selectedLesson.fileName
                                });
                                handleDownloadMaterial(materialId, selectedLesson.fileName);
                              }}
                              className={styles.downloadBtn}
                              style={{ 
                                padding: '12px 24px',
                                fontSize: '16px',
                                fontWeight: '500',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              <Paperclip size={20} /> Tải xuống tài liệu
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={styles.noContent}>
                      <p>Không tìm thấy nội dung tài liệu</p>
                    </div>
                  )}
                </div>
              )}

              {/* Quiz Viewer */}
              {selectedLesson.contentType === 'quiz' && (
                <div className={styles.quizPreview}>
                  {selectedLesson.description && (
                    <div className={styles.quizDescription}>
                      <h4>Mô tả:</h4>
                      <p>{selectedLesson.description}</p>
                    </div>
                  )}
                  
                  {selectedLesson.questions && selectedLesson.questions.length > 0 ? (
                    <div className={styles.questionsList}>
                      <h4>Danh sách câu hỏi ({selectedLesson.questions.length} câu):</h4>
                      {selectedLesson.questions.map((question, index) => (
                        <div key={index} className={styles.questionItem}>
                          <div className={styles.questionHeader}>
                            <span className={styles.questionNumber}>Câu {index + 1}</span>
                            {question.type && (
                              <span className={styles.questionType}>
                                {question.type === 'multiple-choice' ? 'Trắc nghiệm' : 'Tự luận'}
                              </span>
                            )}
                          </div>
                          
                          <p className={styles.questionText}>{question.questionText || question.question}</p>
                          
                          {question.options && question.options.length > 0 && (
                            <div className={styles.optionsList}>
                              {question.options.map((option, optionIndex) => {
                                // Check if this option is correct
                                // Support both correctAnswer (index) and correctAnswers (array of text)
                                const isCorrect = question.correctAnswer === optionIndex || 
                                  (question.correctAnswers && question.correctAnswers.includes(option));
                                
                                return (
                                  <div 
                                    key={optionIndex} 
                                    className={`${styles.optionItem} ${
                                      isCorrect ? styles.correctAnswer : ''
                                    }`}
                                  >
                                    <span className={styles.optionLabel}>
                                      {String.fromCharCode(65 + optionIndex)}.
                                    </span>
                                    <span className={styles.optionText}>{option}</span>
                                    {isCorrect && (
                                      <span className={styles.correctBadge}>
                                        <CheckCircle size={14} /> Đáp án đúng
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          {question.explanation && (
                            <div className={styles.explanation}>
                              <strong>Giải thích:</strong>
                              <p>{question.explanation}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.noContent}>
                      <p>Quiz chưa có câu hỏi</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevisionApproval;
