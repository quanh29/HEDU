import mongoose from "mongoose";

const headingSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
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
