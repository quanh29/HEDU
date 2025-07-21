import { get } from "mongoose";
import Lesson from "../models/Lesson.js";

// protected route to get lesson by ID
export const getLessonById = async (req, res) => {
    const { lessonId } = req.params;

    try {
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }
        res.status(200).json(lesson);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// unprotected route to get all lessons by section ID
// this is used to display lessons in the section page
export const getLessonBySectionId = async (req, res) => {
    const { sectionId } = req.params;

    try {
        const lessons = await Lesson.find({ section: sectionId });
        if (!lessons || lessons.length === 0) {
            return res.status(404).json({ message: 'No lessons found for this section' });
        }
        // remove contentUrl, description, createdAt, updatedAt fields from each lesson
        lessons.forEach(lesson => {
            lesson.contentUrl = undefined;
            lesson.description = undefined;
            lesson.createdAt = undefined;
            lesson.updatedAt = undefined;
            lesson.section = undefined; // remove section field to avoid circular reference
        });
        res.status(200).json(lessons);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


