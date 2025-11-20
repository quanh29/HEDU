# Course Progress Tracking Feature

Tính năng theo dõi tiến độ học tập với checkbox cho mỗi bài học và thanh progress bar.

## ✨ Tính năng

### 1. Progress Bar
- Hiển thị phần trăm hoàn thành khóa học
- Thanh tiến độ với gradient màu xanh
- Số liệu: X / Y bài học đã hoàn thành

### 2. Checkbox cho mỗi bài học
- Checkbox bên cạnh mỗi bài học
- Click để đánh dấu hoàn thành / bỏ đánh dấu
- Optimistic UI update (cập nhật ngay lập tức)
- Badge "Đã hoàn thành" hiển thị khi lesson được check

### 3. Tích hợp API
- Lưu trữ progress trong MongoDB Enrollment collection
- Real-time sync với backend
- Error handling và revert khi có lỗi

## 🎨 UI Components

### Progress Section
```jsx
<div className={styles.progressSection}>
  <div className={styles.progressHeader}>
    <span>Tiến độ học tập</span>
    <span>75%</span>
  </div>
  <div className={styles.progressBarContainer}>
    <div className={styles.progressBarFill} style={{ width: '75%' }}></div>
  </div>
  <div className={styles.progressStats}>
    <span>15 / 20 bài học đã hoàn thành</span>
  </div>
</div>
```

### Lesson Checkbox
```jsx
<input
  type="checkbox"
  className={styles.lessonCheckbox}
  checked={isCompleted}
  onChange={(e) => toggleLessonComplete(e, lesson.lessonId)}
/>
```

## 📊 Data Flow

### 1. Fetch Progress on Page Load
```javascript
// Lấy enrollment data khi load trang
const fetchEnrollmentProgress = async () => {
  const response = await axios.get(
    `/api/enrollment/check/${courseId}`,
    authConfig
  );
  setCompletedLessons(response.data.data.completedLessons);
};
```

### 2. Toggle Lesson Complete
```javascript
// User click checkbox
const toggleLessonComplete = async (e, lessonId) => {
  // 1. Optimistic update UI
  setCompletedLessons(prev => 
    wasCompleted 
      ? prev.filter(id => id !== lessonId)
      : [...prev, lessonId]
  );
  
  // 2. Call API
  await axios.put(
    `/api/enrollment/${courseId}/complete-lesson`,
    { lessonId, action: wasCompleted ? 'uncomplete' : 'complete' }
  );
  
  // 3. Revert on error
  if (error) {
    await fetchEnrollmentProgress();
  }
};
```

### 3. Calculate Progress
```javascript
const calculateProgress = () => {
  const totalLessons = sections.reduce((sum, s) => sum + s.lessons.length, 0);
  const percentage = (completedLessons.length / totalLessons) * 100;
  return Math.round(percentage);
};
```

## 🔄 Backend API

### Endpoint
`PUT /api/enrollment/:courseId/complete-lesson`

### Request Body
```json
{
  "lessonId": "video_123",
  "action": "complete" | "uncomplete"
}
```

### Response
```json
{
  "success": true,
  "message": "Lesson marked as completed",
  "data": {
    "completedLessons": ["video_1", "video_2", "video_123"]
  }
}
```

### Controller Logic
```javascript
// Kiểm tra action
if (action === 'uncomplete') {
  // Xóa khỏi array
  enrollment.completedLessons = enrollment.completedLessons.filter(
    id => id !== lessonId
  );
} else {
  // Thêm vào array (nếu chưa có)
  if (!enrollment.completedLessons.includes(lessonId)) {
    enrollment.completedLessons.push(lessonId);
  }
}
await enrollment.save();
```

## 💾 Database Schema

### MongoDB Enrollment Model
```javascript
{
  userId: "user_2abc123def",
  courseId: "C001",
  rating: 5,
  completedLessons: [
    "video_1",
    "video_2", 
    "quiz_1",
    "material_1"
  ],
  createdAt: "2025-11-07T10:00:00.000Z",
  updatedAt: "2025-11-07T15:30:00.000Z"
}
```

## 🎯 User Experience

### 1. Load Course Content Page
1. Fetch course sections và lessons
2. Fetch enrollment progress (completedLessons array)
3. Render progress bar với % hoàn thành
4. Render lessons với checkbox checked/unchecked

### 2. User Clicks Checkbox
1. UI update ngay lập tức (optimistic)
2. API call trong background
3. Nếu thành công: giữ nguyên UI
4. Nếu lỗi: revert UI và hiển thị error

### 3. Visual Feedback
- Checkbox animation khi hover
- Progress bar smooth transition
- "Đã hoàn thành" badge
- Lesson title màu xám khi completed
- Disable interaction khi đang update

## 🎨 CSS Styling

### Progress Bar
```css
.progressBarContainer {
  width: 100%;
  height: 0.75rem;
  background-color: #e5e7eb;
  border-radius: 9999px;
}

.progressBarFill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
  transition: width 0.3s ease;
}
```

### Checkbox
```css
.lessonCheckbox {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: #3b82f6;
  cursor: pointer;
}

.lessonCheckbox:hover {
  transform: scale(1.1);
}
```

## 🔐 Security

- Tất cả requests yêu cầu authentication (Clerk JWT)
- Chỉ update được enrollment của chính user
- Validate courseId và lessonId
- Prevent duplicate entries trong completedLessons array

## 🧪 Testing Checklist

- [ ] Progress bar hiển thị đúng % khi load
- [ ] Checkbox sync với completedLessons từ DB
- [ ] Click checkbox update UI ngay lập tức
- [ ] API call thành công cập nhật DB
- [ ] Error handling revert UI khi API fail
- [ ] Progress bar update khi check/uncheck
- [ ] Completed badge hiển thị đúng
- [ ] Multiple checkboxes có thể toggle đồng thời
- [ ] Page refresh giữ nguyên progress state

## 📝 Notes

- Sử dụng `e.stopPropagation()` để prevent lesson click khi click checkbox
- Optimistic UI update để UX mượt mà
- Progress calculation based on total lessons trong tất cả sections
- completedLessons array không bị duplicate (check trước khi push)
