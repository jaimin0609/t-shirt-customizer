import Design from '../models/Design.js';
import { asyncHandler } from '../utils/errorHandler.js';
import mongoose from 'mongoose';
import imageService from '../services/image.service.js';

// Get all designs
export const getAllDesigns = asyncHandler(async (req, res) => {
    const designs = await Design.find({});
    res.status(200).json(designs);
});

// Get a design by ID
export const getDesignById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid design ID format' });
    }
    
    const design = await Design.findById(id);
    
    if (!design) {
        return res.status(404).json({ message: 'Design not found' });
    }
    
    res.status(200).json(design);
});

// Create a new design
export const createDesign = asyncHandler(async (req, res) => {
    const { name, description, category, price } = req.body;
    
    if (!name || !category) {
        return res.status(400).json({ message: 'Name and category are required' });
    }
    
    // Handle image upload if provided
    let imageUrl = null;
    let thumbnailUrl = null;
    
    if (req.file) {
        // Use the new image service to process and store the image
        try {
            const imageResult = await imageService.processAndStoreImage(req.file, {
                createThumbnail: true
            });
            
            imageUrl = imageResult.url;
            thumbnailUrl = imageResult.thumbnail?.url || null;
            
            console.log('Image processed and stored:', imageUrl);
        } catch (error) {
            console.error('Image processing error:', error);
            return res.status(500).json({ 
                message: 'Error processing image',
                error: error.message
            });
        }
    }
    
    // Create the design
    const design = await Design.create({
        name,
        description,
        category,
        price: price || 0,
        imageUrl,
        thumbnailUrl
    });
    
    res.status(201).json(design);
});

// Update a design by ID
export const updateDesign = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, category, price } = req.body;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid design ID format' });
    }
    
    // Find the design
    const design = await Design.findById(id);
    
    if (!design) {
        return res.status(404).json({ message: 'Design not found' });
    }
    
    // Handle image update if provided
    let imageUrl = design.imageUrl;
    let thumbnailUrl = design.thumbnailUrl;
    
    if (req.file) {
        // Delete old images if they exist
        try {
            if (design.imageUrl) {
                await imageService.deleteImage(design.imageUrl);
            }
        } catch (error) {
            console.warn('Error deleting old image:', error.message);
        }
        
        // Process and store new image
        try {
            const imageResult = await imageService.processAndStoreImage(req.file, {
                createThumbnail: true
            });
            
            imageUrl = imageResult.url;
            thumbnailUrl = imageResult.thumbnail?.url || null;
        } catch (error) {
            console.error('Image processing error:', error);
            return res.status(500).json({ 
                message: 'Error processing image',
                error: error.message
            });
        }
    }
    
    // Update the design
    const updatedDesign = await Design.findByIdAndUpdate(
        id,
        {
            name: name || design.name,
            description: description !== undefined ? description : design.description,
            category: category || design.category,
            price: price !== undefined ? price : design.price,
            imageUrl,
            thumbnailUrl,
            updatedAt: Date.now()
        },
        { new: true }
    );
    
    res.status(200).json(updatedDesign);
});

// Delete a design by ID
export const deleteDesign = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid design ID format' });
    }
    
    // Find the design
    const design = await Design.findById(id);
    
    if (!design) {
        return res.status(404).json({ message: 'Design not found' });
    }
    
    // Delete associated images
    try {
        if (design.imageUrl) {
            await imageService.deleteImage(design.imageUrl);
            console.log('Deleted image:', design.imageUrl);
        }
    } catch (error) {
        console.warn('Error deleting design image:', error.message);
    }
    
    // Delete the design from the database
    await Design.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Design deleted successfully' });
});

// Search designs by criteria
export const searchDesigns = asyncHandler(async (req, res) => {
    const { query, category, minPrice, maxPrice, sort } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (query) {
        filter.$or = [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ];
    }
    
    if (category) {
        filter.category = category;
    }
    
    // Handle price range if provided
    if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        
        if (minPrice !== undefined) {
            filter.price.$gte = parseFloat(minPrice);
        }
        
        if (maxPrice !== undefined) {
            filter.price.$lte = parseFloat(maxPrice);
        }
    }
    
    // Build sort object
    let sortOptions = { createdAt: -1 }; // Default: newest first
    
    if (sort) {
        switch (sort) {
            case 'price_asc':
                sortOptions = { price: 1 };
                break;
            case 'price_desc':
                sortOptions = { price: -1 };
                break;
            case 'name_asc':
                sortOptions = { name: 1 };
                break;
            case 'name_desc':
                sortOptions = { name: -1 };
                break;
            case 'oldest':
                sortOptions = { createdAt: 1 };
                break;
            // Default remains newest first
        }
    }
    
    // Execute query with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const designs = await Design.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);
    
    const total = await Design.countDocuments(filter);
    
    res.status(200).json({
        designs,
        pagination: {
            total,
            page,
            pages: Math.ceil(total / limit)
        }
    });
}); 