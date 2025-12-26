import mongoose from "mongoose";

const languageSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        // _id sẽ chứa trực tiếp lang_id từ MySQL
    },
    title: {
        type: String,
        required: true,
        unique: true,
    }
}, { timestamps: true });

export default mongoose.model('Language', languageSchema);
