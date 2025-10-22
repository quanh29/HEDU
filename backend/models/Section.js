import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
    course_id: {
        type: String,
        required: true,
        ref: 'Course' // Reference to MySQL course_id
    },
    title: {
        type: String,
        required: true,
    },
    order: {
        type: Number,
        default: 1,
    }
});

const Section = mongoose.model("Section", sectionSchema);

export default Section;
