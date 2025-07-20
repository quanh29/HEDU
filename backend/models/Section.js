import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
    courseId: {
        type: String,
        ref: 'Course',
        required: true,
    },
    title: {
        type: String,
        required: true,
    }
});

const Section = mongoose.model("Section", sectionSchema);

export default Section;
