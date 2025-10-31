import pool from '../config/mysql.js';

// GET /api/languages
export const getLanguages = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT lang_id, title FROM Languages ORDER BY title');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default { getLanguages };
