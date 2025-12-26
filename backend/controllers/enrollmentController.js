import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Section from '../models/Section.js';
import Video from '../models/video.js';
import Material from '../models/Material.js';
import Quiz from '../models/Quiz.js';

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

        // Kiểm tra xem khóa học có tồn tại không (MongoDB)
        const course = await Course.findOne({ 
            _id: courseId, 
            course_status: 'approved' 
        }).lean();

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found or not available for enrollment'
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
        const { userId } = req; // userId được lấy từ protectUserAction middleware

        const enrollments = await Enrollment.find({ userId: userId })
            .sort({ createdAt: -1 });

        // Lấy thông tin khóa học từ MongoDB cho mỗi enrollment
        const enrollmentsWithCourseInfo = await Promise.all(
            enrollments.map(async (enrollment) => {
                // Lấy course từ MongoDB
                const course = await Course.findById(enrollment.courseId).lean();
                
                if (!course) {
                    return null;
                }
                
                // Lấy instructor info
                const instructor = await User.findById(course.instructor_id).lean();

                // Lấy sections và lessons để tính totalLessons
                const sections = await Section.find({ course_id: enrollment.courseId })
                    .sort({ order: 1 })
                    .lean();

                // Lấy số lượng lessons trong mỗi section
                const sectionsWithLessons = await Promise.all(
                    sections.map(async (section) => {
                        const sectionIdStr = section._id.toString();
                        
                        const [videoCount, materialCount, quizCount] = await Promise.all([
                            Video.countDocuments({ section: sectionIdStr }),
                            Material.countDocuments({ section: sectionIdStr }),
                            Quiz.countDocuments({ section: sectionIdStr })
                        ]);

                        return {
                            _id: section._id,
                            title: section.title,
                            order: section.order,
                            lessons: {
                                count: videoCount + materialCount + quizCount
                            }
                        };
                    })
                );

                return {
                    enrollmentId: enrollment._id,
                    userId: enrollment.userId,
                    courseId: enrollment.courseId,
                    completedLessons: enrollment.completedLessons,
                    enrolledAt: enrollment.createdAt,
                    course: {
                        course_id: course._id,
                        title: course.title,
                        subTitle: course.sub_title,
                        des: course.description,
                        originalPrice: course.original_price,
                        currentPrice: course.current_price,
                        picture_url: course.thumbnail_url,
                        course_status: course.course_status,
                        full_name: instructor?.full_name || 'Instructor',
                        instructor_ava: instructor?.ava || '',
                        sections: sectionsWithLessons
                    }
                };
            })
        );

        res.json({
            success: true,
            data: enrollmentsWithCourseInfo.filter(e => e !== null)
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
        const { userId } = req; // userId được lấy từ protectUserAction middleware
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
        const { userId } = req; // userId được lấy từ protectUserAction middleware
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


