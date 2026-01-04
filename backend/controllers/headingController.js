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

// Get all categories with pagination
export const getAllCategories = async (req, res) => {
    try {
        const { page = 1, limit = 100, search = '' } = req.query;
        
        const query = search ? { title: { $regex: search, $options: 'i' } } : {};
        
        const total = await Category.countDocuments(query);
        const categories = await Category.find(query)
            .sort({ title: 1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .lean();
        
        // Convert _id to category_id for compatibility
        const result = categories.map(cat => ({
            category_id: cat._id,
            title: cat.title
        }));

        res.status(200).json({
            success: true,
            data: result,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * ADMIN FUNCTIONS
 */

// Get statistics for admin
export const getCategoryStatistics = async (req, res) => {
    try {
        const totalHeadings = await Heading.countDocuments();
        const totalCategories = await Category.countDocuments();
        const totalMappings = await HeadingCategory.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                totalHeadings,
                totalCategories,
                totalMappings
            }
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
};

// Create new heading
export const createHeading = async (req, res) => {
    try {
        const { title, sub_title } = req.body;

        if (!title || !sub_title) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Generate UUID for _id
        const { randomUUID } = await import('crypto');
        const heading = new Heading({
            _id: randomUUID(),
            title,
            sub_title
        });

        await heading.save();

        res.status(201).json({
            success: true,
            message: 'Heading created successfully',
            data: heading
        });
    } catch (error) {
        console.error('Error creating heading:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create heading',
            error: error.message
        });
    }
};

// Update heading
export const updateHeading = async (req, res) => {
    try {
        const { headingId } = req.params;
        const { title, sub_title } = req.body;

        const heading = await Heading.findById(headingId);
        if (!heading) {
            return res.status(404).json({
                success: false,
                message: 'Heading not found'
            });
        }

        if (title) heading.title = title;
        if (sub_title) heading.sub_title = sub_title;

        await heading.save();

        res.status(200).json({
            success: true,
            message: 'Heading updated successfully',
            data: heading
        });
    } catch (error) {
        console.error('Error updating heading:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update heading',
            error: error.message
        });
    }
};

// Delete heading
export const deleteHeading = async (req, res) => {
    try {
        const { headingId } = req.params;

        const heading = await Heading.findById(headingId);
        if (!heading) {
            return res.status(404).json({
                success: false,
                message: 'Heading not found'
            });
        }

        // Delete all heading-category mappings
        await HeadingCategory.deleteMany({ heading_id: headingId });

        // Delete heading
        await Heading.findByIdAndDelete(headingId);

        res.status(200).json({
            success: true,
            message: 'Heading deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting heading:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete heading',
            error: error.message
        });
    }
};

// Create new category
export const createCategory = async (req, res) => {
    try {
        const { title } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Generate UUID for _id
        const { randomUUID } = await import('crypto');
        const category = new Category({
            _id: randomUUID(),
            title
        });

        await category.save();

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });
    } catch (error) {
        console.error('Error creating category:', error);
        // Handle unique constraint error from mongoose
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Category title already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to create category',
            error: error.message
        });
    }
};

// Update category
export const updateCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { title } = req.body;

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        if (title) {
            // Check if new title already exists
            const existingTitle = await Category.findOne({ 
                title, 
                _id: { $ne: categoryId } 
            });
            if (existingTitle) {
                return res.status(400).json({
                    success: false,
                    message: 'Category title already exists'
                });
            }
            category.title = title;
        }

        await category.save();

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update category',
            error: error.message
        });
    }
};

// Delete category
export const deleteCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Check if category is used in any heading
        const usageCount = await HeadingCategory.countDocuments({ category_id: categoryId });
        if (usageCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete category that is assigned to headings'
            });
        }

        await Category.findByIdAndDelete(categoryId);

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete category',
            error: error.message
        });
    }
};

// Add category to heading
export const addCategoryToHeading = async (req, res) => {
    try {
        const { headingId, categoryId } = req.body;

        if (!headingId || !categoryId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Check if heading exists
        const heading = await Heading.findById(headingId);
        if (!heading) {
            return res.status(404).json({
                success: false,
                message: 'Heading not found'
            });
        }

        // Check if category exists
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Check if mapping already exists
        const existingMapping = await HeadingCategory.findOne({
            heading_id: headingId,
            category_id: categoryId
        });

        if (existingMapping) {
            return res.status(400).json({
                success: false,
                message: 'Category already added to this heading'
            });
        }

        const headingCategory = new HeadingCategory({
            heading_id: headingId,
            category_id: categoryId
        });

        await headingCategory.save();

        res.status(201).json({
            success: true,
            message: 'Category added to heading successfully',
            data: headingCategory
        });
    } catch (error) {
        console.error('Error adding category to heading:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add category to heading',
            error: error.message
        });
    }
};

// Remove category from heading
export const removeCategoryFromHeading = async (req, res) => {
    try {
        const { headingId, categoryId } = req.params;

        const result = await HeadingCategory.findOneAndDelete({
            heading_id: headingId,
            category_id: categoryId
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Mapping not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Category removed from heading successfully'
        });
    } catch (error) {
        console.error('Error removing category from heading:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove category from heading',
            error: error.message
        });
    }
};
