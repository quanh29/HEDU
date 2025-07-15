import React from 'react';
import { useParams } from 'react-router-dom';
import { courseDetailDummy } from './coursepage_dummydata';
import Carousel from '../components/Carousel/Carousel';
import { courses as relatedCourses } from '../assets/dummyData';

function CoursePage() {
  // Lấy slug từ URL
  const { slug } = useParams();

  // Sử dụng dữ liệu mẫu từ file riêng
  const course = courseDetailDummy;

  // ...existing code...

  // Format giá tiền
  const formatPrice = (price) => price.toLocaleString('vi-VN') + 'đ';

  // State cho dropdown curriculum
  const [openSections, setOpenSections] = React.useState([]);

  // Toggle mở/đóng section
  const handleToggleSection = idx => {
    setOpenSections(prev =>
      prev.includes(idx)
        ? prev.filter(i => i !== idx)
        : [...prev, idx]
    );
  };

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginTop: 70, padding: '2rem 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
          {/* Breadcrumb */}
          <div style={{ marginBottom: '1rem', color: '#666' }}>
            <a href="/" style={{ fontWeight: 'bold' }}>Trang chủ</a> &gt; <a href="/courses" style={{ fontWeight: 'bold' }}>Lập trình</a> &gt; <a href="/courses" style={{ fontWeight: 'bold' }}>Web Development</a> &gt; {course.title}
          </div>
          
          {/* Main Layout with Sidebar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '3rem', marginBottom: '3rem', marginLeft: '-10rem', paddingLeft: '2rem' }}>
            {/* Left Column - Main Content */}
            <div>
              {/* Course Layout */}
              <div style={{ marginBottom: '3rem' }}>
                {/* Course Main Info */}
                <div style={{ background: 'white', borderRadius: 15, padding: '2rem', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
                  <div style={{ width: '100%', height: '45rem', background: 'linear-gradient(45deg, #333, #666)', borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0rem', backgroundImage: `url(${course.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    
                  </div>
                  <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem', color: '#333' }}>{course.title}</h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {/* <span style={{ color: '#FFD700', fontSize: '1.2rem' }}>⭐⭐⭐⭐⭐</span> */}
                      <span style={{ fontWeight: 600, color: '#333' }}>{course.rating}</span>
                      <span style={{ color: '#FFD700', fontSize: '1.2rem' }}>⭐</span>
                      <span style={{ color: '#666' }}>({course.reviewCount.toLocaleString('vi-VN')} đánh giá)</span>
                    </div>
                    <div style={{ color: '#666' }}>{course.studentsCount.toLocaleString('vi-VN')} học viên</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    {course.tags.map((tag, idx) => (
                      <span key={idx} style={{ background: '#f8f9fa', color: '#333', padding: '0.3rem 0.8rem', borderRadius: 15, fontSize: '0.8rem', fontWeight: 500, border: '1px solid #ddd' }}>{tag}</span>
                    ))}
                  </div>
                  <p style={{ color: '#555', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '2rem' }}>{course.description}</p>
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ color: '#333', marginBottom: '0.3rem' }}>Giảng viên</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: 10, border: '1px solid #ddd' }}>
                      {course.instructor.avatar ? (
                        <img 
                          src={course.instructor.avatar} 
                          alt={course.instructor.name}
                          style={{ 
                            width: 60, 
                            height: 60, 
                            borderRadius: '50%', 
                            objectFit: 'cover',
                            border: '2px solid #ddd'
                          }} 
                        />
                      ) : (
                        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(45deg, #333, #666)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
                          {course.instructor.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                      <div>
                        <h4 style={{ color: '#333', marginBottom: '0.3rem' }}>{course.instructor.name}</h4>
                        <p style={{ color: '#666', fontSize: '0.9rem' }}>{course.instructor.bio}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* What You'll Learn */}
              <div style={{ background: 'white', borderRadius: 15, padding: '2rem', marginBottom: '2rem', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '1.5rem', color: '#333' }}>Những gì bạn sẽ học được</h2>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {course.objectives.map((obj, idx) => (
                    <li key={idx} style={{ padding: '0.75rem 0', color: '#555', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '1.1rem', lineHeight: 1.6 }}>
                      <span style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '0.1rem' }}>✓</span> {obj}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Requirements */}
              <div style={{ background: 'white', borderRadius: 15, padding: '2rem', marginBottom: '2rem', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '1.5rem', color: '#333' }}>Yêu cầu</h2>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {course.requirements.map((req, idx) => (
                    <li key={idx} style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1rem' }}>📋</span> {req}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Course Description */}
              <div style={{ background: 'white', borderRadius: 15, padding: '2rem', marginBottom: '2rem', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '1.5rem', color: '#333' }}>Mô tả khóa học</h2>
                <div style={{ lineHeight: 1.8, color: '#555' }}>
                  <p style={{ marginBottom: '1.5rem' }}>
                    <strong>Khóa học Lập trình Web từ cơ bản đến nâng cao</strong> là một hành trình toàn diện giúp bạn trở thành một lập trình viên web chuyên nghiệp. Với hơn 40 giờ video chất lượng cao và 120 bài tập thực hành, bạn sẽ học được tất cả những kỹ năng cần thiết để phát triển ứng dụng web hiện đại.
                  </p>
                  <p style={{ marginBottom: '1.5rem' }}>
                    Khóa học bắt đầu từ những kiến thức cơ bản nhất về HTML và CSS, sau đó tiến dần đến JavaScript, các framework hiện đại như React.js, và backend development với Node.js. Mỗi concept đều được giải thích một cách dễ hiểu với nhiều ví dụ thực tế.
                  </p>
                  <p style={{ marginBottom: '1.5rem' }}>
                    Điểm đặc biệt của khóa học là <strong>15 dự án thực tế</strong> từ đơn giản đến phức tạp, giúp bạn áp dụng kiến thức đã học và xây dựng portfolio ấn tượng. Bạn sẽ tạo ra những ứng dụng như blog cá nhân, e-commerce website, social media app, và nhiều hơn nữa.
                  </p>
                  <p>
                    Sau khi hoàn thành khóa học, bạn sẽ có đủ kiến thức và kỹ năng để ứng tuyển vào các vị trí Junior Frontend Developer, Junior Backend Developer, hoặc Full Stack Developer tại các công ty công nghệ.
                  </p>
                </div>
              </div>

              {/* Course Curriculum */}
              <div style={{ background: 'white', borderRadius: 15, padding: '2rem', marginBottom: '2rem', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '1.5rem', color: '#333' }}>Nội dung khóa học</h2>
                <div>
                  {course.curriculum.map((section, idx) => {
                    const isOpen = openSections.includes(idx);
                    return (
                      <div key={idx} style={{ border: '1px solid #eee', borderRadius: 8, marginBottom: '1rem', overflow: 'hidden' }}>
                        <div
                          style={{
                            background: isOpen ? '#e3e7ed' : '#f8f9fa',
                            padding: '1rem 1.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'background 0.3s',
                            border: '1px solid #ddd',
                            fontWeight: 600,
                            color: '#333',
                            userSelect: 'none',
                          }}
                          onClick={() => handleToggleSection(idx)}
                          aria-expanded={isOpen}
                        >
                          <span>{section.title}</span>
                          <span style={{ color: '#666', fontSize: '0.9rem', marginLeft: 10 }}>
                            {section.lessons.length} bài học
                            <span style={{ marginLeft: 16, fontSize: '1.2rem' }}>{isOpen ? '▲' : '▼'}</span>
                          </span>
                        </div>
                        {isOpen && (
                          <div style={{ padding: '0 1.5rem', animation: 'fadeIn 0.3s' }}>
                            {section.lessons.map((lesson, lidx) => (
                              <div key={lidx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #f0f0f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ color: '#666' }}>📄</span>
                                  <span>{lesson}</span>
                                </div>
                                <span style={{ color: '#999', fontSize: '0.85rem' }}>10 phút</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Related Courses */}
              <div style={{ marginTop: '3rem' }}>
                <div style={{ marginTop: '2rem' }}>
                  <Carousel courses={relatedCourses} title="Khóa học liên quan" />
                </div>
              </div>
            </div>

            {/* Right Column - Course Sidebar */}
            <div style={{ position: 'sticky', top: 100, height: 'fit-content' }}>
              <div style={{ background: 'white', borderRadius: 15, padding: '2rem', boxShadow: '0 5px 15px rgba(0,0,0,0.08)', marginBottom: '2rem' }}>
                {course.originalPrice ? (
                  <>
                    <div style={{ textDecoration: 'line-through', color: '#999', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{formatPrice(course.originalPrice)}</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#333', marginBottom: '1rem' }}>{formatPrice(course.currentPrice)}</div>
                  </>
                ) : (
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#333', marginBottom: '1rem' }}>{formatPrice(course.currentPrice)}</div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                  <button
                    style={{
                      padding: '1rem 2rem',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: '#333',
                      color: 'white',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#000';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#333';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    Mua ngay
                  </button>
                  <button
                    style={{
                      padding: '1rem 2rem',
                      border: '2px solid #333',
                      borderRadius: 10,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: 'transparent',
                      color: '#333',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#333';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#333';
                    }}
                  >
                    Thêm vào giỏ hàng
                  </button>
                </div>
                <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: 10, border: '1px solid #ddd' }}>
                  <h4 style={{ marginBottom: '1rem', color: '#333', fontWeight: 'bold' }}>Khóa học bao gồm:</h4>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li>40+ giờ video chất lượng cao</li>
                    <li>120+ bài tập thực hành</li>
                    <li>15 dự án thực tế</li>
                    <li>Chứng chỉ hoàn thành</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoursePage;