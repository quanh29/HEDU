import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        // _id sẽ chứa trực tiếp course_id từ MySQL
    },
    title:{
        type: String,
        required: true,
    },
    sub_title:{
        type: String,
        required: true,
    },
    description:{
        type: String,
        required: true,
    },
    thumbnail_url:{
        type: String,
        required: false,
    },
    original_price:{
        type: Number,
        required: true,
    },
    current_price:{
        type: Number,
        required: true,
    },
    course_status:{
        type: String,
        enum: ['draft', 'pending', 'approved', 'rejected', 'inactive'],
        required: true,
    },
    level_id:{
        type: String,
        required: true,
    },
    lang_id:{
        type: String,
        required: true,
    },
    has_practice:{
        type: Boolean,
        required: true,
    },
    has_certificate:{
        type: Boolean,
        required: true,
    },
    requirements: {
        type: Array,
        required: true,
    },
    objectives: {
        type: Array,
        required: true,
    },
        instructor_id:{
        type: String,
        required: true,
    },
}, { _id: false }); // Disable auto _id generation

const Course = mongoose.model("Course", courseSchema);

export default Course;
