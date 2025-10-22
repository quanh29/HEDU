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
    createdAt: {
        type: Date,
        required: true,
    },
    updatedAt: {
        type: Date,
        required: true,
    },
});

const Material = mongoose.model("Material", materialSchema);

export default Material;
