import React from 'react';
import styles from './CourseFilter.module.css';

const CourseFilter = ({ filters, onFilterChange, onCheckboxChange, onApplyFilters }) => {
  return (
    <div className={styles.filterContainer}>
      {/* Các filter còn lại */}
      {/* <select 
        value={filters.topic}
        onChange={e => onFilterChange('topic', e.target.value)}
        className={styles.select}
      >
        <option value="" disabled hidden>Chủ đề</option>
        <option value="analysis">Phân tích</option>
        <option value="data">Dữ liệu</option>
        <option value="business">Kinh doanh</option>
      </select> */}
      <select 
        value={filters.price}
        onChange={e => onFilterChange('price', e.target.value)}
        className={styles.select}
      >
        <option value="" disabled hidden>Giá</option>
        <option value="">Tất cả</option>
        <option value="free">Miễn phí</option>
        <option value="paid">Trả phí</option>
        <option value="under-500k">Dưới 500k</option>
        <option value="500k-1m">500k - 1M</option>
        <option value="over-1m">Trên 1M</option>
      </select>
      <select 
        value={filters.language}
        onChange={e => onFilterChange('language', e.target.value)}
        className={styles.select}
      >
        <option value="" disabled hidden>Ngôn ngữ</option>
        <option value="">Tất cả</option>
        <option value="vietnamese">Tiếng Việt</option>
        <option value="english">Tiếng Anh</option>
        <option value="japanese">Tiếng Nhật</option>
        <option value="french">Tiếng Pháp</option>
        <option value="spanish">Tiếng Tây Ba Nha</option>
      </select>
      <select 
        value={filters.level}
        onChange={e => onFilterChange('level', e.target.value)}
        className={styles.select}
      >
        <option value="" disabled hidden>Cấp độ</option>
        <option value="">Tất cả</option>
        <option value="beginner">Người mới bắt đầu</option>
        <option value="intermediate">Trung cấp</option>
        <option value="advanced">Chuyên gia</option>
      </select>
      <button
        onClick={() => onCheckboxChange('hasPractice', !filters.hasPractice)}
        className={`${styles.button} ${filters.hasPractice ? styles.buttonActive : ''}`}
      >
        Có thực hành
      </button>
      <button
        onClick={() => onCheckboxChange('hasCertificate', !filters.hasCertificate)}
        className={`${styles.button} ${filters.hasCertificate ? styles.buttonActive : ''}`}
      >
        Có chứng chỉ
      </button>
      {/* <button
        onClick={() => onCheckboxChange('hasProject', !filters.hasProject)}
        className={`${styles.button} ${filters.hasProject ? styles.buttonActive : ''}`}
      >
        Có dự án
      </button> */}
      {/* Sort filter sang phải, dùng class riêng */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <select 
          value={filters.sort}
          onChange={e => onFilterChange('sort', e.target.value)}
          style={{ border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', background: 'white', color: '#3182ce', fontWeight: 500, cursor: 'pointer' }}
        >
          <option value="relevance">Liên quan nhất</option>
          <option value="rating">Đánh giá cao nhất</option>
          <option value="newest">Mới nhất</option>
          <option value="price-asc">Giá thấp đến cao</option>
          <option value="price-desc">Giá cao đến thấp</option>
        </select>
        
        {/* Apply Filter Button */}
        <button
          onClick={onApplyFilters}
          className={styles.applyButton}
        >
          Áp dụng
        </button>
      </div>
    </div>
  );
};

export default CourseFilter;
