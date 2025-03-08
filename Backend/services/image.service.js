import sharp from 'sharp';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imageService = {
    async optimizeImage(file, options = {}) {
        const {
            width = 800,
            quality = 80,
            format = 'jpeg'
        } = options;

        try {
            console.log('Optimizing image:', file);
            const optimizedFileName = `${path.parse(file.filename).name}-optimized.${format}`;
            const outputPath = path.join(file.destination, optimizedFileName);
            
            console.log('Output path:', outputPath);

            await sharp(file.path)
                .resize(width, null, {
                    fit: 'contain',
                    withoutEnlargement: true
                })
                .toFormat(format, { quality })
                .toFile(outputPath);

            // Verify file was created
            if (!fs.existsSync(outputPath)) {
                throw new Error('Optimized image was not created');
            }

            console.log('Image optimized successfully:', optimizedFileName);

            return {
                filename: optimizedFileName,
                path: outputPath
            };
        } catch (error) {
            console.error('Image optimization error:', error);
            throw error;
        }
    },

    async generateThumbnail(file) {
        try {
            const thumbnailFileName = `${path.parse(file.filename).name}-thumb.jpeg`;
            const outputPath = path.join(file.destination, thumbnailFileName);

            await sharp(file.path)
                .resize(200, 200, {
                    fit: 'cover',
                    position: 'center'
                })
                .toFormat('jpeg', { quality: 70 })
                .toFile(outputPath);

            return {
                filename: thumbnailFileName,
                path: outputPath
            };
        } catch (error) {
            console.error('Thumbnail generation error:', error);
            throw error;
        }
    }
};

export default imageService; 