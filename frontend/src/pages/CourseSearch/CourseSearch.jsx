import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../../components/Card/Card.jsx';
import CourseFilter from '../../components/CourseFilter/CourseFilter.jsx';
import axios from 'axios';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';

const CourseSearch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const titleQuery = searchParams.get('title') || '';
  
  const [searchTerm, setSearchTerm] = useState(titleQuery || '');
  
  // Set dynamic title
  useDocumentTitle(
    searchTerm 
      ? `Tìm kiếm: ${searchTerm}` 
      : 'Tìm kiếm khóa học'
  );

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    topic: '',
    price: searchParams.get('price') || '',
    language: searchParams.get('language') || '',
    difficulty: '',
    level: searchParams.get('level') || '',
    hasPractice: false,
    hasCertificate: false,
    hasProject: false,
    sort: searchParams.get('sort') || 'relevance'
  });
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const coursesPerPage = 12; // Khớp với backend limit

  // Update state when URL parameters change
  useEffect(() => {
    const titleQuery = searchParams.get('title') || '';
    const categoryQuery = searchParams.get('category') || '';
    const priceQuery = searchParams.get('price') || '';
    const languageQuery = searchParams.get('language') || '';
    const levelQuery = searchParams.get('level') || '';
    const sortQuery = searchParams.get('sort') || 'relevance';
    const pageQuery = parseInt(searchParams.get('page')) || 1;
    const pracQuery = searchParams.get('prac') === 'true';
    const certQuery = searchParams.get('cert') === 'true';
    
    setSearchTerm(titleQuery);
    setFilters(prev => ({
      ...prev,
      category: categoryQuery,
      price: priceQuery,
      language: languageQuery,
      level: levelQuery,
      sort: sortQuery,
      hasPractice: pracQuery,
      hasCertificate: certQuery
    }));
    setCurrentPage(pageQuery);
  }, [searchParams]);

  // Reset page to 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Function to apply filters and update URL
  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    
    // Thêm các parameters
    const categoryParam = searchParams.get('category') || '';
    if (searchTerm) params.append('title', searchTerm);
    if (categoryParam) params.append('category', categoryParam);
    if (filters.level && filters.level !== '') params.append('level', filters.level);
    if (filters.language && filters.language !== '') params.append('language', filters.language);
    if (filters.price && filters.price !== '') params.append('price', filters.price);
    if (filters.sort && filters.sort !== 'relevance') params.append('sort', filters.sort);
    if (filters.hasPractice) params.append('prac', 'true');
    if (filters.hasCertificate) params.append('cert', 'true');
    params.append('page', '1'); // Reset to page 1 when applying filters

    // Update URL
    navigate(`/course/search?${params.toString()}`, { replace: true });
    
    // Reset current page
    setCurrentPage(1);
  };

  // Function to fetch courses from API
  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      
      // Đọc từ URL parameters
      const titleParam = searchParams.get('title') || '';
      const categoryParam = searchParams.get('category') || '';
      const levelParam = searchParams.get('level') || '';
      const languageParam = searchParams.get('language') || '';
      const priceParam = searchParams.get('price') || '';
      const sortParam = searchParams.get('sort') || '';
      const pageParam = searchParams.get('page') || '1';
      const pracParam = searchParams.get('prac') || '';
      const certParam = searchParams.get('cert') || '';
      
      // Thêm các parameters
      if (titleParam) params.append('title', titleParam);
      if (categoryParam) params.append('category', categoryParam);
      if (levelParam) params.append('level', levelParam);
      if (languageParam) params.append('language', languageParam);
      if (priceParam) params.append('price', priceParam);
      if (sortParam && sortParam !== 'relevance') params.append('sort', sortParam);
      if (pracParam) params.append('prac', pracParam);
      if (certParam) params.append('cert', certParam);
      params.append('page', pageParam);

      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/course/search?${params.toString()}`);
      
      // Extract courses from response (backend returns array of {course, score})
      const coursesData = response.data.map(item => item.course || item);
      setCourses(coursesData);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Không thể tải dữ liệu khóa học. Vui lòng thử lại.');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch courses when URL parameters change
  useEffect(() => {
    fetchCourses();
  }, [searchParams]); // Chỉ fetch khi URL parameters thay đổi

  // Calculate pagination based on API data (giả sử mỗi page có 12 items từ backend)
  const totalCourses = courses.length;
  const totalPages = Math.ceil(totalCourses / coursesPerPage) || 1;
  const startIndex = 0; // Backend đã handle pagination
  const currentCourses = courses; // Backend đã trả về courses cho page hiện tại

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1); // Reset về trang 1 khi filter thay đổi
  };

  const handleCheckboxChange = (filterType, checked) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: checked
    }));
    setCurrentPage(1); // Reset về trang 1 khi filter thay đổi
  };

  const handlePageChange = (page) => {
    const params = new URLSearchParams();
    
    // Thêm các parameters hiện tại
    const categoryParam = searchParams.get('category') || '';
    if (searchTerm) params.append('title', searchTerm);
    if (categoryParam) params.append('category', categoryParam);
    if (filters.level && filters.level !== '') params.append('level', filters.level);
    if (filters.language && filters.language !== '') params.append('language', filters.language);
    if (filters.price && filters.price !== '') params.append('price', filters.price);
    if (filters.sort && filters.sort !== 'relevance') params.append('sort', filters.sort);
    if (filters.hasPractice) params.append('prac', 'true');
    if (filters.hasCertificate) params.append('cert', 'true');
    params.append('page', page.toString());

    // Update URL
    navigate(`/course/search?${params.toString()}`, { replace: true });
    
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f7fafc', paddingTop: '80px' }}>
      {/* Header với filters */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', 'padding-top': '20px', paddingBottom: '2px'}}>

          {/* Filters */}
          <CourseFilter 
            filters={filters}
            onFilterChange={handleFilterChange}
            onCheckboxChange={handleCheckboxChange}
            onApplyFilters={handleApplyFilters}
          />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '100%', margin: '0 auto', padding: '30px 20px'}}>
        {/* Results Info */}
        <div style={{ marginBottom: '30px', marginLeft: '25vw' }}>
          {loading ? (
            <p style={{ color: '#666', fontSize: '14px' }}>Đang tải...</p>
          ) : error ? (
            <p style={{ color: '#e53e3e', fontSize: '14px' }}>{error}</p>
          ) : (
            <p style={{ color: '#666', fontSize: '14px' }}>
              Hiển thị {coursesPerPage * (currentPage - 1) + 1}-{Math.min(coursesPerPage * currentPage, totalCourses)} trong {totalCourses} kết quả
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <div style={{ fontSize: '18px', color: '#666' }}>Đang tải khóa học...</div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <div style={{ fontSize: '18px', color: '#e53e3e', textAlign: 'center' }}>
              <p>{error}</p>
              <button 
                onClick={fetchCourses}
                style={{
                  marginTop: '10px',
                  padding: '10px 20px',
                  backgroundColor: '#3182ce',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        {/* Course Grid (cần điều chỉnh đoạn này)*/} 
        {!loading && !error && (
          <>
            {currentCourses.length > 0 ? (
              <div style={{ 
                display: 'flex',
                flexWrap: 'wrap',
                width: '66vw',
                gap: '20px',
                marginBottom: '40px',
                marginLeft: '17vw',
                marginRight: '17vw',
              }}>
                {currentCourses.map((course) => (
                  <Card
                    key={course.course_id || course._id}
                    courseId={course.course_id || course._id}
                    title={course.title}
                    instructors={course.instructors}
                    rating={course.rating}
                    reviewCount={course.reviewCount}
                    originalPrice={course.originalPrice}
                    currentPrice={course.currentPrice}
                    image={course.picture_url}
                  />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                <div style={{ fontSize: '18px', color: '#666', textAlign: 'center' }}>
                  <p>Không tìm thấy khóa học nào phù hợp</p>
                  <p style={{ fontSize: '14px', marginTop: '10px' }}>Hãy thử tìm kiếm với từ khóa khác</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Pagination - chỉ hiển thị khi có courses và không loading */}
        {!loading && !error && currentCourses.length > 0 && totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '10px',
            marginTop: '40px'
          }}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                backgroundColor: currentPage === 1 ? '#f7fafc' : 'white',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: currentPage === 1 ? '#a0aec0' : '#4a5568'
              }}
            >
              <ChevronLeft size={16} />
            </button>

            {renderPagination().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span style={{ padding: '10px 12px', color: '#666' }}>...</span>
                ) : (
                  <button
                    onClick={() => handlePageChange(page)}
                    style={{
                      padding: '10px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      backgroundColor: currentPage === page ? '#3182ce' : 'white',
                      color: currentPage === page ? 'white' : '#4a5568',
                      cursor: 'pointer',
                      fontWeight: currentPage === page ? 'bold' : 'normal',
                      minWidth: '44px'
                    }}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                backgroundColor: currentPage === totalPages ? '#f7fafc' : 'white',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: currentPage === totalPages ? '#a0aec0' : '#4a5568'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseSearch;