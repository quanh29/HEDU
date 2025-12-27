import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    courseId: {
        type: String,
        required: true,
    },
    completedLessons: {
        type: [String], // Array of lesson IDs
        default: [],
    }
}, { timestamps: true });

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

export default Enrollment;
