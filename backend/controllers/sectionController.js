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
        const sections = await Section.find({ course_id: courseId }).sort({ order: 1 }).lean();

        if (!sections || sections.length === 0) {
            return res.status(404).json({ message: 'No sections found for this course' });
        }

        res.status(200).json({ courseId: courseId, sections });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching sections', error: error.message });
    }
}