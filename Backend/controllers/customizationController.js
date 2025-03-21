import Customization from '../models/Customization.js';
import { asyncHandler } from '../utils/errorHandler.js';
import mongoose from 'mongoose';
import imageService from '../services/image.service.js';

// Get all customizations
export const getAllCustomizations = asyncHandler(async (req, res) => {
    const customizations = await Customization.find({});
    res.status(200).json(customizations);
});

// Get a customization by ID
export const getCustomizationById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid customization ID format' });
    }
    
    const customization = await Customization.findById(id);
    
    if (!customization) {
        return res.status(404).json({ message: 'Customization not found' });
    }
    
    res.status(200).json(customization);
});

// Create a new customization
export const createCustomization = asyncHandler(async (req, res) => {
    const { designId, userId, size, color, quantity, textContent, placement } = req.body;
    
    // Validate required fields
    if (!designId || !size || !color) {
        return res.status(400).json({ message: 'Design ID, size, and color are required' });
    }
    
    // Handle custom image upload if provided
    let customImageUrl = null;
    let previewImageUrl = null;
    
    if (req.files && req.files.length > 0) {
        // Process the custom image upload
        const customImageFile = req.files.find(file => file.fieldname === 'customImage');
        
        if (customImageFile) {
            try {
                // Process and store the custom image
                const imageResult = await imageService.processAndStoreImage(customImageFile, {
                    createThumbnail: false,
                    folder: 'customizations',
                    width: 1200 // Higher resolution for custom images
                });
                
                customImageUrl = imageResult.url;
                console.log('Custom image processed and stored:', customImageUrl);
            } catch (error) {
                console.error('Custom image processing error:', error);
                return res.status(500).json({ 
                    message: 'Error processing custom image',
                    error: error.message
                });
            }
        }
        
        // Process preview image if provided
        const previewImageFile = req.files.find(file => file.fieldname === 'previewImage');
        
        if (previewImageFile) {
            try {
                // Process and store the preview image
                const previewResult = await imageService.processAndStoreImage(previewImageFile, {
                    createThumbnail: true,
                    folder: 'previews'
                });
                
                previewImageUrl = previewResult.url;
                console.log('Preview image processed and stored:', previewImageUrl);
            } catch (error) {
                console.error('Preview image processing error:', error);
                // Continue without preview image if it fails
            }
        }
    }
    
    // Create the customization
    const customization = await Customization.create({
        designId,
        userId: userId || null, // Anonymous customizations are allowed
        size,
        color,
        quantity: quantity || 1,
        textContent: textContent || null,
        placement: placement || 'center',
        customImageUrl,
        previewImageUrl,
        status: 'draft'
    });
    
    res.status(201).json(customization);
});

// Update a customization by ID
export const updateCustomization = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { designId, userId, size, color, quantity, textContent, placement, status } = req.body;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid customization ID format' });
    }
    
    // Find the customization
    const customization = await Customization.findById(id);
    
    if (!customization) {
        return res.status(404).json({ message: 'Customization not found' });
    }
    
    // Handle custom image update if provided
    let customImageUrl = customization.customImageUrl;
    let previewImageUrl = customization.previewImageUrl;
    
    if (req.files && req.files.length > 0) {
        // Process custom image update
        const customImageFile = req.files.find(file => file.fieldname === 'customImage');
        
        if (customImageFile) {
            // Delete old custom image if it exists
            try {
                if (customization.customImageUrl) {
                    await imageService.deleteImage(customization.customImageUrl);
                }
            } catch (error) {
                console.warn('Error deleting old custom image:', error.message);
            }
            
            // Process and store new custom image
            try {
                const imageResult = await imageService.processAndStoreImage(customImageFile, {
                    createThumbnail: false,
                    folder: 'customizations',
                    width: 1200
                });
                
                customImageUrl = imageResult.url;
            } catch (error) {
                console.error('Custom image processing error:', error);
                return res.status(500).json({ 
                    message: 'Error processing custom image',
                    error: error.message
                });
            }
        }
        
        // Process preview image update if provided
        const previewImageFile = req.files.find(file => file.fieldname === 'previewImage');
        
        if (previewImageFile) {
            // Delete old preview image if it exists
            try {
                if (customization.previewImageUrl) {
                    await imageService.deleteImage(customization.previewImageUrl);
                }
            } catch (error) {
                console.warn('Error deleting old preview image:', error.message);
            }
            
            // Process and store new preview image
            try {
                const previewResult = await imageService.processAndStoreImage(previewImageFile, {
                    createThumbnail: true,
                    folder: 'previews'
                });
                
                previewImageUrl = previewResult.url;
            } catch (error) {
                console.error('Preview image processing error:', error);
                // Continue without updating preview image if it fails
            }
        }
    }
    
    // Update the customization
    const updatedCustomization = await Customization.findByIdAndUpdate(
        id,
        {
            designId: designId || customization.designId,
            userId: userId !== undefined ? userId : customization.userId,
            size: size || customization.size,
            color: color || customization.color,
            quantity: quantity !== undefined ? quantity : customization.quantity,
            textContent: textContent !== undefined ? textContent : customization.textContent,
            placement: placement || customization.placement,
            customImageUrl,
            previewImageUrl,
            status: status || customization.status,
            updatedAt: Date.now()
        },
        { new: true }
    );
    
    res.status(200).json(updatedCustomization);
});

// Delete a customization by ID
export const deleteCustomization = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid customization ID format' });
    }
    
    // Find the customization
    const customization = await Customization.findById(id);
    
    if (!customization) {
        return res.status(404).json({ message: 'Customization not found' });
    }
    
    // Delete associated images
    try {
        if (customization.customImageUrl) {
            await imageService.deleteImage(customization.customImageUrl);
        }
        
        if (customization.previewImageUrl) {
            await imageService.deleteImage(customization.previewImageUrl);
        }
    } catch (error) {
        console.warn('Error deleting customization images:', error.message);
    }
    
    // Delete the customization from the database
    await Customization.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Customization deleted successfully' });
});

// Get customizations by user ID
export const getCustomizationsByUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    
    // Validate user ID
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }
    
    const customizations = await Customization.find({ userId });
    
    res.status(200).json(customizations);
});

// Generate a preview image for a customization
export const generatePreview = asyncHandler(async (req, res) => {
    const { customizationId } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(customizationId)) {
        return res.status(400).json({ message: 'Invalid customization ID format' });
    }
    
    // Find the customization
    const customization = await Customization.findById(customizationId);
    
    if (!customization) {
        return res.status(404).json({ message: 'Customization not found' });
    }
    
    // Check if preview file was uploaded
    if (!req.file) {
        return res.status(400).json({ message: 'Preview image is required' });
    }
    
    try {
        // Process and store the preview image
        const imageResult = await imageService.processAndStoreImage(req.file, {
            createThumbnail: true,
            folder: 'previews',
            filename: `preview-${customizationId}-${Date.now()}`
        });
        
        // Delete old preview image if it exists
        if (customization.previewImageUrl) {
            try {
                await imageService.deleteImage(customization.previewImageUrl);
            } catch (error) {
                console.warn('Error deleting old preview image:', error.message);
            }
        }
        
        // Update the customization with the new preview image
        const updatedCustomization = await Customization.findByIdAndUpdate(
            customizationId,
            {
                previewImageUrl: imageResult.url,
                updatedAt: Date.now()
            },
            { new: true }
        );
        
        res.status(200).json({
            message: 'Preview generated successfully',
            previewUrl: imageResult.url,
            thumbnailUrl: imageResult.thumbnail?.url || null,
            customization: updatedCustomization
        });
    } catch (error) {
        console.error('Preview generation error:', error);
        res.status(500).json({ 
            message: 'Error generating preview',
            error: error.message
        });
    }
}); 