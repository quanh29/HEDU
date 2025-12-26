import Heading from '../models/Heading.js';
import Category from '../models/Category.js';
import HeadingCategory from '../models/HeadingCategory.js';

// Get all headings with their categories
export const getAllHeadingsWithCategories = async (req, res) => {
    try {
        // Get all headings
        const headings = await Heading.find().lean();
        
        // Get all heading-category mappings
        const headingCategories = await HeadingCategory.find()
            .populate('category_id', 'title')
            .lean();
        
        // Group categories by heading
        const headingsMap = {};
        
        headings.forEach(heading => {
            headingsMap[heading._id] = {
                heading_id: heading._id,
                title: heading.title,
                sub_title: heading.sub_title,
                categories: []
            };
        });
        
        headingCategories.forEach(hc => {
            if (headingsMap[hc.heading_id] && hc.category_id) {
                headingsMap[hc.heading_id].categories.push({
                    category_id: hc.category_id._id || hc.category_id,
                    title: hc.category_id.title || ''
                });
            }
        });
        
        const result = Object.values(headingsMap);
        
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all categories
export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ title: 1 }).lean();
        
        // Convert _id to category_id for compatibility
        const result = categories.map(cat => ({
            category_id: cat._id,
            title: cat.title
        }));
        
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
