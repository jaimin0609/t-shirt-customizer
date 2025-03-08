import { useState, useEffect, useRef, useContext } from 'react';
import 'fabric/dist/fabric';
const fabric = window.fabric;
import { HiX, HiUpload, HiTrash, HiDuplicate } from 'react-icons/hi';
import { FiMove, FiRotateCw, FiLayers, FiType, FiArrowUp, FiArrowDown, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { tshirtTemplate } from '../../assets/tshirtTemplate';
import { useCart } from '../../contexts/CartContext';
import { AuthContext } from '../../contexts/AuthContext';
import { CartContext } from '../../contexts/CartContext';

const CustomizationModal = ({ product, onClose }) => {
    const [isBackView, setIsBackView] = useState(false);
    const [frontCanvas, setFrontCanvas] = useState(null);
    const [backCanvas, setBackCanvas] = useState(null);
    const [activeCanvas, setActiveCanvas] = useState(null);
    const [selectedColor, setSelectedColor] = useState('white');
    const [selectedSize, setSelectedSize] = useState('M');
    const [customText, setCustomText] = useState('');
    const [textColor, setTextColor] = useState('#000000');
    const [fontSize, setFontSize] = useState(24);
    const [fontFamily, setFontFamily] = useState('Arial');
    const [uploadedImage, setUploadedImage] = useState(null);
    const [isOutsidePrintArea, setIsOutsidePrintArea] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [frontTshirtObject, setFrontTshirtObject] = useState(null);
    const [backTshirtObject, setBackTshirtObject] = useState(null);
    const frontCanvasRef = useRef(null);
    const backCanvasRef = useRef(null);
    const [activeText, setActiveText] = useState(null);
    const fileInputRef = useRef(null);
    const [printAreaWarning, setPrintAreaWarning] = useState('');
    const [selectedObject, setSelectedObject] = useState(null);
    const [showAdjustControls, setShowAdjustControls] = useState(false);
    const [selectedText, setSelectedText] = useState(null);
    const [isTextEditing, setIsTextEditing] = useState(false);
    const [isTextBox, setIsTextBox] = useState(false);
    const maxTextBoxWidth = 150; // Maximum width for text box (matches print area width)
    let rafId = null;
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const { addToCart } = useCart();
    const { user } = useContext(AuthContext);

    const colors = [
        { id: 'white', name: 'White', hex: '#FFFFFF' },
        { id: 'black', name: 'Black', hex: '#000000' },
        { id: 'navy', name: 'Navy', hex: '#1e3a8a' },
        { id: 'red', name: 'Red', hex: '#dc2626' },
        { id: 'gray', name: 'Gray', hex: '#9ca3af' },
    ];

    const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL'];

    const textColors = [
        { name: 'Black', hex: '#000000' },
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Red', hex: '#FF0000' },
        { name: 'Blue', hex: '#0000FF' },
        { name: 'Gold', hex: '#FFD700' },
    ];

    const fonts = [
        { name: 'Arial', value: 'Arial', style: 'normal' },
        { name: 'Roboto', value: 'Roboto', style: 'modern' },
        { name: 'Montserrat', value: 'Montserrat', style: 'modern' },
        { name: 'Pacifico', value: 'Pacifico', style: 'handwriting' },
        { name: 'Dancing Script', value: 'Dancing Script', style: 'handwriting' },
        { name: 'Oswald', value: 'Oswald', style: 'display' },
        { name: 'Playfair Display', value: 'Playfair Display', style: 'serif' },
        { name: 'Quicksand', value: 'Quicksand', style: 'modern' },
        { name: 'Raleway', value: 'Raleway', style: 'modern' },
        { name: 'Sacramento', value: 'Sacramento', style: 'handwriting' },
        { name: 'Shadows Into Light', value: 'Shadows Into Light', style: 'handwriting' },
        { name: 'Times New Roman', value: 'Times New Roman', style: 'serif' },
        { name: 'Georgia', value: 'Georgia', style: 'serif' },
        { name: 'Verdana', value: 'Verdana', style: 'sans-serif' },
    ];

    // Group fonts by style
    const fontGroups = {
        modern: 'Modern',
        handwriting: 'Handwriting',
        serif: 'Serif',
        display: 'Display',
        normal: 'Basic',
    };

    const fontSizes = [16, 20, 24, 28, 32, 36, 40, 48];

    // Add debounce utility at the top of your component
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // Add these constants at the top
    const PRINT_AREA = {
        width: 150, // 225 - 75
        height: 200, // 300 - 100
    };

    // Add these optimized event handlers
    const setupCanvasListeners = (canvas) => {
        let isDragging = false;
        let rafId = null;

        const updateBoundsCheck = (obj) => {
            if (rafId) return; // Skip if there's already a pending frame

            rafId = requestAnimationFrame(() => {
                const bounds = obj.getBoundingRect();
                const isInside = bounds.left >= 75 &&
                    bounds.top >= 100 &&
                    bounds.left + bounds.width <= 225 &&
                    bounds.top + bounds.height <= 300;

                setPrintAreaWarning(isInside ? '' : 'Warning: Design is outside the print area!');
                rafId = null;
            });
        };

        // Optimize object movement
        canvas.on('object:moving', (e) => {
            if (!isDragging) {
                isDragging = true;
                canvas.renderAll();
            }
            updateBoundsCheck(e.target);
        });

        canvas.on('object:scaling', (e) => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                updateBoundsCheck(e.target);
                canvas.renderAll();
            });
        });

        canvas.on('object:rotating', (e) => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                updateBoundsCheck(e.target);
                canvas.renderAll();
            });
        });

        canvas.on('mouse:up', () => {
            isDragging = false;
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            canvas.renderAll();
        });

        canvas.on('object:modified', () => {
            canvas.renderAll();
        });

        canvas.on('object:selected', (e) => {
            const obj = e.target;
            setSelectedObject(obj);
            setShowAdjustControls(true);

            if (obj && obj.type === 'text') {
                setSelectedText(obj);
                setActiveText(obj);
                setCustomText(obj.text || '');
                setFontFamily(obj.fontFamily || 'Arial');
                setFontSize(obj.fontSize || 24);
                setTextColor(obj.fill || '#000000');
            } else {
                setSelectedText(null);
                setActiveText(null);
            }

            requestAnimationFrame(() => {
                obj.set({
                    borderColor: '#2563eb',
                    cornerColor: '#2563eb',
                    cornerSize: 8,
                    cornerStyle: 'circle',
                    transparentCorners: false,
                    padding: 8
                });
                canvas.renderAll();
            });
        });

        canvas.on('selection:cleared', () => {
            setSelectedObject(null);
            setShowAdjustControls(false);
            setSelectedText(null);
            setActiveText(null);
            setCustomText('');
            setPrintAreaWarning('');
        });

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
        };
    };

    // Update canvas initialization with proper error handling
    useEffect(() => {
        if (!frontCanvasRef.current || !backCanvasRef.current) return;

        const initCanvas = (canvasRef) => {
            const canvas = new fabric.Canvas(canvasRef, {
                width: 300,
                height: 360,
                backgroundColor: '#f9fafb',
                preserveObjectStacking: true,
                selection: true,
                skipTargetFind: false,
                renderOnAddRemove: false,
                enableRetinaScaling: false,
                stateful: false,
                perPixelTargetFind: false
            });

            // Create print area
            createPrintArea(canvas);
            setupCanvasListeners(canvas);
            return canvas;
        };

        const loadTshirtImage = (canvas, setTshirtObject, isBack = false) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.onload = () => {
                    const fabricImage = new fabric.Image(img, {
                        scaleX: 0.9,
                        scaleY: 0.9,
                        selectable: false,
                        evented: false,
                        originX: 'center',
                        originY: 'center',
                        left: canvas.width / 2,
                        top: canvas.height / 2,
                    });

                    canvas.add(fabricImage);
                    setTshirtObject(fabricImage);
                    canvas.renderAll();
                    resolve();
                };

                // Try to use the product's image if available, otherwise fall back to template
                const productImage = isBack
                    ? getImageUrl(product?.images?.[selectedColor]?.back || product?.images?.white?.back)
                    : getImageUrl(product?.images?.[selectedColor]?.front || product?.images?.white?.front);

                img.src = productImage || tshirtTemplate;

                // Handle image loading error
                img.onerror = () => {
                    console.warn('Error loading product image, falling back to template');
                    img.src = tshirtTemplate;
                };
            });
        };

        const initializeCanvases = async () => {
            try {
                const fCanvas = initCanvas(frontCanvasRef.current);
                const bCanvas = initCanvas(backCanvasRef.current);

                await Promise.all([
                    loadTshirtImage(fCanvas, setFrontTshirtObject, false),
                    loadTshirtImage(bCanvas, setBackTshirtObject, true)
                ]);

                setFrontCanvas(fCanvas);
                setBackCanvas(bCanvas);
                setActiveCanvas(fCanvas);
                setIsLoading(false);
            } catch (error) {
                console.error('Error initializing canvases:', error);
                setIsLoading(false);
            }
        };

        initializeCanvases();

        return () => {
            if (frontCanvas) frontCanvas.dispose();
            if (backCanvas) backCanvas.dispose();
        };
    }, []);

    // Toggle between front and back views
    const toggleView = (isFront) => {
        setIsBackView(!isFront);
        setActiveCanvas(isFront ? frontCanvas : backCanvas);
        // Reset active text when switching views
        setActiveText(null);
        setCustomText('');
    };

    // Handle color changes
    const handleColorChange = (colorHex) => {
        setSelectedColor(colorHex);

        const currentTshirt = isBackView ? backTshirtObject : frontTshirtObject;
        const currentCanvas = isBackView ? backCanvas : frontCanvas;

        if (!currentCanvas || !currentTshirt) return;

        currentTshirt.filters = [];

        if (colorHex !== '#FFFFFF') {
            currentTshirt.filters.push(
                new fabric.Image.filters.BlendColor({
                    color: colorHex,
                    mode: 'multiply',
                    alpha: 1
                })
            );
        }

        currentTshirt.applyFilters();
        currentCanvas.renderAll();
    };

    // Handle text updates
    const handleTextUpdate = (type, value) => {
        if (!selectedText || !activeCanvas) return;

        requestAnimationFrame(() => {
            switch (type) {
                case 'text':
                    selectedText.set({
                        text: value,
                        width: PRINT_AREA.width // Ensure text wraps within print area
                    });
                    setCustomText(value);

                    // Auto-adjust size if needed
                    const bounds = selectedText.getBoundingRect();
                    if (bounds.width > PRINT_AREA.width || bounds.height > PRINT_AREA.height) {
                        while (
                            (bounds.width > PRINT_AREA.width || bounds.height > PRINT_AREA.height) &&
                            selectedText.fontSize > 12
                        ) {
                            selectedText.set('fontSize', selectedText.fontSize - 1);
                            bounds.setFromObject(selectedText);
                        }
                    }
                    break;
                case 'font':
                    selectedText.set({ fontFamily: value });
                    setFontFamily(value);
                    break;
                case 'size':
                    const newSize = parseInt(value);
                    selectedText.set({ fontSize: newSize });
                    setFontSize(newSize);
                    // Check if new size causes overflow
                    const newBounds = selectedText.getBoundingRect();
                    if (newBounds.width > PRINT_AREA.width || newBounds.height > PRINT_AREA.height) {
                        selectedText.set('fontSize', selectedText.fontSize - 1);
                    }
                    break;
                case 'color':
                    selectedText.set({ fill: value });
                    setTextColor(value);
                    break;
            }
            activeCanvas.requestRenderAll();
        });
    };

    // Update the addText function while keeping existing styling options
    const addText = () => {
        if (!activeCanvas || !customText.trim()) return;

        const text = new fabric.Text(customText, {
            left: activeCanvas.width / 2,
            top: activeCanvas.height / 2,
            fontSize: fontSize,
            fill: textColor,
            fontFamily: fontFamily,
            originX: 'center',
            originY: 'center',
            hasControls: true,
            hasBorders: true,
            lockUniScaling: true,
        });

        if (activeText) {
            activeCanvas.remove(activeText);
        }

        activeCanvas.add(text);
        activeCanvas.setActiveObject(text);
        setActiveText(text);
        setSelectedText(text);
        activeCanvas.renderAll();
    };

    // Handle image upload
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !activeCanvas) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            fabric.Image.fromURL(event.target.result, (img) => {
                img.scaleToWidth(100);  // Default size
                img.set({
                    left: activeCanvas.width / 2,
                    top: activeCanvas.height / 2,
                    originX: 'center',
                    originY: 'center'
                });
                activeCanvas.add(img);
                activeCanvas.setActiveObject(img);
                // Check bounds immediately after adding image
                const isInside = checkPrintAreaBounds(img);
                setPrintAreaWarning(isInside ? '' : 'Warning: Design is outside the print area!');
                activeCanvas.renderAll();
            });
        };
        reader.readAsDataURL(file);
    };

    // Handle drag events
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    // Handle drop event
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageUpload(e);
        }
    };

    // Optimize the checkPrintAreaBounds function
    const checkPrintAreaBounds = (obj) => {
        if (!obj) return true;

        // Cache the bounding rect to avoid recalculation
        const objBounds = obj.getBoundingRect(true, true);

        // Use constants for print area boundaries
        const PRINT_AREA = {
            left: 75,
            top: 100,
            right: 225,
            bottom: 300
        };

        // Simple bounds check without rounding for better performance
        return (
            objBounds.left >= PRINT_AREA.left &&
            objBounds.top >= PRINT_AREA.top &&
            objBounds.left + objBounds.width <= PRINT_AREA.right &&
            objBounds.top + objBounds.height <= PRINT_AREA.bottom
        );
    };

    // Add object movement listener
    useEffect(() => {
        if (!activeCanvas) return;

        activeCanvas.on('object:moving', checkPrintAreaBounds);
        activeCanvas.on('object:scaling', checkPrintAreaBounds);
        activeCanvas.on('object:rotating', checkPrintAreaBounds);

        return () => {
            activeCanvas.off('object:moving', checkPrintAreaBounds);
            activeCanvas.off('object:scaling', checkPrintAreaBounds);
            activeCanvas.off('object:rotating', checkPrintAreaBounds);
        };
    }, [activeCanvas]);

    // Handle text selection on canvas
    useEffect(() => {
        if (!activeCanvas) return;

        activeCanvas.on('selection:created', (e) => {
            if (e.selected[0] && e.selected[0].type === 'text') {
                const selectedText = e.selected[0];
                setActiveText(selectedText);
                setCustomText(selectedText.text);
                setFontFamily(selectedText.fontFamily);
                setFontSize(selectedText.fontSize);
                setTextColor(selectedText.fill);
            }
        });

        activeCanvas.on('selection:cleared', () => {
            setActiveText(null);
            setCustomText('');
        });

        return () => {
            activeCanvas.off('selection:created');
            activeCanvas.off('selection:cleared');
        };
    }, [activeCanvas]);

    const deleteSelectedObject = () => {
        if (!activeCanvas || !activeText) return;
        activeCanvas.remove(activeText);
        setActiveText(null);
        setCustomText('');
        activeCanvas.renderAll();
    };

    // Add this function to create print area boundaries
    const createPrintArea = (canvas) => {
        const printArea = new fabric.Rect({
            left: 75,
            top: 100,
            width: 150,
            height: 200,
            fill: 'transparent',
            stroke: '#2563eb',
            strokeDashArray: [4, 4],
            strokeWidth: 1,
            selectable: false,
            evented: false
        });
        canvas.add(printArea);
        canvas.sendToBack(printArea);
    };

    // Add these adjustment functions
    const adjustSelectedObject = (adjustment) => {
        if (!selectedObject || !activeCanvas) return;

        let modified = false;
        const currentLeft = selectedObject.left;
        const currentTop = selectedObject.top;
        const currentAngle = selectedObject.angle;

        switch (adjustment) {
            case 'moveUp':
                selectedObject.set('top', currentTop - 5);
                modified = true;
                break;
            case 'moveDown':
                selectedObject.set('top', currentTop + 5);
                modified = true;
                break;
            case 'moveLeft':
                selectedObject.set('left', currentLeft - 5);
                modified = true;
                break;
            case 'moveRight':
                selectedObject.set('left', currentLeft + 5);
                modified = true;
                break;
            case 'rotate':
                selectedObject.set('angle', currentAngle + 5);
                modified = true;
                break;
        }

        if (modified) {
            activeCanvas.renderAll();
            if (!checkPrintAreaBounds(selectedObject)) {
                setPrintAreaWarning('Warning: Design is outside the print area!');
            } else {
                setPrintAreaWarning('');
            }
        }
    };

    const handleScale = (value) => {
        if (!selectedObject || !activeCanvas) return;

        const scale = parseFloat(value);
        selectedObject.scale(scale);
        activeCanvas.renderAll();

        if (!checkPrintAreaBounds(selectedObject)) {
            setPrintAreaWarning('Warning: Design is outside the print area!');
        } else {
            setPrintAreaWarning('');
        }
    };

    // Update handleFinalizeDesign to show preview first
    const handleFinalizeDesign = () => {
        setShowPreviewModal(true);
    };

    // Update the handleAddToCart function
    const handleAddToCart = () => {
        console.log('handleAddToCart called in CustomizationModal');

        if (!user) {
            console.error('Add to cart failed: User not logged in');
            alert('Please log in to add items to cart');
            return;
        }

        const designData = {
            productId: product.id || Date.now(),
            name: product.name,
            color: selectedColor,
            size: selectedSize,
            price: product.price,
            frontDesign: frontCanvas ? frontCanvas.toJSON() : null,
            backDesign: backCanvas ? backCanvas.toJSON() : null,
            thumbnail: frontCanvas ? frontCanvas.toDataURL() : null,
            dateAdded: new Date().toISOString()
        };

        console.log('Prepared designData:', designData);

        try {
            console.log('Calling addToCart...');
            addToCart(designData);
            console.log('Successfully added to cart');
            setShowPreviewModal(false);
            onClose();
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('There was an error adding the item to cart. Please try again.');
        }
    };

    // Get the image URL, handling both backend and frontend image paths
    const getImageUrl = (imagePath) => {
        if (!imagePath) return '/assets/placeholder-product.jpg';

        // If it's a backend image path (starts with /uploads)
        if (imagePath.startsWith('/uploads')) {
            return `http://localhost:5002${imagePath}`;
        }

        // If it's an absolute URL
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }

        // Otherwise, use the path as is (for frontend static images)
        return imagePath;
    };

    // Update the preview modal rendering
    const renderPreview = () => {
        if (!showPreviewModal) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
                <div className="bg-white rounded-lg w-[800px] max-h-[90vh] flex flex-col p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Preview Your Design</h2>
                        <button
                            onClick={() => setShowPreviewModal(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <HiX size={24} />
                        </button>
                    </div>

                    <div className="flex gap-8 justify-center mb-6">
                        {/* Front Preview */}
                        <div className="flex flex-col items-center">
                            <h3 className="text-lg font-medium mb-2">Front View</h3>
                            <div className="relative w-[300px] h-[360px]">
                                {frontCanvas && (
                                    <>
                                        <img
                                            src={getImageUrl(product?.images?.[selectedColor]?.front || product?.images?.white?.front)}
                                            alt="T-shirt Front"
                                            className="w-full h-full object-contain"
                                        />
                                        <div
                                            className="absolute top-0 left-0 w-full h-full"
                                            dangerouslySetInnerHTML={{
                                                __html: frontCanvas.toSVG()
                                            }}
                                        />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Back Preview */}
                        <div className="flex flex-col items-center">
                            <h3 className="text-lg font-medium mb-2">Back View</h3>
                            <div className="relative w-[300px] h-[360px]">
                                {backCanvas && (
                                    <>
                                        <img
                                            src={getImageUrl(product?.images?.[selectedColor]?.back || product?.images?.white?.back)}
                                            alt="T-shirt Back"
                                            className="w-full h-full object-contain"
                                        />
                                        <div
                                            className="absolute top-0 left-0 w-full h-full"
                                            dangerouslySetInnerHTML={{
                                                __html: backCanvas.toSVG()
                                            }}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-center mb-4">
                            <div className="space-y-1">
                                <p className="text-lg font-medium">{product.name}</p>
                                <p className="text-gray-600">Color: {selectedColor}</p>
                                <p className="text-gray-600">Size: {selectedSize}</p>
                            </div>
                            <div className="text-xl font-bold">
                                ${parseFloat(product.price).toFixed(2)}
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Back to Editor
                            </button>
                            <button
                                onClick={handleAddToCart}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                            >
                                <span>Add to Cart</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Existing Customization Modal */}
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg w-[500px] max-h-[90vh] flex flex-col p-4">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-bold">Customize Your {product.name}</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <HiX size={20} />
                        </button>
                    </div>

                    {/* View Toggle Buttons */}
                    <div className="flex justify-center space-x-2 mb-2">
                        <button
                            onClick={() => toggleView(true)}
                            className={`px-3 py-1 text-sm font-medium rounded border
                                ${!isBackView ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
                        >
                            Front View
                        </button>
                        <button
                            onClick={() => toggleView(false)}
                            className={`px-3 py-1 text-sm font-medium rounded border
                                ${isBackView ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
                        >
                            Back View
                        </button>
                    </div>

                    {/* Canvas Container - Adjusted height and positioning */}
                    <div className="relative w-full h-[400px] bg-gray-50 rounded-lg mb-2">
                        <div
                            className="absolute left-1/2 transform -translate-x-1/2"
                            style={{
                                width: '300px',
                                height: '360px',
                                top: '20px' // Add some padding from the top
                            }}
                        >
                            {/* Front Canvas */}
                            <div
                                className="absolute inset-0"
                                style={{
                                    visibility: isBackView ? 'hidden' : 'visible',
                                    pointerEvents: isBackView ? 'none' : 'auto'
                                }}
                            >
                                <canvas
                                    ref={frontCanvasRef}
                                    width="300"
                                    height="360"
                                />
                            </div>

                            {/* Back Canvas */}
                            <div
                                className="absolute inset-0"
                                style={{
                                    visibility: isBackView ? 'visible' : 'hidden',
                                    pointerEvents: isBackView ? 'auto' : 'none'
                                }}
                            >
                                <canvas
                                    ref={backCanvasRef}
                                    width="300"
                                    height="360"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Warning Message */}
                    {printAreaWarning && (
                        <div className="text-sm bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-1 rounded mb-2">
                            {printAreaWarning}
                        </div>
                    )}

                    {/* Controls Section */}
                    <div className="overflow-y-auto flex-1 min-h-0">
                        <div className="space-y-3">
                            {/* Color Selection */}
                            <div>
                                <h3 className="text-sm font-medium mb-1">Select T-shirt Color</h3>
                                <div className="flex flex-wrap gap-2">
                                    {colors.map((color) => (
                                        <button
                                            key={color.id}
                                            onClick={() => handleColorChange(color.hex)}
                                            className={`w-6 h-6 rounded-full border border-gray-200
                                                ${selectedColor === color.hex ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                                            style={{ backgroundColor: color.hex }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Text Controls */}
                            <div>
                                <h3 className="text-sm font-medium mb-1">
                                    {selectedText ? 'Edit Text' : 'Add Text'}
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={customText}
                                            onChange={(e) => {
                                                const newText = e.target.value;
                                                setCustomText(newText);
                                                if (selectedText && activeCanvas) {
                                                    selectedText.set('text', newText);
                                                    activeCanvas.renderAll();
                                                }
                                            }}
                                            placeholder="Enter text here"
                                            className="flex-1 px-2 py-1 text-sm border rounded"
                                        />
                                        {!selectedText && (
                                            <button
                                                onClick={() => {
                                                    if (!customText.trim()) return;
                                                    addText();
                                                }}
                                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                            >
                                                Add
                                            </button>
                                        )}
                                    </div>

                                    {(selectedText || customText) && (
                                        <div className="space-y-2">
                                            {/* Font Family Selector */}
                                            <select
                                                value={fontFamily}
                                                onChange={(e) => {
                                                    const newFont = e.target.value;
                                                    setFontFamily(newFont);
                                                    if (selectedText) {
                                                        selectedText.set('fontFamily', newFont);
                                                        activeCanvas?.requestRenderAll();
                                                    }
                                                }}
                                                className="w-full px-2 py-1 text-sm border rounded"
                                            >
                                                {Object.entries(fontGroups).map(([style, groupName]) => (
                                                    <optgroup key={style} label={groupName}>
                                                        {fonts
                                                            .filter(font => font.style === style)
                                                            .map(font => (
                                                                <option key={font.value} value={font.value}>
                                                                    {font.name}
                                                                </option>
                                                            ))}
                                                    </optgroup>
                                                ))}
                                            </select>

                                            {/* Font Size Selector */}
                                            <select
                                                value={fontSize}
                                                onChange={(e) => {
                                                    const newSize = parseInt(e.target.value);
                                                    setFontSize(newSize);
                                                    if (selectedText) {
                                                        selectedText.set('fontSize', newSize);
                                                        activeCanvas?.requestRenderAll();
                                                    }
                                                }}
                                                className="w-full px-2 py-1 text-sm border rounded"
                                            >
                                                {fontSizes.map(size => (
                                                    <option key={size} value={size}>{size}px</option>
                                                ))}
                                            </select>

                                            {/* Text Color Selector */}
                                            <div className="flex flex-wrap gap-1">
                                                {textColors.map(color => (
                                                    <button
                                                        key={color.hex}
                                                        onClick={() => {
                                                            setTextColor(color.hex);
                                                            if (selectedText) {
                                                                selectedText.set('fill', color.hex);
                                                                activeCanvas?.requestRenderAll();
                                                            }
                                                        }}
                                                        className={`w-6 h-6 rounded-full border border-gray-300
                                                            ${textColor === color.hex ? 'ring-2 ring-blue-500' : ''}`}
                                                        style={{ backgroundColor: color.hex }}
                                                        title={color.name}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div>
                                <h3 className="text-sm font-medium mb-1">Upload Image</h3>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-1"
                                >
                                    <HiUpload className="w-4 h-4" />
                                    Upload Image
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Finalize Design Button */}
                    <div className="mt-4 pt-3 border-t border-gray-200">
                        {printAreaWarning && (
                            <div className="mb-2 text-sm text-red-600">
                                {printAreaWarning}
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => onClose()}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleFinalizeDesign}
                                disabled={!!printAreaWarning}
                                className={`px-6 py-2 rounded-md text-sm font-medium text-white
                                    ${printAreaWarning
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                Finalize Design
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-gray-500 text-center">
                            {printAreaWarning
                                ? 'Please ensure all elements are within the print area before finalizing'
                                : 'Make sure your design is exactly as you want it'}
                        </p>
                    </div>
                </div>
            </div>
            {renderPreview()}
        </>
    );
};

export default CustomizationModal; 