import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { pushNotification } from '../services/notificationService.js';
import { io } from '../server.js';
import { pushNotificationToUser } from '../sockets/notificationSocket.js';
import Section from '../models/Section.js';
import Lesson from '../models/Lesson.js';
import Video from '../models/video.js';
import Material from '../models/Material.js';
import Quiz from '../models/Quiz.js';
import Conversation from '../models/Conversation.js';
import logger from '../utils/logger.js';
import { removeFromWishlistInternal } from './wishlistController.js';

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
            completedLessons: []
        });

        await newEnrollment.save();

        // Xóa khóa học khỏi wishlist sau khi enrollment thành công
        await removeFromWishlistInternal(userId, courseId);

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

                // Lấy tất cả lesson IDs trong khóa học và số lượng lessons trong mỗi section
                const allLessonIds = [];
                const sectionsWithLessons = await Promise.all(
                    sections.map(async (section) => {
                        const sectionIdStr = section._id.toString();
                        
                        // Lấy tất cả lessons trong section này
                        const lessons = await Lesson.find({ section: sectionIdStr })
                            .select('_id')
                            .lean();
                        
                        // Thêm lesson IDs vào mảng tổng
                        lessons.forEach(lesson => {
                            allLessonIds.push(lesson._id.toString());
                        });

                        return {
                            _id: section._id,
                            title: section.title,
                            order: section.order,
                            lessons: {
                                count: lessons.length
                            }
                        };
                    })
                );

                // Chỉ đếm những completed lessons thực sự tồn tại trong khóa học
                const validCompletedLessons = enrollment.completedLessons.filter(
                    lessonId => allLessonIds.includes(lessonId)
                );

                // Tính tiến độ
                const totalLessons = allLessonIds.length;
                const progress = totalLessons > 0 
                    ? Math.round((validCompletedLessons.length / totalLessons) * 100)
                    : 0;

                return {
                    enrollmentId: enrollment._id,
                    userId: enrollment.userId,
                    courseId: enrollment.courseId,
                    completedLessons: validCompletedLessons, // Chỉ trả về lessons thực sự tồn tại
                    totalLessons: totalLessons,
                    progress: progress, // Tiến độ tính dựa trên valid lessons
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

/**
 * Đăng ký khóa học miễn phí
 * Tạo enrollment và conversation giữa user và instructor
 */
export const enrollFreeCourse = async (req, res) => {
    try {
        const { userId } = req; // userId từ protectUserAction middleware
        const { courseId } = req.body;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: 'Course ID is required'
            });
        }

        logger.info(`📝 [enrollFreeCourse] User ${userId} enrolling in course ${courseId}`);

        // Kiểm tra khóa học có tồn tại và có miễn phí không
        const course = await Course.findOne({ 
            _id: courseId, 
            course_status: 'approved' 
        }).lean();

        if (!course) {
            logger.warn(`⚠️ [enrollFreeCourse] Course ${courseId} not found or not approved`);
            return res.status(404).json({
                success: false,
                message: 'Course not found or not available'
            });
        }

        // Verify khóa học thực sự miễn phí
        if (course.current_price !== 0) {
            logger.warn(`⚠️ [enrollFreeCourse] Course ${courseId} is not free. Price: ${course.current_price}`);
            return res.status(400).json({
                success: false,
                message: 'This course is not free. Please purchase it through the cart.'
            });
        }

        // Kiểm tra xem user đã đăng ký khóa học này chưa
        const existingEnrollment = await Enrollment.findOne({
            userId: userId,
            courseId: courseId
        });

        if (existingEnrollment) {
            logger.info(`ℹ️ [enrollFreeCourse] User ${userId} already enrolled in course ${courseId}`);
            return res.status(400).json({
                success: false,
                message: 'You are already enrolled in this course'
            });
        }

        // Tạo enrollment mới
        const newEnrollment = new Enrollment({
            userId: userId,
            courseId: courseId,
            completedLessons: []
        });

        await newEnrollment.save();
        logger.info(`✅ [enrollFreeCourse] Enrollment created for user ${userId} in course ${courseId}`);

        // Xóa khóa học khỏi wishlist sau khi enrollment thành công
        await removeFromWishlistInternal(userId, courseId);
        
        // Send notification to student about successful enrollment
        try {
            const user = await User.findById(userId);
            const studentNotification = await pushNotification({
                receiver_id: userId,
                event_type: 'course_enrollment',
                event_title: `Đăng ký khóa học thành công`,
                event_message: `Bạn đã đăng ký khóa học "${course.title}" thành công. Chúc bạn học tập hiệu quả!`,
                event_url: `/course/${courseId}/content/`
            });
            pushNotificationToUser(io, userId, studentNotification);
            
            // Send notification to instructor about new enrollment
            const instructorNotification = await pushNotification({
                receiver_id: course.instructor_id,
                event_type: 'course_enrollment',
                event_title: `Có học viên mới`,
                event_message: `${user?.full_name || 'Một học viên'} đã đăng ký khóa học "${course.title}" của bạn`,
                event_url: `/instructor`
            });
            pushNotificationToUser(io, course.instructor_id, instructorNotification);
        } catch (notifError) {
            logger.error('Error sending enrollment notification:', notifError);
        }

        // Tạo conversation với instructor nếu chưa tồn tại
        const instructorId = course.instructor_id;
        
        // Kiểm tra xem conversation giữa user và instructor đã tồn tại chưa
        const existingConversation = await Conversation.findOne({
            $and: [
                { 'participants.user_id': userId },
                { 'participants.user_id': instructorId }
            ]
        });

        let conversationId = null;

        if (!existingConversation) {
            // Tạo conversation mới
            const newConversation = new Conversation({
                participants: [
                    { user_id: userId },
                    { user_id: instructorId }
                ]
            });

            await newConversation.save();
            conversationId = newConversation._id;
            logger.info(`✅ [enrollFreeCourse] Conversation created between user ${userId} and instructor ${instructorId}`);
        } else {
            conversationId = existingConversation._id;
            logger.info(`ℹ️ [enrollFreeCourse] Conversation already exists between user ${userId} and instructor ${instructorId}`);
        }

        res.status(201).json({
            success: true,
            message: 'Successfully enrolled in the free course',
            data: {
                enrollmentId: newEnrollment._id,
                userId: newEnrollment.userId,
                courseId: newEnrollment.courseId,
                enrolledAt: newEnrollment.createdAt,
                conversationId: conversationId
            }
        });

    } catch (error) {
        logger.error('❌ [enrollFreeCourse] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error enrolling in free course',
            error: error.message
        });
    }
};

/**
 * Lấy danh sách học viên của giảng viên kèm tiến độ theo từng khóa học
 * GET /api/enrollment/instructor/:instructorId/students
 */
export const getInstructorStudents = async (req, res) => {
    try {
        const { instructorId } = req.params;
        const { userId } = req; // Từ protectUserAction middleware

        if (!instructorId) {
            return res.status(400).json({
                success: false,
                message: 'Instructor ID is required'
            });
        }

        // Kiểm tra xem userId có khớp với instructorId không
        if (userId !== instructorId) {
            logger.warn(`⚠️ [getInstructorStudents] Access denied. userId: ${userId}, instructorId: ${instructorId}`);
            return res.status(403).json({
                success: false,
                message: 'Access denied - You can only view your own students'
            });
        }

        logger.info(`📚 [getInstructorStudents] Fetching students for instructor ${instructorId}`);

        // Tìm tất cả khóa học của instructor
        const courses = await Course.find({ 
            instructor_id: instructorId,
            course_status: { $in: ['approved', 'inactive'] } // Chỉ lấy khóa học đã duyệt hoặc không hoạt động
        }).lean();

        if (!courses || courses.length === 0) {
            logger.info(`ℹ️ [getInstructorStudents] No courses found for instructor ${instructorId}`);
            return res.json({
                success: true,
                data: []
            });
        }

        const courseIds = courses.map(course => course._id);
        logger.info(`📋 [getInstructorStudents] Found ${courses.length} courses:`, courseIds);

        // Tìm tất cả enrollments cho các khóa học của instructor
        const enrollments = await Enrollment.find({
            courseId: { $in: courseIds }
        }).lean();

        logger.info(`👥 [getInstructorStudents] Found ${enrollments.length} enrollments`);

        if (!enrollments || enrollments.length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }

        // Lấy thông tin user cho mỗi enrollment
        const userIds = [...new Set(enrollments.map(e => e.userId))];
        const users = await User.find({ _id: { $in: userIds } }).lean();
        const userMap = new Map(users.map(u => [u._id, u]));

        // Tạo map course để dễ tra cứu
        const courseMap = new Map(courses.map(c => [c._id, c]));

        // Import Lesson model
        const Lesson = (await import('../models/Lesson.js')).default;

        // Tính toán tổng số lessons và lấy danh sách lesson IDs cho mỗi khóa học
        const courseLessonData = new Map();
        
        for (const course of courses) {
            // Lấy tất cả sections của khóa học
            const sections = await Section.find({ course_id: course._id }).lean();
            const sectionIds = sections.map(s => s._id.toString());
            
            // Lấy tất cả lessons của các sections
            const lessons = await Lesson.find({ 
                section: { $in: sectionIds } 
            }).lean();
            
            // Lưu tổng số lessons và danh sách lesson IDs
            const lessonIds = lessons.map(l => l._id.toString());
            courseLessonData.set(course._id, {
                totalLessons: lessons.length,
                lessonIds: lessonIds
            });
        }

        // Nhóm enrollments theo khóa học
        const studentsByCourse = [];

        for (const course of courses) {
            const courseEnrollments = enrollments.filter(e => e.courseId === course._id);
            const lessonData = courseLessonData.get(course._id) || { totalLessons: 0, lessonIds: [] };
            const { totalLessons, lessonIds } = lessonData;

            const students = courseEnrollments.map(enrollment => {
                const user = userMap.get(enrollment.userId);
                
                // Chỉ đếm những lesson trong completedLessons có id trùng khớp với lesson của khóa học
                const completedLessonIds = enrollment.completedLessons || [];
                const validCompletedLessons = completedLessonIds.filter(lessonId => 
                    lessonIds.includes(lessonId.toString())
                );
                const completedCount = validCompletedLessons.length;
                const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

                return {
                    userId: enrollment.userId,
                    full_name: user?.full_name || 'Unknown User',
                    email: user?.email || 'N/A',
                    profile_image_url: user?.profile_image_url || null,
                    enrolledDate: enrollment.createdAt,
                    completedLessons: completedCount,
                    totalLessons: totalLessons,
                    progress: progress
                };
            });

            studentsByCourse.push({
                courseId: course._id,
                courseTitle: course.title,
                courseThumbnail: course.thumbnail_url,
                totalStudents: students.length,
                students: students
            });
        }

        logger.info(`✅ [getInstructorStudents] Returning ${studentsByCourse.length} courses with students`);

        res.json({
            success: true,
            data: studentsByCourse
        });

    } catch (error) {
        logger.error('❌ [getInstructorStudents] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching instructor students',
            error: error.message
        });
    }
};
