import mongoose from "mongoose";

const materialSchema = new mongoose.Schema({
    section: {
        type: String,
        ref: 'Section',
        required: false, // Optional for backward compatibility
    },
    lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: false, // Will be required for new structure
    },
    title: {
        type: String,
        required: false, // Sẽ set khi link với lesson
    },
    contentUrl: { // Lưu public ID của Cloudinary
        type: String,
        required: true,
    },
    order: {
        type: Number,
        required: false,
    },
    resource_type: {
        type: String,
        default: 'raw',
    },
    originalFilename: {
        type: String,
        required: false,
    },
    fileSize: {
        type: Number,
        required: false,
    },
    extension: {
        type: String,
        required: false, // Extension của file (pdf, docx, xlsx, etc.)
    },
    isTemporary: {
        type: Boolean,
        default: true, // Material tạm thời chưa được link với course
    }
}, {
    timestamps: true  // Automatically manage createdAt and updatedAt
});

const Material = mongoose.model("Material", materialSchema);

export default Material;
