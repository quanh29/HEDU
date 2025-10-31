# Tóm tắt cập nhật CRUD cho Course

## ✅ Đã hoàn thành

### 1. Backend - Service Layer (`courseService.js`)
Đã thêm các service mới:

- ✅ **`updateCourseService`**: Cập nhật course trong cả MySQL và MongoDB
  - Update thông tin cơ bản trong MySQL (Courses table)
  - Update categories trong Labeling table
  - Update requirements/objectives trong MongoDB (Course model)
  - Update sections và lessons (Videos, Materials, Quizzes)
  - Logic thông minh: có `_id` → update, không có `_id` → create, không có trong request → delete

- ✅ **`updateCourseSectionsService`**: Xử lý sections
  - So sánh sections cũ và mới
  - Xóa sections không còn trong danh sách
  - Update hoặc create sections

- ✅ **`updateSectionLessonsService`**: Xử lý lessons
  - So sánh lessons (videos, materials, quizzes) cũ và mới
  - Update hoặc create lessons dựa vào contentType
  - Xóa lessons không còn trong danh sách
  - Chỉ tạo lesson mới khi có dữ liệu thực (contentUrl, questions, etc.)

- ✅ **`deleteCourseService`**: Xóa course hoàn toàn
  - Xóa từ MySQL (Courses, Labeling) với transaction
  - Xóa từ MongoDB (Course document)
  - Cascade delete tất cả sections
  - Cascade delete tất cả videos, materials, quizzes

- ✅ **`getFullCourseDataForManagementService`**: Lấy full data để edit
  - Lấy course info từ MySQL
  - Lấy requirements/objectives từ MongoDB
  - Lấy tất cả sections với lessons (videos, materials, quizzes)
  - Format data phù hợp cho frontend

### 2. Backend - Controller Layer (`courseController.js`)
Đã thêm các controller mới:

- ✅ **`updateCourse`**: Controller cho PUT `/api/course/:courseId`
- ✅ **`deleteCourse`**: Controller cho DELETE `/api/course/:courseId`
- ✅ **`getFullCourseDataForManagement`**: Controller cho GET `/api/course/manage/:courseId/full`

### 3. Backend - Routes (`courseRoute.js`)
Đã thêm các routes mới:

- ✅ **PUT** `/api/course/:courseId` - Cập nhật course
- ✅ **DELETE** `/api/course/:courseId` - Xóa course
- ✅ **GET** `/api/course/manage/:courseId/full` - Lấy full course data để edit

### 4. Frontend - CourseManagement.jsx

#### ✅ Cập nhật `fetchCourseData`
```javascript
// Sử dụng endpoint mới: /api/course/manage/:courseId/full
// Endpoint này trả về course với sections và lessons đầy đủ
const url = `${VITE_BASE_URL}/api/course/manage/${courseId}/full`;
const courseInfo = await axios.get(url);

// courseInfo.sections có structure:
// [{
//   _id, title, order,
//   lessons: [{ _id, title, contentType, order, contentUrl, ... }]
// }]
```

#### ✅ Cập nhật `saveCourseWithStatus`
```javascript
// Logic phân biệt Create và Update
if (isEditMode) {
  // PUT /api/course/:courseId
  await axios.put(`${VITE_BASE_URL}/api/course/${courseId}`, payload);
} else {
  // POST /api/course
  await axios.post(`${VITE_BASE_URL}/api/course`, payload);
}

// Payload structure:
// - Thông tin cơ bản (title, subTitle, des, prices, etc.)
// - instructor_id: hardcoded '98f7f734-aaa8-11f0-8462-581122e62853'
// - lv_id: mapped từ level (L1, L2, L3)
// - lang_id: mapped từ language (VN, EN)
// - requirements, objectives: arrays
// - categories: array of category_ids
// - course_status: draft/pending
// - sections: array với structure đầy đủ lessons
```

### 5. Frontend - Instructor.jsx

#### ✅ Cập nhật `deleteCourse`
```javascript
// Sử dụng endpoint DELETE /api/course/:courseId
await axios.delete(`${BASE_URL}/api/course/${courseId}`);
// Refresh data sau khi xóa
await fetchInstructorData();
```

## 📊 Cấu trúc dữ liệu

### MySQL (Courses table)
- course_id, title, subTitle, des
- originalPrice, currentPrice
- instructor_id, lv_id, lang_id
- has_practice, has_certificate, picture_url
- course_status (draft/pending/approved/rejected)
- rating, reviewCount

### MongoDB

#### Course
```javascript
{ _id: course_id, requirements: [], objectives: [] }
```

#### Section
```javascript
{ _id, course_id, title, order }
```

#### Video
```javascript
{ _id, section, title, contentUrl, playbackId, status, duration, order }
```

#### Material
```javascript
{ _id, section, title, contentUrl, order }
```

#### Quiz
```javascript
{ _id, section, title, description, questions: [], order }
```

## 🔄 Flow hoạt động

### Create Course
1. **Frontend**: User điền form → Click "Gửi xét duyệt"
2. **Frontend**: POST `/api/course` với payload đầy đủ
3. **Backend**: 
   - Tạo course_id (UUID)
   - Insert vào MySQL (Courses, Labeling)
   - Insert vào MongoDB (Course với requirements/objectives)
   - Tạo Sections và Lessons nếu có
4. **Response**: Return course_id và status

### Update Course
1. **Frontend**: User click Edit → Load data từ `/api/course/manage/:id/full`
2. **Backend**: Trả về course với sections/lessons đầy đủ
3. **Frontend**: User chỉnh sửa → Click "Cập nhật"
4. **Frontend**: PUT `/api/course/:id` với payload
5. **Backend**:
   - Update MySQL (Courses, Labeling)
   - Update MongoDB (Course)
   - So sánh sections/lessons:
     - Có _id → Update
     - Không có _id → Create
     - Không trong request → Delete
6. **Response**: Return success

### Delete Course
1. **Frontend**: User click Delete → Confirm
2. **Frontend**: DELETE `/api/course/:id`
3. **Backend**:
   - Delete từ MySQL (transaction: Labeling → Courses)
   - Delete từ MongoDB: Course → Videos/Materials/Quizzes → Sections
4. **Response**: Return success
5. **Frontend**: Refresh danh sách courses

## 🎯 Mapping Rules

### Level Mapping
```javascript
const levelMap = {
  'beginner': 'L1',
  'intermediate': 'L2',
  'advanced': 'L3'
};
```

### Language Mapping
```javascript
const languageMap = {
  'vietnamese': 'VN',
  'english': 'EN'
};
```

### Lesson Update Logic
```javascript
if (lesson._id && !lesson._id.startsWith('temp-')) {
  // Update existing lesson
} else if (hasRequiredData) {
  // Create new lesson (chỉ khi có data)
}
// Lessons không có trong request → Delete
```

## ⚠️ Lưu ý

1. **Transaction Safety**: MySQL operations dùng transaction
2. **Cascade Delete**: Xóa course → xóa tất cả related data
3. **Instructor ID**: Tạm thời hardcoded `'98f7f734-aaa8-11f0-8462-581122e62853'`
4. **Status**: Chỉ approved courses hiển thị public
5. **Temp IDs**: Frontend dùng `temp-${timestamp}` cho items mới chưa save

## 📝 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/course` | Tạo course mới |
| GET | `/api/course/instructor/:instructorId` | Lấy courses của instructor |
| GET | `/api/course/manage/:courseId` | Lấy course basic info |
| GET | `/api/course/manage/:courseId/full` | Lấy course với sections/lessons (để edit) |
| PUT | `/api/course/:courseId` | Cập nhật course |
| DELETE | `/api/course/:courseId` | Xóa course |
| PATCH | `/api/course/:courseId/status` | Cập nhật status |
| GET | `/api/course/:courseId/full` | Public route (chỉ approved) |

## 🧪 Testing

Xem file `API_COURSE_CRUD.md` để biết chi tiết cách test với curl commands.

## 📚 Tài liệu tham khảo

- `backend/API_COURSE_CRUD.md` - Chi tiết đầy đủ về API
- `backend/models/` - MongoDB schemas
- `backend/db.txt` - MySQL schema
