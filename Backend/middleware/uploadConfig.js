import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a function to configure upload directory
export const createUploadConfig = (folderName) => {
    const uploadDir = path.join(__dirname, `../public/uploads/${folderName}`);

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Configure multer storage
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `${folderName}-${uniqueSuffix}${path.extname(file.originalname)}`);
        }
    });

    // Configure multer upload
    return multer({
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
        fileFilter: function (req, file, cb) {
            const filetypes = /jpeg|jpg|png|gif/;
            const mimetype = filetypes.test(file.mimetype);
            const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
            
            if (mimetype && extname) {
                return cb(null, true);
            }
            cb(new Error('Only image files (jpg, jpeg, png, gif) are allowed!'));
        }
    });
};

// Create specific upload middlewares
export const productUpload = createUploadConfig('products');
export const profileUpload = createUploadConfig('profiles');
export const customUpload = createUploadConfig('custom'); 