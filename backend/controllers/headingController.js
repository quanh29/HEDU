import pool from '../config/mysql.js';

// Get all headings with their categories
export const getAllHeadingsWithCategories = async (req, res) => {
    try {
        const query = `
            SELECT 
                h.heading_id,
                h.title,
                h.sub_title,
                c.category_id,
                c.title as category_title
            FROM headings h
            LEFT JOIN heading_category hc ON h.heading_id = hc.heading_id
            LEFT JOIN categories c ON hc.category_id = c.category_id
            ORDER BY h.heading_id, c.title
        `;
        
        const [rows] = await pool.query(query);
        
        // Group categories by heading
        const headingsMap = {};
        
        rows.forEach(row => {
            if (!headingsMap[row.heading_id]) {
                headingsMap[row.heading_id] = {
                    heading_id: row.heading_id,
                    title: row.title,
                    sub_title: row.sub_title,
                    categories: []
                };
            }
            
            if (row.category_id) {
                headingsMap[row.heading_id].categories.push({
                    category_id: row.category_id,
                    title: row.category_title
                });
            }
        });
        
        const headings = Object.values(headingsMap);
        
        res.status(200).json(headings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all categories
export const getAllCategories = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM categories ORDER BY title');
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
