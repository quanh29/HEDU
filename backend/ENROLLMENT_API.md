# Enrollment API Documentation

API để quản lý việc đăng ký khóa học của người dùng.

## Base URL
```
/api/enrollment
```

## Authentication
Tất cả các endpoints đều yêu cầu authentication với Clerk JWT token trong header:
```
Authorization: Bearer <clerk_jwt_token>
```

---

## Endpoints

### 1. Đăng ký khóa học mới
**POST** `/api/enrollment`

Tạo enrollment mới khi user đăng ký một khóa học.

**Request Body:**
```json
{
  "courseId": "C001"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Successfully enrolled in the course",
  "data": {
    "enrollmentId": "507f1f77bcf86cd799439011",
    "userId": "user_2abc123def",
    "courseId": "C001",
    "enrolledAt": "2025-11-07T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Course ID missing hoặc user đã đăng ký khóa học
- `404` - Khóa học không tồn tại
- `401` - Chưa đăng nhập

---

### 2. Lấy danh sách khóa học đã đăng ký
**GET** `/api/enrollment`

Lấy tất cả khóa học mà user hiện tại đã đăng ký.

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "enrollmentId": "507f1f77bcf86cd799439011",
      "userId": "user_2abc123def",
      "courseId": "C001",
      "rating": 5,
      "completedLessons": ["lesson1", "lesson2", "lesson3"],
      "enrolledAt": "2025-11-07T10:30:00.000Z",
      "course": {
        "course_id": "C001",
        "title": "React từ cơ bản đến nâng cao",
        "currentPrice": 499000,
        "picture_url": "https://...",
        "fName": "Nguyen",
        "lName": "Van A",
        "instructor_ava": "https://..."
      }
    }
  ]
}
```

---

### 3. Kiểm tra đã đăng ký khóa học chưa
**GET** `/api/enrollment/check/:courseId`

Kiểm tra xem user hiện tại đã đăng ký khóa học cụ thể chưa.

**URL Parameters:**
- `courseId` - ID của khóa học cần kiểm tra

**Success Response (200):**
```json
{
  "success": true,
  "isEnrolled": true,
  "data": {
    "userId": "user_2abc123def",
    "courseId": "C001",
    "rating": 5,
    "completedLessons": ["lesson1", "lesson2"],
    "createdAt": "2025-11-07T10:30:00.000Z"
  }
}
```

**Nếu chưa đăng ký:**
```json
{
  "success": true,
  "isEnrolled": false,
  "data": null
}
```

---

### 4. Đánh dấu bài học đã hoàn thành
**PUT** `/api/enrollment/:courseId/complete-lesson`

Thêm hoặc xóa một lesson khỏi danh sách đã hoàn thành.

**URL Parameters:**
- `courseId` - ID của khóa học

**Request Body:**
```json
{
  "lessonId": "lesson123",
  "action": "complete"
}
```

**Action values:**
- `"complete"` - Đánh dấu bài học đã hoàn thành (default)
- `"uncomplete"` - Bỏ đánh dấu bài học đã hoàn thành

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lesson marked as completed",
  "data": {
    "completedLessons": ["lesson1", "lesson2", "lesson123"]
  }
}
```

**Error Responses:**
- `400` - Lesson ID missing
- `404` - Enrollment không tồn tại (user chưa đăng ký khóa học)

---

### 5. Đánh giá khóa học
**PUT** `/api/enrollment/:courseId/rating`

Cập nhật rating cho khóa học đã đăng ký.

**URL Parameters:**
- `courseId` - ID của khóa học

**Request Body:**
```json
{
  "rating": 5
}
```

**Rating phải từ 1-5 (số nguyên)**

**Success Response (200):**
```json
{
  "success": true,
  "message": "Rating updated successfully",
  "data": {
    "rating": 5
  }
}
```

**Error Responses:**
- `400` - Rating không hợp lệ (phải từ 1-5)
- `404` - Enrollment không tồn tại

---

## Use Cases

### Frontend - Đăng ký khóa học
```javascript
const enrollInCourse = async (courseId) => {
  const { getToken } = useAuth();
  const token = await getToken();
  
  const response = await axios.post(
    `${API_URL}/api/enrollment`,
    { courseId },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  
  return response.data;
};
```

### Frontend - Kiểm tra enrollment trước khi hiển thị nội dung
```javascript
const checkEnrollment = async (courseId) => {
  const { getToken } = useAuth();
  const token = await getToken();
  
  const response = await axios.get(
    `${API_URL}/api/enrollment/check/${courseId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  
  return response.data.isEnrolled;
};
```

### Frontend - Đánh dấu bài học hoàn thành
```javascript
const toggleLessonComplete = async (courseId, lessonId, isCompleted) => {
  const { getToken } = useAuth();
  const token = await getToken();
  
  const response = await axios.put(
    `${API_URL}/api/enrollment/${courseId}/complete-lesson`,
    { 
      lessonId,
      action: isCompleted ? 'uncomplete' : 'complete'
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  
  return response.data;
};
```

---

## Database Schema (MongoDB)

```javascript
{
  userId: String,           // Clerk user ID
  courseId: String,         // ID của khóa học (từ MySQL Courses table)
  rating: Number,           // 1-5, default: null
  completedLessons: [String], // Array of lesson IDs
  createdAt: Date,          // Timestamp tự động
  updatedAt: Date           // Timestamp tự động
}
```

## Notes

- Mỗi user chỉ có thể đăng ký một khóa học một lần
- Enrollment chỉ được tạo cho các khóa học có `course_status = 'approved'`
- `completedLessons` là array nên không bị duplicate khi đánh dấu cùng một lesson nhiều lần
- Rating có thể được cập nhật nhiều lần
