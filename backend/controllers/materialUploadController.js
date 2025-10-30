import Material from '../models/Material.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads/materials');
        
        // Tạo folder nếu chưa tồn tại
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Tạo unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Chỉ cho phép các file type nhất định
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX allowed'), false);
    }
};

export const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max
    }
});

/**
 * Upload material file
 */
export const uploadMaterial = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { lessonTitle, sectionId } = req.body;

        // Tạo URL cho file
        const fileUrl = `/uploads/materials/${req.file.filename}`;

        // Lưu thông tin material vào database
        const material = new Material({
            section: sectionId,
            title: lessonTitle,
            contentUrl: fileUrl,
            order: 0 // Sẽ được cập nhật sau
        });

        await material.save();

        res.status(200).json({
            message: 'Material uploaded successfully',
            materialId: material._id,
            fileUrl: fileUrl,
            fileName: req.file.originalname
        });
    } catch (error) {
        console.error('Error uploading material:', error);
        
        // Xóa file nếu có lỗi
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ 
            message: 'Failed to upload material', 
            error: error.message 
        });
    }
};

/**
 * Delete material
 */
export const deleteMaterial = async (req, res) => {
    const { materialId } = req.params;

    try {
        const material = await Material.findById(materialId);
        
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        // Xóa file từ disk
        const filePath = path.join(__dirname, '../../', material.contentUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Xóa record từ database
        await Material.findByIdAndDelete(materialId);

        res.status(200).json({ message: 'Material deleted successfully' });
    } catch (error) {
        console.error('Error deleting material:', error);
        res.status(500).json({ 
            message: 'Failed to delete material', 
            error: error.message 
        });
    }
};
