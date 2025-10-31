# Cấu trúc dữ liệu khóa học (Course Data Structure)

## Tổng quan

File này mô tả cấu trúc dữ liệu hoàn chỉnh cho hệ thống quản lý khóa học, bao gồm cách dữ liệu được fetch từ backend và transform để sử dụng trong frontend.

## 1. Course Data Structure

### Backend Response Format (từ API)

```javascript
{
  course: {
    _id: "course_id",
    title: "Tên khóa học",
    subtitle: "Phụ đề",
    description: "Mô tả chi tiết",
    thumbnail: "url_to_image",
    originalPrice: 299000,
    level: "beginner" | "intermediate" | "advanced",
    language: "vietnamese" | "english",
    tags: ["tag1", "tag2"],
    objectives: ["Mục tiêu 1", "Mục tiêu 2"],
    requirements: ["Yêu cầu 1", "Yêu cầu 2"],
    hasPractice: true/false,
    hasCertificate: true/false,
    status: "draft" | "pending" | "approved" | "rejected",
    instructors: ["instructor_id"],
    createdAt: "ISO_DATE",
    updatedAt: "ISO_DATE"
  },
  sections: [
    {
      _id: "section_id",
      title: "Tên chương",
      description: "Mô tả chương",
      order: 0,
      courseId: "course_id",
      videos: [...],      // Xem Video Structure
      materials: [...],   // Xem Material Structure
      quizzes: [...],     // Xem Quiz Structure
      createdAt: "ISO_DATE",
      updatedAt: "ISO_DATE"
    }
  ]
}
```

### Frontend State Format (sau khi transform)

```javascript
{
  courseData: {
    title: string,
    subtitle: string,
    description: string,
    thumbnail: string,
    level: string,
    language: string,
    tags: string[],
    objectives: string[],
    requirements: string[],
    category: string,
    subcategory: string,
    hasPractice: boolean,
    hasCertificate: boolean,
    originalPrice: number
  },
  sections: [
    {
      id: string,
      _id: string,
      title: string,
      description: string,
      order: number,
      lessons: [...],  // Gộp videos, materials, quizzes
      createdAt: string,
      updatedAt: string
    }
  ]
}
```

## 2. Lesson Types

### A. Video Lesson

#### Backend Response:
```javascript
{
  _id: "video_id",
  title: "Tên video",
  description: "Mô tả video",
  contentUrl: "https://...",
  duration: 600,  // seconds
  order: 0,
  status: "ready" | "processing" | "error",
  muxAssetId: "mux_asset_id",
  muxPlaybackId: "mux_playback_id",
  thumbnailUrl: "https://...",
  sectionId: "section_id",
  createdAt: "ISO_DATE",
  updatedAt: "ISO_DATE"
}
```

#### Frontend State:
```javascript
{
  id: string,
  _id: string,
  title: string,
  contentType: "video",
  url: string,
  info: string,
  description: string,
  order: number,
  duration: number,      // seconds
  status: string,
  muxAssetId: string,
  muxPlaybackId: string,
  thumbnailUrl: string,
  createdAt: string,
  updatedAt: string
}
```

### B. Material Lesson (Article/Document)

#### Backend Response:
```javascript
{
  _id: "material_id",
  title: "Tên tài liệu",
  description: "Mô tả tài liệu",
  contentUrl: "https://...",
  fileType: "pdf" | "docx" | "pptx" | "xlsx",
  fileSize: 1024000,  // bytes
  fileName: "document.pdf",
  downloadUrl: "https://...",
  order: 1,
  sectionId: "section_id",
  createdAt: "ISO_DATE",
  updatedAt: "ISO_DATE"
}
```

#### Frontend State:
```javascript
{
  id: string,
  _id: string,
  title: string,
  contentType: "article",
  url: string,
  info: string,
  description: string,
  order: number,
  fileType: string,
  fileSize: number,      // bytes
  fileName: string,
  downloadUrl: string,
  createdAt: string,
  updatedAt: string
}
```

### C. Quiz Lesson

#### Backend Response:
```javascript
{
  _id: "quiz_id",
  title: "Tên bài kiểm tra",
  description: "Mô tả bài kiểm tra",
  order: 2,
  passingScore: 70,     // percentage
  timeLimit: 1800,      // seconds, null = unlimited
  allowRetake: true,
  showCorrectAnswers: true,
  questions: [
    {
      _id: "question_id",
      questionText: "Câu hỏi?",
      questionType: "single-choice" | "multiple-choice",
      options: ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
      correctAnswers: [0, 2],  // indices of correct answers
      explanation: "Giải thích",
      points: 1
    }
  ],
  sectionId: "section_id",
  createdAt: "ISO_DATE",
  updatedAt: "ISO_DATE"
}
```

#### Frontend State:
```javascript
{
  id: string,
  _id: string,
  title: string,
  contentType: "quiz",
  info: string,
  order: number,
  passingScore: number,
  timeLimit: number | null,
  allowRetake: boolean,
  showCorrectAnswers: boolean,
  quizQuestions: [
    {
      id: string,
      question: string,
      questionType: string,
      answers: [
        {
          text: string,
          isCorrect: boolean
        }
      ],
      explanation: string,
      points: number
    }
  ],
  createdAt: string,
  updatedAt: string
}
```

## 3. Data Flow

### Fetching Data (Backend → Frontend)

```
API Response
    ↓
mapSectionData() - Transform section structure
    ↓
mapVideoData() / mapMaterialData() / mapQuizData()
    ↓
Sort by order
    ↓
Frontend State
```

### Saving Data (Frontend → Backend)

```
Frontend State
    ↓
transformSectionForSave() - Normalize section structure
    ↓
transformVideoForSave() / transformMaterialForSave() / transformQuizForSave()
    ↓
Add order indices
    ↓
API Payload
```

## 4. API Endpoints

### Course Routes

- `GET /api/course/:courseId/full` - Lấy toàn bộ nội dung khóa học
- `GET /api/course/:courseId/content` - Lấy nội dung cho học viên đã đăng ký
- `GET /api/course/instructor/:instructorId` - Lấy khóa học của instructor
- `POST /api/course-revision` - Tạo mới course revision
- `PUT /api/course-revision/course/:courseId` - Cập nhật course revision

### Video Routes

- `GET /api/video/section/:sectionId` - Lấy videos theo section
- `GET /api/video/playback/:videoId` - Lấy playback URL (Mux signed URL)
- `GET /api/video/thumbnail/:videoId` - Lấy thumbnail URL
- `POST /api/video` - Thêm video mới
- `PUT /api/video/:videoId` - Cập nhật video
- `DELETE /api/video/:videoId` - Xóa video

### Material Routes

- `GET /api/material/section/:sectionId` - Lấy materials theo section
- `POST /api/material/upload` - Upload material file
- `POST /api/material` - Thêm material mới
- `PUT /api/material/:materialId` - Cập nhật material
- `DELETE /api/material/:materialId` - Xóa material

### Quiz Routes

- `GET /api/quiz/section/:sectionId` - Lấy quizzes theo section
- `GET /api/quiz/student/:quizId` - Lấy quiz cho học viên (không có đáp án đúng)
- `POST /api/quiz/submit/:quizId` - Nộp bài quiz
- `POST /api/quiz` - Thêm quiz mới
- `PUT /api/quiz/:quizId` - Cập nhật quiz
- `DELETE /api/quiz/:quizId` - Xóa quiz

## 5. Utility Functions

### courseDataMapper.js

- `mapVideoData(video)` - Transform video từ API
- `mapMaterialData(material)` - Transform material từ API
- `mapQuizData(quiz)` - Transform quiz từ API
- `mapSectionData(section)` - Transform section với tất cả lessons
- `transformVideoForSave(lesson, index)` - Chuẩn bị video để save
- `transformMaterialForSave(lesson, index)` - Chuẩn bị material để save
- `transformQuizForSave(lesson, index)` - Chuẩn bị quiz để save
- `transformLessonForSave(lesson, index)` - Tự động chọn transform function
- `transformSectionForSave(section, index)` - Transform section để save
- `getLessonStatistics(sections)` - Tính toán thống kê
- `validateLesson(lesson)` - Validate dữ liệu lesson
- `validateSection(section)` - Validate dữ liệu section

## 6. Statistics

```javascript
{
  totalVideos: number,
  totalMaterials: number,
  totalQuizzes: number,
  totalLessons: number,
  totalDuration: number  // minutes
}
```

## 7. Validation Rules

### Lesson Validation
- ✅ Title không được rỗng
- ✅ Video: phải có contentUrl hoặc muxPlaybackId
- ✅ Material: phải có contentUrl
- ✅ Quiz: phải có ít nhất 1 câu hỏi
- ✅ Quiz Question: phải có ít nhất 2 đáp án và 1 đáp án đúng

### Section Validation
- ✅ Title không được rỗng
- ✅ Phải có ít nhất 1 lesson

### Course Validation
- ✅ Title, description không được rỗng
- ✅ Phải có ít nhất 1 objective
- ✅ Phải có ít nhất 1 section

## 8. Best Practices

1. **Luôn sort lessons theo order** sau khi fetch hoặc thêm/sửa
2. **Validate dữ liệu** trước khi save
3. **Log statistics** để tracking
4. **Sử dụng helper functions** từ courseDataMapper.js
5. **Handle missing data** với fallback values
6. **Preserve IDs** (_id, id) khi transform
7. **Include timestamps** (createdAt, updatedAt) để tracking changes

## 9. Example Usage

### Fetching và mapping data:

```javascript
const response = await axios.get(`/api/course/${courseId}/full`);
const sectionsData = response.data.sections || [];
const transformedSections = sectionsData.map(section => mapSectionData(section));
setSections(transformedSections);
```

### Saving data:

```javascript
const normalizedSections = sections.map((section, index) => 
  transformSectionForSave(section, index)
);

await axios.put(`/api/course-revision/course/${courseId}`, {
  ...courseData,
  sections: normalizedSections
});
```

### Getting statistics:

```javascript
const stats = getLessonStatistics(sections);
console.log(`Total: ${stats.totalLessons} lessons, ${stats.totalDuration} minutes`);
```
