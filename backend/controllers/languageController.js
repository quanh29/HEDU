import Language from '../models/Language.js';

// GET /api/languages
export const getLanguages = async (req, res) => {
  try {
    const languages = await Language.find().sort({ title: 1 }).lean();
    
    // Convert _id to lang_id for compatibility
    const result = languages.map(lang => ({
      lang_id: lang._id,
      title: lang.title
    }));
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default { getLanguages };
