# Hướng dẫn sử dụng Course Data Mapper

## Tổng quan

Hệ thống quản lý khóa học đã được cải tiến để fetch và map đầy đủ dữ liệu cho tất cả các loại bài học: **Video**, **Material (Tài liệu)**, và **Quiz (Bài kiểm tra)**.

## Các file liên quan

1. **`/frontend/src/utils/courseDataMapper.js`** - Utility functions cho việc map và transform data
2. **`/frontend/src/utils/COURSE_DATA_STRUCTURE.md`** - Documentation chi tiết về cấu trúc dữ liệu
3. **`/frontend/src/components/LessonStatistics/LessonStatistics.jsx`** - Component hiển thị thống kê bài học
4. **`/frontend/src/pages/CourseManagement/CourseManagement.jsx`** - Page quản lý khóa học (đã được cập nhật)
5. **`/frontend/src/pages/Instructor/Instructor.jsx`** - Page instructor dashboard (đã được cập nhật)

## Các tính năng mới

### 1. Fetch đầy đủ dữ liệu bài học

Khi fetch khóa học từ API, tất cả thông tin về video, material, và quiz đều được load và map đầy đủ:

```javascript
// Video fields
{
  duration, status, muxAssetId, muxPlaybackId, thumbnailUrl
}

// Material fields
{
  fileType, fileSize, fileName, downloadUrl
}

// Quiz fields
{
  passingScore, timeLimit, allowRetake, showCorrectAnswers,
  quizQuestions: [{ questionType, answers, explanation, points }]
}
```

### 2. Helper Functions

#### Mapping Functions (Backend → Frontend)

```javascript
import { mapVideoData, mapMaterialData, mapQuizData, mapSectionData } from '@/utils/courseDataMapper';

// Map một video
const video = mapVideoData(backendVideo);

// Map toàn bộ section với tất cả lessons
const section = mapSectionData(backendSection);
```

#### Transform Functions (Frontend → Backend)

```javascript
import { transformVideoForSave, transformMaterialForSave, transformQuizForSave, transformSectionForSave } from '@/utils/courseDataMapper';

// Transform lesson để save
const lesson = transformLessonForSave(frontendLesson, lessonIndex);

// Transform section để save
const section = transformSectionForSave(frontendSection, sectionIndex);
```

#### Statistics & Validation

```javascript
import { getLessonStatistics, validateLesson, validateSection } from '@/utils/courseDataMapper';

// Lấy thống kê
const stats = getLessonStatistics(sections);
console.log(stats); 
// { totalVideos, totalMaterials, totalQuizzes, totalLessons, totalDuration }

// Validate lesson
const errors = validateLesson(lesson);
if (errors.length > 0) {
  console.error('Lesson errors:', errors);
}
```

### 3. Lesson Statistics Component

Component hiển thị thống kê trực quan về số lượng bài học:

```jsx
import LessonStatistics from '@/components/LessonStatistics/LessonStatistics';

<LessonStatistics sections={sections} />
```

Hiển thị:
- 📊 Tổng bài học
- 🎥 Số video
- 📄 Số tài liệu
- 📝 Số bài kiểm tra
- ⏱️ Tổng thời lượng

## Cách sử dụng trong CourseManagement

### 1. Fetch và hiển thị dữ liệu

```javascript
const fetchCourseData = async () => {
  const response = await axios.get(`${API_URL}/api/course/${courseId}/full`);
  const sectionsData = response.data.sections || [];
  
  // Transform sections với tất cả lessons
  const transformedSections = sectionsData.map(section => mapSectionData(section));
  
  // Log statistics
  const stats = getLessonStatistics(transformedSections);
  console.log('Course statistics:', stats);
  
  setSections(transformedSections);
};
```

### 2. Save dữ liệu

```javascript
const saveCourse = async () => {
  // Transform sections để save
  const normalizedSections = sections.map((section, index) => 
    transformSectionForSave(section, index)
  );
  
  const payload = {
    ...courseData,
    sections: normalizedSections
  };
  
  await axios.put(`${API_URL}/api/course-revision/course/${courseId}`, payload);
};
```

### 3. Validate dữ liệu trước khi save

```javascript
const validateCourse = () => {
  const errors = [];
  
  sections.forEach((section, sectionIndex) => {
    // Validate section
    const sectionErrors = validateSection(section);
    if (sectionErrors.length > 0) {
      errors.push(`Section ${sectionIndex + 1}: ${sectionErrors.join(', ')}`);
    }
    
    // Validate lessons
    section.lessons?.forEach((lesson, lessonIndex) => {
      const lessonErrors = validateLesson(lesson);
      if (lessonErrors.length > 0) {
        errors.push(`Section ${sectionIndex + 1}, Lesson ${lessonIndex + 1}: ${lessonErrors.join(', ')}`);
      }
    });
  });
  
  return errors;
};
```

## Cách sử dụng trong Instructor Dashboard

### Display course content với đầy đủ thông tin

```javascript
// Component CourseDetail
const CourseDetail = () => {
  const getAllLessons = (section) => {
    const lessons = [];
    
    // Videos
    section.videos?.forEach(video => lessons.push(mapVideoData(video)));
    
    // Materials
    section.materials?.forEach(material => lessons.push(mapMaterialData(material)));
    
    // Quizzes
    section.quizzes?.forEach(quiz => lessons.push(mapQuizData(quiz)));
    
    // Sort by order
    return lessons.sort((a, b) => a.order - b.order);
  };
  
  return (
    // Render lessons...
  );
};
```

## API Endpoints Reference

### Course
- `GET /api/course/:courseId/full` - Full course content
- `GET /api/course/instructor/:instructorId` - Instructor's courses

### Video
- `GET /api/video/section/:sectionId` - Videos by section
- `GET /api/video/playback/:videoId` - Video playback URL

### Material
- `GET /api/material/section/:sectionId` - Materials by section
- `POST /api/material/upload` - Upload material

### Quiz
- `GET /api/quiz/section/:sectionId` - Quizzes by section
- `GET /api/quiz/student/:quizId` - Quiz for student

## Lưu ý quan trọng

1. **Luôn sort lessons theo order** sau khi fetch hoặc modify
2. **Validate dữ liệu** trước khi save để tránh lỗi
3. **Sử dụng helper functions** thay vì viết logic mapping thủ công
4. **Log statistics** để tracking và debug
5. **Handle missing data** với fallback values
6. **Preserve IDs** khi transform để tránh mất dữ liệu

## Troubleshooting

### Lessons không hiển thị đúng thứ tự
```javascript
// Solution: Đảm bảo sort by order
lessons.sort((a, b) => a.order - b.order);
```

### Data không được save
```javascript
// Solution: Check validation errors
const errors = validateLesson(lesson);
console.log('Validation errors:', errors);
```

### Thiếu fields khi save
```javascript
// Solution: Sử dụng transform functions
const transformed = transformLessonForSave(lesson, index);
// Thay vì tự map thủ công
```

### Statistics không chính xác
```javascript
// Solution: Đảm bảo contentType đúng
lesson.contentType === 'video' | 'article' | 'quiz'
```

## Testing

### Test mapping functions
```javascript
// Test video mapping
const testVideo = {
  _id: 'test123',
  title: 'Test Video',
  duration: 600,
  contentUrl: 'https://...'
};
const mappedVideo = mapVideoData(testVideo);
console.log('Mapped video:', mappedVideo);

// Test statistics
const testSections = [/* ... */];
const stats = getLessonStatistics(testSections);
console.log('Statistics:', stats);
```

## Hỗ trợ

Nếu có vấn đề, tham khảo:
1. **COURSE_DATA_STRUCTURE.md** - Chi tiết về data structure
2. **courseDataMapper.js** - Source code của helper functions
3. Console logs trong browser DevTools

## Changelog

### v1.0.0 (Current)
- ✅ Fetch đầy đủ video, material, quiz data
- ✅ Helper functions cho mapping và transform
- ✅ Validation functions
- ✅ Statistics component
- ✅ Integrated vào CourseManagement và Instructor pages
- ✅ Documentation đầy đủ
