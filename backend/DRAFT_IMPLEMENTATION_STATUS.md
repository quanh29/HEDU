# Draft/Revision System - Implementation Summary

## Overview

A comprehensive draft/revision system has been implemented for courses, sections, lessons, and content (videos, materials, quizzes). This system ensures that instructors work on draft versions when editing approved courses, and only after admin approval do changes reflect in the published course.

## ✅ Completed Components

### 1. Draft Models Created

All draft models have been created in `backend/models/`:

- **SectionDraft.js** - Draft version of sections
- **LessonDraft.js** - Draft version of lessons  
- **VideoDraft.js** - Draft version of videos
- **MaterialDraft.js** - Draft version of materials
- **QuizDraft.js** - Draft version of quizzes

**Key Features**:
- Link to published version (`publishedSectionId`, `publishedLessonId`, etc.)
- Link to revision (`revisionId`)
- Status tracking (`status`, `changeType`)
- Change tracking (`changes` Map)
- Cascade delete hooks (deleting a SectionDraft deletes all its LessonDrafts and content)

### 2. CourseRevision Model Updated

**File**: `backend/models/CourseRevision.js`

**New Fields Added**:
```javascript
{
  // References to draft documents
  draftSections: [ObjectId],
  draftLessons: [ObjectId],
  draftVideos: [ObjectId],
  draftMaterials: [ObjectId],
  draftQuizzes: [ObjectId],
  
  // Change tracking
  changeLog: Map<String, Mixed>,
  
  // Version management
  previousVersion: Mixed,
  
  // Workflow timestamps
  submittedAt: Date,
  reviewedAt: Date,
  reviewedBy: String
}
```

### 3. Utility Functions Created

#### **revisionHelper.js** (`backend/utils/revisionHelper.js`)

Helper functions for revision workflow:

- `isCourseApproved(courseId)` - Check if course is approved
- `getPendingRevision(courseId)` - Get existing pending revision
- `getOrCreateRevision(courseId, userId)` - Get or create pending revision
- `canEditCourse(courseId)` - Check if instructor can edit (no pending revision)
- `logChange(revision, type, action, details)` - Log changes to revision

#### **draftCleanup.js** (`backend/utils/draftCleanup.js`)

Cleanup utilities for orphaned drafts:

- `cleanupRejectedRevision(revisionId, deleteAll)` - Clean up when revision is rejected
  - Deletes NEW videos from MUX
  - Deletes NEW materials from Cloudinary
  - Deletes all draft documents
- `cleanupAbandonedDrafts()` - Clean up revisions pending > 30 days (for scheduled jobs)
- `deleteDraftVideo(videoDraftId)` - Delete specific draft video + MUX asset
- `deleteDraftMaterial(materialDraftId)` - Delete specific draft material + Cloudinary file
- `cancelCourseRevision(courseId)` - Cancel and cleanup entire revision

### 4. Controllers Updated

#### **sectionController.js** (✅ COMPLETE)

All functions updated with draft-aware logic:

- **addSection()** - Creates draft section if course is approved, regular section otherwise
- **getSectionsByCourseId()** - Can fetch both published and draft sections (with `includeDrafts=true` query param)
- **updateSection()** - Updates draft if course is approved, direct update otherwise
- **deleteSection()** - Marks for deletion if approved, deletes directly otherwise

#### **lessonController.js** (✅ PARTIAL - createLesson() updated)

- **createLesson()** - Creates draft lesson if course is approved, regular lesson otherwise
- ⚠️ **Remaining functions need update**: `updateLesson()`, `deleteLesson()`, `getLessonById()`, etc.

### 5. Documentation Created

- **DRAFT_SYSTEM_ARCHITECTURE.md** - Comprehensive architecture documentation
  - Data models explained
  - Workflow phases (Creating/Editing, Admin Review, Approval, Rejection)
  - Controller logic patterns
  - Frontend integration guidelines
  - Cleanup utilities

## 🚧 Remaining Work

### High Priority

1. **Complete lessonController.js**
   - Update `updateLesson()`
   - Update `deleteLesson()`
   - Update `getLessonById()` to support drafts
   - Update `getLessonsBySection()` to support drafts
   - Update `linkContentToLesson()` for drafts

2. **Update videoController.js**
   - Modify video upload flow to create VideoDraft for approved courses
   - Update `deleteVideo()` to work with drafts
   - Update `getVideoById()` to support drafts

3. **Update materialController.js**
   - Modify material upload to create MaterialDraft for approved courses
   - Update `deleteMaterial()` to work with drafts
   - Update `getMaterialById()` to support drafts

4. **Update quizController.js**
   - Modify quiz creation to create QuizDraft for approved courses
   - Update `updateQuiz()` to work with drafts
   - Update `deleteQuiz()` to work with drafts

5. **Enhance courseRevisionController.js**
   - **CRITICAL**: Update `approveRevision()` function to:
     - Process draft documents (sections, lessons, content)
     - Apply changes based on `changeType` (new, modified, deleted)
     - Copy draft data to published collections
     - Delete draft documents after approval
     - Create version snapshot for rollback
   
   - **CRITICAL**: Update `rejectRevision()` function to:
     - Call `cleanupRejectedRevision()` utility
     - Delete uploaded content (videos from MUX, materials from Cloudinary)
     - Optionally keep or delete draft documents

6. **Add Route for Draft Management**
   - Create route to cancel pending revision (`DELETE /api/course-revision/:courseId/cancel`)
   - Create route to get draft details (`GET /api/course-revision/:revisionId/drafts`)

### Medium Priority

7. **Frontend Updates**
   - Update `Curriculum.jsx` to detect draft mode
   - Show draft indicators/badges in UI
   - Handle draft-specific API responses
   - Add "Cancel Revision" button
   - Show pending revision banner

8. **Admin UI Updates**
   - Update `RevisionApproval.jsx` to show draft details
   - Add side-by-side comparison view
   - Highlight changes (new/modified/deleted)
   - Show diff for text fields

9. **WebSocket Integration**
   - Update video upload socket handlers to work with VideoDraft
   - Emit events for draft content status changes

### Low Priority

10. **Testing**
    - Unit tests for draft models
    - Integration tests for revision workflow
    - Test cascade deletes
    - Test cleanup utilities

11. **Scheduled Jobs**
    - Set up cron job to run `cleanupAbandonedDrafts()` daily
    - Monitor and log cleanup results

12. **Performance Optimization**
    - Index optimization for draft queries
    - Batch operations for approval workflow

## 📋 Implementation Checklist

### Backend

- [x] Create draft models (Section, Lesson, Video, Material, Quiz)
- [x] Update CourseRevision model with draft references
- [x] Create revisionHelper.js utility
- [x] Create draftCleanup.js utility
- [x] Update sectionController.js (complete)
- [x] Update lessonController.js (partial - createLesson only)
- [ ] Complete lessonController.js (remaining functions)
- [ ] Update videoController.js
- [ ] Update materialController.js
- [ ] Update quizController.js
- [ ] Enhance courseRevisionController.js (approval/rejection)
- [ ] Add draft management routes
- [ ] Test all controllers

### Frontend

- [ ] Update Curriculum.jsx for draft mode
- [ ] Add draft indicators/badges
- [ ] Update API calls to handle draft responses
- [ ] Add cancel revision functionality
- [ ] Update RevisionApproval component
- [ ] Add comparison/diff view
- [ ] Test instructor workflow
- [ ] Test admin workflow

### Infrastructure

- [ ] Set up scheduled job for cleanup
- [ ] Add monitoring/logging
- [ ] Performance testing
- [ ] Documentation for deployment

## 🎯 Next Steps

1. **Complete remaining controllers** - Focus on lesson, video, material, quiz controllers
2. **Enhance courseRevisionController** - Critical for approval/rejection workflow
3. **Frontend integration** - Update UI to work with draft system
4. **Testing** - Comprehensive testing of entire workflow
5. **Deployment** - Deploy and monitor

## 📊 Current Status

**Completion**: ~40% backend, 0% frontend

**Estimated Time to Complete**: 2-3 days of focused development

**Critical Path**: 
1. Complete lesson/video/material/quiz controllers (4-6 hours)
2. Enhance courseRevisionController approval logic (3-4 hours)
3. Frontend Curriculum.jsx updates (3-4 hours)
4. Testing and bug fixes (4-6 hours)

## 💡 Key Design Decisions

1. **One Draft Per Course** - Simplifies workflow, prevents conflicts
2. **Draft Collections** - Better than embedded documents for querying and relationships
3. **changeType Field** - Enables efficient diff and selective processing
4. **Cascade Deletes** - Mongoose middleware handles cleanup automatically
5. **Snapshot for Rollback** - Stores previous version before approval
6. **Cleanup Utilities** - Separate module for maintainability

## ⚠️ Important Notes

- Draft content (videos, materials) are uploaded to the same storage (MUX, Cloudinary) but tracked separately
- When revision is rejected, NEW draft content is deleted from storage
- MODIFIED draft content is kept (references existing published content)
- Cascade delete hooks ensure referential integrity
- Change log provides audit trail for all modifications

---

**Document Created**: November 27, 2025  
**Last Updated**: November 27, 2025  
**Author**: AI Assistant
