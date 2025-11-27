# Draft-Only Editing Implementation - Summary

## Vấn đề
Frontend vẫn đang thao tác trực tiếp với bản chính (published) của khóa học khi instructor chỉnh sửa, thay vì làm việc với draft.

## Giải pháp
Chỉnh sửa frontend để **MỌI THAO TÁC** khi edit khóa học đều làm việc với draft:
- Backend tự động tạo draft từ bản chính nếu chưa có
- Tất cả CRUD operations (sections/lessons) đều thông qua draft API
- Bản chính không bị động đến cho đến khi admin approve

## Thay đổi Backend

### 1. `controllers/sectionController.js`
**Function:** `getSectionsByCourseId()`

**Before:**
```javascript
// Trả về published sections
// Nếu includeDrafts=true → Trả về CẢ published VÀ draft sections riêng biệt
```

**After:**
```javascript
// Nếu includeDrafts=true và course approved:
//   → CHỈ trả về draft sections (nếu có)
//   → Nếu không có draft, trả về empty array
// Nếu không:
//   → Trả về published sections (cho draft/rejected courses)
```

**Response Format:**
```javascript
{
  success: true,
  hasDraft: true,              // Có draft hay không
  draftStatus: 'draft',        // Status của draft
  courseDraftId: '123',        // ID của draft
  sections: [...]              // Chỉ draft sections HOẶC published sections
}
```

**Logic:**
1. Check `includeDrafts=true` AND course is approved
2. Nếu có draft → Return draft sections với lessons populated
3. Nếu không có draft → Return empty (frontend sẽ fallback to published)
4. Nếu course chưa approved → Return published sections

---

## Thay đổi Frontend

### 1. `services/draftService.js`
**Function:** `getSectionsWithDrafts()`

**Changed:**
- URL: `api/section/course/${courseId}` → `api/section/${courseId}`
- Đúng với route backend đã có

---

### 2. `pages/CourseManagement/CourseManagement.jsx`

#### A. Load Data Strategy (fetchCourseData)

**Before:**
```javascript
// Load từ `/api/course/manage/${courseId}/full`
// Luôn lấy published sections
const courseInfo = response.data;
const sectionsData = courseInfo.sections; // Published
```

**After:**
```javascript
// 1. Try load draft sections first
const draftResponse = await draftService.getSectionsWithDrafts(courseId, token, true);

if (draftResponse.hasDraft) {
  // Load draft sections
  sectionsData = draftResponse.sections;
  setDraftMode(true);
  setDraftStatus(draftResponse.draftStatus);
  console.log('✅ Loaded from DRAFT');
} else {
  // Load published sections
  sectionsData = courseInfo.sections;
  console.log('📚 Loaded from PUBLISHED');
}
```

**Result:** Instructor luôn thấy và edit draft nếu có, nếu không thấy published.

---

#### B. Add Section (addSection)

**Before:**
```javascript
// Direct API call to /api/section
axios.post('/api/section', { courseId, title, order })
// → Tạo Section trong published collection
```

**After:**
```javascript
// Use draftService
draftService.addSection(courseId, { title, order }, token)
// → Backend check: Course approved? 
//   → Yes: Create SectionDraft (auto-create CourseDraft if needed)
//   → No: Create Section

// Update draft mode state
if (response.isDraft) {
  setDraftMode(true);
  setDraftStatus('draft');
  setCourseDraftId(response.courseDraftId);
  setChangeCount(prev => prev + 1);
}
```

**Result:** Section luôn được tạo trong draft nếu course approved.

---

#### C. Update Section (updateSection)

**Before:**
```javascript
axios.put(`/api/section/${sectionId}`, { field: value })
// → Update Section trong published collection
```

**After:**
```javascript
draftService.updateSection(sectionId, { field: value }, token, draftMode)
// → Backend check: Is SectionDraft? Update draft
//   → Backend check: Is approved course? Create/update SectionDraft
//   → Otherwise: Update Section

// Update draft mode if auto-created
if (response.isDraft && !draftMode) {
  setDraftMode(true);
  setDraftStatus('draft');
  setCourseDraftId(response.courseDraftId);
}
setChangeCount(prev => prev + 1);
```

**Result:** Update luôn vào draft nếu course approved.

---

#### D. Delete Section (removeSection)

**Before:**
```javascript
axios.delete(`/api/section/${sectionId}`)
// → Delete Section khỏi published collection
```

**After:**
```javascript
draftService.deleteSection(sectionId, token, draftMode)
// → Backend check: Is SectionDraft? Mark changeType='deleted' or delete
//   → Backend check: Is approved course? Create SectionDraft with changeType='deleted'
//   → Otherwise: Delete Section

// Update draft mode
if (response.isDraft && !draftMode) {
  setDraftMode(true);
  setDraftStatus('draft');
  setCourseDraftId(response.courseDraftId);
}
setChangeCount(prev => prev + 1);
```

**Result:** Delete marking trong draft, không xóa thật published.

---

#### E. Add Lesson (addLesson)

**Before:**
```javascript
axios.post('/api/lesson', { sectionId, title, contentType })
// → Tạo Lesson trong published collection
```

**After:**
```javascript
draftService.addLesson(sectionId, { title, contentType }, token, draftMode)
// → Backend: Create LessonDraft if course approved
//   → Auto-create SectionDraft if section is published
//   → Otherwise: Create Lesson

// Update draft mode
if (response.isDraft && !draftMode) {
  setDraftMode(true);
  setDraftStatus('draft');
  setCourseDraftId(response.courseDraftId);
}
setChangeCount(prev => prev + 1);
```

**Result:** Lesson luôn được tạo trong draft nếu course approved.

---

#### F. Update Lesson (updateLesson)

**Before:**
```javascript
axios.put(`/api/lesson/${lessonId}`, { field: value })
// → Update Lesson trong published collection
```

**After:**
```javascript
draftService.updateLesson(lessonId, { field: value }, token, draftMode)
// → Backend: Update LessonDraft if exists
//   → Create/update draft if approved course
//   → Otherwise: Update Lesson

// Update draft mode
if (response.isDraft && !draftMode) {
  setDraftMode(true);
  setDraftStatus('draft');
  setCourseDraftId(response.courseDraftId);
}
setChangeCount(prev => prev + 1);
```

**Result:** Update luôn vào draft nếu course approved.

---

#### G. Delete Lesson (removeLesson)

**Before:**
```javascript
// Chỉ remove khỏi UI state
// Không có API call
```

**After:**
```javascript
// Remove khỏi UI state
setSections(...)

// Call API to delete in draft
draftService.deleteLesson(lessonId, token, draftMode)
// → Backend: Mark changeType='deleted' in draft
//   → Or delete if already draft lesson

// Update draft mode
if (response.isDraft && !draftMode) {
  setDraftMode(true);
  setDraftStatus('draft');
  setCourseDraftId(response.courseDraftId);
}
setChangeCount(prev => prev + 1);
```

**Result:** Delete marking trong draft, không xóa thật published.

---

## Workflow Mới

### 1. Instructor Opens Course for Edit
```
Frontend: Load course data
↓
Frontend: Try getSectionsWithDrafts(courseId, includeDrafts=true)
↓
Backend: Check course approved?
  → Yes: Return draft sections (if exist) or empty
  → No: Return published sections
↓
Frontend: Display draft sections OR published sections
Frontend: Set draftMode = (hasDraft === true)
```

### 2. Instructor Adds Section
```
Frontend: User clicks "Add Section"
↓
Frontend: draftService.addSection(courseId, data)
↓
Backend: Check course approved?
  → Yes: getOrCreateDraft() → Create SectionDraft
  → No: Create Section
↓
Backend: Return { isDraft: true, courseDraftId, data }
↓
Frontend: Update UI + Set draftMode=true
Frontend: Show DraftBanner
```

### 3. Instructor Updates Section
```
Frontend: User edits section title
↓
Frontend: draftService.updateSection(sectionId, updates, draftMode)
↓
Backend: Check if SectionDraft exists?
  → Yes: Update SectionDraft
  → No: Check if course approved?
    → Yes: getOrCreateDraft() → Create/Update SectionDraft
    → No: Update Section
↓
Backend: Return { isDraft: true, courseDraftId, data }
↓
Frontend: Update UI + Increment changeCount
```

### 4. Instructor Submits for Approval
```
Frontend: User clicks "Gửi phê duyệt"
↓
Frontend: draftService.submitDraftForApproval(courseId)
↓
Backend: Update CourseDraft.status = 'pending'
↓
Frontend: Update draftStatus='pending'
Frontend: Show yellow pending banner
```

### 5. Admin Approves
```
Admin: Click "Phê duyệt"
↓
Backend: Apply draft changes to published
  - Process SectionDraft.changeType='new' → Create Section
  - Process SectionDraft.changeType='modified' → Update Section
  - Process SectionDraft.changeType='deleted' → Delete Section
  - Same for lessons
↓
Backend: Delete all draft documents
↓
Frontend: Reload course data (now shows updated published)
```

---

## Key Benefits

### ✅ Published Never Touched During Edit
- Instructor có thể edit tự do
- Không ảnh hưởng đến students đang học
- Có thể cancel bất cứ lúc nào

### ✅ Auto-Create Draft
- Backend tự động copy từ published
- Instructor không cần thao tác thủ công
- First edit triggers draft creation

### ✅ Change Tracking
- `changeCount` increases với mỗi thay đổi
- `changeType` tracks: new/modified/deleted/unchanged
- Admin thấy rõ những gì changed

### ✅ Visual Feedback
- DraftBanner shows when in draft mode
- Draft status badges (draft/pending/approved/rejected)
- Change indicators on UI

---

## Testing Checklist

### Approved Course - With Draft
- [ ] Load course → Shows draft sections (not published)
- [ ] Add section → Creates in draft, shows draft banner
- [ ] Update section → Updates in draft, changeCount++
- [ ] Delete section → Marks deleted in draft, changeCount++
- [ ] Add lesson → Creates in draft, auto-creates section draft if needed
- [ ] Update lesson → Updates in draft, changeCount++
- [ ] Delete lesson → Marks deleted in draft, changeCount++
- [ ] Submit → Status changes to 'pending', banner turns yellow

### Approved Course - No Draft Yet
- [ ] Load course → Shows published sections
- [ ] First edit → Auto-creates draft, shows draft banner
- [ ] All subsequent edits → Work with draft

### Draft/Rejected Course
- [ ] Load course → Shows published sections
- [ ] All edits → Directly update published (no draft creation)
- [ ] Submit → Normal course submission flow

### Admin Approval
- [ ] View pending draft → Shows change summary
- [ ] Approve → Draft applies to published, draft deleted
- [ ] View course after approval → Shows updated published data

---

## Files Changed

### Backend (1 file)
1. `backend/controllers/sectionController.js`
   - `getSectionsByCourseId()` - Return ONLY draft sections when includeDrafts=true and approved

### Frontend (2 files)
1. `frontend/src/services/draftService.js`
   - `getSectionsWithDrafts()` - Fix URL

2. `frontend/src/pages/CourseManagement/CourseManagement.jsx`
   - `fetchCourseData()` - Load draft first, fallback to published
   - `addSection()` - Use draftService, update draft state
   - `updateSection()` - Use draftService, update draft state
   - `removeSection()` - Use draftService, update draft state
   - `addLesson()` - Use draftService, update draft state
   - `updateLesson()` - Use draftService, update draft state
   - `removeLesson()` - Use draftService, update draft state

---

**Implementation Date:** November 28, 2025
**Status:** ✅ Complete
**Impact:** HIGH - Changes fundamental editing workflow to be draft-first
