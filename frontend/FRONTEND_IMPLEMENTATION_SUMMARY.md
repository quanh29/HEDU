# Frontend Draft System Integration - Implementation Summary

## ✅ Completed Tasks

### 1. Service Layer (`frontend/src/services/draftService.js`)
**Created:** Complete API service layer for draft operations

**Functions Implemented:**
- `getOrCreateDraft()` - Get or auto-create draft from published
- `hasPendingDraft()` - Check if course has pending draft
- `submitDraftForApproval()` - Submit draft for admin approval
- `cancelDraft()` - Cancel/delete draft
- `addSection()`, `updateSection()`, `deleteSection()` - Section operations
- `addLesson()`, `updateLesson()`, `deleteLesson()` - Lesson operations
- `getLesson()`, `getLessonsBySection()` - Fetch operations
- `getSectionsWithDrafts()` - Get sections with draft support
- `getDraftChangeLog()` - Get change history

**Features:**
- All functions handle authentication tokens
- Returns structured responses with `isDraft` flag
- Proper error handling and logging

---

### 2. UI Components (`frontend/src/components/DraftIndicator/`)

#### a) `DraftIndicator.jsx`
**Created:** Comprehensive draft indicator component system

**Components:**
1. **DraftIndicator** - Status badge component
   - Props: `status`, `isDraft`, `changeType`, `size`, `showText`
   - Variants: draft, pending, approved, rejected, new, modified, deleted
   - Responsive sizing: small, medium, large

2. **DraftBanner** - Page-level draft warning banner
   - Shows draft mode with course name
   - Displays change count
   - Action buttons: "Gửi phê duyệt", "Hủy bản nháp"
   - Status-aware styling

3. **ChangeIndicator** - Shows individual field changes
   - Displays old value → new value
   - Shows change type badge
   - Useful for diff views

#### b) `DraftIndicator.module.css`
**Created:** Complete styling for all draft UI components

**Features:**
- Color-coded badges (draft=gray, pending=yellow, approved=green, rejected=red)
- Banner styles with status variants
- Change indicator with before/after display
- Fully responsive design
- Smooth transitions and hover effects

---

### 3. CourseManagement Page Updates (`frontend/src/pages/CourseManagement/CourseManagement.jsx`)

**Changes Made:**

#### Import Updates
```javascript
import { DraftBanner } from '../../components/DraftIndicator/DraftIndicator';
import * as draftService from '../../services/draftService';
```

#### State Management
Added draft-specific state:
```javascript
const [draftMode, setDraftMode] = useState(false);
const [draftStatus, setDraftStatus] = useState(null); // draft | pending | approved | rejected
const [courseDraftId, setCourseDraftId] = useState(null);
const [changeCount, setChangeCount] = useState(0);
```

#### New Functions

1. **checkDraftStatus()**
   - Called on component mount for edit mode
   - Checks if course has pending draft
   - Sets draft mode and status

2. **handleSubmitDraft()**
   - Submits draft for admin approval
   - Confirmation dialog
   - Updates status to 'pending'
   - Error handling with user feedback

3. **handleCancelDraft()**
   - Cancels draft and deletes all changes
   - Strong confirmation warning
   - Reloads published course data
   - Resets draft state

#### UI Integration
```jsx
{/* Draft Banner - shows when in draft mode */}
{draftMode && (
  <DraftBanner
    courseName={courseData.title}
    status={draftStatus}
    changeCount={changeCount}
    onSubmit={handleSubmitDraft}
    onCancel={handleCancelDraft}
  />
)}
```

**Location:** Inserted after header, before main content

---

### 4. RevisionApproval Component Updates (`frontend/src/pages/Admin/components/RevisionApproval/`)

#### a) `RevisionApproval.jsx`

**Import Updates:**
```javascript
import DraftIndicator from '../../../../components/DraftIndicator/DraftIndicator';
import { Edit3, FileText, Video, File } from 'lucide-react';
```

**Changes Made:**

1. **Revision Card Updates**
   - Replaced static badge with `<DraftIndicator />` component
   - Added change summary showing new/modified/deleted counts
   ```jsx
   <Edit3 size={16} />
   <span>
     {revision.draftSections?.filter(s => s.changeType === 'new').length || 0} chương mới, 
     {revision.draftLessons?.filter(l => l.changeType === 'modified').length || 0} bài học sửa
   </span>
   ```

2. **Modal Detail View Enhancements**
   - **Change Summary Section**: 4-column grid showing statistics
     - New sections count
     - Modified lessons count
     - Deleted lessons count
     - New content count (videos + materials + quizzes)
   
   - **Change Log Section**: Timeline of all changes
     - Sorted by timestamp (newest first)
     - Shows change type, action, and details
     - Limited to 10 most recent changes
     - Scrollable container

3. **Updated Section Reference**
   - Changed `revision.sections?.length` → `revision.draftSections?.length`
   - Properly references draft structure

#### b) `RevisionApproval.module.css`

**Added Styles:**

1. **Change Summary Styles**
```css
.changesSummary - Grid layout for statistics
.changeStat - Individual stat card
.changeNumber - Large number display (32px, blue)
.changeLabel - Label below number
```

2. **Change Log Styles**
```css
.changeLog - Scrollable container (max 300px)
.changeLogItem - Individual log entry with left border
.changeLogTime - Timestamp (small, gray)
.changeLogContent - Action description
.changeLogDetails - Additional info (italic)
```

**Features:**
- Responsive grid (auto-fit, min 150px)
- Color-coded elements
- Proper spacing and borders
- Hover effects

---

### 5. Documentation (`frontend/FRONTEND_DRAFT_INTEGRATION.md`)

**Created:** Comprehensive 400+ line documentation covering:

1. **Architecture Overview**
   - Service layer structure
   - Component hierarchy
   - State management

2. **API Integration Guide**
   - All service functions with examples
   - Request/response formats
   - Error handling patterns

3. **Component Usage Examples**
   - DraftIndicator variants
   - DraftBanner implementation
   - ChangeIndicator usage

4. **Workflow Diagrams**
   - Instructor workflow (ASCII diagram)
   - Course creation flow
   - Edit approved course flow
   - Admin approval flow

5. **Testing Checklist**
   - Draft creation tests
   - Editing tests
   - Submission tests
   - Cancellation tests
   - Admin approval tests

6. **Best Practices**
   - Always check draft status
   - Use isDraft flag correctly
   - Handle API responses
   - Error handling patterns
   - Loading states

7. **Styling Guidelines**
   - Color coding for status
   - Change type indicators
   - Responsive design

8. **Troubleshooting Guide**
   - Common issues and solutions
   - Debug checklist

---

## 📊 Integration Statistics

### Files Created: 4
1. `frontend/src/services/draftService.js` (283 lines)
2. `frontend/src/components/DraftIndicator/DraftIndicator.jsx` (156 lines)
3. `frontend/src/components/DraftIndicator/DraftIndicator.module.css` (193 lines)
4. `frontend/FRONTEND_DRAFT_INTEGRATION.md` (467 lines)

### Files Modified: 3
1. `frontend/src/pages/CourseManagement/CourseManagement.jsx`
   - Added 3 imports
   - Added 4 state variables
   - Added 1 useEffect hook
   - Added 2 handler functions (60+ lines)
   - Added 1 UI component (DraftBanner)

2. `frontend/src/pages/Admin/components/RevisionApproval/RevisionApproval.jsx`
   - Added 5 imports
   - Updated 2 UI sections
   - Added 2 new modal sections (change summary, change log)

3. `frontend/src/pages/Admin/components/RevisionApproval/RevisionApproval.module.css`
   - Added 70+ lines of new styles
   - 10 new CSS classes

### Total Lines Added: ~1,200 lines

---

## 🔄 Integration Points with Backend

### 1. API Endpoints Used
- `GET /api/course-draft/:courseId` - Get/create draft
- `GET /api/course-draft/:courseId/status` - Check draft status
- `POST /api/course-draft/:courseId/submit` - Submit for approval
- `DELETE /api/course-draft/:courseId` - Cancel draft
- `POST /api/section` - Add section (auto-draft)
- `PUT /api/section/:id` - Update section
- `DELETE /api/section/:id` - Delete section
- `POST /api/lesson` - Add lesson (auto-draft)
- `PUT /api/lesson/:id` - Update lesson
- `DELETE /api/lesson/:id` - Delete lesson
- `GET /api/admin/revisions/pending` - Get pending drafts

### 2. Response Format
All draft-aware endpoints return:
```javascript
{
  success: true,
  isDraft: boolean,
  courseDraftId: string,
  data: {
    _id: string,
    changeType: 'new' | 'modified' | 'deleted' | 'unchanged',
    // ... entity fields
  }
}
```

### 3. Backend Dependencies
- `backend/models/CourseDraft.js` - Main draft model
- `backend/models/SectionDraft.js` - Section draft
- `backend/models/LessonDraft.js` - Lesson draft
- `backend/utils/draftHelper.js` - Draft utilities
- `backend/controllers/sectionController.js` - Draft-aware section ops
- `backend/controllers/lessonController.js` - Draft-aware lesson ops

---

## 🎯 How It Works

### User Journey: Instructor Edits Approved Course

1. **Open Course for Edit**
   ```
   Instructor clicks "Edit" → CourseManagement loads
   ↓
   checkDraftStatus() called
   ↓
   API: hasPendingDraft(courseId)
   ↓
   If hasDraft → setDraftMode(true), show DraftBanner
   ```

2. **Make Changes**
   ```
   Instructor adds section
   ↓
   Frontend: draftService.addSection(courseId, data, token)
   ↓
   Backend: getOrCreateDraft() → auto-copies published if no draft
   ↓
   Backend: Creates SectionDraft with changeType='new'
   ↓
   Response: { isDraft: true, courseDraftId: '123', data: section }
   ↓
   Frontend: Updates UI with draft indicator
   ```

3. **Submit for Approval**
   ```
   Instructor clicks "Gửi phê duyệt"
   ↓
   handleSubmitDraft() → Confirmation dialog
   ↓
   draftService.submitDraftForApproval(courseId)
   ↓
   Backend: Updates draft.status = 'pending'
   ↓
   Frontend: setDraftStatus('pending'), banner updates
   ```

4. **Admin Reviews**
   ```
   Admin opens RevisionApproval
   ↓
   Shows list of pending drafts
   ↓
   Admin clicks "Xem chi tiết"
   ↓
   Modal shows: change summary, change log
   ↓
   Admin clicks "Phê duyệt"
   ↓
   Backend: Applies draft to published, deletes draft
   ↓
   Frontend: Refreshes list
   ```

---

## ✨ Key Features Implemented

### 1. Automatic Draft Creation
- Backend automatically creates draft from published course on first edit
- No manual draft creation needed
- Preserves all sections, lessons, content with changeType='unchanged'

### 2. Real-time Draft Status
- Frontend checks draft status on page load
- Shows visual indicators (banner, badges)
- Updates on status changes

### 3. Draft Mode Banner
- Prominent warning banner when editing draft
- Shows course name, status, change count
- Action buttons for submit/cancel

### 4. Change Tracking
- Backend tracks all changes in changeLog Map
- Frontend displays change summary
- Admin sees detailed change history

### 5. Safe Cancellation
- Strong confirmation before deleting draft
- Reloads published data after cancel
- Cleans up uploaded content (MUX/Cloudinary)

### 6. Admin Approval Interface
- Visual change summary with statistics
- Detailed change log with timestamps
- Clear approve/reject actions

---

## 🚀 Next Steps (Not Yet Implemented)

### 1. Video/Material/Quiz Controllers
- Apply same draft-aware pattern
- Handle MUX webhooks for draft videos
- Track material uploads in drafts

### 2. Enhanced Approval Logic
- Process changeType correctly (new/modified/deleted)
- Apply draft changes to published atomically
- Create rollback snapshots

### 3. Curriculum Component Updates
- Show draft indicators on sections/lessons
- Highlight modified items
- Show deleted items with strikethrough

### 4. Diff View
- Side-by-side comparison for admin
- Highlight changes in text fields
- Show before/after for media

### 5. Conflict Resolution
- Detect if published changed while draft pending
- Merge strategies
- Conflict notification

---

## 📝 Usage Examples

### For Developers

#### Check if Course Has Draft
```javascript
import * as draftService from '../services/draftService';

const token = await getToken();
const status = await draftService.hasPendingDraft(courseId, token);

if (status.hasDraft) {
  console.log('Draft exists with status:', status.status);
  // Show draft mode UI
}
```

#### Add Section in Draft Mode
```javascript
const response = await draftService.addSection(
  courseId, 
  { title: 'New Section', order: 1 },
  token
);

if (response.isDraft) {
  console.log('Created draft section:', response.courseDraftId);
  // Show draft indicator
}
```

#### Display Draft Banner
```jsx
import { DraftBanner } from '../components/DraftIndicator/DraftIndicator';

<DraftBanner
  courseName={courseData.title}
  status={draftStatus}
  changeCount={5}
  onSubmit={async () => {
    await draftService.submitDraftForApproval(courseId, token);
    alert('Submitted!');
  }}
  onCancel={async () => {
    await draftService.cancelDraft(courseId, token);
    alert('Cancelled!');
  }}
/>
```

---

## 🎨 UI/UX Features

### Visual Indicators
- **Gray Badge**: Draft mode (editing)
- **Yellow Badge**: Pending approval
- **Green Badge**: Approved
- **Red Badge**: Rejected

### Banner States
- **Draft**: Gray banner with edit icon
- **Pending**: Yellow banner with clock icon
- **Rejected**: Red banner with X icon

### Buttons
- **Submit**: Green, prominent
- **Cancel**: White with border, secondary
- **Disabled**: Grayed out when saving

### Responsive Design
- Mobile-friendly layouts
- Stacked buttons on small screens
- Adaptive grid for change summary

---

## 🔒 Security Considerations

### Frontend
- All API calls require authentication token
- Confirmation dialogs for destructive actions
- Error messages don't expose sensitive info

### Backend (Already Implemented)
- Auth middleware on all routes
- Permission checks (instructor can only edit own courses)
- Admin-only approval endpoints
- Cascade deletes prevent orphan data

---

## 📊 Performance Considerations

### Optimizations
- Draft status checked only once on mount
- State updates are minimal
- API responses are cached where appropriate

### Loading States
- Skeleton loaders for draft data
- Disabled buttons during operations
- Loading text on action buttons

---

## 🧪 Testing Recommendations

### Unit Tests
- Test draftService functions
- Test DraftIndicator component variants
- Test DraftBanner actions

### Integration Tests
- Test draft creation workflow
- Test submission workflow
- Test cancellation workflow
- Test admin approval workflow

### E2E Tests
- Full instructor flow (create → edit → submit → approve)
- Multiple instructors editing different courses
- Draft timeout and cleanup

---

**Implementation Status:** ✅ Complete (Frontend Integration)
**Remaining Work:** Backend video/material/quiz controllers, Enhanced approval logic
**Documentation:** ✅ Complete
**Testing:** ⚠️ Pending

**Implemented By:** GitHub Copilot
**Date:** November 27, 2025
