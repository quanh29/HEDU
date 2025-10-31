import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import BasicInfo from '../../components/BasicInfo/BasicInfo';
import Curriculum from '../../components/Curriculum/Curriculum';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Upload,
  X,
  Move,
  GripVertical,
  PlayCircle,
  FileText,
  
  Settings,
  Image as ImageIcon
} from 'lucide-react';
import axios from 'axios';
import styles from './CourseManagement.module.css';

const CreateUpdateCourse = ({ mode = 'edit' }) => {
  const { user } = useUser();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!courseId;
  const isViewMode = mode === 'view';
  
  // Course basic info state
  const [courseData, setCourseData] = useState({
    title: '',
    subtitle: '',
    description: '',
    thumbnail: '',
    level: 'beginner',
    language: 'vietnamese',
    tags: [],
    objectives: [''],
    requirements: [''],
    category: '',
    subcategory: '',
    hasPractice: false,
    hasCertificate: false
  });

  // Course structure state
  const [sections, setSections] = useState([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form validation
  const [errors, setErrors] = useState({});

  // Fetch course data if editing
  useEffect(() => {
    console.log('CourseId from params:', courseId);
    console.log('IsEditMode:', isEditMode);
    console.log('IsViewMode:', isViewMode);
    
    if (isEditMode && courseId) {
      fetchCourseData();
    }
  }, [courseId, isEditMode]);

  const fetchCourseData = async () => {
    if (!courseId) {
      console.error('CourseId is undefined!');
      alert('Không tìm thấy ID khóa học');
      navigate('/instructor');
      return;
    }
    
    setLoading(true);
    console.log('Fetching course data for ID:', courseId);
    try {
      // Sử dụng API đúng để fetch course data
      const url = `${import.meta.env.VITE_BASE_URL}/api/course/${courseId}/full`;
      console.log('Fetching from URL:', url);
      const response = await axios.get(url);
      const data = response.data;
      
      console.log('Full API Response:', data);
      
      // Data có thể có cấu trúc { course, sections } hoặc trực tiếp course data
      const courseInfo = data.course || data;
      const sectionsData = data.sections || [];
      
      console.log('Course Info:', courseInfo);
      console.log('Sections Data:', sectionsData);
      
      // Lấy categories/tags từ MySQL hoặc MongoDB
      const tags = courseInfo.categories 
        ? courseInfo.categories.map(cat => cat.title) 
        : (courseInfo.tags || []);
      
      const category = tags.length > 0 ? tags[0] : '';
      const subcategory = tags.length > 1 ? tags[1] : '';
      
      setCourseData({
        title: courseInfo.title || '',
        subtitle: courseInfo.subTitle || courseInfo.subtitle || '',
        description: courseInfo.des || courseInfo.description || '',
        thumbnail: courseInfo.picture_url || courseInfo.thumbnail || '',
        level: courseInfo.level_title || courseInfo.level || 'beginner',
        language: courseInfo.language_title || courseInfo.language || 'vietnamese',
        tags: tags,
        objectives: (courseInfo.objectives && courseInfo.objectives.length) ? courseInfo.objectives : [''],
        requirements: (courseInfo.requirements && courseInfo.requirements.length) ? courseInfo.requirements : [''],
        category: category,
        subcategory: subcategory,
        hasPractice: courseInfo.has_practice === 1 || courseInfo.hasPractice || false,
        hasCertificate: courseInfo.has_certificate === 1 || courseInfo.hasCertificate || false,
        originalPrice: courseInfo.originalPrice || courseInfo.original_price || 0
      });
      
      console.log('Set courseData:', {
        title: courseInfo.title,
        objectives: courseInfo.objectives,
        requirements: courseInfo.requirements
      });
      
      // Transform sections data - sections có videos, materials, quizzes
      const transformedSections = sectionsData.map(section => {
        console.log('Processing section:', section.title, section);
        
        // Gộp tất cả lessons từ videos, materials, quizzes
        const lessons = [];
        
        // Add videos
        if (section.videos && section.videos.length > 0) {
          section.videos.forEach(video => {
            lessons.push({
              id: video._id,
              _id: video._id,
              title: video.title,
              contentType: 'video',
              url: video.contentUrl || '',
              info: video.description || '',
              description: video.description || '',
              order: video.order || 0
            });
          });
        }
        
        // Add materials
        if (section.materials && section.materials.length > 0) {
          section.materials.forEach(material => {
            lessons.push({
              id: material._id,
              _id: material._id,
              title: material.title,
              contentType: 'article',
              url: material.contentUrl || '',
              info: '',
              description: '',
              order: material.order || 0
            });
          });
        }
        
        // Add quizzes
        if (section.quizzes && section.quizzes.length > 0) {
          section.quizzes.forEach(quiz => {
            lessons.push({
              id: quiz._id,
              _id: quiz._id,
              title: quiz.title,
              contentType: 'quiz',
              info: '',
              quizQuestions: (quiz.questions || []).map(q => ({
                question: q.questionText,
                answers: q.options.map((opt, idx) => ({
                  text: opt,
                  isCorrect: q.correctAnswers.includes(idx)
                })),
                explanation: q.explanation || ''
              })),
              order: quiz.order || 0
            });
          });
        }
        
        // Sort lessons by order
        lessons.sort((a, b) => a.order - b.order);
        
        return {
          id: section._id,
          _id: section._id,
          title: section.title,
          lessons: lessons
        };
      });
      
      console.log('Transformed sections:', transformedSections);
      setSections(transformedSections);
      
    } catch (error) {
      console.error('Error fetching course data:', error);
      console.error('Error details:', error.response?.data);
      alert('Không thể tải dữ liệu khóa học: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Handle basic info changes
  const handleInputChange = (field, value) => {
    setCourseData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle array fields (objectives, requirements, tags)
  const handleArrayFieldChange = (field, index, value) => {
    setCourseData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayField = (field) => {
    setCourseData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field, index) => {
    if (courseData[field].length > 1) {
      setCourseData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    }
  };

  // Section management
  const addSection = () => {
    const newSection = {
      id: Date.now().toString(),
      title: '',
      lessons: []
    };
    setSections(prev => [...prev, newSection]);
  };

  const updateSection = (sectionId, field, value) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId || section._id === sectionId
        ? { ...section, [field]: value }
        : section
    ));
  };

  const removeSection = (sectionId) => {
    setSections(prev => prev.filter(section => 
      section.id !== sectionId && section._id !== sectionId
    ));
  };

  // Lesson management
  const addLesson = (sectionId) => {
    const newLesson = {
      id: Date.now().toString(),
      title: '',
      contentType: 'video',
      info: ''
    };
    
    setSections(prev => prev.map(section => {
      if (section.id === sectionId || section._id === sectionId) {
        return {
          ...section,
          lessons: [...(section.lessons || []), newLesson]
        };
      }
      return section;
    }));
  };

  const updateLesson = (sectionId, lessonId, field, value) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId || section._id === sectionId) {
        return {
          ...section,
          lessons: section.lessons.map(lesson => 
            lesson.id === lessonId || lesson._id === lessonId
              ? { ...lesson, [field]: value }
              : lesson
          )
        };
      }
      return section;
    }));
  };

  const removeLesson = (sectionId, lessonId) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId || section._id === sectionId) {
        return {
          ...section,
          lessons: section.lessons.filter(lesson => 
            lesson.id !== lessonId && lesson._id !== lessonId
          )
        };
      }
      return section;
    }));
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!courseData.title.trim()) {
      newErrors.title = 'Tiêu đề khóa học là bắt buộc';
    }
    
    if (!courseData.description.trim()) {
      newErrors.description = 'Mô tả khóa học là bắt buộc';
    }
    

    
    if (courseData.objectives.every(obj => !obj.trim())) {
      newErrors.objectives = 'Cần ít nhất một mục tiêu học tập';
    }
    
    if (sections.length === 0) {
      newErrors.sections = 'Cần ít nhất một chương học';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Lưu khóa học với status truyền vào
  const saveCourseWithStatus = async (status) => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const normalizedSections = sections.map(section => ({
        title: section.title,
        lessons: (section.lessons || []).map(lesson => {
          const baseLesson = {
            title: lesson.title,
            contentType: lesson.contentType,
            info: lesson.info || '',
            description: lesson.description || ''
          };
          if (lesson.contentType === 'video' || lesson.contentType === 'article') {
            baseLesson.contentUrl = lesson.url || '';
          }
          if (lesson.contentType === 'quiz' && lesson.quizQuestions) {
            baseLesson.questions = lesson.quizQuestions.map(q => ({
              questionText: q.question,
              options: (q.answers || []).map(ans => ans.text),
              correctAnswers: (q.answers || []).map((ans, idx) => ans.isCorrect ? idx : null).filter(idx => idx !== null),
              explanation: q.explanation || ''
            }));
          }
          return baseLesson;
        })
      }));

      const instructors = user ? [user.id] : [];
      const tags = [courseData.category, courseData.subcategory].filter(Boolean);

      const payload = {
        title: courseData.title,
        subtitle: courseData.subtitle,
        instructors,
        thumbnail: courseData.thumbnail,
        description: courseData.description,
        originalPrice: courseData.originalPrice,
        requirements: courseData.requirements,
        objectives: courseData.objectives,
        tags,
        level: courseData.level,
        language: courseData.language,
        hasPractice: courseData.hasPractice,
        hasCertificate: courseData.hasCertificate,
        sections: normalizedSections,
        status: status
      };

      if (isEditMode) {
        // Call PUT endpoint to update existing course revision
        await axios.put(`${import.meta.env.VITE_BASE_URL}/api/course-revision/course/${courseId}`, payload);
        alert(status === 'draft' ? 'Cập nhật nháp khóa học thành công!' : 'Cập nhật và gửi khóa học xét duyệt thành công!');
        navigate('/instructor');
      } else {
        await axios.post(`${import.meta.env.VITE_BASE_URL}/api/course-revision`, payload);
        alert(status === 'draft' ? 'Đã lưu nháp khóa học!' : 'Đã gửi khóa học xét duyệt!');
        navigate('/instructor');
      }
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Có lỗi xảy ra khi lưu khóa học');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingText}>Đang tải dữ liệu khóa học...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <button
              onClick={() => navigate('/instructor')}
              className={styles.backButton}
            >
              <ArrowLeft size={16} />
              Quay lại
            </button>
            <h1 className={styles.title}>
              {isViewMode ? 'Xem khóa học' : (isEditMode ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới')}
            </h1>
          </div>
          
          {!isViewMode && (
            <div className={styles.headerActions}>
              <button
                onClick={() => saveCourseWithStatus('draft')}
                disabled={saving}
                className={styles.saveButton}
              >
                <Save size={16} />
                {saving ? 'Đang lưu...' : 'Lưu nháp'}
              </button>
              <button
                onClick={() => saveCourseWithStatus('pending')}
                disabled={saving}
                className={styles.saveButton}
                style={{ marginLeft: 12, background: '#3b82f6', color: 'white' }}
              >
                <Upload size={16} />
                {saving ? 'Đang gửi...' : 'Gửi xét duyệt'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          {[
            { id: 'basic', label: 'Thông tin cơ bản', icon: Settings },
            { id: 'curriculum', label: 'Chương trình học', icon: PlayCircle }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Basic Information Tab */}
        {activeTab === 'basic' && (
          <BasicInfo
            courseData={courseData}
            errors={errors}
            handleInputChange={handleInputChange}
            handleArrayFieldChange={handleArrayFieldChange}
            addArrayField={addArrayField}
            removeArrayField={removeArrayField}
            readOnly={isViewMode}
          />
        )}

        {/* Curriculum Tab */}
        {activeTab === 'curriculum' && (
          <Curriculum
            sections={sections}
            errors={errors}
            addSection={addSection}
            updateSection={updateSection}
            removeSection={removeSection}
            addLesson={addLesson}
            updateLesson={updateLesson}
            removeLesson={removeLesson}
            readOnly={isViewMode}
          />
        )}
      </div>
    </div>
  );
};

export default CreateUpdateCourse;
