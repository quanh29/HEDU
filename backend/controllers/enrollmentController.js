import Enrollment from '../models/Enrollment.js';
import pool from '../config/mysql.js';

/**
 * Tạo enrollment mới khi user đăng ký khóa học
 */
export const createEnrollment = async (req, res) => {
    try {
        // const { userId } = req.auth(); // Lấy userId từ Clerk authentication
        const { courseId, userId } = req.body;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: 'Course ID is required'
            });
        }

        // Kiểm tra xem khóa học có tồn tại không
        const [courses] = await pool.query(
            'SELECT course_id, title, course_status FROM Courses WHERE course_id = ?',
            [courseId]
        );

        if (courses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        const course = courses[0];

        // Kiểm tra khóa học đã được approved chưa
        if (course.course_status !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'This course is not available for enrollment'
            });
        }

        // Kiểm tra xem user đã đăng ký khóa học này chưa
        const existingEnrollment = await Enrollment.findOne({
            userId: userId,
            courseId: courseId
        });

        if (existingEnrollment) {
            return res.status(400).json({
                success: false,
                message: 'You are already enrolled in this course'
            });
        }

        // Tạo enrollment mới
        const newEnrollment = new Enrollment({
            userId: userId,
            courseId: courseId,
            rating: null,
            completedLessons: []
        });

        await newEnrollment.save();

        res.status(201).json({
            success: true,
            message: 'Successfully enrolled in the course',
            data: {
                enrollmentId: newEnrollment._id,
                userId: newEnrollment.userId,
                courseId: newEnrollment.courseId,
                enrolledAt: newEnrollment.createdAt
            }
        });

    } catch (error) {
        console.error('Error creating enrollment:', error);
        res.status(500).json({
            success: false,
            message: 'Error enrolling in course',
            error: error.message
        });
    }
};

/**
 * Lấy tất cả enrollments của user
 */
export const getUserEnrollments = async (req, res) => {
    try {
        const { userId } = req.auth();

        const enrollments = await Enrollment.find({ userId: userId })
            .sort({ createdAt: -1 });

        // Lấy thông tin khóa học từ MySQL cho mỗi enrollment
        const enrollmentsWithCourseInfo = await Promise.all(
            enrollments.map(async (enrollment) => {
                const [courses] = await pool.query(
                    `SELECT c.*, u.fName, u.lName, u.ava as instructor_ava
                     FROM Courses c
                     LEFT JOIN Users u ON c.instructor_id = u.user_id
                     WHERE c.course_id = ?`,
                    [enrollment.courseId]
                );

                return {
                    enrollmentId: enrollment._id,
                    userId: enrollment.userId,
                    courseId: enrollment.courseId,
                    rating: enrollment.rating,
                    completedLessons: enrollment.completedLessons,
                    enrolledAt: enrollment.createdAt,
                    course: courses[0] || null
                };
            })
        );

        res.json({
            success: true,
            data: enrollmentsWithCourseInfo
        });

    } catch (error) {
        console.error('Error fetching user enrollments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching enrollments',
            error: error.message
        });
    }
};

/**
 * Kiểm tra xem user đã đăng ký khóa học chưa
 */
export const checkEnrollment = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { courseId } = req.params;

        const enrollment = await Enrollment.findOne({
            userId: userId,
            courseId: courseId
        });

        res.json({
            success: true,
            isEnrolled: !!enrollment,
            data: enrollment || null
        });

    } catch (error) {
        console.error('Error checking enrollment:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking enrollment',
            error: error.message
        });
    }
};

/**
 * Cập nhật completed lessons
 */
export const updateCompletedLessons = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { courseId } = req.params;
        const { lessonId, action } = req.body; // action: 'complete' or 'uncomplete'

        if (!lessonId) {
            return res.status(400).json({
                success: false,
                message: 'Lesson ID is required'
            });
        }

        const enrollment = await Enrollment.findOne({
            userId: userId,
            courseId: courseId
        });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Enrollment not found'
            });
        }

        // Kiểm tra action
        if (action === 'uncomplete') {
            // Xóa lessonId khỏi completedLessons
            enrollment.completedLessons = enrollment.completedLessons.filter(id => id !== lessonId);
            await enrollment.save();
        } else {
            // Thêm lessonId vào completedLessons nếu chưa có (default action)
            if (!enrollment.completedLessons.includes(lessonId)) {
                enrollment.completedLessons.push(lessonId);
                await enrollment.save();
            }
        }

        res.json({
            success: true,
            message: action === 'uncomplete' ? 'Lesson unmarked as completed' : 'Lesson marked as completed',
            data: {
                completedLessons: enrollment.completedLessons
            }
        });

    } catch (error) {
        console.error('Error updating completed lessons:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating progress',
            error: error.message
        });
    }
};

/**
 * Cập nhật rating cho khóa học
 */
export const updateCourseRating = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { courseId } = req.params;
        const { rating } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        const enrollment = await Enrollment.findOneAndUpdate(
            { userId: userId, courseId: courseId },
            { rating: rating },
            { new: true }
        );

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Enrollment not found'
            });
        }

        res.json({
            success: true,
            message: 'Rating updated successfully',
            data: {
                rating: enrollment.rating
            }
        });

    } catch (error) {
        console.error('Error updating rating:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating rating',
            error: error.message
        });
    }
};
