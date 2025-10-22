# API Course Content - Hướng dẫn sử dụng

## Route mới: `/api/courses/:courseId/content`

### Mô tả
Route này được tạo để phục vụ trang **CourseContent** - nơi học viên đã đăng ký có thể xem và truy cập đầy đủ nội dung của khóa học.

### Endpoint
```
GET /api/courses/:courseId/content
```

### Parameters
- `courseId` (string, required): ID của khóa học cần lấy nội dung

### Response Format

```json
{
  "course": {
    "courseId": "string",
    "title": "string",
    "description": "string",
    "thumbnail": "string (URL)"
  },
  "sections": [
    {
      "sectionId": "string",
      "title": "string",
      "courseTitle": "string",
      "order": "number",
      "lessons": [
        {
          "lessonId": "string",
          "type": "video" | "document" | "quiz",
          "title": "string",
          "order": "number",
          "completed": "boolean",
          
          // Nếu type === "video"
          "contentUrl": "string",
          "description": "string",
          "duration": "string (MM:SS)",
          
          // Nếu type === "document"
          "contentUrl": "string",
          "fileType": "string (pdf, doc, etc.)",
          "fileSize": "string",
          "fileName": "string",
          
          // Nếu type === "quiz"
          "description": "string",
          "questionCount": "number",
          "questions": [
            {
              "questionText": "string",
              "options": ["array of strings"]
              // NOTE: correctAnswers và explanation không được trả về
            }
          ]
        }
      ]
    }
  ]
}
```

### Ví dụ Response

```json
{
  "course": {
    "courseId": "course123",
    "title": "Lập trình Web từ cơ bản đến nâng cao",
    "description": "Khóa học toàn diện về lập trình web",
    "thumbnail": "https://example.com/thumbnail.jpg"
  },
  "sections": [
    {
      "sectionId": "section1",
      "title": "Giới thiệu",
      "courseTitle": "Lập trình Web từ cơ bản đến nâng cao",
      "order": 1,
      "lessons": [
        {
          "lessonId": "lesson1",
          "type": "video",
          "title": "Chào mừng đến với khóa học",
          "contentUrl": "https://example.com/videos/intro.mp4",
          "description": "Video giới thiệu khóa học",
          "duration": "5:30",
          "order": 1,
          "completed": false
        },
        {
          "lessonId": "lesson2",
          "type": "document",
          "title": "Tài liệu tham khảo",
          "contentUrl": "https://example.com/docs/reference.pdf",
          "fileType": "pdf",
          "fileSize": "2.5MB",
          "fileName": "reference.pdf",
          "order": 2,
          "completed": false
        },
        {
          "lessonId": "lesson3",
          "type": "quiz",
          "title": "Kiểm tra kiến thức",
          "description": "Bài kiểm tra về phần giới thiệu",
          "questionCount": 5,
          "questions": [
            {
              "questionText": "HTML là gì?",
              "options": [
                "Ngôn ngữ đánh dấu",
                "Ngôn ngữ lập trình",
                "Framework",
                "Database"
              ]
            }
          ],
          "order": 3,
          "completed": false
        }
      ]
    }
  ]
}
```

### Sự khác biệt với route `/api/courses/:courseId/full`

| Feature | `/full` (Public) | `/content` (Enrolled Users) |
|---------|------------------|----------------------------|
| Course info | ✅ | ✅ |
| Sections list | ✅ | ✅ |
| Lesson titles | ✅ | ✅ |
| Video contentUrl | ❌ | ✅ |
| Video description | ❌ | ✅ |
| Material contentUrl | ❌ | ✅ |
| Quiz questions | ❌ | ✅ (no answers) |
| Quiz correct answers | ❌ | ❌ |
| Quiz explanations | ❌ | ❌ |

### Bảo mật
- Route này chỉ trả về khóa học có status = 'approved'
- Đáp án và giải thích của quiz **KHÔNG** được trả về để tránh gian lận
- Trong tương lai, nên thêm middleware xác thực để đảm bảo người dùng đã đăng ký khóa học

### Cách sử dụng trong Frontend

```javascript
// CourseContent.jsx
const fetchCourseContent = async () => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/courses/${courseId}/content`
    );
    const data = await response.json();
    
    setCourse(data.course);
    setSections(data.sections);
  } catch (error) {
    console.error('Error fetching course content:', error);
  }
};
```

### TODO - Tính năng nâng cao
1. **Authentication middleware**: Kiểm tra user đã đăng ký khóa học chưa
2. **Progress tracking**: Lưu và trả về trạng thái `completed` cho từng lesson
3. **Video duration**: Tính toán thời lượng video thực tế từ file
4. **File size**: Lấy kích thước file thực tế của materials
5. **Quiz results**: API riêng để submit và kiểm tra đáp án quiz
6. **Access control**: Kiểm tra quyền truy cập theo tiến trình học (sequential access)

## Models liên quan

### MongoDB Models
- **Course**: Lưu requirements, objectives
- **Section**: Các chương/phần của khóa học
- **Video**: Video bài giảng
- **Material**: Tài liệu học tập
- **Quiz**: Bài kiểm tra

### MySQL Tables
- **Courses**: Thông tin cơ bản khóa học
- **Users**: Thông tin giảng viên
- **Levels**: Cấp độ khóa học
- **Languages**: Ngôn ngữ giảng dạy

## Controller Function

File: `backend/controllers/courseController.js`

Function: `getCourseContentForEnrolledUser(req, res)`

Export được thêm vào: `backend/routes/courseRoute.js`
