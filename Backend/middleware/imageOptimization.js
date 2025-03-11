import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to import Sharp, but provide a fallback if it's not available
let sharp;
let sharpAvailable = true;
try {
    sharp = await import('sharp');
    console.log('Sharp module loaded in imageOptimization middleware');
} catch (e) {
    console.warn('Warning: Sharp module not available in imageOptimization middleware. Using fallback.');
    sharpAvailable = false;
    // Create a mock Sharp for fallback
    sharp = {
        default: (input) => ({
            resize: () => sharp.default(input),
            jpeg: () => sharp.default(input),
            toFile: async (output) => {
                // Simple file copy as fallback when Sharp is not available
                try {
                    fs.copyFileSync(input, output);
                    return { width: 0, height: 0, size: fs.statSync(output).size };
                } catch (err) {
                    console.error('Error in Sharp fallback:', err);
                    throw err;
                }
            }
        })
    };
}

// This middleware optimizes product images (with fallback if Sharp is unavailable)
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
        
        if (sharpAvailable) {
            try {
                // Optimize main image with Sharp
                await sharp.default(req.file.path)
                    .resize(800) // Resize to 800px width
                    .jpeg({ quality: 80 }) // Compress with 80% quality
                    .toFile(mainImagePath);
                    
                // Create thumbnail with Sharp
                await sharp.default(req.file.path)
                    .resize(200) // Resize to 200px width for thumbnail
                    .jpeg({ quality: 70 }) // Compress with 70% quality
                    .toFile(thumbnailPath);
            } catch (sharpError) {
                console.error('Sharp processing error, using fallback:', sharpError);
                // Fallback to simple file copy
                fs.copyFileSync(req.file.path, mainImagePath);
                fs.copyFileSync(req.file.path, thumbnailPath);
            }
        } else {
            // Fallback when Sharp is not available - just copy the files
            console.log('Using fallback file copy for image optimization');
            fs.copyFileSync(req.file.path, mainImagePath);
            fs.copyFileSync(req.file.path, thumbnailPath);
        }
            
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
        // Don't fail the request if image optimization fails
        req.optimizedImage = {
            main: {
                filename: req.file.filename,
                path: req.file.path
            },
            thumbnail: {
                filename: req.file.filename,
                path: req.file.path
            }
        };
        next();
    }
};

export { optimizeProductImage }; 