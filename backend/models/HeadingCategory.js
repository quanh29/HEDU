import mongoose from "mongoose";

const headingCategorySchema = new mongoose.Schema({
    heading_id: {
        type: String,
        required: true,
        ref: 'Heading'
    },
    category_id: {
        type: String,
        required: true,
        ref: 'Category'
    }
}, { timestamps: true });

// Composite index for unique constraint
headingCategorySchema.index({ heading_id: 1, category_id: 1 }, { unique: true });

export default mongoose.model('HeadingCategory', headingCategorySchema);
