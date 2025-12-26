import mongoose from "mongoose";

const labelingSchema = new mongoose.Schema({
    category_id: {
        type: String,
        required: true,
        ref: 'Category'
    },
    course_id: {
        type: String,
        required: true,
        ref: 'Course'
    }
}, { timestamps: true });

// Composite index for unique constraint
labelingSchema.index({ category_id: 1, course_id: 1 }, { unique: true });

export default mongoose.model('Labeling', labelingSchema);
