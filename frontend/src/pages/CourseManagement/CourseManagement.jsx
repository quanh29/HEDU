import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import BasicInfo from '../../components/BasicInfo/BasicInfo';
import Curriculum from '../../components/Curriculum/Curriculum';
import LessonStatistics from '../../components/LessonStatistics/LessonStatistics';
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
import { 
  mapSectionData, 
  transformSectionForSave,
  getLessonStatistics
} from '../../utils/courseDataMapper';

const CreateUpdateCourse = ({ mode = 'edit' }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
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

  // Headings and categories state
  const [headings, setHeadings] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Levels and languages state
  const [levels, setLevels] = useState([]);
  const [languages, setLanguages] = useState([]);

  // Form validation
  const [errors, setErrors] = useState({});

  // Fetch headings and categories on mount
  useEffect(() => {
    fetchHeadingsAndCategories();
    fetchLevelsAndLanguages();
  }, []);

  // Fetch course data if editing (after headings are loaded)
  useEffect(() => {
    console.log('CourseId from params:', courseId);
    console.log('IsEditMode:', isEditMode);
    console.log('IsViewMode:', isViewMode);
    
    // Wait for headings to be loaded before fetching course data
    if (isEditMode && courseId && headings.length > 0) {
      fetchCourseData();
    }
  }, [courseId, isEditMode, headings]);

  const fetchHeadingsAndCategories = async () => {
    setLoadingCategories(true);
    try {
      const token = await getToken();
      const url = `${import.meta.env.VITE_BASE_URL}/api/headings`;
      console.log('📚 [fetchHeadingsAndCategories] Fetching from:', url);
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const headingsData = response.data;
      
      console.log('📚 [fetchHeadingsAndCategories] Received headings:', headingsData);
      setHeadings(headingsData);
      
      // Flatten all categories for easy access
      const allCats = [];
      headingsData.forEach(heading => {
        if (heading.categories && heading.categories.length > 0) {
          heading.categories.forEach(cat => {
            allCats.push({
              ...cat,
              heading_id: heading.heading_id,
              heading_title: heading.title
            });
          });
        }
      });
      
      console.log('📚 [fetchHeadingsAndCategories] All categories:', allCats);
      setAllCategories(allCats);
      
    } catch (error) {
      console.error('❌ [fetchHeadingsAndCategories] Error:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchLevelsAndLanguages = async () => {
    try {
      const token = await getToken();
      const [levelsRes, languagesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BASE_URL}/api/levels`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_BASE_URL}/api/languages`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      console.log('📊 [fetchLevelsAndLanguages] Levels:', levelsRes.data);
      console.log('🌍 [fetchLevelsAndLanguages] Languages:', languagesRes.data);
      
      setLevels(levelsRes.data);
      setLanguages(languagesRes.data);
    } catch (error) {
      console.error('❌ [fetchLevelsAndLanguages] Error:', error);
      console.error('Error details:', error.response?.data);
    }
  };

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
      const token = await getToken();
      // Sử dụng API mới để fetch full course data cho management (bao gồm sections và lessons)
      const url = `${import.meta.env.VITE_BASE_URL}/api/course/manage/${courseId}/full`;
      console.log('Fetching from URL:', url);
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const courseInfo = response.data;
      
      console.log('Full API Response:', courseInfo);
      
      // Lấy categories từ MySQL
      const tags = courseInfo.categories 
        ? courseInfo.categories.map(cat => cat.title) 
        : [];
      
      // Map category to heading_id and subcategory to category_id
      let categoryId = '';
      let subcategoryId = '';
      
      if (courseInfo.categories && courseInfo.categories.length > 0) {
        // Try to find matching heading and category from fetched headings
        const firstCatTitle = courseInfo.categories[0].title;
        const matchingHeading = headings.find(h => 
          h.categories.some(c => c.title === firstCatTitle)
        );
        
        if (matchingHeading) {
          categoryId = matchingHeading.heading_id;
          const matchingCat = matchingHeading.categories.find(c => c.title === firstCatTitle);
          if (matchingCat) {
            subcategoryId = matchingCat.category_id;
          }
        }
      }
      
      console.log('📚 [fetchCourseData] Mapped categories:', {
        categoryId,
        subcategoryId,
        originalCategories: courseInfo.categories,
        originalTags: tags
      });
      
      // Set course basic info
      setCourseData({
        title: courseInfo.title || '',
        subtitle: courseInfo.subTitle || '',
        description: courseInfo.des || '',
        thumbnail: courseInfo.picture_url || '',
        level: courseInfo.level_title || 'beginner',
        language: courseInfo.language_title || 'vietnamese',
        tags: tags,
        objectives: (courseInfo.objectives && courseInfo.objectives.length) ? courseInfo.objectives : [''],
        requirements: (courseInfo.requirements && courseInfo.requirements.length) ? courseInfo.requirements : [''],
        category: categoryId,
        subcategory: subcategoryId,
        hasPractice: courseInfo.has_practice === 1 || false,
        hasCertificate: courseInfo.has_certificate === 1 || false,
        originalPrice: courseInfo.originalPrice || 0,
        currentPrice: courseInfo.currentPrice || 0
      });
      
      console.log('Set courseData:', {
        title: courseInfo.title,
        objectives: courseInfo.objectives,
        requirements: courseInfo.requirements
      });
      
      // Transform sections data từ MongoDB
      console.log('🚀 [fetchCourseData] Starting section transformation...');
      
      const sectionsData = courseInfo.sections || [];
      
      if (!sectionsData || sectionsData.length === 0) {
        console.warn('⚠️ [fetchCourseData] No sections data found!');
        setSections([]);
      } else {
        console.log(`📦 [fetchCourseData] Transforming ${sectionsData.length} sections...`);
        
        const transformedSections = sectionsData.map((section, index) => {
          console.log(`\n🔄 [fetchCourseData] Transforming section ${index + 1}/${sectionsData.length}`);
          console.log('Section data:', section);
          
          // Gom tất cả lessons từ section
          const lessons = section.lessons || [];
          console.log(`📚 Section "${section.title}" has ${lessons.length} lessons`);
          
          return {
            _id: section._id,
            id: section._id,
            title: section.title || '',
            order: section.order || index + 1,
            lessons: lessons.map((lesson, lessonIndex) => {
              console.log(`  📝 Lesson ${lessonIndex + 1}: ${lesson.title}`);
              console.log('    - contentType:', lesson.contentType);
              console.log('    - videoId from backend:', lesson.videoId);
              console.log('    - _id:', lesson._id);
              
              const baseLesson = {
                _id: lesson._id,
                id: lesson._id,
                title: lesson.title || '',
                contentType: lesson.contentType,
                order: lesson.order || 0,
                contentUrl: lesson.contentUrl || '',
                playbackId: lesson.playbackId || '',
                videoId: lesson.videoId || lesson._id || '', // Add videoId for delete functionality
                materialId: lesson.materialId || '', // Add materialId for material linking
                fileName: lesson.fileName || '', // Add fileName for material display
                publicId: lesson.publicId || lesson.contentUrl || '', // Add publicId for Cloudinary
                assetId: lesson.assetId || '',
                uploadId: lesson.uploadId || '',
                duration: lesson.duration || 0,
                status: lesson.status || 'ready',
                description: lesson.description || ''
              };
              
              console.log('    ✅ Mapped videoId:', baseLesson.videoId);
              console.log('    ✅ Mapped materialId:', baseLesson.materialId);

              // Transform quiz questions từ backend format sang frontend format
              if (lesson.contentType === 'quiz' && lesson.questions && lesson.questions.length > 0) {
                baseLesson.quizQuestions = lesson.questions.map(q => ({
                  question: q.questionText || '',
                  explanation: q.explanation || '',
                  answers: (q.options || []).map(option => ({
                    text: option,
                    isCorrect: (q.correctAnswers || []).includes(option)
                  }))
                }));
                // Giữ lại questions cho backend
                baseLesson.questions = lesson.questions;
              } else if (lesson.contentType === 'quiz') {
                // Quiz mới chưa có questions
                baseLesson.quizQuestions = [];
                baseLesson.questions = [];
              }

              return baseLesson;
            })
          };
        });
        
        console.log('✅ [fetchCourseData] Transformed sections:', transformedSections);
        
        // Log statistics
        const stats = getLessonStatistics(transformedSections);
        console.log('📊 [fetchCourseData] Course statistics:', stats);
        
        setSections(transformedSections);
      }
      
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
      // Get instructorId from Clerk user
      const instructorId = user?.id;
      
      if (!instructorId) {
        alert('Vui lòng đăng nhập để tạo khóa học');
        return;
      }
      
      // Map level và language từ title sang ID
      const selectedLevel = levels.find(lv => lv.title.toLowerCase() === courseData.level.toLowerCase());
      const selectedLanguage = languages.find(lang => lang.title.toLowerCase() === courseData.language.toLowerCase());
      
      const lv_id = selectedLevel ? selectedLevel.lv_id : 'L1'; // Fallback to L1
      const lang_id = selectedLanguage ? selectedLanguage.lang_id : languages[0]?.lang_id; // Fallback to first language
      
      console.log('🗺️ [saveCourseWithStatus] Mapped IDs:', {
        level: courseData.level,
        lv_id,
        selectedLevel,
        language: courseData.language,
        lang_id,
        selectedLanguage
      });
      
      // Lấy category_id từ subcategory đã chọn
      const categories = courseData.subcategory ? [courseData.subcategory] : [];
      
      console.log('💾 [saveCourseWithStatus] Preparing course data:', {
        isEditMode,
        courseId,
        status,
        categories
      });

      // Chuẩn bị sections để lưu
      const sectionsForSave = sections.map((section, index) => ({
        _id: section._id && !section._id.startsWith('temp-') ? section._id : undefined,
        title: section.title,
        order: index + 1,
        lessons: (section.lessons || []).map((lesson, lessonIndex) => {
          const baseLesson = {
            _id: lesson._id && !lesson._id.startsWith('temp-') ? lesson._id : undefined,
            // Attach videoId so backend can link to existing Video documents.
            // Prefer explicit lesson.videoId (set by uploader), otherwise fall back to lesson._id
            // which often is the existing video document _id when editing.
            videoId: lesson.videoId || lesson._id || undefined,
            // Attach materialId to link with Material documents
            materialId: lesson.materialId || undefined,
            title: lesson.title,
            contentType: lesson.contentType,
            order: lessonIndex + 1,
            contentUrl: lesson.contentUrl || '',
            playbackId: lesson.playbackId || '',
            status: lesson.status || 'ready',
            description: lesson.description || '',
            // Include fileName for materials
            fileName: lesson.fileName || undefined
          };

          // Transform quiz questions từ frontend format sang backend format
          if (lesson.contentType === 'quiz' && lesson.quizQuestions) {
            baseLesson.questions = lesson.quizQuestions.map(q => {
              // Lấy options và correctAnswers từ answers array
              const options = (q.answers || []).map(ans => ans.text);
              const correctAnswers = (q.answers || [])
                .map((ans, idx) => ans.isCorrect ? ans.text : null)
                .filter(ans => ans !== null);

              return {
                questionText: q.question || '',
                options: options,
                correctAnswers: correctAnswers,
                explanation: q.explanation || '' // Có thể để trống nếu chưa có
              };
            });
          } else if (lesson.contentType === 'quiz' && lesson.questions) {
            // Nếu đã có format đúng từ MongoDB (khi edit)
            baseLesson.questions = lesson.questions;
          } else {
            baseLesson.questions = [];
          }

          return baseLesson;
        })
      }));

      const payload = {
        title: courseData.title,
        subTitle: courseData.subtitle,
        des: courseData.description,
        originalPrice: courseData.originalPrice || 0,
        currentPrice: courseData.currentPrice || courseData.originalPrice || 0,
        instructor_id: instructorId,
        lv_id: lv_id,
        lang_id: lang_id,
        has_practice: courseData.hasPractice,
        has_certificate: courseData.hasCertificate,
        picture_url: courseData.thumbnail,
        requirements: courseData.requirements.filter(r => r.trim()),
        objectives: courseData.objectives.filter(o => o.trim()),
        categories: categories,
        course_status: status,
        sections: sectionsForSave
      };

      console.log('💾 [saveCourseWithStatus] Payload:', payload);

      if (isEditMode) {
        // Update existing course
        const token = await getToken();
        const url = `${import.meta.env.VITE_BASE_URL}/api/course/${courseId}`;
        console.log('📝 [saveCourseWithStatus] Updating course:', url);
        const response = await axios.put(url, payload, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Kiểm tra xem có phải là revision không
        if (response.data.isRevision) {
          alert('Đã gửi yêu cầu cập nhật khóa học! Vui lòng chờ admin phê duyệt.');
        } else {
          alert(status === 'draft' ? 'Cập nhật nháp khóa học thành công!' : 'Cập nhật và gửi khóa học xét duyệt thành công!');
        }
        navigate('/instructor');
      } else {
        // Create new course
        const token = await getToken();
        const url = `${import.meta.env.VITE_BASE_URL}/api/course`;
        console.log('➡️ [saveCourseWithStatus] Creating new course:', url);
        const response = await axios.post(url, payload, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('✅ [saveCourseWithStatus] Course created:', response.data);
        alert(status === 'draft' ? 'Đã lưu nháp khóa học!' : 'Đã gửi khóa học xét duyệt!');
        navigate('/instructor');
      }
    } catch (error) {
      console.error('❌ [saveCourseWithStatus] Error saving course:', error);
      console.error('Error details:', error.response?.data);
      alert('Có lỗi xảy ra khi lưu khóa học: ' + (error.response?.data?.message || error.message));
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
              {/* Chỉ hiện nút Lưu nháp khi tạo mới (không phải edit) */}
              {!isEditMode && (
                <button
                  onClick={() => saveCourseWithStatus('draft')}
                  disabled={saving}
                  className={styles.saveButton}
                >
                  <Save size={16} />
                  {saving ? 'Đang lưu...' : 'Lưu nháp'}
                </button>
              )}
              <button
                onClick={() => saveCourseWithStatus('pending')}
                disabled={saving}
                className={styles.saveButton}
                style={{ marginLeft: !isEditMode ? 12 : 0, background: '#3b82f6', color: 'white' }}
              >
                <Upload size={16} />
                {saving ? 'Đang gửi...' : (isEditMode ? 'Gửi cập nhật' : 'Gửi xét duyệt')}
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
            headings={headings}
            allCategories={allCategories}
            loadingCategories={loadingCategories}
            levels={levels}
            languages={languages}
            readOnly={isViewMode}
          />
        )}

        {/* Curriculum Tab */}
        {activeTab === 'curriculum' && (
          <>
            {/* Lesson Statistics */}
            {sections.length > 0 && <LessonStatistics sections={sections} />}
            
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
          </>
        )}
      </div>
    </div>
  );
};

export default CreateUpdateCourse;
