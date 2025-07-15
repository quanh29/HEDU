
import React, { useState } from 'react';
import styles from './MyLearning.module.css';
import EnrolledCard from '../../components/EnrolledCard/EnrolledCard';
import TabSwitch from '../../components/TabSwitch/TabSwitch';

// Dữ liệu mẫu cho các khóa học đã đăng ký
const enrolledCourses = [
  {
    id: 1,
    title: "Lập trình Web từ cơ bản đến nâng cao",
    instructor: "Nguyễn Văn A",
    image: "https://media.tenor.com/6d-TGfcta6EAAAAe/meme-blue-archive.png",
    progress: 0,
    totalLessons: 120,
    completedLessons: 0,
    lastAccessed: "2 ngày trước",
    duration: "40 giờ",
    rating: 4.8
  },
  {
    id: 2,
    title: "React.js từ Zero đến Hero",
    instructor: "Trần Thị B",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkKlOcX1ybokobqWGzQDACUmci5V5uOtqbTA&s",
    progress: 45,
    totalLessons: 80,
    completedLessons: 36,
    lastAccessed: "1 tuần trước",
    duration: "25 giờ",
    rating: 4.9
  },
  {
    id: 3,
    title: "Node.js và Backend Development",
    instructor: "Lê Văn C",
    image: "https://i.ytimg.com/vi/sgVe7QYBGBU/maxresdefault.jpg",
    progress: 20,
    totalLessons: 95,
    completedLessons: 19,
    lastAccessed: "3 ngày trước",
    duration: "35 giờ",
    rating: 4.7
  },
  {
    id: 4,
    title: "UI/UX Design với Figma",
    instructor: "Phạm Thị D",
    image: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/d5004956-c7d5-44dc-b1c3-080cf8827715/de6q8q7-60682995-4335-4830-a5e5-f78cdad08483.jpg/v1/fill/w_1280,h_720,q_75,strp/fischl_wallpaper__genshin_impact__by_nathanjrrf_de6q8q7-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NzIwIiwicGF0aCI6IlwvZlwvZDUwMDQ5NTYtYzdkNS00NGRjLWIxYzMtMDgwY2Y4ODI3NzE1XC9kZTZxOHE3LTYwNjgyOTk1LTQzMzUtNDgzMC1hNWU1LWY3OGNkYWQwODQ4My5qcGciLCJ3aWR0aCI6Ijw9MTI4MCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.wdPNMY0pmTdHBcyJo3q-qXWdBMKz8Ht4wsySLe3INB4",
    progress: 100,
    totalLessons: 60,
    completedLessons: 54,
    lastAccessed: "1 ngày trước",
    duration: "20 giờ",
    rating: 4.6
  },
  {
    id: 5,
    title: "JavaScript ES6+ và Modern JS",
    instructor: "Hoàng Văn E",
    image: "https://minhtuanmobile.com/uploads/blog/lich-bao-tri-phien-ban-genshin-impact-5-1-241008102259.jpg",
    progress: 60,
    totalLessons: 75,
    completedLessons: 45,
    lastAccessed: "5 ngày trước",
    duration: "30 giờ",
    rating: 4.8
  },
  {
    id: 6,
    title: "Python cho Data Science",
    instructor: "Vũ Thị F",
    image: "https://cellphones.com.vn/sforum/wp-content/uploads/2023/05/honkai-star-rail-1-5.jpg",
    progress: 10,
    totalLessons: 100,
    completedLessons: 10,
    lastAccessed: "2 tuần trước",
    duration: "45 giờ",
    rating: 4.5
  }
];

function MyLearning() {
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    {
      id: 'all',
      label: 'Tất cả khóa học',
      icon: '📚',
      count: enrolledCourses.length
    },
    {
      id: 'in-progress',
      label: 'Đang học',
      icon: '🎯',
      count: enrolledCourses.filter(course => course.progress > 0 && course.progress < 100).length
    },
    {
      id: 'completed',
      label: 'Hoàn thành',
      icon: '✅',
      count: enrolledCourses.filter(course => course.progress === 100).length
    },
    {
      id: 'not-started',
      label: 'Chưa bắt đầu',
      icon: '⭐',
      count: enrolledCourses.filter(course => course.progress === 0).length
    },
  ];

  const getFilteredCourses = () => {
    switch (activeTab) {
      case 'in-progress':
        return enrolledCourses.filter(course => course.progress > 0 && course.progress < 100);
      case 'completed':
        return enrolledCourses.filter(course => course.progress === 100);
      case 'not-started':
        return enrolledCourses.filter(course => course.progress === 0);
      default:
        return enrolledCourses;
    }
  };

  const filteredCourses = getFilteredCourses();
  const handleContinueLearning = (courseId) => {
    console.log(`Continue learning course ${courseId}`);
    // Navigate to course detail or learning page
  };

  const getProgressColor = (progress) => {
    return '#10b981'; // Green
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Khóa học của tôi</h1>
        <p className={styles.subtitle}>Tiếp tục học tập và phát triển kỹ năng của bạn</p>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <h3 className={styles.statNumber}>{enrolledCourses.length}</h3>
          <p className={styles.statLabel}>Khóa học đã đăng ký</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.statNumber}>
            {enrolledCourses.filter(course => course.progress === 100).length}
          </h3>
          <p className={styles.statLabel}>Khóa học hoàn thành</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.statNumber}>
            {Math.round(enrolledCourses.reduce((acc, course) => acc + course.progress, 0) / enrolledCourses.length)}%
          </h3>
          <p className={styles.statLabel}>Tiến độ trung bình</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.statNumber}>
            {enrolledCourses.reduce((acc, course) => acc + course.completedLessons, 0)}
          </h3>
          <p className={styles.statLabel}>Bài học đã hoàn thành</p>
        </div>
      </div>

      <TabSwitch 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className={styles.coursesGrid}>
        {filteredCourses.length > 0 ? (
          filteredCourses.map(course => (
            <EnrolledCard
              key={course.id}
              courseId={course.id}
              courseTitle={course.title}
              course={course}
              onContinueLearning={handleContinueLearning}
              getProgressColor={getProgressColor}
            />
          ))
        ) : (
          <div className={styles.emptyCourses}>
            <p>Không có khóa học nào trong danh mục này.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyLearning;