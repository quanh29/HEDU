import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Loader, Save } from 'lucide-react';
import axios from 'axios';
import styles from './BasicInfo.module.css';

const BasicInfo = ({ 
  courseData, 
  errors, 
  handleInputChange, 
  handleArrayFieldChange, 
  addArrayField, 
  removeArrayField,
  headings = [],
  allCategories = [],
  loadingCategories = false,
  levels = [],
  languages = [],
  onSave,
  initialData
}) => {
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [thumbnailPublicId, setThumbnailPublicId] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes by comparing courseData with initialData
  useEffect(() => {
    if (!initialData) {
      setHasChanges(false);
      return;
    }

    const checkForChanges = () => {
      // Compare all fields
      const changed = 
        courseData.title !== initialData.title ||
        courseData.subtitle !== initialData.subtitle ||
        courseData.description !== initialData.description ||
        courseData.thumbnail !== initialData.thumbnail ||
        courseData.level !== initialData.level ||
        courseData.language !== initialData.language ||
        courseData.category !== initialData.category ||
        courseData.subcategory !== initialData.subcategory ||
        courseData.hasPractice !== initialData.hasPractice ||
        courseData.hasCertificate !== initialData.hasCertificate ||
        courseData.originalPrice !== initialData.originalPrice ||
        JSON.stringify(courseData.objectives) !== JSON.stringify(initialData.objectives) ||
        JSON.stringify(courseData.requirements) !== JSON.stringify(initialData.requirements);
      
      setHasChanges(changed);
    };

    checkForChanges();
  }, [courseData, initialData]);

  // Get categories for selected heading
  const getSubcategoriesForHeading = (headingId) => {
    if (!headingId) return [];
    return allCategories.filter(cat => cat.heading_id === headingId);
  };

  const selectedHeading = headings.find(h => h.heading_id === courseData.category);
  const subcategories = selectedHeading ? getSubcategoriesForHeading(selectedHeading.heading_id) : [];

  // Handle thumbnail file upload
  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 10MB');
      return;
    }

    setUploadingThumbnail(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('📤 [BasicInfo] Uploading thumbnail to Cloudinary...');

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/thumbnail/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        console.log('✅ [BasicInfo] Thumbnail uploaded successfully:', response.data);
        
        // Update thumbnail URL and save public ID for deletion
        handleInputChange('thumbnail', response.data.url);
        setThumbnailPublicId(response.data.publicId);
        
        alert('Upload ảnh thành công!');
      }
    } catch (error) {
      console.error('❌ [BasicInfo] Thumbnail upload error:', error);
      alert('Upload ảnh thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploadingThumbnail(false);
    }
  };

  // Extract publicId from Cloudinary URL
  const extractPublicIdFromUrl = (url) => {
    if (!url) return null;
    
    try {
      // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{filename}.{ext}
      // We need: {folder}/{filename}
      const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
      if (matches && matches[1]) {
        return matches[1]; // Returns "course-thumbnails/file_up97ue"
      }
      return null;
    } catch (error) {
      console.error('Error extracting publicId from URL:', error);
      return null;
    }
  };

  // Handle thumbnail deletion
  const handleDeleteThumbnail = async () => {
    if (!courseData.thumbnail) {
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh thumbnail này không?')) {
      return;
    }

    try {
      console.log('🗑️ [BasicInfo] Deleting thumbnail from Cloudinary...');

      // Extract publicId from URL or use saved publicId
      const publicIdToDelete = thumbnailPublicId || extractPublicIdFromUrl(courseData.thumbnail);
      
      if (!publicIdToDelete) {
        console.warn('⚠️ [BasicInfo] Could not extract publicId, just clearing URL');
        handleInputChange('thumbnail', '');
        setThumbnailPublicId('');
        return;
      }

      console.log('   Public ID to delete:', publicIdToDelete);

      const encodedPublicId = encodeURIComponent(publicIdToDelete);
      await axios.delete(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/thumbnail/${encodedPublicId}`
      );

      console.log('✅ [BasicInfo] Thumbnail deleted successfully');
      
      handleInputChange('thumbnail', '');
      setThumbnailPublicId('');
      
      alert('Xóa ảnh thành công!');
    } catch (error) {
      console.error('❌ [BasicInfo] Thumbnail delete error:', error);
      alert('Xóa ảnh thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Thông tin cơ bản</h2>
      <div className={styles.grid}>
        {/* Title */}
        <div>
          <label className={styles.label}>Tiêu đề khóa học *</label>
          <input
            type="text"
            value={courseData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Nhập tiêu đề khóa học..."
            className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
          />
          {errors.title && <p className={styles.error}>{errors.title}</p>}
        </div>
        {/* Original Price */}
        <div>
          <label className={styles.label}>Giá gốc</label>
          <input
            type="number"
            min="0"
            value={courseData.originalPrice || ''}
            onChange={e => handleInputChange('originalPrice', e.target.value)}
            placeholder="Nhập giá gốc (VND)"
            className={styles.input}
          />
        </div>
        {/* Subtitle */}
        <div>
          <label className={styles.label}>Phụ đề</label>
          <input
            type="text"
            value={courseData.subtitle}
            onChange={(e) => handleInputChange('subtitle', e.target.value)}
            placeholder="Nhập phụ đề khóa học..."
            className={styles.input}
          />
        </div>
        {/* Description */}
        <div>
          <label className={styles.label}>Mô tả khóa học *</label>
          <textarea
            value={courseData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Mô tả chi tiết về khóa học..."
            rows={6}
            className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
            style={{resize: 'vertical'}}
          />
          {errors.description && <p className={styles.error}>{errors.description}</p>}
        </div>
        {/* Thumbnail */}
        <div>
          <label className={styles.label}>Ảnh thumbnail</label>
          
          {/* Upload Button - chỉ hiện khi chưa có ảnh */}
          {!courseData.thumbnail && (
            <div style={{ marginBottom: '12px' }}>
              <input
                type="file"
                id="thumbnail-upload"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleThumbnailUpload}
                style={{ display: 'none' }}
                disabled={uploadingThumbnail}
              />
              <label
                htmlFor="thumbnail-upload"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: uploadingThumbnail ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: uploadingThumbnail ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!uploadingThumbnail) {
                    e.currentTarget.style.background = '#2563eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!uploadingThumbnail) {
                    e.currentTarget.style.background = '#3b82f6';
                  }
                }}
              >
                {uploadingThumbnail ? (
                  <>
                    <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Đang tải lên...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Chọn ảnh
                  </>
                )}
              </label>
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
                Định dạng: JPEG, PNG, GIF, WebP. Tối đa 10MB
              </p>
            </div>
          )}

          {/* Preview & Delete - chỉ hiện khi có ảnh */}
          {courseData.thumbnail && (
            <div style={{ 
              position: 'relative', 
              marginTop: '12px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '2px solid #e5e7eb',
              display: 'inline-block',
              maxWidth: '100%'
            }}>
              <img
                src={courseData.thumbnail}
                alt="Course thumbnail"
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: '6px'
                }}
              />
              <button
                onClick={handleDeleteThumbnail}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  padding: '8px',
                  background: 'rgba(239, 68, 68, 0.9)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(220, 38, 38, 0.9)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
        {/* Level and Language */}
        <div className={styles.grid2}>
          <div>
            <label className={styles.label}>Trình độ</label>
            <select
              value={courseData.level}
              onChange={(e) => handleInputChange('level', e.target.value)}
              className={styles.select}
            >
              <option value="">Chọn trình độ</option>
              {levels.length > 0 ? (
                levels.map(level => (
                  <option key={level.lv_id} value={level.title}>
                    {level.title === 'beginner' ? 'Cơ bản' : 
                     level.title === 'intermediate' ? 'Trung cấp' : 
                     level.title === 'advanced' ? 'Nâng cao' : level.title}
                  </option>
                ))
              ) : (
                <>
                  <option value="beginner">Cơ bản</option>
                  <option value="intermediate">Trung cấp</option>
                  <option value="advanced">Nâng cao</option>
                </>
              )}
            </select>
          </div>
          <div>
            <label className={styles.label}>Ngôn ngữ</label>
            <select
              value={courseData.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
              className={styles.select}
            >
              <option value="">Chọn ngôn ngữ</option>
              {languages.length > 0 ? (
                languages.map(lang => (
                  <option key={lang.lang_id} value={lang.title}>
                    {lang.title === 'vietnamese' ? 'Tiếng Việt' : 
                     lang.title === 'english' ? 'English' : lang.title}
                  </option>
                ))
              ) : (
                <>
                  <option value="vietnamese">Tiếng Việt</option>
                  <option value="english">English</option>
                </>
              )}
            </select>
          </div>
        </div>
        {/* Category & Subcategory */}
        <div className={styles.grid2}>
          <div>
            <label className={styles.label}>Danh mục khóa học *</label>
            <select
              value={courseData.category}
              onChange={e => {
                handleInputChange('category', e.target.value);
                // Reset subcategory when category changes
                handleInputChange('subcategory', '');
              }}
              className={styles.select}
              disabled={loadingCategories}
            >
              <option value="">
                {loadingCategories ? 'Đang tải...' : 'Chọn danh mục'}
              </option>
              {headings.map(heading => (
                <option key={heading.heading_id} value={heading.heading_id}>
                  {heading.title}
                </option>
              ))}
            </select>
            {loadingCategories && (
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Đang tải danh mục...
              </p>
            )}
          </div>
          <div>
            <label className={styles.label}>Danh mục con</label>
            <select
              value={courseData.subcategory}
              onChange={e => handleInputChange('subcategory', e.target.value)}
              className={styles.select}
              disabled={!courseData.category || loadingCategories}
            >
              <option value="">Chọn danh mục con</option>
              {subcategories.map(cat => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.title}
                </option>
              ))}
            </select>
            {courseData.category && subcategories.length === 0 && !loadingCategories && (
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                Không có danh mục con
              </p>
            )}
          </div>
        </div>
        {/* Features */}
        <div>
          <label className={styles.label}>Tính năng khóa học</label>
          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={courseData.hasPractice}
                onChange={(e) => handleInputChange('hasPractice', e.target.checked)}
              />
              Bài tập thực hành
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={courseData.hasCertificate}
                onChange={(e) => handleInputChange('hasCertificate', e.target.checked)}
              />
              Chứng chỉ hoàn thành
            </label>
          </div>
        </div>
        {/* Objectives */}
        <div>
          <label className={styles.label}>Mục tiêu học tập *</label>
          {courseData.objectives.map((objective, index) => (
            <div key={index} className={styles.arrayField}>
              <input
                type="text"
                value={objective}
                onChange={(e) => handleArrayFieldChange('objectives', index, e.target.value)}
                placeholder={`Mục tiêu ${index + 1}...`}
                className={`${styles.input} ${errors.objectives ? styles.inputError : ''}`}
                style={{flex: 1}}
              />
              <button
                onClick={() => removeArrayField('objectives', index)}
                className={styles.removeBtn}
              >
                X
              </button>
            </div>
          ))}
          <button
            onClick={() => addArrayField('objectives')}
            className={styles.addBtn}
          >
            Thêm mục tiêu
          </button>
          {errors.objectives && <p className={styles.error}>{errors.objectives}</p>}
        </div>
        {/* Requirements */}
        <div>
          <label className={styles.label}>Yêu cầu</label>
          {courseData.requirements.map((requirement, index) => (
            <div key={index} className={styles.arrayField}>
              <input
                type="text"
                value={requirement}
                onChange={(e) => handleArrayFieldChange('requirements', index, e.target.value)}
                placeholder={`Yêu cầu ${index + 1}...`}
                className={styles.input}
                style={{flex: 1}}
              />
              <button
                onClick={() => removeArrayField('requirements', index)}
                className={styles.removeBtn}
              >
                X
              </button>
            </div>
          ))}
          <button
            onClick={() => addArrayField('requirements')}
            className={styles.addBtn}
          >
            Thêm yêu cầu
          </button>
        </div>
      </div>

      {/* Save Button Footer */}
      {onSave && (
        <div style={{
          marginTop: '24px',
          padding: '16px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onSave}
            disabled={!hasChanges}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: hasChanges ? '#10b981' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: hasChanges ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background 0.2s'
            }}
          >
            <Save size={16} />
            {hasChanges ? 'Lưu thay đổi' : 'Không có thay đổi'}
          </button>
        </div>
      )}
    </div>
  );
};

export default BasicInfo;
