# API Response Structure - Course Page

## Endpoint: GET `/api/course/:courseId/full`

### Response Format

```json
{
  "course": {
    // Thông tin cơ bản khóa học (từ MySQL)
    "course_id": "uuid",
    "title": "Tên khóa học",
    "subTitle": "Tiêu đề phụ",
    "des": "Mô tả khóa học",
    "rating": 4.5,
    "reviewCount": 100,
    "originalPrice": 1000000,
    "currentPrice": 500000,
    "has_practice": true,
    "has_certificate": false,
    "picture_url": "https://...",
    "course_status": "approved",
    "level_title": "Beginner",
    "language_title": "Vietnamese",
    
    // Instructor info
    "instructor_id": "uuid",
    "instructor_user_id": "uuid",
    "fName": "Nguyễn",
    "lName": "Văn A",
    "avaUrl": "https://...",
    "headline": "Senior Developer",
    "instructors": [
      {
        "_id": "uuid",
        "fullName": "Nguyễn Văn A",
        "avaUrl": "https://...",
        "headline": "Senior Developer"
      }
    ],
    
    // Từ MongoDB
    "requirements": [
      "Requirement 1",
      "Requirement 2"
    ],
    "objectives": [
      "Objective 1",
      "Objective 2"
    ],
    
    // Categories
    "categories": [
      {
        "category_id": "uuid",
        "title": "Web Development"
      }
    ]
  },
  
  "sections": [
    {
      "_id": "section_id",
      "course_id": "course_uuid",
      "title": "Section 1: Introduction",
      "order": 1,
      "lessonCount": 5,
      "lessons": [
        {
          "_id": "lesson_id",
          "type": "video",
          "title": "Welcome to the course",
          "order": 1
          // ❌ KHÔNG có: contentUrl, description
        },
        {
          "_id": "lesson_id",
          "type": "material",
          "title": "Course syllabus PDF",
          "order": 2
          // ❌ KHÔNG có: contentUrl
        },
        {
          "_id": "lesson_id",
          "type": "quiz",
          "title": "Introduction Quiz",
          "description": "Test your knowledge",
          "questionCount": 5,
          "order": 3
          // ❌ KHÔNG có: questions, correctAnswers, explanation
        }
      ]
    }
  ],
  
  "stats": {
    "totalSections": 4,
    "totalVideos": 10,
    "totalMaterials": 5,
    "totalQuizzes": 2,
    "totalLessons": 17
  }
}
```

## 🔒 Security Notes

### Thông tin KHÔNG trả về cho public:

1. **Videos:**
   - ❌ `contentUrl` - URL video thực tế
   - ❌ `description` - Mô tả chi tiết

2. **Materials:**
   - ❌ `contentUrl` - URL file tài liệu thực tế

3. **Quizzes:**
   - ❌ `questions` - Nội dung câu hỏi chi tiết
   - ❌ `correctAnswers` - Đáp án đúng
   - ❌ `explanation` - Giải thích đáp án
   - ✅ Chỉ có: title, description, questionCount

### Các route để lấy nội dung chi tiết (protected):

```javascript
// Video - yêu cầu authentication/enrollment
GET /api/video/:videoId
Response: { contentUrl, description, ... }

// Material - yêu cầu authentication/enrollment
GET /api/material/:materialId
Response: { contentUrl, ... }

// Quiz - để làm bài (không có đáp án)
GET /api/quiz/student/:quizId
Response: { questions: [{ questionText, options }] }
// ❌ Không có correctAnswers, explanation

// Quiz - nộp bài và nhận kết quả
POST /api/quiz/submit/:quizId
Body: { answers: [...] }
Response: { score, results with correctAnswers and explanation }
```

## 📊 Usage in CoursePage.jsx

```javascript
useEffect(() => {
  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/course/${courseId}/full`);
      const data = await response.json();
      
      // data.course - Thông tin khóa học
      // data.sections - Danh sách sections với lessons
      // data.stats - Thống kê tổng quan
      
      setCourse(data);
    } catch (error) {
      console.error(error);
    }
  };
  
  fetchCourse();
}, [courseId]);

// Hiển thị curriculum
{course.sections.map(section => (
  <div key={section._id}>
    <h3>{section.title} ({section.lessonCount} lessons)</h3>
    <ul>
      {section.lessons.map(lesson => (
        <li key={lesson._id}>
          {lesson.type === 'video' && '🎥'}
          {lesson.type === 'material' && '📄'}
          {lesson.type === 'quiz' && '📝'}
          {lesson.title}
          {lesson.type === 'quiz' && ` (${lesson.questionCount} questions)`}
        </li>
      ))}
    </ul>
  </div>
))}

// Hiển thị stats
<div>
  <p>{course.stats.totalSections} sections</p>
  <p>{course.stats.totalLessons} lessons</p>
  <p>{course.stats.totalVideos} videos</p>
  <p>{course.stats.totalMaterials} materials</p>
  <p>{course.stats.totalQuizzes} quizzes</p>
</div>
```

## ✅ Benefits

1. **Security**: Không lộ nội dung trả phí ra ngoài
2. **Performance**: Giảm kích thước response
3. **User Experience**: Hiển thị đủ thông tin để user quyết định mua
4. **Flexibility**: Dễ dàng thêm/bớt fields khi cần

## 🎯 Next Steps

Khi user đã mua khóa học hoặc đăng nhập:
1. Gọi `/api/video/:videoId` để lấy video URL
2. Gọi `/api/material/:materialId` để lấy file URL
3. Gọi `/api/quiz/student/:quizId` để làm quiz
4. Submit quiz qua `/api/quiz/submit/:quizId`
