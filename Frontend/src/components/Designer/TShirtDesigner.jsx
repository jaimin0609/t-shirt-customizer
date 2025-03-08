import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { toast } from 'react-toastify';

const TShirtDesigner = ({ onSaveDesign }) => {
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const [canvas, setCanvas] = useState(null);
    const [selectedObject, setSelectedObject] = useState(null);
    const [tshirtColor, setTshirtColor] = useState('#ffffff');
    const [loading, setLoading] = useState(false);
    const [showLayerControls, setShowLayerControls] = useState(false);
    const [textOptions, setTextOptions] = useState({
        text: 'Your Text Here',
        fontSize: 20,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'center',
        fill: '#000000'
    });

    // Available colors for the t-shirt
    const colors = [
        { name: 'White', value: '#ffffff' },
        { name: 'Black', value: '#000000' },
        { name: 'Navy', value: '#000080' },
        { name: 'Red', value: '#ff0000' },
        { name: 'Green', value: '#008000' },
        { name: 'Yellow', value: '#ffff00' },
        { name: 'Purple', value: '#800080' },
        { name: 'Gray', value: '#808080' }
    ];

    // Available fonts
    const fonts = [
        'Arial', 'Helvetica', 'Times New Roman',
        'Courier New', 'Verdana', 'Georgia',
        'Comic Sans MS', 'Impact', 'Tahoma'
    ];

    // Initialize canvas
    useEffect(() => {
        if (canvasRef.current) {
            // Set up canvas with device pixel ratio for crisp rendering
            const dpr = window.devicePixelRatio || 1;

            const fabricCanvas = new fabric.Canvas(canvasRef.current, {
                width: 200,
                height: 200,
                backgroundColor: 'transparent',
                selection: true
            });

            // Apply device pixel ratio for better rendering
            fabricCanvas.setDimensions(
                { width: 200 * dpr, height: 200 * dpr },
                { cssOnly: true }
            );
            fabricCanvas.setZoom(dpr);

            // Add a boundary box to indicate the design area
            const boundaryBox = new fabric.Rect({
                width: 190,
                height: 190,
                fill: 'transparent',
                stroke: 'currentColor', // Use currentColor for better theme integration
                strokeWidth: 2,
                strokeDashArray: [5, 5],
                selectable: false,
                evented: false,
                originX: 'center',
                originY: 'center',
                left: 100,
                top: 100,
                className: 'text-blue-500' // Use Tailwind class for color
            });
            fabricCanvas.add(boundaryBox);
            fabricCanvas.sendToBack(boundaryBox);

            // Setup event listeners
            fabricCanvas.on('selection:created', handleObjectSelected);
            fabricCanvas.on('selection:updated', handleObjectSelected);
            fabricCanvas.on('selection:cleared', () => setSelectedObject(null));

            // Set object limits to keep designs within the T-shirt
            fabricCanvas.on('object:moving', function (e) {
                const obj = e.target;
                const bounds = {
                    top: obj.height * obj.scaleY / 2,
                    bottom: fabricCanvas.height - (obj.height * obj.scaleY / 2),
                    left: obj.width * obj.scaleX / 2,
                    right: fabricCanvas.width - (obj.width * obj.scaleX / 2)
                };

                obj.setCoords();

                // Limit object movement
                if (obj.top < bounds.top) {
                    obj.top = bounds.top;
                }
                if (obj.top > bounds.bottom) {
                    obj.top = bounds.bottom;
                }
                if (obj.left < bounds.left) {
                    obj.left = bounds.left;
                }
                if (obj.left > bounds.right) {
                    obj.left = bounds.right;
                }
            });

            // Limit scaling to keep objects within bounds
            fabricCanvas.on('object:scaling', function (e) {
                const obj = e.target;
                obj.setCoords();

                // Prevent oversized objects
                if (obj.scaleX * obj.width > fabricCanvas.width * 0.8) {
                    obj.scaleX = fabricCanvas.width * 0.8 / obj.width;
                }
                if (obj.scaleY * obj.height > fabricCanvas.height * 0.8) {
                    obj.scaleY = fabricCanvas.height * 0.8 / obj.height;
                }
            });

            setCanvas(fabricCanvas);

            // Clean up
            return () => {
                fabricCanvas.dispose();
            };
        }
    }, []);

    // Handle object selection
    const handleObjectSelected = (e) => {
        const selectedObj = e.selected[0];
        setSelectedObject(selectedObj);
        setShowLayerControls(true);

        // Update text options if the selected object is a text
        if (selectedObj && selectedObj.type === 'text') {
            setTextOptions({
                text: selectedObj.text,
                fontSize: selectedObj.fontSize || 20,
                fontFamily: selectedObj.fontFamily || 'Arial',
                fontWeight: selectedObj.fontWeight || 'normal',
                fontStyle: selectedObj.fontStyle || 'normal',
                textAlign: selectedObj.textAlign || 'center',
                fill: selectedObj.fill || '#000000'
            });
        }
    };

    // Add text to canvas
    const addText = () => {
        if (!canvas) return;

        const text = new fabric.Text(textOptions.text, {
            left: 100,
            top: 100,
            fontSize: textOptions.fontSize,
            fontFamily: textOptions.fontFamily,
            fontWeight: textOptions.fontWeight,
            fontStyle: textOptions.fontStyle,
            textAlign: textOptions.textAlign,
            fill: textOptions.fill,
            cornerSize: 10,
            transparentCorners: false,
            originX: 'center',
            originY: 'center'
        });

        canvas.add(text);
        canvas.setActiveObject(text);
        setSelectedObject(text);
        canvas.renderAll();
        toast.success('Text added! You can drag, resize and customize it.');
    };

    // Update text options
    const handleTextChange = (e) => {
        const { name, value } = e.target;
        setTextOptions(prev => ({ ...prev, [name]: value }));

        // Update selected text object if exists
        if (selectedObject && selectedObject.type === 'text') {
            selectedObject.set(name, value);
            if (name === 'text') {
                selectedObject.setText(value);
            }
            canvas.renderAll();
        }
    };

    // Handle image upload
    const handleImageUpload = (e) => {
        if (!canvas || !e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];
        const reader = new FileReader();

        setLoading(true);
        reader.onload = function (event) {
            const imgObj = new Image();
            imgObj.src = event.target.result;

            imgObj.onload = function () {
                const image = new fabric.Image(imgObj);

                // Scale down the image if it's too large
                if (image.width > 150 || image.height > 150) {
                    const scale = Math.min(150 / image.width, 150 / image.height);
                    image.scale(scale);
                }

                // Center the image on the canvas
                image.set({
                    left: 100,
                    top: 100,
                    originX: 'center',
                    originY: 'center'
                });

                canvas.add(image);
                canvas.setActiveObject(image);
                setSelectedObject(image);
                canvas.renderAll();
                setLoading(false);
                toast.success('Image added! You can drag and resize it.');
            };
        };

        reader.readAsDataURL(file);
        e.target.value = null; // Reset input
    };

    // Remove selected object
    const removeSelected = () => {
        if (!canvas || !selectedObject) return;

        canvas.remove(selectedObject);
        setSelectedObject(null);
        setShowLayerControls(false);
        canvas.renderAll();
        toast.info('Element removed');
    };

    // Bring selected object to front
    const bringToFront = () => {
        if (!canvas || !selectedObject) return;

        selectedObject.bringToFront();
        canvas.renderAll();
        toast.info('Brought to front');
    };

    // Send selected object to back
    const sendToBack = () => {
        if (!canvas || !selectedObject) return;

        selectedObject.sendToBack();
        canvas.renderAll();
        toast.info('Sent to back');
    };

    // Save the design
    const saveDesign = () => {
        if (!canvas) return;

        try {
            // Store original objects visibility
            const boundaryBox = canvas.getObjects().find(obj =>
                obj.type === 'rect' && obj.strokeDashArray && obj.fill === 'transparent'
            );

            // Hide boundary box for the screenshot
            if (boundaryBox) {
                boundaryBox.visible = false;
            }

            canvas.renderAll();

            // Convert canvas to image
            const dataURL = canvas.toDataURL({
                format: 'png',
                quality: 1
            });

            // Restore boundary box visibility
            if (boundaryBox) {
                boundaryBox.visible = true;
            }

            canvas.renderAll();

            // Call the onSaveDesign callback with design data
            if (onSaveDesign) {
                onSaveDesign({
                    image: dataURL,
                    color: tshirtColor,
                    timestamp: new Date().getTime()
                });
            }

            toast.success('Design saved successfully!');
        } catch (error) {
            console.error('Error saving design:', error);
            toast.error('Failed to save design');
        }
    };

    // Change shirt color
    const changeShirtColor = (color) => {
        setTshirtColor(color);
    };

    // Get the color name from its value
    const getColorName = (colorValue) => {
        const colorObj = colors.find(c => c.value === colorValue);
        return colorObj ? colorObj.name : 'Custom';
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Design Your T-Shirt</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left column - Controls */}
                <div className="space-y-6">
                    {/* T-shirt Color Selection */}
                    <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
                        <h3 className="font-semibold text-gray-800 mb-3">Select T-shirt Color</h3>
                        <div className="flex flex-wrap gap-2">
                            {colors.map((color) => (
                                <button
                                    key={color.value}
                                    className={`w-8 h-8 rounded-full border-2 ${tshirtColor === color.value ? 'border-blue-500' : 'border-gray-300'}`}
                                    style={{ backgroundColor: color.value }}
                                    onClick={() => changeShirtColor(color.value)}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Add elements section */}
                    <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
                        <h3 className="font-semibold text-gray-800 mb-3">Add Elements</h3>
                        <div className="flex gap-2 mb-3">
                            <button
                                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center justify-center"
                                onClick={addText}
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Add Text
                            </button>
                            <button
                                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded flex items-center justify-center"
                                onClick={() => fileInputRef.current.click()}
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Upload Image
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                    </div>

                    {/* Text options section - only shown when text is selected */}
                    {selectedObject && selectedObject.type === 'text' && (
                        <div className="bg-gray-50 rounded-lg p-4 shadow-sm animate-fadeIn">
                            <h3 className="font-semibold text-gray-800 mb-3">Text Options</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
                                    <input
                                        type="text"
                                        name="text"
                                        value={textOptions.text}
                                        onChange={handleTextChange}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                                    <select
                                        name="fontFamily"
                                        value={textOptions.fontFamily}
                                        onChange={handleTextChange}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {fonts.map(font => (
                                            <option key={font} value={font}>{font}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                                    <input
                                        type="number"
                                        name="fontSize"
                                        min="8"
                                        max="80"
                                        value={textOptions.fontSize}
                                        onChange={handleTextChange}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                                    <input
                                        type="color"
                                        name="fill"
                                        value={textOptions.fill}
                                        onChange={handleTextChange}
                                        className="w-full h-10 border border-gray-300 rounded px-1 py-1"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        className={`px-3 py-1 border rounded ${textOptions.fontWeight === 'bold' ? 'bg-gray-200' : 'bg-white'}`}
                                        onClick={() => handleTextChange({ target: { name: 'fontWeight', value: textOptions.fontWeight === 'bold' ? 'normal' : 'bold' } })}
                                        title="Bold"
                                    >
                                        B
                                    </button>
                                    <button
                                        className={`px-3 py-1 border rounded ${textOptions.fontStyle === 'italic' ? 'bg-gray-200' : 'bg-white'}`}
                                        onClick={() => handleTextChange({ target: { name: 'fontStyle', value: textOptions.fontStyle === 'italic' ? 'normal' : 'italic' } })}
                                        title="Italic"
                                    >
                                        I
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Layer controls - only shown when an object is selected */}
                    {showLayerControls && (
                        <div className="bg-gray-50 rounded-lg p-4 shadow-sm animate-fadeIn">
                            <h3 className="font-semibold text-gray-800 mb-3">Layer Controls</h3>
                            <div className="flex gap-2">
                                <button
                                    className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded"
                                    onClick={removeSelected}
                                >
                                    Delete
                                </button>
                                <button
                                    className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded"
                                    onClick={bringToFront}
                                >
                                    Bring Forward
                                </button>
                                <button
                                    className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded"
                                    onClick={sendToBack}
                                >
                                    Send Back
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Middle column - T-shirt Preview */}
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <div className="relative w-[300px] h-[380px]">
                            {/* Improved SVG with accessibility features */}
                            <svg
                                viewBox="0 0 500 600"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-full h-full pointer-events-none"
                                role="img"
                                aria-label={`T-shirt design template in ${getColorName(tshirtColor)} color`}
                            >
                                <title>T-shirt Design Template - {getColorName(tshirtColor)}</title>

                                {/* T-shirt color description for screen readers */}
                                <text x="0" y="20" className="sr-only">
                                    {`T-shirt color: ${getColorName(tshirtColor)}`}
                                </text>

                                {/* T-shirt shape */}
                                <path
                                    d="M 100,100 L 170,30 L 330,30 L 400,100 L 350,150 L 350,550 L 150,550 L 150,150 L 100,100 z"
                                    fill={tshirtColor}
                                    stroke="currentColor"
                                    strokeWidth="2"
                                />

                                {/* Left sleeve */}
                                <path
                                    d="M 100,100 L 70,200 L 130,200 L 150,150 z"
                                    fill={tshirtColor}
                                    stroke="currentColor"
                                    strokeWidth="2"
                                />

                                {/* Right sleeve */}
                                <path
                                    d="M 400,100 L 430,200 L 370,200 L 350,150 z"
                                    fill={tshirtColor}
                                    stroke="currentColor"
                                    strokeWidth="2"
                                />

                                {/* Collar */}
                                <path
                                    d="M 200,30 L 250,60 L 300,30"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                />
                            </svg>

                            {/* Improved canvas container with clear design area indication */}
                            <div className="absolute top-[100px] left-[50px]">
                                <div className="relative w-[200px] h-[200px] border-2 border-dashed border-blue-500 rounded">
                                    <canvas
                                        ref={canvasRef}
                                        id="tshirt-canvas"
                                        className="w-full h-full"
                                        aria-label="Design canvas area. Use the controls to add and customize elements."
                                    />
                                </div>
                            </div>

                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 text-center">
                            <div className="text-xs text-gray-500 bg-gray-100 rounded-md p-2 shadow-sm">
                                <p className="font-medium text-gray-600 mb-1">Design Area</p>
                                <p>Elements within the blue dotted border will be printed</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-gray-600 mt-4 text-center">
                        Click and drag to move elements. <br />
                        Use corner handles to resize.
                    </p>
                </div>

                {/* Right column - Tips and Save */}
                <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
                        <h3 className="font-semibold text-gray-800 mb-3">Design Tips</h3>
                        <ul className="text-sm text-gray-600 space-y-2">
                            <li className="flex items-start">
                                <svg className="w-4 h-4 text-blue-500 mr-2 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Keep your design simple and focused for better visibility.
                            </li>
                            <li className="flex items-start">
                                <svg className="w-4 h-4 text-blue-500 mr-2 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Consider the t-shirt color when choosing text and image colors.
                            </li>
                            <li className="flex items-start">
                                <svg className="w-4 h-4 text-blue-500 mr-2 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                High contrast between design and shirt color works best.
                            </li>
                            <li className="flex items-start">
                                <svg className="w-4 h-4 text-blue-500 mr-2 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                For image uploads, transparent PNG files work best.
                            </li>
                        </ul>
                    </div>

                    <button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition duration-200 flex items-center justify-center"
                        onClick={saveDesign}
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Save Design
                    </button>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="font-semibold text-yellow-800 mb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Note
                        </h3>
                        <p className="text-sm text-yellow-700">
                            This is a simplified preview. The printed design may appear slightly different. Professional adjustments will be made before printing to ensure best quality.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TShirtDesigner; 