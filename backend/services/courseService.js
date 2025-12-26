import { v4 as uuidv4 } from 'uuid';
import Mux from '@mux/mux-node';
// MongoDB models
import Course from '../models/Course.js';
import Section from '../models/Section.js';
import Lesson from '../models/Lesson.js';
import Video from '../models/video.js';
import Material from '../models/Material.js';
import Quiz from '../models/Quiz.js';
import CourseRevision from '../models/CourseDraft.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Language from '../models/Language.js';
import Level from '../models/Level.js';
import Labeling from '../models/Labeling.js';
import Rating from '../models/Rating.js';

/**
 * Helper functions
 */
function getFileType(url) {
    const extension = url.split('.').pop().toLowerCase();
    return extension || 'pdf';
}

function getFileName(url) {
    return url.split('/').pop() || 'document';
}

/**
 * Helper: Tính toán rating và reviewCount từ collection Ratings
 */
async function calculateCourseRatings(courseId) {
    const ratings = await Rating.find({ course_id: courseId }).lean();
    
    if (ratings.length === 0) {
        return {
            rating: 0,
            reviewCount: 0
        };
    }
    
    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / ratings.length;
    
    return {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        reviewCount: ratings.length
    };
}

/**
 * Helper: Tính toán ratings cho nhiều courses cùng lúc
 */
async function calculateMultipleCoursesRatings(courseIds) {
    const ratings = await Rating.find({ course_id: { $in: courseIds } }).lean();
    
    // Group ratings by course_id
    const ratingsMap = {};
    courseIds.forEach(id => {
        ratingsMap[id] = {
            rating: 0,
            reviewCount: 0,
            ratings: []
        };
    });
    
    ratings.forEach(r => {
        if (ratingsMap[r.course_id]) {
            ratingsMap[r.course_id].ratings.push(r.rating);
        }
    });
    
    // Calculate averages
    Object.keys(ratingsMap).forEach(courseId => {
        const courseRatings = ratingsMap[courseId].ratings;
        if (courseRatings.length > 0) {
            const total = courseRatings.reduce((sum, r) => sum + r, 0);
            ratingsMap[courseId].rating = Math.round((total / courseRatings.length) * 10) / 10;
            ratingsMap[courseId].reviewCount = courseRatings.length;
        }
        delete ratingsMap[courseId].ratings; // Clean up
    });
    
    return ratingsMap;
}

/**
 * Helper: Xóa videos và MUX assets
 */
async function deleteVideosWithMuxAssets(videoIds) {
    try {
        // Lấy thông tin videos trước khi xóa
        const videos = await Video.find({ _id: { $in: videoIds } }).lean();
        
        // Initialize MUX client
        const { video: muxVideo } = new Mux({
            tokenId: process.env.MUX_TOKEN_ID,
            tokenSecret: process.env.MUX_SECRET_KEY
        });

        // Xóa MUX assets
        const deletePromises = videos.map(async (video) => {
            if (video.assetId) {
                try {
                    await muxVideo.assets.delete(video.assetId);
                    console.log(`✅ Deleted MUX asset: ${video.assetId} for video: ${video.title}`);
                } catch (muxError) {
                    console.error(`❌ Error deleting MUX asset ${video.assetId}:`, muxError.message);
                    // Continue even if MUX deletion fails
                }
            }
        });

        await Promise.all(deletePromises);

        // Xóa videos từ MongoDB
        await Video.deleteMany({ _id: { $in: videoIds } });
        console.log(`✅ Deleted ${videoIds.length} videos from MongoDB`);
    } catch (error) {
        console.error('Error in deleteVideosWithMuxAssets:', error);
        throw error;
    }
}

/**
 * Service: Lấy thông tin course theo ID (chỉ approved courses)
 */
export const getCourseByIdService = async (courseId) => {
    // Lấy thông tin course từ MongoDB - chỉ lấy khóa học đã duyệt (approved)
    const course = await Course.findOne({ _id: courseId, course_status: 'approved' }).lean();
    
    if (!course) {
        return null;
    }
    
    // Calculate ratings from Ratings collection
    const { rating, reviewCount } = await calculateCourseRatings(courseId);
    
    // Convert MongoDB field names to MySQL format for compatibility
    return {
        course_id: course._id,
        title: course.title,
        subTitle: course.sub_title,
        des: course.description,
        originalPrice: course.original_price,
        currentPrice: course.current_price,
        instructor_id: course.instructor_id,
        lv_id: course.level_id,
        lang_id: course.lang_id,
        has_practice: course.has_practice,
        has_certificate: course.has_certificate,
        picture_url: course.thumbnail_url,
        course_status: course.course_status,
        requirements: course.requirements,
        objectives: course.objectives,
        rating: rating,
        reviewCount: reviewCount
    };
};

/**
 * Service: Lấy thông tin course theo ID (không phân biệt status - cho management)
 */
export const getCourseByIdForManagementService = async (courseId) => {
    const course = await Course.findById(courseId).lean();
    
    if (!course) {
        return null;
    }
    
    // Calculate ratings from Ratings collection
    const { rating, reviewCount } = await calculateCourseRatings(courseId);
    
    // Convert MongoDB field names to MySQL format for compatibility
    return {
        course_id: course._id,
        title: course.title,
        subTitle: course.sub_title,
        des: course.description,
        originalPrice: course.original_price,
        currentPrice: course.current_price,
        instructor_id: course.instructor_id,
        lv_id: course.level_id,
        lang_id: course.lang_id,
        has_practice: course.has_practice,
        has_certificate: course.has_certificate,
        picture_url: course.thumbnail_url,
        course_status: course.course_status,
        requirements: course.requirements,
        objectives: course.objectives,
        rating: rating,
        reviewCount: reviewCount
    };
};

/**
 * Service: Tìm kiếm và filter courses
 */
export const searchCoursesService = async (filters) => {
    const { title = '', category, tag, sort, page = 1, level, language, price, prac, cert } = filters;
    const limit = 12;
    const offset = (page - 1) * limit;

    // Build MongoDB query
    let query = { course_status: 'approved' }; // Chỉ lấy khóa học đã duyệt
    
    // Title search
    if (title) {
        const keywords = title.trim().split('-').filter(Boolean);
        if (keywords.length > 0) {
            query.$or = keywords.map(kw => ({
                title: { $regex: kw, $options: 'i' }
            }));
        }
    }

    // Practice and Certificate filters
    if (prac !== undefined) {
        query.has_practice = prac === 'true';
    }
    if (cert !== undefined) {
        query.has_certificate = cert === 'true';
    }

    // Level filter
    if (level && level !== 'all') {
        const levelDoc = await Level.findOne({ title: level }).lean();
        if (levelDoc) {
            query.level_id = levelDoc._id;
        }
    }

    // Language filter
    if (language) {
        const langDoc = await Language.findOne({ title: language }).lean();
        if (langDoc) {
            query.lang_id = langDoc._id;
        }
    }

    // Price filter
    if (price) {
        switch (price) {
            case 'free':
                query.current_price = 0;
                break;
            case 'paid':
                query.current_price = { $gt: 0 };
                break;
            case 'under-500k':
                query.current_price = { $lt: 500000 };
                break;
            case '500k-1m':
                query.current_price = { $gte: 500000, $lte: 1000000 };
                break;
            case 'over-1m':
                query.current_price = { $gt: 1000000 };
                break;
        }
    }

    // Category or Tag filter
    let filteredCourseIds = null;
    if (category || tag) {
        const categoryQuery = {};
        
        if (category) {
            const categoryDoc = await Category.findOne({ title: category }).lean();
            if (categoryDoc) {
                categoryQuery.category_id = categoryDoc._id;
            }
        }
        
        if (tag) {
            const tags = tag.split(',');
            const categoryDocs = await Category.find({ title: { $in: tags } }).lean();
            if (categoryDocs.length > 0) {
                categoryQuery.category_id = { $in: categoryDocs.map(c => c._id) };
            }
        }
        
        // Get course IDs from Labeling
        const labelings = await Labeling.find(categoryQuery).lean();
        filteredCourseIds = labelings.map(l => l.course_id);
        
        if (filteredCourseIds.length > 0) {
            query._id = { $in: filteredCourseIds };
        } else {
            // No courses match category/tag filter
            return [];
        }
    }

    // Sorting logic
    let courses;
    let needsRatingSort = sort === 'rating';
    
    if (needsRatingSort) {
        // Nếu sort theo rating: query tất cả courses mà không skip/limit
        courses = await Course.find(query).lean();
        
        // Calculate ratings for all courses
        const courseIds = courses.map(c => c._id);
        const ratingsMap = await calculateMultipleCoursesRatings(courseIds);
        
        // Populate instructor information
        const instructorIds = [...new Set(courses.map(c => c.instructor_id))];
        const instructors = await User.find({ _id: { $in: instructorIds } }).lean();
        const instructorMap = {};
        instructors.forEach(inst => {
            instructorMap[inst._id] = inst;
        });
        
        // Map courses với ratings
        let coursesWithRatings = courses.map(c => {
            const instructor = instructorMap[c.instructor_id] || {};
            const courseRatings = ratingsMap[c._id] || { rating: 0, reviewCount: 0 };
            
            return {
                course_id: c._id,
                title: c.title,
                subTitle: c.sub_title,
                des: c.description,
                rating: courseRatings.rating,
                reviewCount: courseRatings.reviewCount,
                originalPrice: c.original_price,
                currentPrice: c.current_price,
                instructor_id: c.instructor_id,
                lv_id: c.level_id,
                lang_id: c.lang_id,
                has_practice: c.has_practice,
                has_certificate: c.has_certificate,
                picture_url: c.thumbnail_url,
                course_status: c.course_status,
                instructors: [{ fullName: instructor.full_name || 'Giảng viên' }]
            };
        });
        
        // Sort by rating in memory
        coursesWithRatings.sort((a, b) => b.rating - a.rating);
        
        // Apply pagination
        return coursesWithRatings.slice(offset, offset + limit);
        
    } else {
        // Sort khác: sort trong database như bình thường
        let sortOption = {};
        switch (sort) {
            case 'price-asc':
                sortOption = { current_price: 1 };
                break;
            case 'price-desc':
                sortOption = { current_price: -1 };
                break;
            case 'newest':
                sortOption = { createdAt: -1 };
                break;
            default:
                sortOption = { _id: -1 };
        }

        // Execute query with sort and pagination
        courses = await Course.find(query)
            .sort(sortOption)
            .skip(offset)
            .limit(limit)
            .lean();

        // Populate instructor information
        const instructorIds = [...new Set(courses.map(c => c.instructor_id))];
        const instructors = await User.find({ _id: { $in: instructorIds } }).lean();
        const instructorMap = {};
        instructors.forEach(inst => {
            instructorMap[inst._id] = inst;
        });

        // Calculate ratings for all courses
        const courseIds = courses.map(c => c._id);
        const ratingsMap = await calculateMultipleCoursesRatings(courseIds);

        return courses.map(c => {
            const instructor = instructorMap[c.instructor_id] || {};
            const courseRatings = ratingsMap[c._id] || { rating: 0, reviewCount: 0 };
            
            return {
                course_id: c._id,
                title: c.title,
                subTitle: c.sub_title,
                des: c.description,
                rating: courseRatings.rating,
                reviewCount: courseRatings.reviewCount,
                originalPrice: c.original_price,
                currentPrice: c.current_price,
                instructor_id: c.instructor_id,
                lv_id: c.level_id,
                lang_id: c.lang_id,
                has_practice: c.has_practice,
                has_certificate: c.has_certificate,
                picture_url: c.thumbnail_url,
                course_status: c.course_status,
                instructors: [{ fullName: instructor.full_name || 'Giảng viên' }]
            };
        });
    }
};

/**
 * Service: Tạo course mới
 */
export const createCourseService = async (courseData) => {
    const { 
        title, subTitle, des, originalPrice, currentPrice, instructor_id, 
        lv_id, lang_id, has_practice, has_certificate, picture_url, 
        requirements, objectives, categories, course_status = 'draft',
        sections
    } = courseData;

    try {
        const course_id = uuidv4();
        
        console.log('🆕 [createCourseService] Creating course:', {
            course_id,
            title,
            instructor_id,
            sectionsCount: sections?.length || 0
        });
        
        // Lưu vào MongoDB
        const mongoCourse = new Course({
            _id: course_id,
            title: title,
            sub_title: subTitle || '',
            description: des || '',
            original_price: originalPrice || 0,
            current_price: currentPrice || 0,
            instructor_id: instructor_id,
            level_id: lv_id || 'L1',
            lang_id: lang_id || 'lang1',
            has_practice: has_practice || false,
            has_certificate: has_certificate || false,
            thumbnail_url: picture_url || '',
            course_status: course_status,
            requirements: requirements || [],
            objectives: objectives || []
        });
        await mongoCourse.save();
        
        console.log('✅ [createCourseService] MongoDB Course created');

        // Lưu categories vào Labeling
        if (categories && categories.length > 0) {
            const labelings = categories.map(category_id => ({
                category_id,
                course_id
            }));
            await Labeling.insertMany(labelings);
        }

        // Tạo sections và lessons nếu có
        if (sections && sections.length > 0) {
            console.log(`📦 [createCourseService] Creating ${sections.length} sections...`);
            await updateCourseSectionsService(course_id, sections);
            console.log('✅ [createCourseService] Sections created');
        } else {
            console.log('⚠️ [createCourseService] No sections provided');
        }

        return { course_id, status: course_status };
    } catch (error) {
        console.error('❌ [createCourseService] Error:', error);
        throw error;
    }
};

/**
 * Service: Lấy full course content (public - approved only)
 */
export const getFullCourseContentService = async (courseId) => {
    // Lấy course từ MongoDB
    const mongoCourse = await Course.findOne({ _id: courseId, course_status: 'approved' }).lean();

    if (!mongoCourse) {
        return null;
    }

    // Get instructor info
    const instructor = await User.findById(mongoCourse.instructor_id).lean();
    
    // Get level and language info
    const [level, language] = await Promise.all([
        Level.findById(mongoCourse.level_id).lean(),
        Language.findById(mongoCourse.lang_id).lean()
    ]);
    
    // Calculate ratings from Ratings collection
    const { rating, reviewCount } = await calculateCourseRatings(courseId);

    // Map to expected format
    const course = {
        course_id: mongoCourse._id,
        title: mongoCourse.title,
        subTitle: mongoCourse.sub_title,
        des: mongoCourse.description,
        thumbnail: mongoCourse.thumbnail_url,
        description: mongoCourse.description,
        originalPrice: mongoCourse.original_price,
        currentPrice: mongoCourse.current_price,
        rating: rating,
        reviewCount: reviewCount,
        hasPractice: mongoCourse.has_practice,
        hasCertificate: mongoCourse.has_certificate,
        course_status: mongoCourse.course_status,
        level: level?.title || '',
        language: language?.title || '',
        requirements: mongoCourse.requirements,
        objectives: mongoCourse.objectives,
        instructor_id: mongoCourse.instructor_id,
        instructors: [{
            _id: mongoCourse.instructor_id,
            fullName: instructor ? instructor.full_name : '',
            avaUrl: instructor?.profile_image_url || '',
            headline: instructor?.headline || '',
        }]
    };

    // Lấy categories
    const labelings = await Labeling.find({ course_id: courseId }).lean();
    const categoryIds = labelings.map(l => l.category_id);
    const categories = await Category.find({ _id: { $in: categoryIds } }).lean();
    
    course.categories = categories.map(cat => ({
        category_id: cat._id,
        title: cat.title
    }));

    // Lấy sections với Lesson layer
    const sections = await Section.find({ course_id: courseId }).sort({ order: 1 }).lean();
    
    if (!sections || sections.length === 0) {
        return {
            course,
            sections: [],
            stats: {
                totalSections: 0,
                totalLessons: 0,
                totalVideos: 0,
                totalMaterials: 0,
                totalQuizzes: 0
            }
        };
    }

    const sectionIds = sections.map(sec => sec._id);
    
    // NEW APPROACH: Lấy lessons với populated content (Video/Material/Quiz)
    const lessons = await Lesson.find({ section: { $in: sectionIds } })
        .populate('video')
        .populate('material')
        .populate('quiz')
        .sort({ order: 1 })
        .lean();

    // FALLBACK: For backward compatibility, also get direct section→content references
    const [directVideos, directMaterials, directQuizzes] = await Promise.all([
        Video.find({ section: { $in: sectionIds }, lesson: { $exists: false } }).sort({ order: 1 }).lean(),
        Material.find({ section: { $in: sectionIds }, lesson: { $exists: false } }).sort({ order: 1 }).lean(),
        Quiz.find({ section: { $in: sectionIds }, lesson: { $exists: false } }).sort({ order: 1 }).lean()
    ]);

    // Combine lesson-based content and direct content for stats
    const lessonVideos = lessons.filter(l => l.contentType === 'video' && l.video).map(l => l.video);
    const lessonMaterials = lessons.filter(l => l.contentType === 'material' && l.material).map(l => l.material);
    const lessonQuizzes = lessons.filter(l => l.contentType === 'quiz' && l.quiz).map(l => l.quiz);

    const allVideos = [...lessonVideos, ...directVideos];
    const allMaterials = [...lessonMaterials, ...directMaterials];
    const allQuizzes = [...lessonQuizzes, ...directQuizzes];

    const stats = {
        totalSections: sections.length,
        totalVideos: allVideos.length,
        totalMaterials: allMaterials.length,
        totalQuizzes: allQuizzes.length,
        totalLessons: lessons.length + directVideos.length + directMaterials.length + directQuizzes.length
    };

    // Gom content theo từng section
    const sectionsWithContent = sections.map(section => {
        const sectionIdStr = section._id.toString();
        
        // Get lessons for this section
        const sectionLessons = lessons
            .filter(l => l.section.toString() === sectionIdStr)
            .map(lesson => {
                // Extract content based on contentType
                let content = null;
                let contentData = {};

                if (lesson.contentType === 'video' && lesson.video) {
                    content = lesson.video;
                    contentData = {
                        videoId: content._id,
                        duration: content.duration || 0
                    };
                } else if (lesson.contentType === 'material' && lesson.material) {
                    content = lesson.material;
                    contentData = {
                        materialId: content._id,
                        fileName: content.fileName || '',
                        fileType: content.fileType || '',
                        fileSize: content.fileSize || 0,
                    };
                } else if (lesson.contentType === 'quiz' && lesson.quiz) {
                    content = lesson.quiz;
                    contentData = {
                        quizId: content._id,
                        passingScore: content.passingScore || 70,
                        timeLimit: content.timeLimit || null,
                    };
                }

                return {
                    _id: lesson._id,
                    title: lesson.title,
                    description: content?.description || '',
                    contentType: lesson.contentType,
                    order: lesson.order || 0,
                    ...contentData,
                    createdAt: lesson.createdAt,
                    updatedAt: lesson.updatedAt
                };
            });

        // FALLBACK: Add direct content for backward compatibility
        const fallbackVideos = directVideos
            .filter(v => v.section.toString() === sectionIdStr)
            .map(v => ({
                _id: v._id,
                title: v.title,
                description: v.description || '',
                contentType: 'video',
                order: v.order || 0,
                videoId: v._id,
                duration: v.duration || 0,
                createdAt: v.createdAt,
                updatedAt: v.updatedAt
            }));

        const fallbackMaterials = directMaterials
            .filter(m => m.section.toString() === sectionIdStr)
            .map(m => ({
                _id: m._id,
                title: m.title,
                description: m.description || '',
                contentType: 'material',
                order: m.order || 0,
                materialId: m._id,
                fileName: m.fileName || '',
                fileType: m.fileType || '',
                fileSize: m.fileSize || 0,
                createdAt: m.createdAt,
                updatedAt: m.updatedAt
            }));

        const fallbackQuizzes = directQuizzes
            .filter(q => q.section.toString() === sectionIdStr)
            .map(q => ({
                _id: q._id,
                title: q.title,
                description: q.description || '',
                contentType: 'quiz',
                order: q.order || 0,
                quizId: q._id,
                passingScore: q.passingScore || 70,
                timeLimit: q.timeLimit || null,
                createdAt: q.createdAt,
                updatedAt: q.updatedAt
            }));

        // Merge lesson-based and direct content
        const allLessons = [
            ...sectionLessons,
            ...fallbackVideos,
            ...fallbackMaterials,
            ...fallbackQuizzes
        ].sort((a, b) => (a.order || 0) - (b.order || 0));

        return {
            _id: section._id,
            course_id: section.course_id,
            title: section.title,
            description: section.description || '',
            order: section.order || 0,
            lessons: allLessons,
            createdAt: section.createdAt,
            updatedAt: section.updatedAt
        };
    });

    return {
        course,
        sections: sectionsWithContent,
        stats
    };
};

/**
 * Service: Lấy course content cho enrolled users (với full data)
 */
export const getCourseContentForEnrolledUserService = async (courseId) => {
    // Lấy course từ MongoDB
    const mongoCourse = await Course.findOne({ _id: courseId, course_status: 'approved' }).lean();

    if (!mongoCourse) {
        return null;
    }

    const course = {
        course_id: mongoCourse._id,
        title: mongoCourse.title,
        des: mongoCourse.description,
        picture_url: mongoCourse.thumbnail_url
    };

    // Lấy sections
    const sections = await Section.find({ course_id: courseId }).sort({ order: 1 }).lean();
    
    if (!sections || sections.length === 0) {
        return {
            course: {
                ...course,
                title: course.title,
                courseId: course.course_id
            },
            sections: []
        };
    }

    const sectionIds = sections.map(sec => sec._id.toString());
    
    // Lấy lessons với populate content
    const lessons = await Lesson.find({ section: { $in: sectionIds } })
        .populate('video')
        .populate('material')
        .populate('quiz')
        .sort({ order: 1 })
        .lean();

    // Gom lessons theo section
    const sectionsWithContent = sections.map((section) => {
        const sectionIdStr = section._id.toString();
        
        // Filter lessons thuộc section này
        const sectionLessons = lessons
            .filter(lesson => lesson.section.toString() === sectionIdStr)
            .map(lesson => {
                // Base lesson data
                const lessonData = {
                    lessonId: lesson._id.toString(),
                    type: lesson.contentType,
                    title: lesson.title,
                    order: lesson.order,
                    completed: false
                };

                // Add content-specific data
                if (lesson.contentType === 'video' && lesson.video) {
                    return {
                        ...lessonData,
                        videoId: lesson.video._id.toString(),
                        contentUrl: lesson.video.contentUrl || '',
                        description: lesson.video.description || '',
                        duration: lesson.video.duration || 0,
                        playbackId: lesson.video.playbackId || ''
                    };
                } else if (lesson.contentType === 'material' && lesson.material) {
                    return {
                        ...lessonData,
                        materialId: lesson.material._id.toString(),
                        contentUrl: lesson.material.contentUrl || '', // This is the Cloudinary public_id
                        fileType: getFileType(lesson.material.originalFilename || lesson.material.contentUrl || ''),
                        fileSize: lesson.material.fileSize ? `${Math.round(lesson.material.fileSize / 1024)} KB` : '1MB',
                        fileName: lesson.material.originalFilename || getFileName(lesson.material.contentUrl || '')
                    };
                } else if (lesson.contentType === 'quiz' && lesson.quiz) {
                    return {
                        ...lessonData,
                        quizId: lesson.quiz._id.toString(),
                        description: lesson.quiz.description || '',
                        questionCount: lesson.quiz.questions ? lesson.quiz.questions.length : 0,
                        questions: lesson.quiz.questions ? lesson.quiz.questions.map(quest => ({
                            questionText: quest.questionText,
                            options: quest.options,
                        })) : []
                    };
                }

                // Return basic lesson if content not populated
                return lessonData;
            });

        return {
            sectionId: section._id.toString(),
            title: section.title,
            courseTitle: course.title,
            order: section.order,
            lessons: sectionLessons
        };
    });

    return {
        course: {
            courseId: course.course_id,
            title: course.title,
            description: course.des,
            thumbnail: course.picture_url
        },
        sections: sectionsWithContent
    };
};

/**
 * Service: Lấy courses của instructor
 */
export const getInstructorCoursesService = async (instructorId, page = 1, limit = 12, offset = 0, status = null) => {
    let query = { instructor_id: instructorId };

    // Lọc theo status nếu có
    if (status) {
        query.course_status = status;
    }

    const courses = await Course.find(query)
        .sort({ _id: -1 })
        .skip(offset)
        .limit(limit)
        .lean();

    // Get instructor info
    const instructor = await User.findById(instructorId).lean();
    const fullName = instructor ? `${instructor.fName || ''} ${instructor.lName || ''}`.trim() : '';

    // Calculate ratings for all courses
    const courseIds = courses.map(c => c._id);
    const ratingsMap = await calculateMultipleCoursesRatings(courseIds);

    // Check for pending revisions for each course
    const coursesWithRevisionStatus = await Promise.all(
        courses.map(async (c) => {
            const pendingRevision = await CourseRevision.findOne({
                courseId: c._id,
                status: 'pending'
            }).lean();
            
            const courseRatings = ratingsMap[c._id] || { rating: 0, reviewCount: 0 };

            return {
                course_id: c._id,
                title: c.title,
                subTitle: c.sub_title,
                des: c.description,
                originalPrice: c.original_price,
                currentPrice: c.current_price,
                instructor_id: c.instructor_id,
                lv_id: c.level_id,
                lang_id: c.lang_id,
                has_practice: c.has_practice,
                has_certificate: c.has_certificate,
                picture_url: c.thumbnail_url,
                course_status: c.course_status,
                rating: courseRatings.rating,
                reviewCount: courseRatings.reviewCount,
                fName: instructor?.fName || '',
                lName: instructor?.lName || '',
                instructors: [{ fullName }],
                hasPendingRevision: !!pendingRevision,
                pendingRevisionId: pendingRevision?._id || null
            };
        })
    );

    return coursesWithRevisionStatus;
};

/**
 * Service: Cập nhật status của course
 */
export const updateCourseStatusService = async (courseId, course_status) => {
    const result = await Course.updateOne(
        { _id: courseId },
        { $set: { course_status } }
    );

    return result.modifiedCount;
};

/**
 * Service: Import course data (requirements & objectives)
 */
export const importCourseDataService = async (courses) => {
    const results = {
        success: [],
        failed: [],
        skipped: []
    };

    for (const courseData of courses) {
        const { _id, requirements, objectives } = courseData;

        // Validate required fields
        if (!_id || !requirements || !objectives) {
            results.failed.push({
                _id: _id || 'unknown',
                reason: 'Missing required fields (_id, requirements, or objectives)'
            });
            continue;
        }

        // Validate arrays
        if (!Array.isArray(requirements) || !Array.isArray(objectives)) {
            results.failed.push({
                _id,
                reason: 'Requirements and objectives must be arrays'
            });
            continue;
        }

        try {
            // Check if course already exists
            const existingCourse = await Course.findById(_id);
            
            if (existingCourse) {
                // Update existing course
                existingCourse.requirements = requirements;
                existingCourse.objectives = objectives;
                await existingCourse.save();
                results.success.push({
                    _id,
                    action: 'updated'
                });
            } else {
                // Create new course
                const newCourse = new Course({
                    _id,
                    requirements,
                    objectives
                });
                await newCourse.save();
                results.success.push({
                    _id,
                    action: 'created'
                });
            }
        } catch (error) {
            results.failed.push({
                _id,
                reason: error.message
            });
        }
    }

    return results;
};

/**
 * Service: Update course (MongoDB)
 */
export const updateCourseService = async (courseId, courseData) => {
    const { 
        title, subTitle, des, originalPrice, currentPrice, 
        lv_id, lang_id, has_practice, has_certificate, picture_url, 
        requirements, objectives, categories, course_status,
        sections
    } = courseData;

    try {
        // Build update object for MongoDB
        const updateObj = {};
        
        if (title !== undefined) updateObj.title = title;
        if (subTitle !== undefined) updateObj.sub_title = subTitle;
        if (des !== undefined) updateObj.description = des;
        if (originalPrice !== undefined) updateObj.original_price = originalPrice;
        if (currentPrice !== undefined) updateObj.current_price = currentPrice;
        if (lv_id !== undefined) updateObj.level_id = lv_id;
        if (lang_id !== undefined) updateObj.lang_id = lang_id;
        if (has_practice !== undefined) updateObj.has_practice = has_practice;
        if (has_certificate !== undefined) updateObj.has_certificate = has_certificate;
        if (picture_url !== undefined) updateObj.thumbnail_url = picture_url;
        if (course_status !== undefined) updateObj.course_status = course_status;
        if (requirements !== undefined) updateObj.requirements = requirements;
        if (objectives !== undefined) updateObj.objectives = objectives;

        // Cập nhật course trong MongoDB
        if (Object.keys(updateObj).length > 0) {
            await Course.findByIdAndUpdate(courseId, { $set: updateObj });
        }

        // Cập nhật categories nếu có
        if (categories && categories.length > 0) {
            // Xóa categories cũ
            await Labeling.deleteMany({ course_id: courseId });
            
            // Thêm categories mới
            const labelings = categories.map(category_id => ({
                category_id,
                course_id: courseId
            }));
            await Labeling.insertMany(labelings);
        }

        // Cập nhật sections nếu có
        if (sections && sections.length > 0) {
            await updateCourseSectionsService(courseId, sections);
        }

        return { success: true, course_id: courseId };
    } catch (error) {
        console.error('Error updating course:', error);
        throw error;
    }
};

/**
 * Service: Update course sections and lessons
 */
export const updateCourseSectionsService = async (courseId, sections) => {
    console.log(`📦 [updateCourseSectionsService] Processing ${sections.length} sections for course ${courseId}`);
    
    // Lấy danh sách section IDs hiện có
    const existingSections = await Section.find({ course_id: courseId }).lean();
    const existingSectionIds = existingSections.map(s => s._id.toString());
    const newSectionIds = sections
        .filter(s => s._id && !s._id.startsWith('temp-'))
        .map(s => s._id.toString());

    console.log('🔍 [updateCourseSectionsService] Existing sections:', existingSectionIds.length);
    console.log('🔍 [updateCourseSectionsService] New section IDs:', newSectionIds);

    // Xóa sections không còn trong danh sách mới
    const sectionsToDelete = existingSectionIds.filter(id => !newSectionIds.includes(id));
    if (sectionsToDelete.length > 0) {
        console.log(`🗑️ [updateCourseSectionsService] Deleting ${sectionsToDelete.length} sections`);
        for (const sectionId of sectionsToDelete) {
            await Section.findByIdAndDelete(sectionId);
            // Xóa tất cả lessons của section này
            await Video.deleteMany({ section: sectionId });
            await Material.deleteMany({ section: sectionId });
            await Quiz.deleteMany({ section: sectionId });
        }
    }

    // Cập nhật hoặc tạo mới sections
    for (const [index, section] of sections.entries()) {
        console.log(`\n📝 [updateCourseSectionsService] Processing section ${index + 1}/${sections.length}:`, {
            title: section.title,
            _id: section._id,
            hasId: !!section._id,
            startsWithTemp: section._id?.startsWith('temp-'),
            lessonsCount: section.lessons?.length || 0
        });
        
        let sectionId;
        
        if (section._id && !section._id.startsWith('temp-')) {
            // Cập nhật section hiện có
            console.log(`✏️ [updateCourseSectionsService] Updating existing section: ${section._id}`);
            await Section.findByIdAndUpdate(section._id, {
                title: section.title,
                order: section.order || 1
            });
            sectionId = section._id;
        } else {
            // Tạo section mới
            console.log('➕ [updateCourseSectionsService] Creating new section:', section.title);
            const newSection = new Section({
                course_id: courseId,
                title: section.title,
                order: section.order || 1
            });
            const savedSection = await newSection.save();
            sectionId = savedSection._id.toString();
            console.log('✅ [updateCourseSectionsService] Section created with ID:', sectionId);
        }

        // Cập nhật lessons của section
        if (section.lessons && section.lessons.length > 0) {
            console.log(`📚 [updateCourseSectionsService] Processing ${section.lessons.length} lessons for section ${sectionId}`);
            await updateSectionLessonsService(sectionId, section.lessons);
        } else {
            console.log(`⚠️ [updateCourseSectionsService] No lessons for section ${sectionId}`);
        }
    }
    
    console.log('✅ [updateCourseSectionsService] All sections processed');
};

/**
 * Service: Update lessons trong một section
 */
export const updateSectionLessonsService = async (sectionId, lessons) => {
    console.log(`📚 [updateSectionLessonsService] Processing ${lessons.length} lessons for section ${sectionId}`);
    
    // Lấy danh sách lesson IDs hiện có
    const [existingVideos, existingMaterials, existingQuizzes] = await Promise.all([
        Video.find({ section: sectionId }).lean(),
        Material.find({ section: sectionId }).lean(),
        Quiz.find({ section: sectionId }).lean()
    ]);

    const existingVideoIds = existingVideos.map(v => v._id.toString());
    const existingMaterialIds = existingMaterials.map(m => m._id.toString());
    const existingQuizIds = existingQuizzes.map(q => q._id.toString());

    const newVideoIds = [];
    const newMaterialIds = [];
    const newQuizIds = [];

    // Xử lý từng lesson
    for (const [index, lesson] of lessons.entries()) {
        console.log(`\n  📝 [updateSectionLessonsService] Processing lesson ${index + 1}:`, {
            title: lesson.title,
            contentType: lesson.contentType,
            _id: lesson._id,
            hasContent: !!(lesson.contentUrl || lesson.playbackId || (lesson.questions && lesson.questions.length > 0))
        });
        
        if (lesson.contentType === 'video') {
            let videoId = null;
            
            // Case 1: link video đã tạo với section bằng videoId
            if (lesson.videoId) {
                console.log('  🔗 [updateSectionLessonsService] Linking existing video to section:', lesson.videoId);
                const existingVideo = await Video.findById(lesson.videoId);
                
                if (existingVideo) {
                    // Cập nhật video với section và thông tin mới
                    console.log('  📝 [updateSectionLessonsService] Updating video:', {
                        oldSection: existingVideo.section,
                        newSection: sectionId,
                        oldTitle: existingVideo.title,
                        newTitle: lesson.title
                    });
                    
                    await Video.findByIdAndUpdate(lesson.videoId, {
                        section: sectionId,
                        title: lesson.title || existingVideo.title,
                        description: lesson.description || existingVideo.description || '',
                        order: lesson.order || 1
                    });
                    videoId = lesson.videoId;
                    console.log('  ✅ [updateSectionLessonsService] Video linked and updated successfully');
                } else {
                    console.log('  ⚠️ [updateSectionLessonsService] Video not found, skipping');
                }
            }
            // Case 2: Lesson mới có playbackId → tìm video theo playbackId và link
            else if (lesson.playbackId) {
                console.log('  🔍 [updateSectionLessonsService] Searching video by playbackId:', lesson.playbackId);
                const existingVideo = await Video.findOne({ playbackId: lesson.playbackId });
                
                if (existingVideo) {
                    console.log('  🔗 [updateSectionLessonsService] Found video, linking to section:', existingVideo._id);
                    console.log('  📝 [updateSectionLessonsService] Updating video:', {
                        oldSection: existingVideo.section,
                        newSection: sectionId,
                        oldTitle: existingVideo.title,
                        newTitle: lesson.title
                    });
                    
                    // Cập nhật video với section và thông tin mới
                    await Video.findByIdAndUpdate(existingVideo._id, {
                        section: sectionId,
                        title: lesson.title || existingVideo.title,
                        description: lesson.description || existingVideo.description || '',
                        order: lesson.order || 1
                    });
                    videoId = existingVideo._id.toString();
                    console.log('  ✅ [updateSectionLessonsService] Video linked and updated successfully');
                } else {
                    console.log('  ⚠️ [updateSectionLessonsService] Video not found by playbackId, skipping');
                }
            }
            // Case 3: Lesson có _id (existing video)
            else if (lesson._id && !lesson._id.startsWith('temp-')) {
                console.log('  📝 [updateSectionLessonsService] Updating existing video by _id:', lesson._id);
                const existingVideo = await Video.findById(lesson._id);
                
                if (existingVideo) {
                    console.log('  📝 [updateSectionLessonsService] Updating video:', {
                        oldSection: existingVideo.section,
                        newSection: sectionId,
                        oldTitle: existingVideo.title,
                        newTitle: lesson.title
                    });
                    
                    await Video.findByIdAndUpdate(lesson._id, {
                        section: sectionId,
                        title: lesson.title || existingVideo.title,
                        description: lesson.description || existingVideo.description || '',
                        order: lesson.order || 1
                    });
                    videoId = lesson._id;
                    console.log('  ✅ [updateSectionLessonsService] Video updated successfully');
                } else {
                    console.log('  ⚠️ [updateSectionLessonsService] Video not found by _id, skipping');
                }
            }
            
            if (videoId) {
                newVideoIds.push(videoId);
            }
        } else if (lesson.contentType === 'material') {
            // Xử lý material: Ưu tiên materialId (từ upload), sau đó mới đến lesson._id
            const materialIdToLink = lesson.materialId || (lesson._id && !lesson._id.startsWith('temp-') ? lesson._id : null);
            
            if (materialIdToLink) {
                // Link existing material document với section
                console.log('  🔗 [updateSectionLessonsService] Linking existing material to section:', materialIdToLink);
                
                try {
                    const material = await Material.findById(materialIdToLink);
                    
                    if (material) {
                        // Update material: link với section, set isTemporary = false
                        await Material.findByIdAndUpdate(materialIdToLink, {
                            section: sectionId,
                            title: lesson.title || material.originalFilename || 'Untitled Material',
                            order: lesson.order || 1,
                            isTemporary: false // Material giờ đã được link với course
                        });
                        console.log('  ✅ [updateSectionLessonsService] Material linked successfully');
                        newMaterialIds.push(materialIdToLink);
                    } else {
                        console.log('  ⚠️ [updateSectionLessonsService] Material not found, skipping');
                    }
                } catch (error) {
                    console.error('  ❌ [updateSectionLessonsService] Error linking material:', error);
                }
            } else if (lesson.contentUrl) {
                // Legacy: Tạo material mới từ contentUrl (backward compatibility)
                console.log('  ➕ [updateSectionLessonsService] Creating new material from URL:', lesson.title);
                const newMaterial = new Material({
                    section: sectionId,
                    title: lesson.title || 'Untitled Material',
                    order: lesson.order || 1,
                    contentUrl: lesson.contentUrl,
                    isTemporary: false
                });
                const savedMaterial = await newMaterial.save();
                console.log('  ✅ [updateSectionLessonsService] Material created with ID:', savedMaterial._id);
                newMaterialIds.push(savedMaterial._id.toString());
            } else {
                console.log('  ⚠️ [updateSectionLessonsService] Skipping material without materialId or contentUrl:', lesson.title);
            }
        } else if (lesson.contentType === 'quiz') {
            if (lesson._id && !lesson._id.startsWith('temp-')) {
                // Cập nhật quiz hiện có
                console.log('  ✏️ [updateSectionLessonsService] Updating existing quiz:', lesson._id);
                await Quiz.findByIdAndUpdate(lesson._id, {
                    title: lesson.title,
                    description: lesson.description || '',
                    order: lesson.order || 1,
                    questions: lesson.questions || []
                });
                newQuizIds.push(lesson._id);
            } else {
                // Tạo quiz mới - BẤT KỂ có questions hay không
                console.log('  ➕ [updateSectionLessonsService] Creating new quiz:', lesson.title);
                const newQuiz = new Quiz({
                    section: sectionId,
                    title: lesson.title || 'Untitled Quiz',
                    description: lesson.description || '',
                    order: lesson.order || 1,
                    questions: lesson.questions || []
                });
                const savedQuiz = await newQuiz.save();
                console.log('  ✅ [updateSectionLessonsService] Quiz created with ID:', savedQuiz._id);
                newQuizIds.push(savedQuiz._id.toString());
            }
        }
    }

    // Xóa lessons không còn trong danh sách mới
    const videosToDelete = existingVideoIds.filter(id => !newVideoIds.includes(id));
    const materialsToDelete = existingMaterialIds.filter(id => !newMaterialIds.includes(id));
    const quizzesToDelete = existingQuizIds.filter(id => !newQuizIds.includes(id));

    if (videosToDelete.length > 0 || materialsToDelete.length > 0 || quizzesToDelete.length > 0) {
        console.log('🗑️ [updateSectionLessonsService] Deleting removed lessons:', {
            videos: videosToDelete.length,
            materials: materialsToDelete.length,
            quizzes: quizzesToDelete.length
        });
        
        // Xóa videos và MUX assets
        if (videosToDelete.length > 0) {
            await deleteVideosWithMuxAssets(videosToDelete);
        }
        
        await Promise.all([
            ...materialsToDelete.map(id => Material.findByIdAndDelete(id)),
            ...quizzesToDelete.map(id => Quiz.findByIdAndDelete(id))
        ]);
    }
    
    console.log('✅ [updateSectionLessonsService] Summary:', {
        totalProcessed: lessons.length,
        videosCreated: newVideoIds.length - existingVideoIds.filter(id => newVideoIds.includes(id)).length,
        materialsCreated: newMaterialIds.length - existingMaterialIds.filter(id => newMaterialIds.includes(id)).length,
        quizzesCreated: newQuizIds.length - existingQuizIds.filter(id => newQuizIds.includes(id)).length
    });
};

/**
 * Service: Delete course (MongoDB)
 */
export const deleteCourseService = async (courseId) => {
    try {
        // Xóa course từ MongoDB
        await Course.findByIdAndDelete(courseId);
        
        // Xóa categories (Labeling)
        await Labeling.deleteMany({ course_id: courseId });
        
        // Lấy tất cả sections của course
        const sections = await Section.find({ course_id: courseId }).lean();
        const sectionIds = sections.map(s => s._id);

        // Lấy tất cả videos để xóa MUX assets
        const videos = await Video.find({ section: { $in: sectionIds } }).lean();
        const videoIds = videos.map(v => v._id);

        // Xóa videos và MUX assets
        if (videoIds.length > 0) {
            await deleteVideosWithMuxAssets(videoIds);
        }

        // Xóa materials và quizzes
        await Promise.all([
            Material.deleteMany({ section: { $in: sectionIds } }),
            Quiz.deleteMany({ section: { $in: sectionIds } })
        ]);

        // Xóa tất cả sections
        await Section.deleteMany({ course_id: courseId });

        return { success: true, message: 'Course deleted successfully' };
    } catch (error) {
        console.error('Error deleting course:', error);
        throw error;
    }
};

/**
 * Service: Get full course data for management (bao gồm sections và lessons)
 */
export const getFullCourseDataForManagementService = async (courseId) => {
    // Lấy course từ MongoDB
    const mongoCourse = await Course.findById(courseId).lean();

    if (!mongoCourse) {
        return null;
    }

    // Lấy level và language info
    const [level, language] = await Promise.all([
        Level.findById(mongoCourse.level_id).lean(),
        Language.findById(mongoCourse.lang_id).lean()
    ]);

    // Map course data to expected format
    const course = {
        course_id: mongoCourse._id,
        title: mongoCourse.title,
        subTitle: mongoCourse.sub_title,
        des: mongoCourse.description,
        originalPrice: mongoCourse.original_price,
        currentPrice: mongoCourse.current_price,
        lv_id: mongoCourse.level_id,
        lang_id: mongoCourse.lang_id,
        has_practice: mongoCourse.has_practice,
        has_certificate: mongoCourse.has_certificate,
        picture_url: mongoCourse.thumbnail_url,
        course_status: mongoCourse.course_status,
        requirements: mongoCourse.requirements || [],
        objectives: mongoCourse.objectives || [],
        level_title: level?.title || '',
        language_title: language?.title || ''
    };

    // Lấy categories từ MongoDB
    const labelings = await Labeling.find({ course_id: courseId }).lean();
    const categoryIds = labelings.map(l => l.category_id);
    const categories = await Category.find({ _id: { $in: categoryIds } }).lean();
    
    course.categories = categories.map(cat => ({
        category_id: cat._id,
        title: cat.title
    }));

    // Lấy sections với lessons từ Lesson model
    const sections = await Section.find({ course_id: courseId }).sort({ order: 1 }).lean();
    
    if (sections && sections.length > 0) {
        // Populate lessons cho từng section
        const sectionsWithLessons = await Promise.all(
            sections.map(async (section) => {
                // Lấy tất cả lessons của section này
                const lessons = await Lesson.find({ section: section._id })
                    .sort({ order: 1 })
                    .lean();
                
                // Populate content cho từng lesson dựa vào contentType
                const populatedLessons = await Promise.all(
                    lessons.map(async (lesson) => {
                        const baseLessonData = {
                            _id: lesson._id,
                            title: lesson.title,
                            contentType: lesson.contentType,
                            order: lesson.order,
                            description: lesson.description || '',
                            duration: lesson.duration || 0
                        };

                        // Populate content dựa vào contentType
                        if (lesson.contentType === 'video' && lesson.video) {
                            const video = await Video.findById(lesson.video).lean();
                            if (video) {
                                return {
                                    ...baseLessonData,
                                    videoId: video._id,
                                    contentUrl: video.contentUrl || '',
                                    playbackId: video.playbackId || '',
                                    assetId: video.assetId || '',
                                    uploadId: video.uploadId || '',
                                    status: video.status || '',
                                    duration: video.duration || 0
                                };
                            }
                        } else if (lesson.contentType === 'material' && lesson.material) {
                            const material = await Material.findById(lesson.material).lean();
                            if (material) {
                                return {
                                    ...baseLessonData,
                                    materialId: material._id,
                                    contentUrl: material.contentUrl || '',
                                    fileName: material.originalFilename || material.title || '',
                                    publicId: material.contentUrl || ''
                                };
                            }
                        } else if (lesson.contentType === 'quiz' && lesson.quiz) {
                            const quiz = await Quiz.findById(lesson.quiz).lean();
                            if (quiz) {
                                return {
                                    ...baseLessonData,
                                    quizId: quiz._id,
                                    questions: quiz.questions || []
                                };
                            }
                        }

                        // Return base lesson if content not found
                        return baseLessonData;
                    })
                );

                return {
                    _id: section._id,
                    title: section.title,
                    order: section.order,
                    lessons: populatedLessons
                };
            })
        );

        course.sections = sectionsWithLessons;
    } else {
        course.sections = [];
    }

    return course;
};
