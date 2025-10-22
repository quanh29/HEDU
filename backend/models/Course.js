import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        // _id sẽ chứa trực tiếp course_id từ MySQL
    },
    requirements: {
        type: Array,
        required: true,
    },
    objectives: {
        type: Array,
        required: true,
    }
}, { _id: false }); // Disable auto _id generation

const Course = mongoose.model("Course", courseSchema);

export default Course;
