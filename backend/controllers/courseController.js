import Course from '../models/Course.js';

export const getCourseById = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const course = await Course.findById(courseId);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        res.status(200).json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const findCourseByTitle = async (req, res) => {
    const { title } = req.body
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
        ;
    if (!title) {
        return res.status(400).json({ message: 'Title query parameter is required' });
    }
    try {
        const courses = await Course.find({ title: new RegExp(title, 'i') });
        if (courses.length === 0) {
            return res.status(404).json({ message: 'No courses found' });
        }
        res.status(200).json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const addCourse = async (req, res) => {
    const { title, instructor, rating, reviewCount, thumbnail, description, originalPrice, currentPrice, tags } = req.body;

    if (!title || !instructor || !rating || !reviewCount || !thumbnail || !description || !originalPrice || !currentPrice || !tags) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const newCourse = new Course({
            title,
            instructor,
            rating,
            reviewCount,
            thumbnail,
            description,
            originalPrice,
            currentPrice,
            tags,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await newCourse.save();
        res.status(201).json(newCourse);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
