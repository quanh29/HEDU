import Level from '../models/Level.js';

// GET /api/levels
export const getLevels = async (req, res) => {
  try {
    const levels = await Level.find().sort({ _id: 1 }).lean();
    
    // Convert _id to lv_id for compatibility
    const result = levels.map(level => ({
      lv_id: level._id,
      title: level.title
    }));
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching levels:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default { getLevels };
