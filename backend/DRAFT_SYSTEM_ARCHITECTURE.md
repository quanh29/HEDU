# Draft/Revision System Architecture

## Overview

This document describes the comprehensive draft/revision system for courses, sections, lessons, and content (videos, materials, quizzes). The system ensures that instructors always work on draft versions when editing approved courses, and only after admin approval do the changes reflect in the published course.

## Key Principle

**One Draft Per Course**: Each course can have only ONE active draft revision at any time. This simplifies the workflow and prevents conflicts.

---

## Data Models

### 1. CourseRevision (Modified)
**Location**: `backend/models/CourseRevision.js`

The main document that tracks a course revision. It now includes references to all draft documents.

**New Fields**:
```javascript
{
  // Legacy (kept for backward compatibility)
  sections: [],  // Embedded sections array
  
  // NEW: References to draft documents
  draftSections: [ObjectId],     // Refs to SectionDraft
  draftLessons: [ObjectId],      // Refs to LessonDraft
  draftVideos: [ObjectId],       // Refs to VideoDraft
  draftMaterials: [ObjectId],    // Refs to MaterialDraft
  draftQuizzes: [ObjectId],      // Refs to QuizDraft
  
  // Change tracking
  changeLog: Map<String, Mixed>, // Track what changed
  
  // Version management
  previousVersion: Mixed,        // Snapshot for rollback
  
  // Workflow timestamps
  submittedAt: Date,
  reviewedAt: Date,
  reviewedBy: String            // Admin user ID
}
```

**Status Flow**:
- `pending` → Submitted for approval
- `approved` → Approved by admin, applied to published course
- `rejected` → Rejected by admin with reason

---

### 2. SectionDraft
**Location**: `backend/models/SectionDraft.js`

Draft version of a section.

**Schema**:
```javascript
{
  publishedSectionId: ObjectId,  // Link to Section (null if new)
  revisionId: ObjectId,          // Required: Link to CourseRevision
  course_id: String,             // Course reference
  
  // Section data (mirrors Section model)
  title: String,
  order: Number,
  
  // Draft-specific fields
  status: enum['draft', 'pending', 'approved', 'rejected'],
  changeType: enum['new', 'modified', 'deleted', 'unchanged'],
  changes: Map<String, Mixed>
}
```

**Cascade Delete**: When a SectionDraft is deleted, it automatically deletes all associated LessonDrafts and their content.

---

### 3. LessonDraft
**Location**: `backend/models/LessonDraft.js`

Draft version of a lesson.

**Schema**:
```javascript
{
  publishedLessonId: ObjectId,   // Link to Lesson (null if new)
  revisionId: ObjectId,          // Required: Link to CourseRevision
  draftSectionId: ObjectId,      // Required: Link to SectionDraft
  
  // Lesson data (mirrors Lesson model)
  title: String,
  contentType: enum['video', 'material', 'quiz'],
  order: Number,
  description: String,
  duration: Number,
  isFreePreview: Boolean,
  
  // References to draft content
  draftVideoId: ObjectId,        // Link to VideoDraft
  draftMaterialId: ObjectId,     // Link to MaterialDraft
  draftQuizId: ObjectId,         // Link to QuizDraft
  
  // Draft-specific fields
  status: enum['draft', 'pending', 'approved', 'rejected'],
  changeType: enum['new', 'modified', 'deleted', 'unchanged'],
  changes: Map<String, Mixed>
}
```

**Cascade Delete**: When a LessonDraft is deleted, it automatically deletes the associated draft content (video/material/quiz).

---

### 4. VideoDraft
**Location**: `backend/models/VideoDraft.js`

Draft version of a video.

**Schema**:
```javascript
{
  publishedVideoId: ObjectId,    // Link to Video (null if new)
  revisionId: ObjectId,          // Required: Link to CourseRevision
  draftLessonId: ObjectId,       // Required: Link to LessonDraft
  
  // Video data (mirrors Video model)
  title: String,
  userId: String,                // Clerk user ID
  uploadId: String,              // MUX upload ID
  assetId: String,               // MUX asset ID
  playbackId: String,            // MUX playback ID
  status: enum['uploading', 'processing', 'ready', 'error', 'cancelled'],
  duration: Number,
  description: String,
  order: Number,
  
  // Draft-specific fields
  draftStatus: enum['draft', 'pending', 'approved', 'rejected'],
  changeType: enum['new', 'modified', 'deleted', 'unchanged'],
  changes: Map<String, Mixed>
}
```

---

### 5. MaterialDraft
**Location**: `backend/models/MaterialDraft.js`

Draft version of a material/document.

**Schema**:
```javascript
{
  publishedMaterialId: ObjectId, // Link to Material (null if new)
  revisionId: ObjectId,          // Required: Link to CourseRevision
  draftLessonId: ObjectId,       // Required: Link to LessonDraft
  
  // Material data (mirrors Material model)
  title: String,
  contentUrl: String,            // Cloudinary public ID
  order: Number,
  resource_type: String,
  originalFilename: String,
  fileSize: Number,
  extension: String,
  isTemporary: Boolean,
  
  // Draft-specific fields
  draftStatus: enum['draft', 'pending', 'approved', 'rejected'],
  changeType: enum['new', 'modified', 'deleted', 'unchanged'],
  changes: Map<String, Mixed>
}
```

---

### 6. QuizDraft
**Location**: `backend/models/QuizDraft.js`

Draft version of a quiz.

**Schema**:
```javascript
{
  publishedQuizId: ObjectId,     // Link to Quiz (null if new)
  revisionId: ObjectId,          // Required: Link to CourseRevision
  draftLessonId: ObjectId,       // Required: Link to LessonDraft
  
  // Quiz data (mirrors Quiz model)
  title: String,
  questions: [{
    questionText: String,
    options: Array,
    correctAnswers: Array,
    explanation: String
  }],
  order: Number,
  
  // Draft-specific fields
  draftStatus: enum['draft', 'pending', 'approved', 'rejected'],
  changeType: enum['new', 'modified', 'deleted', 'unchanged'],
  changes: Map<String, Mixed>
}
```

---

## Workflow

### Phase 1: Creating/Editing a Draft

#### For NEW Courses (Status: draft/rejected):
1. Instructor creates course → Creates CourseRevision with status 'draft'
2. Instructor adds sections/lessons/content → Creates Section/Lesson/Video/Material/Quiz documents directly (NO draft documents)
3. Instructor submits for approval → CourseRevision status changes to 'pending'

#### For APPROVED Courses (Status: approved):
1. Instructor edits approved course → System checks if draft already exists
   - If NO draft exists → Create new CourseRevision with status 'pending' + Create draft documents
   - If draft exists → Return error "A pending revision already exists"
2. Instructor modifies structure:
   - **Add Section** → Create SectionDraft (changeType: 'new', publishedSectionId: null)
   - **Edit Section** → Create/Update SectionDraft (changeType: 'modified', publishedSectionId: <sectionId>)
   - **Delete Section** → Create SectionDraft (changeType: 'deleted', publishedSectionId: <sectionId>)
3. Instructor modifies lessons (similar pattern):
   - **Add Lesson** → Create LessonDraft (changeType: 'new', publishedLessonId: null)
   - **Edit Lesson** → Create/Update LessonDraft (changeType: 'modified')
   - **Delete Lesson** → Create LessonDraft (changeType: 'deleted')
4. Instructor uploads content:
   - **Upload Video** → Create VideoDraft linked to LessonDraft
   - **Upload Material** → Create MaterialDraft linked to LessonDraft
   - **Create Quiz** → Create QuizDraft linked to LessonDraft
5. Instructor submits → CourseRevision status remains 'pending', sets `submittedAt` timestamp

---

### Phase 2: Admin Review

1. Admin navigates to "Duyệt cập nhật" (Revision Approval)
2. System displays pending CourseRevisions with summary:
   - Course title, instructor name
   - Number of sections/lessons changed
   - Timestamp of submission
3. Admin clicks "View Details" → System loads:
   - Side-by-side comparison (current vs. draft)
   - Highlighted changes (new/modified/deleted)
   - Diff view for text fields
4. Admin decides:
   - **Approve** → Triggers approval workflow
   - **Reject** → Marks revision as rejected + Stores rejection reason

---

### Phase 3: Approval Workflow

**Function**: `approveRevision()` in `courseRevisionController.js`

#### Steps:

1. **Verify Revision Status**
   - Check revision status is 'pending'
   - Load all draft documents (sections, lessons, content)

2. **Create Version Snapshot** (for rollback)
   ```javascript
   const snapshot = {
     courseData: { /* MySQL course data */ },
     sections: [ /* Current published sections */ ],
     lessons: [ /* Current published lessons */ ],
     content: [ /* Current videos/materials/quizzes */ ]
   };
   revision.previousVersion = snapshot;
   ```

3. **Update MySQL Course Data**
   - Update course metadata (title, subtitle, description, price, etc.)
   - Update categories in Labeling table

4. **Update MongoDB Course Document**
   - Update requirements and objectives

5. **Process Draft Sections**
   - Iterate through `draftSections` array
   - For each SectionDraft:
     - **changeType: 'new'** → Create new Section document
     - **changeType: 'modified'** → Update existing Section (using publishedSectionId)
     - **changeType: 'deleted'** → Delete Section (triggers cascade delete of lessons/content)
     - **changeType: 'unchanged'** → Skip (no changes)

6. **Process Draft Lessons**
   - Iterate through `draftLessons` array
   - For each LessonDraft:
     - **changeType: 'new'** → Create new Lesson document
     - **changeType: 'modified'** → Update existing Lesson
     - **changeType: 'deleted'** → Delete Lesson (triggers cascade delete of content)

7. **Process Draft Content**
   - **Videos**:
     - For each VideoDraft:
       - **changeType: 'new'** → Create new Video document
       - **changeType: 'modified'** → Update existing Video
       - **changeType: 'deleted'** → Delete Video from MUX and MongoDB
   - **Materials**:
     - For each MaterialDraft:
       - **changeType: 'new'** → Create new Material document (set isTemporary: false)
       - **changeType: 'modified'** → Update existing Material
       - **changeType: 'deleted'** → Delete Material from Cloudinary and MongoDB
   - **Quizzes**:
     - For each QuizDraft:
       - **changeType: 'new'** → Create new Quiz document
       - **changeType: 'modified'** → Update existing Quiz
       - **changeType: 'deleted'** → Delete Quiz

8. **Update Revision Status**
   ```javascript
   revision.status = 'approved';
   revision.reviewedAt = new Date();
   revision.reviewedBy = req.auth.userId; // Admin's Clerk ID
   await revision.save();
   ```

9. **Cleanup Draft Documents**
   - Delete all SectionDraft documents (cascade deletes LessonDrafts and content drafts)
   - Clear `draftSections`, `draftLessons`, `draftVideos`, `draftMaterials`, `draftQuizzes` arrays in CourseRevision

10. **Log Changes**
    - Record approval action in system logs
    - Notify instructor (optional: via email/notification)

---

### Phase 4: Rejection Workflow

**Function**: `rejectRevision()` in `courseRevisionController.js`

#### Steps:

1. **Verify Revision Status**
   - Check revision status is 'pending'

2. **Update Revision Status**
   ```javascript
   revision.status = 'rejected';
   revision.rejectionReason = reason; // Provided by admin
   revision.reviewedAt = new Date();
   revision.reviewedBy = req.auth.userId;
   await revision.save();
   ```

3. **Cleanup Draft Content** (Optional - can keep for instructor to revise)
   - **Option A (Keep Drafts)**: Leave draft documents so instructor can fix and resubmit
   - **Option B (Delete Drafts)**: Delete all draft documents to force fresh start
   
   **Recommended**: Option A (Keep Drafts)

4. **Delete Uploaded Content Files**
   - For rejected VideoDrafts: Delete from MUX (call MUX API to delete asset)
   - For rejected MaterialDrafts: Delete from Cloudinary
   - Note: Only delete if changeType is 'new' (don't delete modified existing content)

5. **Notify Instructor**
   - Send notification with rejection reason
   - Allow instructor to view rejection reason in UI

---

## Controller Logic Updates

### sectionController.js

**Current**:
- `addSection()` → Creates Section directly
- `updateSection()` → Updates Section directly
- `deleteSection()` → Deletes Section directly

**NEW**:
- Check if course is approved:
  - **If approved** → Create/Update SectionDraft (via CourseRevision)
  - **If draft/rejected** → Create/Update Section directly (existing logic)

**New Functions**:
```javascript
// Check if course is approved
const isCourseApproved = async (courseId) => {
  const [courses] = await pool.query(
    'SELECT course_status FROM Courses WHERE course_id = ?',
    [courseId]
  );
  return courses[0]?.course_status === 'approved';
};

// Get or create pending revision for course
const getOrCreateRevision = async (courseId, userId) => {
  let revision = await CourseRevision.findOne({
    courseId: courseId,
    status: 'pending'
  });
  
  if (!revision) {
    // Load current course data
    const [courses] = await pool.query('SELECT * FROM Courses WHERE course_id = ?', [courseId]);
    const course = courses[0];
    
    // Create new revision
    revision = new CourseRevision({
      courseId: courseId,
      // ... copy all course fields ...
      status: 'pending',
      version: (course.version || 0) + 1,
      submittedAt: new Date()
    });
    await revision.save();
  }
  
  return revision;
};

// Add section (draft-aware)
export const addSection = async (req, res) => {
  const { courseId, title, order } = req.body;
  
  try {
    const isApproved = await isCourseApproved(courseId);
    
    if (isApproved) {
      // Create draft section
      const revision = await getOrCreateRevision(courseId, req.auth.userId);
      
      const draftSection = new SectionDraft({
        publishedSectionId: null,
        revisionId: revision._id,
        course_id: courseId,
        title: title,
        order: order || 1,
        status: 'draft',
        changeType: 'new'
      });
      
      await draftSection.save();
      
      // Add to revision's draftSections array
      revision.draftSections.push(draftSection._id);
      await revision.save();
      
      return res.status(201).json({ 
        success: true, 
        isDraft: true,
        data: draftSection 
      });
    } else {
      // Create regular section (existing logic)
      const newSection = new Section({
        course_id: courseId,
        title: title,
        order: order || 1
      });
      
      await newSection.save();
      
      return res.status(201).json({ 
        success: true, 
        isDraft: false,
        data: newSection 
      });
    }
  } catch (error) {
    console.error('Error adding section:', error);
    res.status(500).json({ success: false, message: 'Error creating section' });
  }
};
```

---

### lessonController.js

Similar pattern to sectionController:

```javascript
export const createLesson = async (req, res) => {
  const { sectionId, title, contentType, order } = req.body;
  
  try {
    // Determine if this is a draft section or published section
    const section = await Section.findById(sectionId);
    const draftSection = await SectionDraft.findById(sectionId);
    
    if (draftSection) {
      // Working with draft - create LessonDraft
      const revision = await CourseRevision.findById(draftSection.revisionId);
      
      const draftLesson = new LessonDraft({
        publishedLessonId: null,
        revisionId: revision._id,
        draftSectionId: draftSection._id,
        title: title,
        contentType: contentType,
        order: order || 0,
        status: 'draft',
        changeType: 'new'
      });
      
      await draftLesson.save();
      
      revision.draftLessons.push(draftLesson._id);
      await revision.save();
      
      return res.status(201).json({ 
        success: true, 
        isDraft: true,
        data: draftLesson 
      });
    } else if (section) {
      // Check if course is approved
      const isApproved = await isCourseApproved(section.course_id);
      
      if (isApproved) {
        // Need to create draft
        const revision = await getOrCreateRevision(section.course_id, req.auth.userId);
        
        // First, ensure section has a draft
        let sectionDraft = await SectionDraft.findOne({
          publishedSectionId: section._id,
          revisionId: revision._id
        });
        
        if (!sectionDraft) {
          // Create section draft
          sectionDraft = new SectionDraft({
            publishedSectionId: section._id,
            revisionId: revision._id,
            course_id: section.course_id,
            title: section.title,
            order: section.order,
            status: 'draft',
            changeType: 'unchanged' // Section itself unchanged, just adding lesson
          });
          await sectionDraft.save();
          revision.draftSections.push(sectionDraft._id);
        }
        
        // Create lesson draft
        const draftLesson = new LessonDraft({
          publishedLessonId: null,
          revisionId: revision._id,
          draftSectionId: sectionDraft._id,
          title: title,
          contentType: contentType,
          order: order || 0,
          status: 'draft',
          changeType: 'new'
        });
        
        await draftLesson.save();
        revision.draftLessons.push(draftLesson._id);
        await revision.save();
        
        return res.status(201).json({ 
          success: true, 
          isDraft: true,
          data: draftLesson 
        });
      } else {
        // Create regular lesson (existing logic)
        const lesson = new Lesson({
          section: sectionId,
          title: title,
          contentType: contentType,
          order: order || 0
        });
        
        await lesson.save();
        
        return res.status(201).json({ 
          success: true, 
          isDraft: false,
          data: lesson 
        });
      }
    } else {
      return res.status(404).json({ 
        success: false, 
        message: 'Section not found' 
      });
    }
  } catch (error) {
    console.error('Error creating lesson:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create lesson',
      error: error.message 
    });
  }
};
```

---

### videoController.js, materialController.js, quizController.js

Similar draft-aware logic:

1. Check if the parent lesson is a LessonDraft or Lesson
2. If LessonDraft → Create draft content document
3. If Lesson and course is approved → Create LessonDraft first, then draft content
4. If Lesson and course is draft → Create regular content document

---

## Cleanup Utilities

**Location**: `backend/utils/draftCleanup.js`

```javascript
import VideoDraft from '../models/VideoDraft.js';
import MaterialDraft from '../models/MaterialDraft.js';
import SectionDraft from '../models/SectionDraft.js';
import CourseRevision from '../models/CourseRevision.js';
import Mux from '@mux/mux-node';
import { v2 as cloudinary } from 'cloudinary';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

/**
 * Clean up draft content when revision is rejected
 * Only deletes NEW content (changeType: 'new'), not modified existing content
 */
export const cleanupRejectedRevision = async (revisionId) => {
  try {
    console.log(`🧹 Starting cleanup for rejected revision: ${revisionId}`);
    
    // Get revision
    const revision = await CourseRevision.findById(revisionId);
    if (!revision) {
      throw new Error('Revision not found');
    }
    
    // Delete NEW videos from MUX
    const newVideos = await VideoDraft.find({
      revisionId: revisionId,
      changeType: 'new'
    });
    
    for (const video of newVideos) {
      if (video.assetId) {
        try {
          await mux.video.assets.delete(video.assetId);
          console.log(`  ✅ Deleted MUX asset: ${video.assetId}`);
        } catch (error) {
          console.error(`  ❌ Failed to delete MUX asset ${video.assetId}:`, error);
        }
      }
    }
    
    // Delete NEW materials from Cloudinary
    const newMaterials = await MaterialDraft.find({
      revisionId: revisionId,
      changeType: 'new'
    });
    
    for (const material of newMaterials) {
      if (material.contentUrl) {
        try {
          await cloudinary.uploader.destroy(material.contentUrl, {
            resource_type: material.resource_type
          });
          console.log(`  ✅ Deleted Cloudinary file: ${material.contentUrl}`);
        } catch (error) {
          console.error(`  ❌ Failed to delete Cloudinary file ${material.contentUrl}:`, error);
        }
      }
    }
    
    // Delete all draft documents (cascade delete handles relationships)
    const draftSections = await SectionDraft.find({ revisionId: revisionId });
    for (const section of draftSections) {
      await section.deleteOne(); // Triggers cascade delete
    }
    
    console.log(`✅ Cleanup completed for revision: ${revisionId}`);
  } catch (error) {
    console.error(`❌ Error cleaning up revision ${revisionId}:`, error);
    throw error;
  }
};

/**
 * Clean up abandoned drafts (revisions pending > 30 days)
 * Can be run as a scheduled job
 */
export const cleanupAbandonedDrafts = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const abandonedRevisions = await CourseRevision.find({
      status: 'pending',
      submittedAt: { $lt: thirtyDaysAgo }
    });
    
    console.log(`🧹 Found ${abandonedRevisions.length} abandoned revisions`);
    
    for (const revision of abandonedRevisions) {
      await cleanupRejectedRevision(revision._id);
      
      // Mark as rejected
      revision.status = 'rejected';
      revision.rejectionReason = 'Automatically rejected due to inactivity (30+ days)';
      revision.reviewedAt = new Date();
      await revision.save();
    }
    
    console.log(`✅ Cleaned up ${abandonedRevisions.length} abandoned revisions`);
  } catch (error) {
    console.error('❌ Error cleaning up abandoned drafts:', error);
    throw error;
  }
};
```

---

## Frontend Integration

### Key Changes in Curriculum.jsx

1. **Detect Draft Mode**:
   ```javascript
   const [isDraftMode, setIsDraftMode] = useState(false);
   const [revisionId, setRevisionId] = useState(null);
   
   useEffect(() => {
     // Check if course is approved
     if (courseStatus === 'approved') {
       // Fetch pending revision
       fetchPendingRevision(courseId);
     }
   }, [courseId, courseStatus]);
   ```

2. **Show Draft Indicators**:
   ```jsx
   {isDraftMode && (
     <div className={styles.draftBanner}>
       <AlertCircle /> You are editing a DRAFT. Changes will not be published until approved.
     </div>
   )}
   
   {section.isDraft && (
     <span className={styles.draftBadge}>DRAFT</span>
   )}
   ```

3. **API Calls**:
   - When adding/editing sections/lessons/content, check `isDraftMode`
   - If draft mode, call draft-specific endpoints
   - If not draft mode, use existing endpoints

---

## Summary

This draft/revision system provides:

✅ **Separation of Concerns**: Draft content is isolated from published content  
✅ **Single Draft**: Only one pending revision per course prevents conflicts  
✅ **Atomic Updates**: All changes applied together on approval  
✅ **Rollback Capability**: Previous version snapshot enables rollback  
✅ **Clean Workflow**: Clear separation between draft/pending/approved/rejected states  
✅ **Content Cleanup**: Automatic deletion of orphaned draft content  
✅ **Change Tracking**: changeLog and changeType fields enable detailed comparison  

The system ensures instructors can safely work on approved courses without affecting live students, and admins have full control over what gets published.
