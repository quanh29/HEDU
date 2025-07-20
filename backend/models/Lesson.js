import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
    sectionId: {
        type: String,
        ref: 'Section',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    contentUrl: {
        type: String,
        required: true,
    },
    info: {
        type: Number,
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
