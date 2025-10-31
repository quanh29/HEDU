# DEBUG: Course Creation - Sections & Lessons Not Saving

## Vấn đề
Khi tạo course mới, chỉ có thông tin cơ bản trong MySQL được tạo, còn sections/videos/materials/quizzes trong MongoDB không được tạo.

## Root Cause Analysis

### 1. Logic cũ trong `createCourseService`
```javascript
// ❌ TRƯỚC ĐÂY: Không xử lý sections khi create
export const createCourseService = async (courseData) => {
    // ... tạo MySQL course
    // ... tạo MongoDB Course (requirements/objectives)
    
    // ⚠️ THIẾU: Không có code để tạo sections và lessons
    return { course_id, status: course_status };
};
```

### 2. Logic trong `updateSectionLessonsService`
```javascript
// ❌ TRƯỚC ĐÂY: Chỉ tạo lessons khi có content
else if (lesson.contentUrl || lesson.playbackId) {
    // Tạo video chỉ khi có contentUrl hoặc playbackId
}
else if (lesson.contentUrl) {
    // Tạo material chỉ khi có contentUrl
}
else if (lesson.questions && lesson.questions.length > 0) {
    // Tạo quiz chỉ khi có questions
}
```

**Vấn đề**: User muốn tạo skeleton trước (chỉ có title) rồi upload content sau, nhưng logic không cho phép.

## Solutions Implemented

### ✅ Fix 1: Add sections handling trong `createCourseService`

**File:** `backend/services/courseService.js`

```javascript
export const createCourseService = async (courseData) => {
    const { 
        title, subTitle, des, originalPrice, currentPrice, instructor_id, 
        lv_id, lang_id, has_practice, has_certificate, picture_url, 
        requirements, objectives, categories, course_status = 'draft',
        sections  // ✅ THÊM: Extract sections từ courseData
    } = courseData;

    // ... MySQL operations
    // ... MongoDB Course creation
    
    // ✅ THÊM: Tạo sections và lessons nếu có
    if (sections && sections.length > 0) {
        console.log(`📦 [createCourseService] Creating ${sections.length} sections...`);
        await updateCourseSectionsService(course_id, sections);
        console.log('✅ [createCourseService] Sections created');
    } else {
        console.log('⚠️ [createCourseService] No sections provided');
    }

    return { course_id, status: course_status };
}
```

### ✅ Fix 2: Allow creating lessons without content

**File:** `backend/services/courseService.js`

```javascript
// ✅ SAU KHI SỬA: Tạo video/quiz ngay cả khi chưa có content
if (lesson.contentType === 'video') {
    if (lesson._id && !lesson._id.startsWith('temp-')) {
        // Update existing
    } else {
        // ✅ Tạo mới BẤT KỂ có contentUrl hay không
        const newVideo = new Video({
            section: sectionId,
            title: lesson.title || 'Untitled Video',
            description: lesson.description || '',
            order: lesson.order || 1,
            contentUrl: lesson.contentUrl || '',  // Empty string OK
            playbackId: lesson.playbackId || '',
            status: lesson.status || 'uploading'
        });
        await newVideo.save();
    }
}

// Material VẪN cần contentUrl vì schema requires it
else if (lesson.contentType === 'material') {
    if (lesson._id && !lesson._id.startsWith('temp-')) {
        // Update
    } else if (lesson.contentUrl) {
        // ✅ Chỉ tạo khi có contentUrl (vì Material.contentUrl = required)
        const newMaterial = new Material({...});
    } else {
        console.log('⚠️ Skipping material without contentUrl');
    }
}

// Quiz có thể tạo mà không cần questions
else if (lesson.contentType === 'quiz') {
    if (lesson._id && !lesson._id.startsWith('temp-')) {
        // Update
    } else {
        // ✅ Tạo mới BẤT KỂ có questions hay không
        const newQuiz = new Quiz({
            section: sectionId,
            title: lesson.title || 'Untitled Quiz',
            description: lesson.description || '',
            order: lesson.order || 1,
            questions: lesson.questions || []  // Empty array OK
        });
        await newQuiz.save();
    }
}
```

### ✅ Fix 3: Enhanced logging cho debugging

**File:** `backend/controllers/courseController.js`

```javascript
export const addCourse = async (req, res) => {
    const { title, sections } = req.body;
    
    // ✅ THÊM: Log để kiểm tra request
    console.log('📥 [addCourse] Received request:', {
        title,
        sectionsCount: sections?.length || 0,
        hasSections: !!sections
    });
    
    try {
        const result = await courseService.createCourseService(req.body);
        console.log('✅ [addCourse] Course created:', result);
        res.status(201).json({ success: true, ...result });
    } catch (error) {
        console.error('❌ [addCourse] Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
```

**File:** `backend/services/courseService.js`

```javascript
// ✅ THÊM: Detailed logging trong updateCourseSectionsService
export const updateCourseSectionsService = async (courseId, sections) => {
    console.log(`📦 [updateCourseSectionsService] Processing ${sections.length} sections`);
    
    for (const [index, section] of sections.entries()) {
        console.log(`\n📝 Processing section ${index + 1}:`, {
            title: section.title,
            _id: section._id,
            lessonsCount: section.lessons?.length || 0
        });
        
        // ... create/update section
        
        if (section.lessons && section.lessons.length > 0) {
            console.log(`📚 Processing ${section.lessons.length} lessons`);
            await updateSectionLessonsService(sectionId, section.lessons);
        }
    }
    
    console.log('✅ All sections processed');
};

// ✅ THÊM: Detailed logging trong updateSectionLessonsService
export const updateSectionLessonsService = async (sectionId, lessons) => {
    console.log(`📚 Processing ${lessons.length} lessons for section ${sectionId}`);
    
    for (const [index, lesson] of lessons.entries()) {
        console.log(`\n  📝 Processing lesson ${index + 1}:`, {
            title: lesson.title,
            contentType: lesson.contentType,
            hasContent: !!(lesson.contentUrl || lesson.playbackId)
        });
        
        // ... create/update lesson
        
        console.log('  ✅ Lesson processed');
    }
    
    console.log('✅ Summary:', {
        totalProcessed: lessons.length,
        videosCreated: ...,
        materialsCreated: ...,
        quizzesCreated: ...
    });
};
```

## How to Test

### 1. Check Backend Logs khi tạo course
Khi POST `/api/course`, kiểm tra console logs:

```
📥 [addCourse] Received request: { title: "...", sectionsCount: 2, hasSections: true }
🆕 [createCourseService] Creating course: { course_id: "...", title: "...", sectionsCount: 2 }
✅ [createCourseService] MongoDB Course created
📦 [createCourseService] Creating 2 sections...

📦 [updateCourseSectionsService] Processing 2 sections for course ...
📝 Processing section 1/2: { title: "Section 1", lessonsCount: 3 }
➕ Creating new section: Section 1
✅ Section created with ID: ...
📚 Processing 3 lessons for section ...

  📝 Processing lesson 1: { title: "Video 1", contentType: "video", hasContent: false }
  ➕ Creating new video: Video 1
  ✅ Video created with ID: ...
  
  📝 Processing lesson 2: { title: "Material 1", contentType: "material", hasContent: false }
  ⚠️ Skipping material without contentUrl

  📝 Processing lesson 3: { title: "Quiz 1", contentType: "quiz", hasContent: false }
  ➕ Creating new quiz: Quiz 1
  ✅ Quiz created with ID: ...

✅ Summary: { totalProcessed: 3, videosCreated: 1, materialsCreated: 0, quizzesCreated: 1 }
✅ [createCourseService] Sections created
✅ [addCourse] Course created: { course_id: "...", status: "draft" }
```

### 2. Kiểm tra MongoDB sau khi tạo

```javascript
// Connect to MongoDB
use your_database;

// Check Course document
db.courses.findOne({ _id: "course_id_here" });
// Expected: { _id, requirements: [...], objectives: [...] }

// Check Sections
db.sections.find({ course_id: "course_id_here" });
// Expected: Array of sections with titles and orders

// Check Videos
db.videos.find({ section: "section_id_here" });
// Expected: Array of videos, có thể có contentUrl = "" nếu chưa upload

// Check Quizzes
db.quizzes.find({ section: "section_id_here" });
// Expected: Array of quizzes, có thể có questions = [] nếu chưa add

// Check Materials
db.materials.find({ section: "section_id_here" });
// Expected: Empty nếu chưa upload files
```

### 3. Frontend - Check payload gửi lên

Mở Browser Console, check logs:

```javascript
💾 [saveCourseWithStatus] Payload: {
  title: "...",
  sections: [
    {
      title: "Section 1",
      order: 1,
      lessons: [
        {
          title: "Lesson 1",
          contentType: "video",
          order: 1,
          contentUrl: "",
          playbackId: ""
        }
      ]
    }
  ]
}
```

## Expected Behavior

### Scenario 1: Create course với empty lessons
**Input:**
- Sections: có title
- Lessons: có title nhưng không có contentUrl/playbackId/questions

**Expected:**
- ✅ Sections được tạo trong MongoDB
- ✅ Videos được tạo với contentUrl = ""
- ✅ Quizzes được tạo với questions = []
- ⚠️ Materials KHÔNG được tạo (cần contentUrl)

### Scenario 2: Create course với content
**Input:**
- Lessons có đầy đủ contentUrl/playbackId/questions

**Expected:**
- ✅ Tất cả sections và lessons được tạo
- ✅ Content được lưu đầy đủ

### Scenario 3: Update course
**Input:**
- Lessons có `_id` (existing) hoặc không có `_id` (new)

**Expected:**
- ✅ Lessons có `_id` được update
- ✅ Lessons không có `_id` được create mới
- ✅ Lessons bị xóa khỏi request được delete

## Troubleshooting

### Issue 1: Sections không được tạo
**Check:**
1. Frontend có gửi `sections` trong payload không?
2. Backend log có hiện "No sections provided"?

**Solution:** Kiểm tra CourseManagement.jsx, đảm bảo `sections` được include trong payload

### Issue 2: Lessons không được tạo
**Check:**
1. Sections có `lessons` array không?
2. Backend log có hiện "No lessons for section"?

**Solution:** Kiểm tra structure của sections trong payload

### Issue 3: Videos/Quizzes được tạo nhưng Materials không
**Expected behavior!** Materials cần contentUrl (file upload) nên không tạo nếu chưa có file.

**Solution:** Upload material files trước, hoặc accept materials chỉ được tạo sau khi upload.

## Related Files Changed

1. ✅ `backend/services/courseService.js`
   - Modified: `createCourseService()` - add sections handling
   - Modified: `updateSectionLessonsService()` - allow empty content
   - Modified: `updateCourseSectionsService()` - add logging

2. ✅ `backend/controllers/courseController.js`
   - Modified: `addCourse()` - add logging

3. ℹ️ Frontend không cần thay đổi (đã gửi đúng payload)

## Notes

- Video model: `contentUrl` không required → có thể tạo trước, upload sau
- Material model: `contentUrl` required → phải có file mới tạo
- Quiz model: `questions` không required → có thể tạo trước, add questions sau
- Section được tạo với `id` hoặc `_id` bắt đầu bằng số timestamp là section mới
