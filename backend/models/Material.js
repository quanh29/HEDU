import mongoose from "mongoose";

const materialSchema = new mongoose.Schema({
    section: {
        type: String,
        ref: 'Section',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    contentUrl: {
        type: String,
        required: true,
    },
    order: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true  // Automatically manage createdAt and updatedAt
});

const Material = mongoose.model("Material", materialSchema);

export default Material;
