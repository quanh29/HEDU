import React, { useState, useEffect } from 'react';
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
import styles from './ManageCourse.module.css';

const ManageCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!courseId;
  
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
    if (isEditMode) {
      fetchCourseData();
    }
  }, [courseId, isEditMode]);

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/course/${courseId}`);
      const { course, sections: courseSections } = response.data;
      
      setCourseData({
  title: course.title || '',
  subtitle: course.subtitle || '',
  description: course.description || '',
  thumbnail: course.thumbnail || '',
  level: course.level || 'beginner',
  language: course.language || 'vietnamese',
  tags: course.tags || [],
  objectives: course.objectives || [''],
  requirements: course.requirements || [''],
  category: course.category || '',
  subcategory: course.subcategory || '',
  hasPractice: course.hasPractice || false,
  hasCertificate: course.hasCertificate || false
      });
      
      setSections(courseSections || []);
    } catch (error) {
      console.error('Error fetching course data:', error);
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

  // Save course
  const saveCourse = async () => {
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        ...courseData,
        sections: sections.map(section => ({
          ...section,
          lessons: section.lessons || []
        }))
      };
      
      if (isEditMode) {
        await axios.put(`${import.meta.env.VITE_BASE_URL}/api/course/${courseId}`, payload);
      } else {
        const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/course`, payload);
        // Navigate to edit mode with the new course ID
        navigate(`/manage-course/${response.data.courseId}`, { replace: true });
      }
      
      alert(isEditMode ? 'Khóa học đã được cập nhật!' : 'Khóa học đã được tạo!');
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
              {isEditMode ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}
            </h1>
          </div>
          
          <div className={styles.headerActions}>
            <button
              onClick={saveCourse}
              disabled={saving}
              className={styles.saveButton}
            >
              <Save size={16} />
              {saving ? 'Đang lưu...' : 'Lưu khóa học'}
            </button>
          </div>
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
          />
        )}
      </div>
    </div>
  );
};

export default ManageCourse;
