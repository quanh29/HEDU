import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
    section: {
        type: String,
        ref: 'Section',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    contentType: {
        type: String,
        required: true,
    },
    contentUrl: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    createdAt: {
        type: Date,
        required: true,
    },
    updatedAt: {
        type: Date,
        required: true,
    },
});

const Lesson = mongoose.model("Lesson", lessonSchema);

export default Lesson;
