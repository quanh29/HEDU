import Certificate from '../models/Certificate.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import Lesson from '../models/Lesson.js';
import Section from '../models/Section.js';
import logger from '../utils/logger.js';

/**
 * Controller: Tạo certificate cho user đã hoàn thành khóa học
 * Method: POST
 * Route: /api/certificates/create
 * Access: Enrolled users only (protectEnrolledUser middleware)
 */
export const createCertificate = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.userId; // From protectEnrolledUser middleware

        logger.info(`📋 [Create Certificate] Request from userId: ${userId} for courseId: ${courseId}`);
        logger.info(`   Checking completion status for userId: ${userId} in courseId: ${courseId}`);
        
        // Validate input
        if (!userId || !courseId) {
            return res.status(400).json({
                success: false,
                message: 'User ID and Course ID are required'
            });
        }

        // Check if course exists and has certificate enabled
        const course = await Course.findById(courseId).lean();
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        if (!course.has_certificate) {
            return res.status(400).json({
                success: false,
                message: 'This course does not offer a certificate'
            });
        }

        // Check if certificate already exists
        const existingCertificate = await Certificate.findOne({
            userId: userId,
            courseId: courseId
        });

        if (existingCertificate) {
            return res.status(200).json({
                success: true,
                message: 'Certificate already exists',
                certificate: {
                    certificateId: existingCertificate._id,
                    issuedAt: existingCertificate.createdAt
                }
            });
        }

        // Get enrollment with completed lessons
        const enrollment = await Enrollment.findOne({
            userId: userId,
            courseId: courseId
        }).lean();

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Enrollment not found'
            });
        }

        // Get all sections of the course
        const sections = await Section.find({ course_id: courseId }).lean();
        const sectionIds = sections.map(s => s._id.toString());

        // Get all lessons in the course
        const allLessons = await Lesson.find({ 
            section: { $in: sectionIds } 
        }).lean();

        const allLessonIds = allLessons.map(l => l._id.toString());
        
        // Filter completed lessons to only include valid lesson IDs from this course
        const validCompletedLessons = enrollment.completedLessons.filter(
            lessonId => allLessonIds.includes(lessonId)
        );

        // Check if user completed 100% of the lessons
        const totalLessons = allLessonIds.length;
        const completedCount = validCompletedLessons.length;

        logger.info(`   Total lessons: ${totalLessons}, Completed: ${completedCount}`);

        if (totalLessons === 0) {
            return res.status(400).json({
                success: false,
                message: 'This course has no lessons'
            });
        }

        if (completedCount < totalLessons) {
            return res.status(400).json({
                success: false,
                message: `You need to complete all lessons to get the certificate. Progress: ${completedCount}/${totalLessons}`,
                progress: {
                    completed: completedCount,
                    total: totalLessons,
                    percentage: Math.round((completedCount / totalLessons) * 100)
                }
            });
        }

        // Create certificate
        const certificate = new Certificate({
            userId: userId,
            courseId: courseId
        });

        await certificate.save();

        logger.info(`✅ [Create Certificate] Certificate created: ${certificate._id}`);

        return res.status(201).json({
            success: true,
            message: 'Certificate created successfully',
            certificate: {
                certificateId: certificate._id,
                issuedAt: certificate.createdAt
            }
        });

    } catch (error) {
        logger.error('❌ [Create Certificate] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while creating certificate',
            error: error.message
        });
    }
};

/**
 * Controller: Xem certificate công khai
 * Method: GET
 * Route: /api/certificates/:certificateId
 * Access: Public
 */
export const getCertificate = async (req, res) => {
    try {
        const { certificateId } = req.params;

        logger.info(`📜 [Get Certificate] Request for certificateId: ${certificateId}`);

        // Find certificate
        const certificate = await Certificate.findById(certificateId).lean();

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }

        // Get user info
        const user = await User.findById(certificate.userId).lean();
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get course info
        const course = await Course.findById(certificate.courseId).lean();
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Get instructor info
        const instructor = await User.findById(course.instructor_id).lean();
        if (!instructor) {
            return res.status(404).json({
                success: false,
                message: 'Instructor not found'
            });
        }

        logger.info(`✅ [Get Certificate] Certificate found for ${user.full_name}`);

        return res.status(200).json({
            success: true,
            certificate: {
                certificateId: certificate._id,
                issuedAt: certificate.createdAt,
                student: {
                    name: user.full_name,
                    profileImage: user.profile_image_url
                },
                course: {
                    id: course._id,
                    title: course.title,
                    thumbnail: course.thumbnail_url
                },
                instructor: {
                    name: instructor.full_name,
                    profileImage: instructor.profile_image_url
                }
            }
        });

    } catch (error) {
        logger.error('❌ [Get Certificate] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching certificate',
            error: error.message
        });
    }
};

/**
 * Controller: Kiểm tra xem user đã có certificate cho khóa học chưa
 * Method: GET
 * Route: /api/certificates/check/:courseId
 * Access: Enrolled users only
 */
export const checkCertificate = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.userId; // From middleware

        logger.info(`📜 [Check Certificate] userId: ${userId}, courseId: ${courseId}`);

        // Check if certificate exists
        const certificate = await Certificate.findOne({
            userId: userId,
            courseId: courseId
        }).lean();

        if (certificate) {
            return res.status(200).json({
                success: true,
                hasCertificate: true,
                certificate: {
                    certificateId: certificate._id,
                    issuedAt: certificate.createdAt
                }
            });
        } else {
            return res.status(200).json({
                success: true,
                hasCertificate: false
            });
        }

    } catch (error) {
        logger.error('❌ [Check Certificate] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while checking certificate',
            error: error.message
        });
    }
};
