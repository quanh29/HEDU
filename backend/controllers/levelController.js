import pool from '../config/mysql.js';

// GET /api/levels
export const getLevels = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT lv_id, title FROM Levels ORDER BY lv_id');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching levels:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default { getLevels };
