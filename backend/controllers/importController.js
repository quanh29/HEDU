import Section from "../models/Section.js";
import Video from "../models/video.js";
import Material from "../models/Material.js";
import Quiz from "../models/Quiz.js";

// Import sections và lessons (videos, materials, quizzes) cho một khóa học
export const importCourseContent = async (req, res) => {
    const { courseId, sections } = req.body;

    // Validate input
    if (!courseId || !sections || !Array.isArray(sections) || sections.length === 0) {
        return res.status(400).json({ 
            message: 'courseId and sections array are required',
            example: {
                courseId: "uuid-course-id",
                sections: [
                    {
                        title: "Section 1",
                        order: 1,
                        videos: [
                            {
                                title: "Video 1",
                                contentUrl: "https://example.com/video1.mp4",
                                description: "Video description",
                                order: 1
                            }
                        ],
                        materials: [
                            {
                                title: "Material 1",
                                contentUrl: "https://example.com/material1.pdf",
                                order: 2
                            }
                        ],
                        quizzes: [
                            {
                                title: "Quiz 1",
                                description: "Quiz description",
                                questions: [
                                    {
                                        questionText: "Question?",
                                        options: ["A", "B", "C", "D"],
                                        correctAnswers: [0],
                                        explanation: "Explanation"
                                    }
                                ],
                                order: 3
                            }
                        ]
                    }
                ]
            }
        });
    }

    try {
        const results = {
            courseId,
            sections: [],
            totalVideos: 0,
            totalMaterials: 0,
            totalQuizzes: 0,
            errors: []
        };

        for (const sectionData of sections) {
            try {
                const { title, order, videos = [], materials = [], quizzes = [] } = sectionData;

                if (!title) {
                    results.errors.push({
                        section: sectionData,
                        error: 'Section title is required'
                    });
                    continue;
                }

                // Tạo section
                const newSection = new Section({
                    course_id: courseId,
                    title,
                    order: order || 1
                });

                const savedSection = await newSection.save();
                const sectionId = savedSection._id.toString();

                const sectionResult = {
                    sectionId,
                    title,
                    videos: [],
                    materials: [],
                    quizzes: []
                };

                // Import videos
                for (const videoData of videos) {
                    try {
                        const { title: videoTitle, contentUrl, description, order: videoOrder } = videoData;

                        if (!videoTitle || !contentUrl) {
                            results.errors.push({
                                section: title,
                                type: 'video',
                                data: videoData,
                                error: 'Video title and contentUrl are required'
                            });
                            continue;
                        }

                        const newVideo = new Video({
                            section: sectionId,
                            title: videoTitle,
                            contentUrl,
                            description: description || '',
                            order: videoOrder || 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        });

                        const savedVideo = await newVideo.save();
                        sectionResult.videos.push(savedVideo._id);
                        results.totalVideos++;
                    } catch (error) {
                        results.errors.push({
                            section: title,
                            type: 'video',
                            data: videoData,
                            error: error.message
                        });
                    }
                }

                // Import materials
                for (const materialData of materials) {
                    try {
                        const { title: materialTitle, contentUrl, order: materialOrder } = materialData;

                        if (!materialTitle || !contentUrl) {
                            results.errors.push({
                                section: title,
                                type: 'material',
                                data: materialData,
                                error: 'Material title and contentUrl are required'
                            });
                            continue;
                        }

                        const newMaterial = new Material({
                            section: sectionId,
                            title: materialTitle,
                            contentUrl,
                            order: materialOrder || 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        });

                        const savedMaterial = await newMaterial.save();
                        sectionResult.materials.push(savedMaterial._id);
                        results.totalMaterials++;
                    } catch (error) {
                        results.errors.push({
                            section: title,
                            type: 'material',
                            data: materialData,
                            error: error.message
                        });
                    }
                }

                // Import quizzes
                for (const quizData of quizzes) {
                    try {
                        const { title: quizTitle, description, questions, order: quizOrder } = quizData;

                        if (!quizTitle || !questions || questions.length === 0) {
                            results.errors.push({
                                section: title,
                                type: 'quiz',
                                data: quizData,
                                error: 'Quiz title and questions are required'
                            });
                            continue;
                        }

                        // Validate questions
                        const validQuestions = questions.every(q => 
                            q.questionText && 
                            q.options && 
                            q.correctAnswers && 
                            q.explanation
                        );

                        if (!validQuestions) {
                            results.errors.push({
                                section: title,
                                type: 'quiz',
                                data: quizData,
                                error: 'Each question must have questionText, options, correctAnswers, and explanation'
                            });
                            continue;
                        }

                        const newQuiz = new Quiz({
                            section: sectionId,
                            title: quizTitle,
                            description: description || '',
                            questions,
                            order: quizOrder || 1
                        });

                        const savedQuiz = await newQuiz.save();
                        sectionResult.quizzes.push(savedQuiz._id);
                        results.totalQuizzes++;
                    } catch (error) {
                        results.errors.push({
                            section: title,
                            type: 'quiz',
                            data: quizData,
                            error: error.message
                        });
                    }
                }

                results.sections.push(sectionResult);

            } catch (error) {
                results.errors.push({
                    section: sectionData,
                    error: error.message
                });
            }
        }

        res.status(201).json({
            success: true,
            message: 'Import completed',
            results
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during import', 
            error: error.message 
        });
    }
};

// Xóa tất cả sections và lessons của một khóa học (dùng để clean up khi test)
export const deleteAllCourseContent = async (req, res) => {
    const { courseId } = req.params;

    if (!courseId) {
        return res.status(400).json({ message: 'courseId is required' });
    }

    try {
        // Tìm tất cả sections của course
        const sections = await Section.find({ course_id: courseId });
        const sectionIds = sections.map(s => s._id.toString());

        // Xóa tất cả videos, materials, quizzes của các sections
        const [deletedVideos, deletedMaterials, deletedQuizzes] = await Promise.all([
            Video.deleteMany({ section: { $in: sectionIds } }),
            Material.deleteMany({ section: { $in: sectionIds } }),
            Quiz.deleteMany({ section: { $in: sectionIds } })
        ]);

        // Xóa tất cả sections
        const deletedSections = await Section.deleteMany({ course_id: courseId });

        res.status(200).json({
            success: true,
            message: 'All course content deleted',
            deleted: {
                sections: deletedSections.deletedCount,
                videos: deletedVideos.deletedCount,
                materials: deletedMaterials.deletedCount,
                quizzes: deletedQuizzes.deletedCount
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during deletion', 
            error: error.message 
        });
    }
};
