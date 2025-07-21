import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    slug_title: {
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
        required: true,
    },
    updatedAt: {
        type: Date,
        required: true,
    },
    tags: {
        type: Array,
        required: true,
    },
});

const Course = mongoose.model("Course", courseSchema);

export default Course;
