import Section from "../models/Section.js";
import SectionDraft from "../models/SectionDraft.js";
import VideoDraft from "../models/VideoDraft.js";
import MaterialDraft from "../models/MaterialDraft.js";
import QuizDraft from "../models/QuizDraft.js";
import mongoose from "mongoose";
import { isCourseApproved, getOrCreateDraft } from "../utils/draftHelper.js";

export const addSection = async (req, res) => {
    const { courseId, title, order } = req.body;

    if (!courseId || !title) {
        return res.status(400).json({ success: false, message: 'courseId and title are required' });
    }

    try {
        // Check if course is approved
        const isApproved = await isCourseApproved(courseId);

        if (isApproved) {
            // Course is approved - work with drafts
            const draft = await getOrCreateDraft(courseId, req.auth?.userId);

            const draftSection = new SectionDraft({
                publishedSectionId: null, // New section
                courseDraftId: courseId,
                course_id: courseId,
                title: title,
                order: order || 1,
                status: 'draft',
                changeType: 'new'
            });

            await draftSection.save();

            // Add to draft's draftSections array
            draft.draftSections.push(draftSection._id);
            await draft.save();

            console.log(`✅ Created draft section: ${draftSection._id} for draft: ${draft._id}`);

            return res.status(201).json({
                success: true,
                isDraft: true,
                courseDraftId: draft._id,
                data: draftSection
            });
        } else {
            // Course is draft/rejected - create regular section
            const newSection = new Section({
                course_id: courseId,
                title,
                order: order || 1
            });

            const savedSection = await newSection.save();

            console.log(`✅ Created section: ${savedSection._id}`);

            return res.status(201).json({
                success: true,
                isDraft: false,
                data: savedSection
            });
        }
    } catch (error) {
        console.error('Error adding section:', error);
        res.status(500).json({ success: false, message: 'Error creating section', error: error.message });
    }
}

export const getSectionsByCourseId = async (req, res) => {
    const { courseId } = req.params;
    const { includeDrafts } = req.query; // Optional query param to include drafts

    try {
        const isApproved = await isCourseApproved(courseId);

        // If includeDrafts='true' and course is approved, ONLY return draft sections
        if (includeDrafts === 'true' && isApproved) {
            const CourseDraft = mongoose.model('CourseDraft');
            const draft = await CourseDraft.findById(courseId);

            if (draft && draft.draftSections.length > 0) {
                // Fetch draft sections
                const draftSections = await SectionDraft.find({
                    _id: { $in: draft.draftSections }
                }).sort({ order: 1 }).lean();

                // Populate draft lessons
                const LessonDraft = mongoose.model('LessonDraft');
                
                const draftSectionsWithLessons = await Promise.all(
                    draftSections.map(async (section) => {
                        const draftLessons = await LessonDraft.find({ draftSectionId: section._id })
                            .sort({ order: 1 })
                            .lean();
                        
                        // Populate content for each lesson based on content type
                        const lessonsWithContent = await Promise.all(
                            draftLessons.map(async (lesson) => {
                                const enrichedLesson = { ...lesson };
                                
                                // Populate video data if contentType is 'video'
                                if (lesson.contentType === 'video' && lesson.draftVideoId) {
                                    const videoDraft = await VideoDraft.findById(lesson.draftVideoId).lean();
                                    if (videoDraft) {
                                        enrichedLesson.videoId = videoDraft._id;
                                        enrichedLesson.playbackId = videoDraft.playbackId;
                                        enrichedLesson.assetId = videoDraft.assetId;
                                        enrichedLesson.uploadId = videoDraft.uploadId;
                                        enrichedLesson.duration = videoDraft.duration;
                                        enrichedLesson.status = videoDraft.status;
                                    }
                                }
                                
                                // Populate material data if contentType is 'material'
                                if (lesson.contentType === 'material' && lesson.draftMaterialId) {
                                    const materialDraft = await MaterialDraft.findById(lesson.draftMaterialId).lean();
                                    if (materialDraft) {
                                        enrichedLesson.materialId = materialDraft._id;
                                        enrichedLesson.contentUrl = materialDraft.contentUrl;
                                        enrichedLesson.publicId = materialDraft.contentUrl;
                                        enrichedLesson.fileName = materialDraft.originalFilename || materialDraft.title;
                                        enrichedLesson.fileSize = materialDraft.fileSize;
                                    }
                                }
                                
                                // Populate quiz data if contentType is 'quiz'
                                if (lesson.contentType === 'quiz' && lesson.draftQuizId) {
                                    const quizDraft = await QuizDraft.findById(lesson.draftQuizId).lean();
                                    if (quizDraft) {
                                        enrichedLesson.quizId = quizDraft._id;
                                        enrichedLesson.questions = quizDraft.questions || [];
                                    }
                                }
                                
                                return enrichedLesson;
                            })
                        );
                        
                        return {
                            ...section,
                            lessons: lessonsWithContent || [],
                            isDraft: true,
                            courseDraftId: draft._id
                        };
                    })
                );

                console.log(`✅ Returning ${draftSectionsWithLessons.length} draft sections for course ${courseId}`);

                return res.status(200).json({
                    success: true,
                    hasDraft: true,
                    draftStatus: draft.status,
                    courseDraftId: draft._id,
                    sections: draftSectionsWithLessons
                });
            } else {
                // No draft exists, return empty (frontend will fall back to published)
                console.log(`⚠️ No draft found for approved course ${courseId}`);
                return res.status(200).json({
                    success: true,
                    hasDraft: false,
                    sections: []
                });
            }
        }

        // Return published sections (for non-approved courses or when includeDrafts=false)
        const sections = await Section.find({ course_id: courseId })
            .sort({ order: 1 })
            .lean();

        // Import Lesson model để lấy lessons
        const Lesson = mongoose.model('Lesson');
        
        // Populate lessons cho từng section
        const sectionsWithLessons = await Promise.all(
            sections.map(async (section) => {
                const lessons = await Lesson.find({ section: section._id })
                    .sort({ order: 1 })
                    .lean();
                
                return {
                    ...section,
                    lessons: lessons || [],
                    isDraft: false
                };
            })
        );

        if (!sections || sections.length === 0) {
            // Course has no sections yet - this is OK for new/draft courses
            console.log(`ℹ️ No sections found for course ${courseId} - returning empty array`);
            return res.status(200).json({
                success: true,
                courseId: courseId,
                sections: [],
                hasDraft: false
            });
        }

        res.status(200).json({
            success: true,
            courseId: courseId,
            sections: sectionsWithLessons,
            hasDraft: false
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching sections', error: error.message });
    }
}

export const updateSection = async (req, res) => {
    const { sectionId } = req.params;
    const updateData = req.body;

    try {
        // Check if this is a draft section or published section
        const draftSection = await SectionDraft.findById(sectionId);
        
        if (draftSection) {
            // Update draft section
            Object.assign(draftSection, updateData);
            draftSection.changeType = draftSection.publishedSectionId ? 'modified' : 'new';
            
            await draftSection.save();

            // Update draft reference
            const draft = await mongoose.model('CourseDraft').findById(draftSection.courseDraftId);
            if (draft) {
                await draft.save();
            }

            console.log(`✅ Updated draft section: ${draftSection._id}`);

            return res.status(200).json({
                success: true,
                isDraft: true,
                data: draftSection
            });
        }
        
        // Check if published section
        const section = await Section.findById(sectionId);
        
        if (!section) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }

        // Check if course is approved
        const isApproved = await isCourseApproved(section.course_id);

        if (isApproved) {
            // Create/update draft section for approved course
            const draft = await getOrCreateDraft(section.course_id, req.auth?.userId);

            // Check if draft already exists for this section
            let existingDraft = await SectionDraft.findOne({
                publishedSectionId: section._id,
                courseDraftId: draft._id
            });

            if (existingDraft) {
                // Update existing draft
                Object.assign(existingDraft, updateData);
                existingDraft.changeType = 'modified';
                await existingDraft.save();

                console.log(`✅ Updated existing draft section: ${existingDraft._id}`);

                return res.status(200).json({
                    success: true,
                    isDraft: true,
                    data: existingDraft
                });
            } else {
                // Create new draft from published section
                const newDraft = new SectionDraft({
                    publishedSectionId: section._id,
                    courseDraftId: draft._id,
                    course_id: section.course_id,
                    title: updateData.title !== undefined ? updateData.title : section.title,
                    order: updateData.order !== undefined ? updateData.order : section.order,
                    status: 'draft',
                    changeType: 'modified'
                });

                await newDraft.save();

                // Add to draft
                draft.draftSections.push(newDraft._id);
                await draft.save();

                console.log(`✅ Created draft for published section: ${newDraft._id}`);

                return res.status(200).json({
                    success: true,
                    isDraft: true,
                    data: newDraft
                });
            }
        } else {
            // Course is draft - update directly
            const updatedSection = await Section.findByIdAndUpdate(
                sectionId,
                updateData,
                { new: true, runValidators: true }
            );

            console.log(`✅ Updated section: ${updatedSection._id}`);

            return res.status(200).json({
                success: true,
                isDraft: false,
                data: updatedSection
            });
        }
    } catch (error) {
        console.error('Error updating section:', error);
        res.status(500).json({ success: false, message: 'Error updating section', error: error.message });
    }
}

export const deleteSection = async (req, res) => {
    const { sectionId } = req.params;

    try {
        // Check if this is a draft section or published section
        const draftSection = await SectionDraft.findById(sectionId);
        
        if (draftSection) {
            // Delete draft section (triggers cascade delete)
            await draftSection.deleteOne();

            // Remove from draft's draftSections array
            const draft = await mongoose.model('CourseDraft').findById(draftSection.courseDraftId);
            if (draft) {
                draft.draftSections = draft.draftSections.filter(
                    id => id.toString() !== sectionId
                );
                await draft.save();
            }

            console.log(`✅ Deleted draft section: ${sectionId}`);

            return res.status(200).json({
                success: true,
                message: 'Draft section deleted successfully',
                isDraft: true,
                sectionId
            });
        }

        // Find published section
        const section = await Section.findById(sectionId);

        if (!section) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }

        // Check if course is approved
        const isApproved = await isCourseApproved(section.course_id);

        if (isApproved) {
            // Create a "deleted" draft marker for approved course
            const draft = await getOrCreateDraft(section.course_id, req.auth?.userId);

            const deletedDraft = new SectionDraft({
                publishedSectionId: section._id,
                courseDraftId: draft._id,
                course_id: section.course_id,
                title: section.title,
                order: section.order,
                status: 'draft',
                changeType: 'deleted'
            });

            await deletedDraft.save();

            draft.draftSections.push(deletedDraft._id);
            await draft.save();

            console.log(`✅ Marked section for deletion: ${section._id} (draft: ${deletedDraft._id})`);

            return res.status(200).json({
                success: true,
                message: 'Section marked for deletion (pending approval)',
                isDraft: true,
                sectionId,
                draftId: deletedDraft._id
            });
        } else {
            // Course is draft - delete directly
            await section.deleteOne();

            console.log(`✅ Deleted section: ${sectionId}`);

            return res.status(200).json({
                success: true,
                message: 'Section deleted successfully',
                isDraft: false,
                sectionId
            });
        }
    } catch (error) {
        console.error('Error deleting section:', error);
        res.status(500).json({ success: false, message: 'Error deleting section', error: error.message });
    }
}