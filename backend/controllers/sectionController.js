import Section from "../models/Section.js";
import mongoose from "mongoose";

export const addSection = async (req, res) => {
    const { courseId, title } = req.body;

    try {
        const newSection = new Section({
            course_id: courseId,
            title,
        });

        const savedSection = await newSection.save();
        res.status(201).json(savedSection);
    } catch (error) {
        res.status(500).json({ message: 'Error creating section', error });
    }
}

export const getSectionsByCourseId = async (req, res) => {
    const { courseId } = req.params;

    try {
        const sections = await Section.find({ course_id: courseId }).lean();

        if (!sections || sections.length === 0) {
            return res.status(404).json({ message: 'No sections found for this course' });
        }

        res.status(200).json({ courseId: courseId, sections });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sections', error });
    }
}