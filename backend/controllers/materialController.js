import Material from "../models/Material.js";

// Tạo material mới
export const addMaterial = async (req, res) => {
    const { section, title, contentUrl, order } = req.body;

    if (!section || !title || !contentUrl) {
        return res.status(400).json({ message: 'section, title, and contentUrl are required' });
    }

    try {
        const newMaterial = new Material({
            section,
            title,
            contentUrl,
            order: order || 1,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const savedMaterial = await newMaterial.save();
        res.status(201).json(savedMaterial);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating material', error: error.message });
    }
};

// Lấy material theo ID (protected - có đầy đủ thông tin)
export const getMaterialById = async (req, res) => {
    const { materialId } = req.params;

    try {
        const material = await Material.findById(materialId);
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }
        res.status(200).json(material);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Lấy tất cả materials theo section ID (public - không có contentUrl)
export const getMaterialsBySectionId = async (req, res) => {
    const { sectionId } = req.params;

    try {
        const materials = await Material.find({ section: sectionId }).sort({ order: 1 }).lean();
        
        if (!materials || materials.length === 0) {
            return res.status(404).json({ message: 'No materials found for this section' });
        }

        // Loại bỏ contentUrl cho route public
        const publicMaterials = materials.map(material => ({
            _id: material._id,
            section: material.section,
            title: material.title,
            order: material.order
        }));

        res.status(200).json(publicMaterials);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Cập nhật material
export const updateMaterial = async (req, res) => {
    const { materialId } = req.params;
    const { title, contentUrl, order } = req.body;

    try {
        const material = await Material.findById(materialId);
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        if (title) material.title = title;
        if (contentUrl) material.contentUrl = contentUrl;
        if (order) material.order = order;
        material.updatedAt = new Date();

        const updatedMaterial = await material.save();
        res.status(200).json(updatedMaterial);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating material', error: error.message });
    }
};

// Xóa material
export const deleteMaterial = async (req, res) => {
    const { materialId } = req.params;

    try {
        const material = await Material.findByIdAndDelete(materialId);
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }
        res.status(200).json({ message: 'Material deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting material', error: error.message });
    }
};
