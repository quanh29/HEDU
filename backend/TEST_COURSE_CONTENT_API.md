# Test API Course Content

## Cách test API mới

### 1. Khởi động backend server
```bash
cd backend
npm start
```

### 2. Khởi động frontend
```bash
cd frontend
npm run dev
```

### 3. Test bằng curl hoặc Postman

#### Lấy nội dung đầy đủ của khóa học
```bash
curl http://localhost:3000/api/courses/{courseId}/content
```

Ví dụ với courseId cụ thể:
```bash
curl http://localhost:3000/api/courses/course123/content
```

### 4. Test trên trình duyệt

Truy cập URL:
```
http://localhost:5173/course/{courseId}/content/
```

Ví dụ:
```
http://localhost:5173/course/course123/content/
```

### 5. So sánh với route public

#### Route public (ít thông tin hơn):
```bash
curl http://localhost:3000/api/courses/{courseId}/full
```

#### Route cho enrolled users (đầy đủ thông tin):
```bash
curl http://localhost:3000/api/courses/{courseId}/content
```

### 6. Kiểm tra dữ liệu trả về

Route `/content` nên trả về:
- ✅ contentUrl của videos
- ✅ description của videos
- ✅ contentUrl của materials
- ✅ questions của quiz (không có đáp án)
- ❌ correctAnswers của quiz (bảo mật)
- ❌ explanations của quiz (bảo mật)

### 7. Test với MongoDB có dữ liệu

Đảm bảo MongoDB đã có:
- Courses collection với requirements, objectives
- Sections collection với các section của khóa học
- Videos collection với videos trong các section
- Materials collection với materials trong các section
- Quizzes collection với quizzes trong các section

### 8. Import dữ liệu mẫu (nếu chưa có)

```bash
# Sử dụng route import có sẵn
curl -X POST http://localhost:3000/api/courses/import \
  -H "Content-Type: application/json" \
  -d @backend/example-import-data.json
```

## Kiểm tra Frontend

1. Mở trình duyệt Developer Tools (F12)
2. Vào tab Network
3. Truy cập `/course/{courseId}/content/`
4. Kiểm tra:
   - Request được gửi đến `/api/courses/{courseId}/content`
   - Response có đầy đủ sections và lessons
   - Component render đúng dữ liệu

## Debug thông thường

### Backend không trả về dữ liệu
- Kiểm tra MongoDB connection
- Kiểm tra courseId có tồn tại
- Kiểm tra course_status = 'approved'
- Xem console log trong terminal backend

### Frontend không hiển thị
- Kiểm tra Network tab xem API có lỗi
- Kiểm tra Console log trong browser
- Verify state `course` và `sections` có dữ liệu
- Kiểm tra CORS settings nếu backend và frontend khác domain

### Dữ liệu không đầy đủ
- Verify rằng sections có lessons
- Kiểm tra order của lessons
- Kiểm tra type của lessons (video/document/quiz)
