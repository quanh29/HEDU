import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Verify configuration
const verifyCloudinaryConfig = () => {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
        console.warn('⚠️ CLOUDINARY_CLOUD_NAME is not set');
        return false;
    }
    if (!process.env.CLOUDINARY_API_KEY) {
        console.warn('⚠️ CLOUDINARY_API_KEY is not set');
        return false;
    }
    if (!process.env.CLOUDINARY_API_SECRET) {
        console.warn('⚠️ CLOUDINARY_API_SECRET is not set');
        return false;
    }
    
    console.log('✅ Cloudinary configured successfully');
    console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    return true;
};

// Verify on import
verifyCloudinaryConfig();

export default cloudinary;
