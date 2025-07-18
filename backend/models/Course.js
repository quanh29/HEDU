import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    courseId: {
    type: String,
    required: true,
    unique: true,
    },
    title: {
    type: String,
    required: true,
    },
    instructor: {
    type: Array,
    required: true,
    },
    description: {
    type: String,
    required: true,
    },
    rating: {
    type: Number,
    default: 0,
    },
    reviewCount: {
    type: Number,
    default: 0,
    },
    thumbnail: {
    type: String,
    required: true,
    },
    originalPrice: {
    type: Number,
    required: true,
    },
    currentPrice: {
    type: Number,
    required: true,
    },
    createdAt: {
    type: Date,
    default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const Course = mongoose.model("Course", courseSchema);

export default Course;
