# Debug Guide - Lesson Not Fetching Issue

## Vấn đề

Lessons (videos, materials, quizzes) không được fetch và hiển thị trong CourseManagement.

## Các thay đổi đã thực hiện

### 1. Backend - courseService.js

**Vấn đề phát hiện:**
- Backend đã có function `getFullCourseContentService` nhưng **không populate đầy đủ** videos, materials, quizzes vào từng section
- Response trả về structure không đúng: trả về `lessons` array thay vì `videos`, `materials`, `quizzes` arrays riêng biệt

**Đã sửa:**
```javascript
// CŨ (SAI):
return {
    _id: section._id,
    title: section.title,
    lessonCount: allLessons.length,
    lessons: allLessons  // ❌ Gộp tất cả vào 1 array
};

// MỚI (ĐÚNG):
return {
    _id: section._id,
    title: section.title,
    videos: sectionVideos,      // ✅ Riêng biệt
    materials: sectionMaterials, // ✅ Riêng biệt  
    quizzes: sectionQuizzes      // ✅ Riêng biệt
};
```

**Thêm logging chi tiết:**
- Log số lượng sections tìm thấy
- Log từng section được process
- Log số lượng videos, materials, quizzes trong mỗi section
- Log khi không tìm thấy data

### 2. Frontend - courseDataMapper.js

**Thêm logging chi tiết:**
```javascript
export const mapSectionData = (section) => {
  console.log('🔍 [mapSectionData] Processing section:', section.title);
  console.log('🔍 [mapSectionData] Section data:', {
    hasVideos: !!section.videos,
    videosLength: section.videos?.length || 0,
    hasMaterials: !!section.materials,
    materialsLength: section.materials?.length || 0,
    hasQuizzes: !!section.quizzes,
    quizzesLength: section.quizzes?.length || 0
  });
  // ... rest of the code
}
```

### 3. Frontend - CourseManagement.jsx

**Thêm debug logging:**
```javascript
console.log('Sections Data type:', typeof sectionsData);
console.log('Is Array?:', Array.isArray(sectionsData));
console.log('Sections length:', sectionsData?.length || 0);

// Debug first section structure
if (sectionsData && sectionsData.length > 0) {
  console.log('First section structure:', {
    _id: sectionsData[0]._id,
    title: sectionsData[0].title,
    keys: Object.keys(sectionsData[0]),
    videos: sectionsData[0].videos,
    materials: sectionsData[0].materials,
    quizzes: sectionsData[0].quizzes
  });
}
```

## Cách kiểm tra (Testing)

### 1. Kiểm tra Backend

**Test API endpoint trực tiếp:**
```bash
# Thay YOUR_COURSE_ID bằng ID thực tế
curl http://localhost:8000/api/course/YOUR_COURSE_ID/full
```

**Kiểm tra response structure:**
```json
{
  "course": {
    "_id": "...",
    "title": "...",
    ...
  },
  "sections": [
    {
      "_id": "...",
      "title": "...",
      "videos": [...],      // ← Phải có array này
      "materials": [...],   // ← Phải có array này
      "quizzes": [...]      // ← Phải có array này
    }
  ],
  "stats": {...}
}
```

### 2. Kiểm tra MongoDB Data

**Kiểm tra xem MongoDB có data không:**
```javascript
// Trong MongoDB shell hoặc Compass
db.sections.find({ course_id: "YOUR_COURSE_ID" })
db.videos.find({ section: "SECTION_ID" })
db.materials.find({ section: "SECTION_ID" })
db.quizzes.find({ section: "SECTION_ID" })
```

**Lưu ý quan trọng về field names:**
- Section model dùng: `course_id` (snake_case)
- Video/Material/Quiz model dùng: `section` (reference to Section._id)

### 3. Kiểm tra Frontend Console

**Mở Browser DevTools Console và kiểm tra:**

```
🔍 [getFullCourseContentService] Found sections: X
📦 [getFullCourseContentService] Section IDs: [...]
📊 [getFullCourseContentService] Content found: { videos: X, materials: Y, quizzes: Z }

🔄 [getFullCourseContentService] Processing section: Section Name
  📹 Video: Video Title
  📄 Material: Material Title
  📝 Quiz: Quiz Title (N questions)
  ✅ Section "..." has X lessons

✅ [getFullCourseContentService] All sections processed successfully

---

🔍 [mapSectionData] Processing section: Section Name
🔍 [mapSectionData] Section data: { hasVideos: true, videosLength: X, ... }
📹 [mapSectionData] Mapping X videos
  Video 1: ...
📄 [mapSectionData] Mapping Y materials
  Material 1: ...
📝 [mapSectionData] Mapping Z quizzes
  Quiz 1: ...
✅ [mapSectionData] Total lessons mapped: X
```

## Các lỗi phổ biến và cách sửa

### Lỗi 1: "No sections found"
```
⚠️ [getFullCourseContentService] No sections found for course: XXX
```

**Nguyên nhân:** MongoDB không có sections cho course này

**Cách sửa:**
- Kiểm tra `db.sections.find({ course_id: "XXX" })`
- Đảm bảo đã import/tạo sections
- Kiểm tra `course_id` có đúng format không

### Lỗi 2: "Section has 0 lessons"
```
✅ Section "..." has 0 lessons
```

**Nguyên nhân:** Không có videos/materials/quizzes cho section

**Cách sửa:**
- Kiểm tra `db.videos.find({ section: "SECTION_ID" })`
- Đảm bảo field `section` trong video/material/quiz model match với `section._id`
- Kiểm tra data type (ObjectId vs String)

### Lỗi 3: "sectionsData is not an array"
```javascript
console.log('Sections Data type:', typeof sectionsData); // object
console.log('Is Array?:', Array.isArray(sectionsData)); // false
```

**Nguyên nhân:** Backend trả về sai structure

**Cách sửa:**
```javascript
// Trong fetchCourseData, đảm bảo:
const sectionsData = data.sections || [];  // Lấy đúng field
```

### Lỗi 4: "Cannot map videos/materials/quizzes"
```
📹 [mapSectionData] No videos found
📄 [mapSectionData] No materials found
📝 [mapSectionData] No quizzes found
```

**Nguyên nhân:** Section structure không có fields `videos`, `materials`, `quizzes`

**Cách sửa:**
- Kiểm tra backend có trả về đúng structure không
- Kiểm tra API response trong Network tab
- Đảm bảo backend đã được cập nhật và restart

## Checklist Debug

- [ ] Backend server đã restart sau khi sửa code
- [ ] MongoDB có data (sections, videos, materials, quizzes)
- [ ] Field names trong MongoDB models đúng (`course_id`, `section`)
- [ ] API response có đúng structure: `{ course, sections: [...] }`
- [ ] Sections có fields: `videos`, `materials`, `quizzes` arrays
- [ ] Frontend console có log chi tiết
- [ ] Network tab cho thấy API call thành công (200 OK)
- [ ] Response data không rỗng

## Contact Info

Nếu vẫn gặp lỗi sau khi check tất cả, cung cấp:
1. Console logs đầy đủ (backend + frontend)
2. API response sample (từ Network tab)
3. MongoDB data sample
4. Screenshots của error (nếu có)
