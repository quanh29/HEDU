import CourseRevision from '../models/CourseDraft.js';
import pool from '../config/mysql.js';
import Course from '../models/Course.js';

/**
 * Check if a course is in approved status
 * @param {string} courseId - MySQL course_id
 * @returns {Promise<boolean>}
 */
export const isCourseApproved = async (courseId) => {
    try {
        const [courses] = await pool.query(
            'SELECT course_status FROM Courses WHERE course_id = ?',
            [courseId]
        );
        return courses[0]?.course_status === 'approved';
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
        
        // Load current course data from MySQL
        const [courses] = await pool.query(
            'SELECT * FROM Courses WHERE course_id = ?',
            [courseId]
        );
        
        if (!courses || courses.length === 0) {
            throw new Error(`Course not found: ${courseId}`);
        }
        
        const course = courses[0];
        
        // Load MongoDB course data
        const mongoCourse = await Course.findById(courseId);
        
        // Load categories
        const [categories] = await pool.query(
            'SELECT category_id FROM Labeling WHERE course_id = ?',
            [courseId]
        );
        const categoryIds = categories.map(c => c.category_id);
        
        // Create new revision
        revision = new CourseRevision({
            courseId: courseId,
            title: course.title || '',
            subtitle: course.subTitle || '',
            instructors: [course.instructor_id || userId],
            description: course.des || '',
            thumbnail: course.picture_url || '',
            originalPrice: course.originalPrice || 0,
            currentPrice: course.currentPrice || 0,
            createdAt: course.createdAt || new Date(),
            updatedAt: new Date(),
            tags: categoryIds,
            level: course.lv_id || 'beginner',
            language: course.lang_id || 'vietnamese',
            hasPractice: course.has_practice || false,
            hasCertificate: course.has_certificate || false,
            requirements: mongoCourse?.requirements || [],
            objectives: mongoCourse?.objectives || [],
            sections: [], // Legacy field, will be deprecated
            status: 'pending',
            version: (course.version || 0) + 1,
            lv_id: course.lv_id,
            lang_id: course.lang_id,
            categories: categoryIds,
            picture_url: course.picture_url,
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
