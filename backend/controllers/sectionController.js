import Section from "../models/Section.js";
import mongoose from "mongoose";

export const addSection = async (req, res) => {
    const { courseId, title } = req.body;

    try {
        const newSection = new Section({
            courseId,
            title,
        });

        const savedSection = await newSection.create();
        res.status(201).json(savedSection);
    } catch (error) {
        res.status(500).json({ message: 'Error creating section', error });
    }
}

export const getSectionsByCourseId = async (req, res) => {
    const { courseId } = req.params;

    try {
        const sections = await Section.find({ course: (courseId) }).populate('course');

        if (!sections || sections.length === 0) {
            return res.status(404).json({ message: 'No sections found for this course' });
        }
        // remove course field from each section by setting it to undefined
        sections.forEach(section => {
            section.course = undefined;
        });

        res.status(200).json({ courseId: courseId, sections });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sections', error });
    }
}