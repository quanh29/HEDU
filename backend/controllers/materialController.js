import Material from "../models/Material.js";
import MaterialDraft from "../models/MaterialDraft.js";
import mongoose from 'mongoose';

// Tạo material mới
export const addMaterial = async (req, res) => {
    const { lessonId, title, contentUrl, order } = req.body;

    if (!lessonId || !title || !contentUrl) {
        return res.status(400).json({ message: 'lessonId, title, and contentUrl are required' });
    }

    try {
        // Check if it's a LessonDraft (draft system)
        const LessonDraft = (await import('../models/LessonDraft.js')).default;
        const draftLesson = await LessonDraft.findById(lessonId);
        
        if (draftLesson) {
            // Create MaterialDraft for draft system
            const newMaterialDraft = new MaterialDraft({
                courseDraftId: draftLesson.courseDraftId,
                draftLessonId: draftLesson._id,
                title,
                contentUrl,
                order: order || 1,
                status: 'draft',
                changeType: 'new'
            });

            await newMaterialDraft.save();

            // Link to lesson draft
            draftLesson.draftMaterialId = newMaterialDraft._id;
            await draftLesson.save();

            // Add to CourseDraft.draftMaterials array
            const CourseDraft = mongoose.model('CourseDraft');
            const courseDraft = await CourseDraft.findById(draftLesson.courseDraftId);
            if (courseDraft) {
                courseDraft.draftMaterials.push(newMaterialDraft._id);
                await courseDraft.save();
            }

            console.log(`✅ Created MaterialDraft ${newMaterialDraft._id} for LessonDraft ${lessonId}`);

            return res.status(201).json({
                success: true,
                isDraft: true,
                data: newMaterialDraft
            });
        }

        // Fallback to published Lesson (old system)
        const Lesson = (await import('../models/Lesson.js')).default;
        const lesson = await Lesson.findById(lessonId);
        
        if (lesson) {
            // Create published Material (backward compatibility)
            const newMaterial = new Material({
                section: lesson.section,
                title,
                contentUrl,
                order: order || 1,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            await newMaterial.save();

            console.log(`✅ Created published Material ${newMaterial._id} for Lesson ${lessonId}`);

            return res.status(201).json({
                success: true,
                isDraft: false,
                data: newMaterial
            });
        }

        return res.status(404).json({ 
            success: false,
            message: 'Lesson not found' 
        });

    } catch (error) {
        console.error('Error creating material:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error creating material', 
            error: error.message 
        });
    }
};

// Lấy material theo ID (protected - có đầy đủ thông tin)
export const getMaterialById = async (req, res) => {
    const { materialId } = req.params;

    try {
        // Try MaterialDraft first
        let material = await MaterialDraft.findById(materialId);
        let isDraft = true;

        if (!material) {
            // Fallback to published Material
            material = await Material.findById(materialId);
            isDraft = false;
        }

        if (!material) {
            return res.status(404).json({ 
                success: false,
                message: 'Material not found' 
            });
        }

        res.status(200).json({
            success: true,
            isDraft,
            data: material
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
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
        // Try MaterialDraft first
        let material = await MaterialDraft.findById(materialId);
        let isDraft = true;

        if (!material) {
            // Fallback to published Material
            material = await Material.findById(materialId);
            isDraft = false;
        }

        if (!material) {
            return res.status(404).json({ 
                success: false,
                message: 'Material not found' 
            });
        }

        if (title) material.title = title;
        if (contentUrl) material.contentUrl = contentUrl;
        if (order) material.order = order;
        
        if (!isDraft) {
            material.updatedAt = new Date();
        } else if (material.changeType === 'unchanged') {
            material.changeType = 'modified';
        }

        const updatedMaterial = await material.save();

        console.log(`✅ Updated ${isDraft ? 'MaterialDraft' : 'Material'}: ${materialId}`);

        res.status(200).json({
            success: true,
            isDraft,
            data: updatedMaterial
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false,
            message: 'Error updating material', 
            error: error.message 
        });
    }
};

// Xóa material
export const deleteMaterial = async (req, res) => {
    const { materialId } = req.params;

    try {
        // Try MaterialDraft first
        let material = await MaterialDraft.findById(materialId);
        let isDraft = true;

        if (!material) {
            // Fallback to published Material
            material = await Material.findById(materialId);
            isDraft = false;
        }

        if (!material) {
            return res.status(404).json({ 
                success: false,
                message: 'Material not found' 
            });
        }

        // Remove from CourseDraft.draftMaterials if draft
        if (isDraft && material.courseDraftId) {
            const CourseDraft = mongoose.model('CourseDraft');
            const courseDraft = await CourseDraft.findById(material.courseDraftId);
            if (courseDraft) {
                courseDraft.draftMaterials = courseDraft.draftMaterials.filter(
                    id => id.toString() !== materialId
                );
                await courseDraft.save();
            }
        }

        // Delete material
        if (isDraft) {
            await MaterialDraft.findByIdAndDelete(materialId);
        } else {
            await Material.findByIdAndDelete(materialId);
        }

        console.log(`✅ Deleted ${isDraft ? 'MaterialDraft' : 'Material'}: ${materialId}`);

        res.status(200).json({ 
            success: true,
            message: 'Material deleted successfully',
            isDraft
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false,
            message: 'Error deleting material', 
            error: error.message 
        });
    }
};
