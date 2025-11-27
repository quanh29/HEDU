import Section from "../models/Section.js";
import mongoose from "mongoose";

export const addSection = async (req, res) => {
    const { courseId, title, order } = req.body;

    if (!courseId || !title) {
        return res.status(400).json({ message: 'courseId and title are required' });
    }

    try {
        const newSection = new Section({
            course_id: courseId,
            title,
            order: order || 1
        });

        const savedSection = await newSection.save();
        res.status(201).json(savedSection);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating section', error: error.message });
    }
}

export const getSectionsByCourseId = async (req, res) => {
    const { courseId } = req.params;

    try {
        // Populate lessons for each section
        const sections = await Section.find({ course_id: courseId })
            .sort({ order: 1 })
            .lean();

        if (!sections || sections.length === 0) {
            return res.status(404).json({ message: 'No sections found for this course' });
        }

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
                    lessons: lessons || []
                };
            })
        );

        res.status(200).json({ courseId: courseId, sections: sectionsWithLessons });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching sections', error: error.message });
    }
}

export const updateSection = async (req, res) => {
    const { sectionId } = req.params;
    const updateData = req.body;

    try {
        const updatedSection = await Section.findByIdAndUpdate(
            sectionId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedSection) {
            return res.status(404).json({ message: 'Section not found' });
        }

        res.status(200).json(updatedSection);
    } catch (error) {
        console.error('Error updating section:', error);
        res.status(500).json({ message: 'Error updating section', error: error.message });
    }
}

export const deleteSection = async (req, res) => {
    const { sectionId } = req.params;

    try {
        // Find the section first
        const section = await Section.findById(sectionId);

        if (!section) {
            return res.status(404).json({ message: 'Section not found' });
        }

        // Use deleteOne to trigger pre-delete hook for cascade deletion
        await section.deleteOne();

        res.status(200).json({ message: 'Section deleted successfully', sectionId });
    } catch (error) {
        console.error('Error deleting section:', error);
        res.status(500).json({ message: 'Error deleting section', error: error.message });
    }
}