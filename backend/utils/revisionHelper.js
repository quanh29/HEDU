import CourseRevision from '../models/CourseDraft.js';
import Course from '../models/Course.js';
import Labeling from '../models/Labeling.js';

/**
 * Check if a course is in approved status
 * @param {string} courseId - MySQL course_id
 * @returns {Promise<boolean>}
 */
export const isCourseApproved = async (courseId) => {
    try {
        const course = await Course.findById(courseId).select('course_status').lean();
        return course?.course_status === 'approved';
    } catch (error) {
        console.error('Error checking course approval status:', error);
        throw error;
    }
};

/**
 * Get existing pending revision for a course, or null if none exists
 * @param {string} courseId - MySQL course_id
 * @returns {Promise<CourseRevision|null>}
 */
export const getPendingRevision = async (courseId) => {
    try {
        const revision = await CourseRevision.findOne({
            courseId: courseId,
            status: 'pending'
        });
        return revision;
    } catch (error) {
        console.error('Error getting pending revision:', error);
        throw error;
    }
};

/**
 * Get or create a pending revision for an approved course
 * Only creates new revision if one doesn't exist
 * @param {string} courseId - MySQL course_id
 * @param {string} userId - Clerk user ID of instructor
 * @returns {Promise<CourseRevision>}
 */
export const getOrCreateRevision = async (courseId, userId) => {
    try {
        // Check if pending revision already exists
        let revision = await getPendingRevision(courseId);
        
        if (revision) {
            console.log(`📋 Using existing pending revision: ${revision._id}`);
            return revision;
        }
        
        // Load current course data from MongoDB
        const course = await Course.findById(courseId).lean();
        
        if (!course) {
            throw new Error(`Course not found: ${courseId}`);
        }
        
        // Load categories from MongoDB
        const categoryDocs = await Labeling.find({ course_id: courseId }).select('category_id').lean();
        const categoryIds = categoryDocs.map(c => c.category_id);
        
        // Create new revision
        revision = new CourseRevision({
            courseId: courseId,
            title: course.title || '',
            subtitle: course.sub_title || '',
            instructors: [course.instructor_id || userId],
            description: course.description || '',
            thumbnail: course.thumbnail_url || '',
            originalPrice: course.original_price || 0,
            currentPrice: course.current_price || 0,
            createdAt: course.createdAt || new Date(),
            updatedAt: new Date(),
            tags: categoryIds,
            level: course.level_id || 'beginner',
            language: course.lang_id || 'vietnamese',
            hasPractice: course.has_practice || false,
            hasCertificate: course.has_certificate || false,
            requirements: course.requirements || [],
            objectives: course.objectives || [],
            sections: [], // Legacy field, will be deprecated
            status: 'pending',
            version: (course.version || 0) + 1,
            lv_id: course.level_id,
            lang_id: course.lang_id,
            categories: categoryIds,
            picture_url: course.thumbnail_url,
            submittedAt: new Date(),
            draftSections: [],
            draftLessons: [],
            draftVideos: [],
            draftMaterials: [],
            draftQuizzes: [],
            changeLog: new Map()
        });
        
        await revision.save();
        
        console.log(`✅ Created new pending revision: ${revision._id} for course: ${courseId}`);
        
        return revision;
    } catch (error) {
        console.error('Error creating revision:', error);
        throw error;
    }
};

/**
 * Check if instructor can edit course (no pending revision exists)
 * @param {string} courseId - MySQL course_id
 * @returns {Promise<{canEdit: boolean, reason?: string, revisionId?: string}>}
 */
export const canEditCourse = async (courseId) => {
    try {
        const pendingRevision = await getPendingRevision(courseId);
        
        if (pendingRevision) {
            return {
                canEdit: false,
                reason: 'A pending revision already exists for this course. Please wait for approval or cancel the pending revision.',
                revisionId: pendingRevision._id
            };
        }
        
        return { canEdit: true };
    } catch (error) {
        console.error('Error checking edit permission:', error);
        throw error;
    }
};

/**
 * Add change to revision's change log
 * @param {CourseRevision} revision 
 * @param {string} type - Type of change (section, lesson, video, etc.)
 * @param {string} action - Action performed (create, update, delete)
 * @param {object} details - Details of the change
 */
export const logChange = (revision, type, action, details) => {
    const timestamp = new Date().toISOString();
    const changeKey = `${type}_${action}_${timestamp}`;
    
    revision.changeLog.set(changeKey, {
        type,
        action,
        details,
        timestamp
    });
};
