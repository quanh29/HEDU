import mongoose from "mongoose";

const headingSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        // _id sẽ chứa trực tiếp heading_id từ MySQL
    },
    title: {
        type: String,
        required: true,
    },
    sub_title: {
        type: String,
        required: true,
    }
}, { timestamps: true });

export default mongoose.model('Heading', headingSchema);
