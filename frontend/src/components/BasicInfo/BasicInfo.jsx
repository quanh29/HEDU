import React from 'react';
import styles from './BasicInfo.module.css';

const BasicInfo = ({ courseData, errors, handleInputChange, handleArrayFieldChange, addArrayField, removeArrayField }) => {
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
          <div className={styles.flex}>
            <input
              type="url"
              value={courseData.thumbnail}
              onChange={(e) => handleInputChange('thumbnail', e.target.value)}
              placeholder="URL ảnh thumbnail..."
              className={styles.input}
              style={{flex: 1}}
            />
            {/* Upload button placeholder */}
            <button className={styles.removeBtn}>Tải lên</button>
          </div>
          {courseData.thumbnail && (
            <div>
              <img
                src={courseData.thumbnail}
                alt="Course thumbnail"
                className={styles.imgThumb}
              />
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
              <option value="beginner">Cơ bản</option>
              <option value="intermediate">Trung cấp</option>
              <option value="advanced">Nâng cao</option>
            </select>
          </div>
          <div>
            <label className={styles.label}>Ngôn ngữ</label>
            <select
              value={courseData.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
              className={styles.select}
            >
              <option value="vietnamese">Tiếng Việt</option>
              <option value="english">English</option>
            </select>
          </div>
        </div>
        {/* Category & Subcategory */}
        <div className={styles.grid2}>
          <div>
            <label className={styles.label}>Danh mục khóa học *</label>
            <select
              value={courseData.category}
              onChange={e => handleInputChange('category', e.target.value)}
              className={styles.select}
            >
              <option value="">Chọn danh mục</option>
              <option value="programming">Lập trình</option>
              <option value="design">Thiết kế</option>
              <option value="marketing">Marketing</option>
              <option value="business">Kinh doanh</option>
              <option value="other">Khác</option>
            </select>
          </div>
          <div>
            <label className={styles.label}>Danh mục con</label>
            <select
              value={courseData.subcategory}
              onChange={e => handleInputChange('subcategory', e.target.value)}
              className={styles.select}
            >
              <option value="" >Chọn danh mục con</option>
              {courseData.category === 'programming' && <>
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="mobile">Mobile</option>
                <option value="data-science">Khoa học dữ liệu</option>
              </>}
              {courseData.category === 'design' && <>
                <option value="graphic">Thiết kế đồ họa</option>
                <option value="uiux">UI/UX</option>
              </>}
              {courseData.category === 'marketing' && <>
                <option value="digital">Digital Marketing</option>
                <option value="content">Content Marketing</option>
              </>}
              {courseData.category === 'business' && <>
                <option value="startup">Khởi nghiệp</option>
                <option value="management">Quản trị</option>
              </>}
            </select>
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
    </div>
  );
};

export default BasicInfo;
