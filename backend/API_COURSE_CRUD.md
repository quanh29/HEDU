# API COURSE CRUD - Hybrid MySQL + MongoDB

## Tổng quan
Dữ liệu course được lưu trữ lai (hybrid) giữa MySQL và MongoDB:
- **MySQL**: Thông tin cơ bản, giá, instructor, level, language, categories, status
- **MongoDB**: Requirements, objectives, sections, videos, materials, quizzes

## Cấu trúc dữ liệu

### MySQL (Courses table)
```sql
- course_id (VARCHAR) - Primary Key
- title (VARCHAR)
- subTitle (VARCHAR)
- des (TEXT) - description
- originalPrice (DECIMAL)
- currentPrice (DECIMAL)
- instructor_id (VARCHAR) - Foreign Key to Users
- lv_id (VARCHAR) - Foreign Key to Levels (L1, L2, L3)
- lang_id (VARCHAR) - Foreign Key to Languages
- has_practice (BOOLEAN)
- has_certificate (BOOLEAN)
- picture_url (VARCHAR)
- course_status (ENUM: 'draft', 'pending', 'approved', 'rejected')
- rating (DECIMAL)
- reviewCount (INT)
```

### MongoDB Models

#### Course Model
```javascript
{
  _id: String,              // course_id từ MySQL
  requirements: [String],    // Yêu cầu trước khi học
  objectives: [String]       // Mục tiêu học tập
}
```

#### Section Model
```javascript
{
  _id: ObjectId,
  course_id: String,        // Reference to MySQL course_id
  title: String,
  order: Number
}
```

#### Video Model
```javascript
{
  _id: ObjectId,
  section: String,          // Reference to Section._id
  title: String,
  contentUrl: String,
  uploadId: String,         // MUX upload ID
  playbackId: String,       // MUX playback ID
  status: String,           // 'uploading', 'processing', 'ready', 'error', 'cancelled'
  duration: Number,
  description: String,
  order: Number
}
```

#### Material Model
```javascript
{
  _id: ObjectId,
  section: String,          // Reference to Section._id
  title: String,
  contentUrl: String,
  order: Number
}
```

#### Quiz Model
```javascript
{
  _id: ObjectId,
  section: String,          // Reference to Section._id
  title: String,
  description: String,
  questions: [{
    questionText: String,
    options: [String],
    correctAnswers: [String],
    explanation: String
  }],
  order: Number
}
```

## API Endpoints

### 1. CREATE - Tạo khóa học mới
**POST** `/api/course`

**Request Body:**
```json
{
  "title": "Khóa học React",
  "subTitle": "Học React từ cơ bản đến nâng cao",
  "des": "Mô tả khóa học...",
  "originalPrice": 500000,
  "currentPrice": 400000,
  "instructor_id": "98f7f734-aaa8-11f0-8462-581122e62853",
  "lv_id": "L1",
  "lang_id": "VN",
  "has_practice": true,
  "has_certificate": true,
  "picture_url": "https://example.com/image.jpg",
  "requirements": ["Biết HTML, CSS", "Biết JavaScript cơ bản"],
  "objectives": ["Hiểu về React components", "Xây dựng ứng dụng React"],
  "categories": ["category-uuid-1"],
  "course_status": "draft",
  "sections": [
    {
      "title": "Giới thiệu",
      "order": 1,
      "lessons": [
        {
          "title": "Video giới thiệu",
          "contentType": "video",
          "order": 1,
          "contentUrl": "https://...",
          "playbackId": "mux-id",
          "status": "ready"
        },
        {
          "title": "Tài liệu PDF",
          "contentType": "material",
          "order": 2,
          "contentUrl": "https://..."
        },
        {
          "title": "Bài kiểm tra",
          "contentType": "quiz",
          "order": 3,
          "questions": [
            {
              "questionText": "Câu hỏi 1?",
              "options": ["A", "B", "C"],
              "correctAnswers": ["A"],
              "explanation": "Giải thích..."
            }
          ]
        }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "course_id": "uuid",
  "status": "draft"
}
```

### 2. READ - Lấy danh sách khóa học của instructor
**GET** `/api/course/instructor/:instructorId`

**Query Parameters:**
- `page`: Số trang (mặc định: 1)
- `status`: Lọc theo status (draft, pending, approved, rejected)

**Response:**
```json
[
  {
    "course_id": "uuid",
    "title": "Khóa học React",
    "subTitle": "...",
    "des": "...",
    "originalPrice": 500000,
    "currentPrice": 400000,
    "course_status": "draft",
    "fName": "Nguyen",
    "lName": "Van A",
    "instructors": [{"fullName": "Nguyen Van A"}]
  }
]
```

### 3. READ - Lấy chi tiết khóa học để edit (bao gồm sections và lessons)
**GET** `/api/course/manage/:courseId/full`

**Response:**
```json
{
  "course_id": "uuid",
  "title": "Khóa học React",
  "subTitle": "...",
  "des": "...",
  "originalPrice": 500000,
  "currentPrice": 400000,
  "level_title": "beginner",
  "language_title": "vietnamese",
  "has_practice": 1,
  "has_certificate": 1,
  "picture_url": "...",
  "course_status": "draft",
  "requirements": ["Biết HTML, CSS"],
  "objectives": ["Hiểu về React components"],
  "categories": [
    {"category_id": "uuid", "title": "Web Development"}
  ],
  "sections": [
    {
      "_id": "section-id",
      "title": "Giới thiệu",
      "order": 1,
      "lessons": [
        {
          "_id": "lesson-id",
          "contentType": "video",
          "title": "Video giới thiệu",
          "order": 1,
          "contentUrl": "https://...",
          "playbackId": "mux-id",
          "status": "ready",
          "description": "..."
        }
      ]
    }
  ]
}
```

### 4. UPDATE - Cập nhật khóa học
**PUT** `/api/course/:courseId`

**Request Body:** (giống như CREATE, nhưng sections/lessons có `_id` sẽ được cập nhật)
```json
{
  "title": "Khóa học React - Updated",
  "subTitle": "...",
  "des": "...",
  "originalPrice": 550000,
  "currentPrice": 450000,
  "lv_id": "L2",
  "lang_id": "VN",
  "has_practice": true,
  "has_certificate": true,
  "picture_url": "...",
  "requirements": ["Updated requirement"],
  "objectives": ["Updated objective"],
  "categories": ["category-uuid-1"],
  "course_status": "pending",
  "sections": [
    {
      "_id": "existing-section-id",  // Có _id -> cập nhật
      "title": "Giới thiệu - Updated",
      "order": 1,
      "lessons": [
        {
          "_id": "existing-lesson-id",  // Có _id -> cập nhật
          "title": "Video giới thiệu - Updated",
          "contentType": "video",
          "order": 1
        },
        {
          // Không có _id -> tạo mới
          "title": "Video mới",
          "contentType": "video",
          "order": 2
        }
      ]
    },
    {
      // Không có _id -> tạo section mới
      "title": "Chương mới",
      "order": 2,
      "lessons": []
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "course_id": "uuid"
}
```

### 5. DELETE - Xóa khóa học
**DELETE** `/api/course/:courseId`

**Response:**
```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

**Note:** Xóa course sẽ cascade xóa:
- Record trong MySQL (Courses, Labeling)
- Course document trong MongoDB
- Tất cả Sections
- Tất cả Videos, Materials, Quizzes thuộc các sections đó

### 6. UPDATE - Cập nhật status của khóa học
**PATCH** `/api/course/:courseId/status`

**Request Body:**
```json
{
  "course_status": "approved"
}
```

**Valid statuses:** `draft`, `pending`, `approved`, `rejected`

**Response:**
```json
{
  "success": true,
  "message": "Course status updated",
  "course_status": "approved"
}
```

### 7. READ - Public route để xem khóa học (chỉ approved)
**GET** `/api/course/:courseId/full`

Trả về thông tin khóa học với sections/lessons nhưng **không có**:
- contentUrl của videos và materials
- correctAnswers và explanation của quiz questions

## Logic xử lý trong Service Layer

### Create Course
1. Begin transaction trong MySQL
2. Tạo UUID cho course_id
3. Insert vào Courses table
4. Insert vào Labeling table (categories)
5. Commit transaction
6. Tạo Course document trong MongoDB với requirements/objectives
7. Tạo Sections trong MongoDB
8. Tạo Videos/Materials/Quizzes trong MongoDB

### Update Course
1. Begin transaction trong MySQL
2. Update Courses table
3. Delete và recreate Labeling records nếu categories thay đổi
4. Commit transaction
5. Update Course document trong MongoDB
6. Update/Create/Delete Sections:
   - Sections có `_id` → update
   - Sections không có `_id` → create
   - Sections không còn trong request → delete
7. Update/Create/Delete Lessons tương tự

### Delete Course
1. Begin transaction trong MySQL
2. Delete từ Labeling table
3. Delete từ Courses table
4. Commit transaction
5. Delete Course document từ MongoDB
6. Tìm tất cả Sections của course
7. Delete tất cả Videos/Materials/Quizzes thuộc sections đó
8. Delete tất cả Sections

## Frontend Integration

### CourseManagement.jsx

#### Fetch Course Data (Edit Mode)
```javascript
const fetchCourseData = async () => {
  const url = `${VITE_BASE_URL}/api/course/manage/${courseId}/full`;
  const response = await axios.get(url);
  const courseInfo = response.data;
  
  // courseInfo đã có đầy đủ sections và lessons
  setCourseData({...});
  setSections(courseInfo.sections);
};
```

#### Save Course (Create/Update)
```javascript
const saveCourseWithStatus = async (status) => {
  const payload = {
    title: courseData.title,
    subTitle: courseData.subtitle,
    des: courseData.description,
    originalPrice: courseData.originalPrice,
    currentPrice: courseData.currentPrice,
    instructor_id: '98f7f734-aaa8-11f0-8462-581122e62853',
    lv_id: 'L1',
    lang_id: 'VN',
    has_practice: courseData.hasPractice,
    has_certificate: courseData.hasCertificate,
    picture_url: courseData.thumbnail,
    requirements: courseData.requirements,
    objectives: courseData.objectives,
    categories: [courseData.subcategory],
    course_status: status,
    sections: sections.map((section, index) => ({
      _id: section._id && !section._id.startsWith('temp-') 
        ? section._id 
        : undefined,
      title: section.title,
      order: index + 1,
      lessons: section.lessons.map((lesson, lessonIndex) => ({
        _id: lesson._id && !lesson._id.startsWith('temp-') 
          ? lesson._id 
          : undefined,
        title: lesson.title,
        contentType: lesson.contentType,
        order: lessonIndex + 1,
        contentUrl: lesson.contentUrl,
        playbackId: lesson.playbackId,
        status: lesson.status,
        description: lesson.description,
        questions: lesson.questions
      }))
    }))
  };

  if (isEditMode) {
    await axios.put(`${VITE_BASE_URL}/api/course/${courseId}`, payload);
  } else {
    await axios.post(`${VITE_BASE_URL}/api/course`, payload);
  }
};
```

### Instructor.jsx

#### Fetch Courses
```javascript
const fetchInstructorData = async () => {
  const instructorId = '98f7f734-aaa8-11f0-8462-581122e62853';
  const url = `${VITE_BASE_URL}/api/course/instructor/${instructorId}`;
  const response = await axios.get(url);
  setCourses(response.data);
};
```

#### Delete Course
```javascript
const deleteCourse = async (courseId) => {
  await axios.delete(`${VITE_BASE_URL}/api/course/${courseId}`);
  await fetchInstructorData(); // Refresh list
};
```

## Lưu ý quan trọng

1. **Transaction Safety**: MySQL operations sử dụng transaction để đảm bảo tính nhất quán
2. **Cascade Delete**: Khi xóa course, tất cả related data trong MongoDB cũng bị xóa
3. **Status Management**: Chỉ course với status='approved' mới hiển thị public
4. **Update Logic**: 
   - Có `_id` và không bắt đầu với 'temp-' → Update
   - Không có `_id` hoặc `_id` bắt đầu với 'temp-' → Create
   - Không có trong request → Delete
5. **Instructor ID**: Tạm thời hardcode `'98f7f734-aaa8-11f0-8462-581122e62853'`

## Testing

### Create Course
```bash
curl -X POST http://localhost:3000/api/course \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Course",
    "subTitle": "Test",
    "des": "Description",
    "originalPrice": 100000,
    "currentPrice": 80000,
    "instructor_id": "98f7f734-aaa8-11f0-8462-581122e62853",
    "lv_id": "L1",
    "lang_id": "VN",
    "has_practice": true,
    "has_certificate": true,
    "picture_url": "http://example.com/image.jpg",
    "requirements": ["Req 1"],
    "objectives": ["Obj 1"],
    "categories": ["category-id"],
    "course_status": "draft",
    "sections": []
  }'
```

### Update Course
```bash
curl -X PUT http://localhost:3000/api/course/{courseId} \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### Delete Course
```bash
curl -X DELETE http://localhost:3000/api/course/{courseId}
```
