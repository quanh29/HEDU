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
}, { 
    timestamps: true,
    _id: false
 });


export default mongoose.model('Labeling', labelingSchema);
