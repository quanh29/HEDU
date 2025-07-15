import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../../components/Card/Card.jsx';
import CourseFilter from '../../components/CourseFilter/CourseFilter.jsx';

const CourseSearch = () => {
  const [searchTerm, setSearchTerm] = useState('Business analyst');
  const [filters, setFilters] = useState({
    topic: '',
    price: '',
    language: '',
    difficulty: '',
    level: '',
    hasPractice: false,
    hasCertificate: false,
    hasProject: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('relevance');
  const coursesPerPage = 16;

  // Dữ liệu mẫu các khóa học
  const sampleCourses = [
    {
      courseId: 1,
      title: "Complete Business Analysis Course - From Beginner to Advanced",
      instructors: ["John Smith", "Sarah Johnson"],
      rating: 4.8,
      reviewCount: 2456,
      originalPrice: 1999000,
      currentPrice: 599000,
      image: "https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=400&q=80"
    },
    {
      courseId: 2,
      title: "Data Analysis for Business Decisions",
      instructors: ["Mike Chen"],
      rating: 4.6,
      reviewCount: 1823,
      originalPrice: 1599000,
      currentPrice: 799000,
      image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=400&q=80"
    },
    {
      courseId: 3,
      title: "Business Intelligence & Analytics Masterclass",
      instructors: ["Emily Davis", "Robert Wilson"],
      rating: 4.9,
      reviewCount: 3241,
      originalPrice: 2499000,
      currentPrice: 899000,
      image: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80"
    },
    {
      courseId: 4,
      title: "SQL for Business Analysts",
      instructors: ["David Brown"],
      rating: 4.7,
      reviewCount: 1567,
      originalPrice: 1299000,
      currentPrice: 499000,
      image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80"
    },
    {
      courseId: 5,
      title: "Requirements Analysis & Documentation",
      instructors: ["Lisa Taylor"],
      rating: 4.5,
      reviewCount: 987,
      originalPrice: 1199000,
      currentPrice: 599000,
      image: "https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=400&q=80"
    },
    {
      courseId: 6,
      title: "Agile Business Analysis Fundamentals",
      instructors: ["Mark Johnson"],
      rating: 4.6,
      reviewCount: 1234,
      originalPrice: 1399000,
      currentPrice: 699000,
      image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80"
    },
    {
      courseId: 7,
      title: "Business Process Modeling with BPMN",
      instructors: ["Anna Kim"],
      rating: 4.4,
      reviewCount: 756,
      originalPrice: 999000,
      currentPrice: 399000,
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80"
    },
    {
      courseId: 8,
      title: "Stakeholder Management for Business Analysts",
      instructors: ["James Wilson"],
      rating: 4.8,
      reviewCount: 1876,
      originalPrice: 1599000,
      currentPrice: 799000,
      image: "https://images.unsplash.com/photo-1519985176271-adb1088fa94c?auto=format&fit=crop&w=400&q=80"
    },
    {
      courseId: 9,
      title: "Power BI for Business Analysis",
      instructors: ["Rachel Green"],
      rating: 4.7,
      reviewCount: 2134,
      originalPrice: 1799000,
      currentPrice: 899000,
      image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80"
    },
    {
      courseId: 10,
      title: "Business Analysis Tools & Techniques",
      instructors: ["Tom Anderson"],
      rating: 4.5,
      reviewCount: 1456,
      originalPrice: 1499000,
      currentPrice: 749000,
      image: "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=400&q=80"
    },
    {
      courseId: 11,
      title: "Financial Analysis for Business Decisions",
      instructors: ["Susan Lee"],
      rating: 4.6,
      reviewCount: 1789,
      originalPrice: 1699000,
      currentPrice: 849000,
      image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=400&q=80"
    },
    {
      courseId: 12,
      title: "Market Research & Competitive Analysis",
      instructors: ["Peter Martinez"],
      rating: 4.4,
      reviewCount: 923,
      originalPrice: 1299000,
      currentPrice: 649000,
      image: "https://images.unsplash.com/photo-1517263904808-5dc0d6e1ad81?auto=format&fit=crop&w=400&q=80"
    },
    {
      courseId: 13,
      title: "Business Case Development",
      instructors: ["Jennifer White"],
      rating: 4.7,
      reviewCount: 1567,
      originalPrice: 1399000,
      currentPrice: 699000,
      image: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80"
    },
    {
      courseId: 14,
      title: "Risk Analysis in Business",
      instructors: ["Michael Brown"],
      rating: 4.5,
      reviewCount: 1234,
      originalPrice: 1199000,
      currentPrice: 599000,
      image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80"
    },
    {
      courseId: 15,
      title: "User Story Writing Workshop",
      instructors: ["Ashley Davis"],
      rating: 4.8,
      reviewCount: 1876,
      originalPrice: 999000,
      currentPrice: 499000,
      image: "https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=400&q=80"
    },
    {
      courseId: 16,
      title: "Business Analysis Certification Prep",
      instructors: ["Robert Johnson"],
      rating: 4.9,
      reviewCount: 2456,
      originalPrice: 1999000,
      currentPrice: 999000,
      image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80"
    }
  ];

  // Tạo thêm dữ liệu để có đủ cho nhiều trang
  const allCourses = [...sampleCourses, ...sampleCourses.map(course => ({
    ...course,
    courseId: course.courseId + 16,
    title: course.title + " - Advanced Edition"
  }))];

  const totalPages = Math.ceil(allCourses.length / coursesPerPage);
  const startIndex = (currentPage - 1) * coursesPerPage;
  const currentCourses = allCourses.slice(startIndex, startIndex + coursesPerPage);

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
          />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '100%', margin: '0 auto', padding: '30px 20px'}}>
        {/* Results Info */}
        <div style={{ marginBottom: '30px', marginLeft: '25vw' }}>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Hiển thị {startIndex + 1}-{Math.min(startIndex + coursesPerPage, allCourses.length)} trong {allCourses.length} kết quả
          </p>
        </div>

        {/* Course Grid */}
        <div style={{ 
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '40px',
          marginLeft: '25vw',
          marginRight: '25vw',
        }}>
          {currentCourses.map((course) => (
            <Card
              key={course.courseId}
              courseId={course.courseId}
              title={course.title}
              instructors={course.instructors}
              rating={course.rating}
              reviewCount={course.reviewCount}
              originalPrice={course.originalPrice}
              currentPrice={course.currentPrice}
              image={course.image}
            />
          ))}
        </div>

        {/* Pagination */}
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
      </div>
    </div>
  );
};

export default CourseSearch;