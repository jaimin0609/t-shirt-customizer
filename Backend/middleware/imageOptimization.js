import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This middleware optimizes product images
const optimizeProductImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return next();
        }

        const uploadDir = path.join(__dirname, '../public/uploads/products');
        
        // Ensure directory exists
        try {
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
        } catch (dirError) {
            console.error('Error creating directory:', dirError);
            return next(new Error('Failed to create upload directory'));
        }

        const filename = path.basename(req.file.filename, path.extname(req.file.filename));
        const mainImageFilename = `${filename}-optimized${path.extname(req.file.filename)}`;
        const thumbnailFilename = `${filename}-thumbnail${path.extname(req.file.filename)}`;
        
        const mainImagePath = path.join(uploadDir, mainImageFilename);
        const thumbnailPath = path.join(uploadDir, thumbnailFilename);
        
        // Optimize main image
        await sharp(req.file.path)
            .resize(800) // Resize to 800px width
            .jpeg({ quality: 80 }) // Compress with 80% quality
            .toFile(mainImagePath);
            
        // Create thumbnail
        await sharp(req.file.path)
            .resize(200) // Resize to 200px width for thumbnail
            .jpeg({ quality: 70 }) // Compress with 70% quality
            .toFile(thumbnailPath);
            
        // Delete original file
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error('Error deleting original file:', unlinkError);
            // Continue even if we can't delete the original
        }
        
        // Add optimized image info to request
        req.optimizedImage = {
            main: {
                filename: mainImageFilename,
                path: mainImagePath
            },
            thumbnail: {
                filename: thumbnailFilename,
                path: thumbnailPath
            }
        };
        
        next();
    } catch (error) {
        console.error('Image optimization error:', error);
        return res.status(500).json({ 
            message: 'Error processing image', 
            error: error.message 
        });
    }
};

export { optimizeProductImage }; 