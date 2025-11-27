# Frontend Draft System Integration Guide

## Tổng quan

Tài liệu này mô tả cách frontend tích hợp với hệ thống draft (bản nháp) của backend để quản lý việc chỉnh sửa khóa học.

## Kiến trúc

### 1. Service Layer - `draftService.js`

Service layer cung cấp các API calls để làm việc với draft system:

```javascript
import * as draftService from '../../services/draftService';

// Check if course has draft
const draftStatus = await draftService.hasPendingDraft(courseId, token);
// Returns: { hasDraft: boolean, status: 'draft'|'pending'|'approved'|'rejected', draftId: string }

// Get or create draft (backend auto-copies from published)
const draft = await draftService.getOrCreateDraft(courseId, token);

// Submit draft for approval
await draftService.submitDraftForApproval(courseId, token);

// Cancel draft
await draftService.cancelDraft(courseId, token);

// Add section (auto-creates draft if needed)
const response = await draftService.addSection(courseId, { title, order }, token);
// Returns: { success: true, isDraft: boolean, courseDraftId: string, data: section }

// Update section
await draftService.updateSection(sectionId, { title: 'New title' }, token, isDraft);

// Delete section
await draftService.deleteSection(sectionId, token, isDraft);

// Similar functions for lessons: addLesson, updateLesson, deleteLesson, etc.
```

### 2. UI Components

#### DraftIndicator Component

Hiển thị trạng thái draft:

```jsx
import DraftIndicator, { DraftBanner, ChangeIndicator } from './DraftIndicator';

// Badge cho status
<DraftIndicator 
  status="pending" // draft | pending | approved | rejected
  isDraft={true}
  showText={true}
  size="medium" // small | medium | large
/>

// Banner cho trang chỉnh sửa
<DraftBanner
  courseName="Tên khóa học"
  status="draft"
  changeCount={5}
  onSubmit={handleSubmitDraft}
  onCancel={handleCancelDraft}
/>

// Indicator cho từng thay đổi
<ChangeIndicator 
  changeType="modified" // new | modified | deleted | unchanged
  fieldName="title"
  oldValue="Old Title"
  newValue="New Title"
/>
```

### 3. CourseManagement Page Integration

#### State Management

```javascript
// Draft-specific state
const [draftMode, setDraftMode] = useState(false);
const [draftStatus, setDraftStatus] = useState(null); // draft | pending | approved | rejected
const [courseDraftId, setCourseDraftId] = useState(null);
const [changeCount, setChangeCount] = useState(0);
```

#### Check Draft Status on Load

```javascript
useEffect(() => {
  if (isEditMode && courseId && headings.length > 0) {
    fetchCourseData();
    checkDraftStatus(); // Check if course has draft
  }
}, [courseId, isEditMode, headings]);

const checkDraftStatus = async () => {
  if (!courseId) return;
  
  try {
    const token = await getToken();
    const draftStatusData = await draftService.hasPendingDraft(courseId, token);
    
    if (draftStatusData.hasDraft) {
      setDraftMode(true);
      setDraftStatus(draftStatusData.status);
      setCourseDraftId(draftStatusData.draftId);
    }
  } catch (error) {
    console.error('Error checking draft status:', error);
  }
};
```

#### Draft Actions

```javascript
// Submit draft for approval
const handleSubmitDraft = async () => {
  const confirmed = window.confirm('Bạn có chắc chắn muốn gửi bản nháp này để phê duyệt?');
  if (!confirmed) return;

  try {
    setSaving(true);
    const token = await getToken();
    await draftService.submitDraftForApproval(courseId, token);
    
    alert('Đã gửi bản nháp để phê duyệt!');
    setDraftStatus('pending');
  } catch (error) {
    alert('Có lỗi khi gửi bản nháp: ' + error.message);
  } finally {
    setSaving(false);
  }
};

// Cancel draft
const handleCancelDraft = async () => {
  const confirmed = window.confirm(
    'Bạn có chắc chắn muốn hủy bản nháp này?\n' +
    'Tất cả thay đổi chưa được phê duyệt sẽ bị xóa vĩnh viễn.'
  );
  if (!confirmed) return;

  try {
    setSaving(true);
    const token = await getToken();
    await draftService.cancelDraft(courseId, token);
    
    alert('Đã hủy bản nháp!');
    setDraftMode(false);
    setDraftStatus(null);
    
    // Reload course data
    fetchCourseData();
  } catch (error) {
    alert('Có lỗi khi hủy bản nháp: ' + error.message);
  } finally {
    setSaving(false);
  }
};
```

## Workflow cho Instructor

### 1. Tạo khóa học mới
- Tạo khóa học → Status: 'draft'
- Thêm sections, lessons, content
- Gửi phê duyệt → Status: 'pending'
- Admin duyệt → Status: 'approved', khóa học public

### 2. Chỉnh sửa khóa học đã approved

```
┌─────────────────────────────────────────┐
│  Instructor mở khóa học để chỉnh sửa    │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  Frontend check: hasPendingDraft()?     │
└─────────────────────────────────────────┘
         ↓ No                    ↓ Yes
┌────────────────┐      ┌────────────────┐
│ Normal editing │      │ Load draft     │
│ (not approved) │      │ Show banner    │
└────────────────┘      └────────────────┘
         ↓                        ↓
┌────────────────────────────────────────┐
│  Instructor thêm/sửa/xóa section/lesson │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Backend: getOrCreateDraft() tự động   │
│  - Nếu chưa có draft → Copy từ published│
│  - Nếu có draft → Sử dụng draft       │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Tất cả thay đổi lưu vào draft         │
│  (SectionDraft, LessonDraft, etc.)     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Instructor nhấn "Gửi phê duyệt"       │
│  → submitDraftForApproval()            │
│  → Status: 'pending'                   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Admin xem và phê duyệt/từ chối        │
└────────────────────────────────────────┘
    ↓ Approved         ↓ Rejected
┌─────────────┐   ┌─────────────┐
│ Apply draft │   │ Keep draft  │
│ to published│   │ for revision│
│ Delete draft│   │ Notify user │
└─────────────┘   └─────────────┘
```

## Backend API Responses

Tất cả API responses từ section/lesson controllers đều bao gồm:

```javascript
{
  success: true,
  isDraft: true,           // Indicates if this is a draft entity
  courseDraftId: "123",    // Draft ID (courseId)
  data: {
    _id: "...",
    title: "...",
    changeType: "modified", // new | modified | deleted | unchanged
    // ... other fields
  }
}
```

Frontend sử dụng `isDraft` flag để:
- Hiển thị badge/indicator
- Track draft mode
- Quyết định API calls tiếp theo

## RevisionApproval Component (Admin)

Component để admin duyệt/từ chối draft:

### Features:
1. **List pending drafts** - Hiển thị danh sách draft chờ duyệt
2. **Change summary** - Tổng quan: bao nhiêu chương mới, bài học sửa, xóa
3. **Change log** - Lịch sử chi tiết các thay đổi
4. **Approve/Reject actions** - Phê duyệt hoặc từ chối với lý do

### Display Change Summary:
```jsx
<div className={styles.changesSummary}>
  <div className={styles.changeStat}>
    <div className={styles.changeNumber}>
      {draftSections.filter(s => s.changeType === 'new').length}
    </div>
    <div className={styles.changeLabel}>Chương mới</div>
  </div>
  {/* More stats... */}
</div>
```

### Display Change Log:
```jsx
{selectedRevision.changeLog && Object.entries(selectedRevision.changeLog)
  .sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp))
  .map(([key, change]) => (
    <div className={styles.changeLogItem}>
      <div className={styles.changeLogTime}>
        {new Date(change.timestamp).toLocaleString('vi-VN')}
      </div>
      <div className={styles.changeLogContent}>
        <strong>{change.type}</strong>: {change.action}
      </div>
    </div>
  ))}
```

## Testing Checklist

### 1. Draft Creation
- [ ] Khi instructor edit approved course, draft tự động tạo
- [ ] Draft copy đầy đủ sections, lessons từ published
- [ ] DraftBanner hiển thị đúng

### 2. Editing in Draft Mode
- [ ] Thêm section mới → Tạo SectionDraft
- [ ] Sửa section → Update SectionDraft hoặc create nếu chưa có
- [ ] Xóa section → Mark changeType='deleted' hoặc xóa thật
- [ ] Tương tự cho lessons

### 3. Draft Submission
- [ ] Button "Gửi phê duyệt" hoạt động
- [ ] Status chuyển từ 'draft' → 'pending'
- [ ] Banner cập nhật status

### 4. Draft Cancellation
- [ ] Button "Hủy bản nháp" hoạt động
- [ ] Confirm dialog hiển thị
- [ ] Draft bị xóa, reload published data
- [ ] Content mới (video/material) bị xóa khỏi MUX/Cloudinary

### 5. Admin Approval
- [ ] Admin thấy draft trong danh sách pending
- [ ] Change summary hiển thị đúng
- [ ] Change log hiển thị chi tiết
- [ ] Approve → Draft apply vào published
- [ ] Reject → Draft giữ lại với rejection reason

## Best Practices

### 1. Always Check Draft Status
Khi load course data, luôn check draft status:
```javascript
await checkDraftStatus();
```

### 2. Use isDraft Flag
Các API calls nên pass `isDraft` flag:
```javascript
await draftService.updateSection(sectionId, updates, token, isDraft);
```

### 3. Handle API Responses
Backend trả về `isDraft` và `courseDraftId`, frontend nên:
- Update UI state
- Show draft indicators
- Track draft mode

### 4. Error Handling
```javascript
try {
  await draftService.submitDraftForApproval(courseId, token);
} catch (error) {
  if (error.response?.status === 404) {
    alert('Không tìm thấy bản nháp');
  } else if (error.response?.status === 403) {
    alert('Bạn không có quyền thực hiện thao tác này');
  } else {
    alert('Có lỗi xảy ra: ' + error.message);
  }
}
```

### 5. Loading States
Luôn show loading states khi:
- Submitting draft
- Canceling draft
- Loading draft data

```javascript
const [saving, setSaving] = useState(false);

// In button
<button disabled={saving}>
  {saving ? 'Đang xử lý...' : 'Gửi phê duyệt'}
</button>
```

## Styling Guidelines

### Draft Indicators
- **draft**: Gray background, neutral
- **pending**: Yellow/orange, waiting
- **approved**: Green, success
- **rejected**: Red, error

### Change Types
- **new**: Blue, addition
- **modified**: Purple, edit
- **deleted**: Red strikethrough, removal
- **unchanged**: Hidden or gray, no change

## Migration Notes

### Existing Courses
- Courses created before draft system → No draft initially
- When instructor edits → Auto-create draft from published
- First edit triggers draft creation

### Data Consistency
- Draft always linked to published course via `courseId`
- One draft per course (enforced by using courseId as _id)
- Orphan draft cleanup runs automatically (>30 days old)

## Troubleshooting

### Draft Not Created
- Check: Course is approved? (`course_status = 'approved'`)
- Check: API returns `isDraft: true` and `courseDraftId`
- Check: Backend logs for draft creation

### Changes Not Saved
- Check: Using correct `isDraft` flag in API calls
- Check: `courseDraftId` is set correctly
- Check: Backend receives draft updates

### Banner Not Showing
- Check: `draftMode` state is true
- Check: `draftStatus` is set
- Check: DraftBanner component imported

### Approval Failed
- Check: Draft status is 'pending'
- Check: Admin has permission
- Check: Backend approval logic doesn't have errors

## Next Steps

1. **Complete video/material/quiz controllers** - Apply same draft pattern
2. **Enhance approval logic** - Process changeType correctly
3. **Add diff view** - Show before/after comparison for admin
4. **Add undo/redo** - For draft editing
5. **Add conflict resolution** - If multiple instructors edit

---

**Last Updated:** November 2025
**Version:** 1.0
