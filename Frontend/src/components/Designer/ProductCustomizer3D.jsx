import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { fabric } from 'fabric';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ProductCustomizer3D.css';
import { ToastContainer } from 'react-toastify';

// TextureLoader is part of the main THREE package, not in examples
// const TextureLoader = THREE.TextureLoader;

const ProductCustomizer3D = ({ onSaveDesign, initialProductType = 'tshirt' }) => {
    // References
    const mountRef = useRef(null);
    const canvasRef = useRef(null);
    const canvasRef3D = useRef(null);
    const fileInputRef = useRef(null);
    const textureCanvasRef = useRef(null);
    const fabricCanvasRef = useRef(null);
    const fabricCanvas = useRef(null);
    const containerRef = useRef(null);
    const threeContainerRef = useRef(null);

    // State for 3D scene
    const [scene, setScene] = useState(null);
    const [camera, setCamera] = useState(null);
    const [renderer, setRenderer] = useState(null);
    const [controls, setControls] = useState(null);
    const [currentModel, setCurrentModel] = useState(null);
    const [modelLoading, setModelLoading] = useState(false);

    // State for product customization
    const [selectedObject, setSelectedObject] = useState(null);
    const [productColor, setProductColor] = useState('#ffffff');
    const [productType, setProductType] = useState(initialProductType);
    const [viewMode, setViewMode] = useState('front');
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
    const [loading, setLoading] = useState(false);
    const [mode3DAvailable, setMode3DAvailable] = useState(true);
    const [designData, setDesignData] = useState(null);

    // Get mask path for current product type
    const getProductMaskPath = (productId) => {
        return `/assets/images/${productId}-mask.svg`;
    };

    // Product configuration
    const products = [
        { id: 'tshirt', name: 'T-Shirt', modelPath: '/assets/models/tshirt.glb', imagePath: '/assets/images/tshirt-placeholder.svg' },
        { id: 'hoodie', name: 'Hoodie', modelPath: '/assets/models/hoodie.glb', imagePath: '/assets/images/hoodie-placeholder.svg' },
        { id: 'mug', name: 'Mug', modelPath: '/assets/models/mug.glb', imagePath: '/assets/images/mug-placeholder.svg' },
        { id: 'cap', name: 'Cap', modelPath: '/assets/models/cap.glb', imagePath: '/assets/images/cap-placeholder.svg' }
    ];

    // Available colors for the products
    const colors = [
        { id: 'white', name: 'White', hex: '#ffffff' },
        { id: 'black', name: 'Black', hex: '#000000' },
        { id: 'red', name: 'Red', hex: '#ff0000' },
        { id: 'blue', name: 'Blue', hex: '#0000ff' },
        { id: 'green', name: 'Green', hex: '#00ff00' },
        { id: 'yellow', name: 'Yellow', hex: '#ffff00' },
        { id: 'purple', name: 'Purple', hex: '#800080' },
        { id: 'orange', name: 'Orange', hex: '#ffa500' },
    ];

    // Available fonts
    const fonts = [
        'Arial', 'Helvetica', 'Times New Roman',
        'Courier New', 'Verdana', 'Georgia',
        'Comic Sans MS', 'Impact', 'Tahoma'
    ];

    // Initialize the component
    useEffect(() => {
        // Add a slight delay to ensure DOM is ready
        const initTimer = setTimeout(() => {
            // Try to initialize 3D mode first
            if (mountRef.current) {
                try {
                    // We'll check if the model exists before attempting to load it
                    const selectedProduct = products.find(p => p.id === productType);
                    const modelPath = selectedProduct?.modelPath;

                    if (modelPath) {
                        console.log('Attempting to load 3D model from:', modelPath);
                        fetch(modelPath)
                            .then(response => {
                                console.log('Model fetch response:', response.status, response.statusText);
                                if (!response.ok) {
                                    throw new Error(`Model file not found (${response.status})`);
                                }
                                return response;
                            })
                            .then(() => {
                                console.log('3D model file exists, initializing 3D mode');
                                setMode3DAvailable(true);
                                init3DCanvas(); // Make sure we call the 3D initialization
                            })
                            .catch(error => {
                                console.error('3D model file not available:', error);
                                setMode3DAvailable(false);
                                // Initialize 2D mode if DOM is ready
                                if (canvasRef.current) {
                                    setTimeout(() => {
                                        initFabricCanvas();
                                        console.log('Falling back to 2D mode');
                                    }, 100);
                                }
                            });
                    } else {
                        console.error('No model path found for product:', productType);
                        setMode3DAvailable(false);
                        // Initialize 2D mode if DOM is ready
                        if (canvasRef.current) {
                            setTimeout(() => {
                                initFabricCanvas();
                                console.log('Falling back to 2D mode');
                            }, 100);
                        }
                    }
                } catch (err) {
                    console.error('Failed to initialize 3D mode:', err);
                    setMode3DAvailable(false);
                    // Initialize 2D mode if DOM is ready
                    if (canvasRef.current) {
                        setTimeout(() => {
                            initFabricCanvas();
                            console.log('Falling back to 2D mode');
                        }, 100);
                    }
                }
            }
        }, 300); // Delay to ensure DOM is ready

        // Set product color after a delay to ensure elements are available
        const colorTimer = setTimeout(() => {
            updateProductColor(productColor);
        }, 500);

        // Cleanup on unmount
        return () => {
            clearTimeout(initTimer);
            clearTimeout(colorTimer);

            if (fabricCanvas) {
                try {
                    fabricCanvas.current?.dispose();
                    fabricCanvas.current = null;
                } catch (e) {
                    console.error('Error disposing fabricCanvas:', e);
                }
            }

            if (scene) {
                try {
                    scene.dispose();
                } catch (e) {
                    console.error('Error disposing scene:', e);
                }
            }
        };
    }, [productType]);

    // Re-initialize when product type changes
    useEffect(() => {
        if (mode3DAvailable) {
            // Re-init 3D mode with new product
            try {
                init3DCanvas();
            } catch (err) {
                console.error('Failed to re-initialize 3D with new product:', err);
                setMode3DAvailable(false);
                // Fallback to 2D mode
                setTimeout(() => {
                    initFabricCanvas();
                }, 100);
            }
        } else {
            // Re-init 2D mode with new product
            initFabricCanvas();
        }

        // Update product color
        setTimeout(() => {
            updateProductColor(productColor);
        }, 200);
    }, [productType]);

    // Initialize Three.js scene
    useEffect(() => {
        if (!mountRef.current) return;

        try {
            // Setup scene
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0xf0f0f0);

            // Setup camera
            const camera = new THREE.PerspectiveCamera(
                75,
                mountRef.current.clientWidth / mountRef.current.clientHeight,
                0.1,
                1000
            );
            camera.position.z = 5;

            // Setup renderer
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
            renderer.outputEncoding = THREE.sRGBEncoding;
            renderer.shadowMap.enabled = true;
            mountRef.current.appendChild(renderer.domElement);

            // Setup lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(0, 10, 10);
            directionalLight.castShadow = true;
            scene.add(directionalLight);

            // Setup controls
            const controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.screenSpacePanning = false;
            controls.minDistance = 3;
            controls.maxDistance = 10;
            controls.maxPolarAngle = Math.PI / 2;

            // Setup animation loop
            const animate = () => {
                requestAnimationFrame(animate);
                controls.update();
                renderer.render(scene, camera);
            };
            animate();

            // Set state with 3D objects
            setScene(scene);
            setCamera(camera);
            setRenderer(renderer);
            setControls(controls);

            // Load initial model
            loadModel(products.find(p => p.id === productType)?.modelPath);

            // Handle resize
            const handleResize = () => {
                if (!mountRef.current) return;

                const width = mountRef.current.clientWidth;
                const height = mountRef.current.clientHeight;

                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
            };

            window.addEventListener('resize', handleResize);

            // Cleanup on unmount
            return () => {
                window.removeEventListener('resize', handleResize);
                mountRef.current?.removeChild(renderer.domElement);
                renderer.dispose();
            };
        } catch (error) {
            console.error("Error initializing 3D scene:", error);
            setMode3DAvailable(false);
        }
    }, []);

    // Load the initial product model when the component mounts or productType changes
    useEffect(() => {
        if (scene && productType) {
            const selectedProduct = products.find(p => p.id === productType);
            if (selectedProduct) {
                try {
                    loadModel(selectedProduct.modelPath);
                } catch (error) {
                    console.error("Failed to load model:", error);
                    setMode3DAvailable(false);
                }
            }
        }
    }, [scene, productType]);

    // Initialize fabric.js canvas for texture customization
    useEffect(() => {
        // Only initialize fabric canvas if we're in 2D mode or if we need it for textures
        if (!canvasRef.current || mode3DAvailable) return;

        console.log('Initializing fabric.js canvas for 2D mode');

        try {
            const dpr = window.devicePixelRatio || 1;
            const fabricInstance = new fabric.Canvas(canvasRef.current, {
                width: 512,
                height: 512,
                backgroundColor: 'transparent',
                selection: true
            });

            // Apply device pixel ratio for better rendering
            fabricInstance.setDimensions(
                { width: 512 * dpr, height: 512 * dpr },
                { cssOnly: true }
            );
            fabricInstance.setZoom(dpr);

            // Add a boundary box to indicate the design area
            const boundaryBox = new fabric.Rect({
                width: 490,
                height: 490,
                fill: 'transparent',
                stroke: 'rgba(0, 0, 0, 0.15)',
                strokeWidth: 1,
                strokeDashArray: [0],
                selectable: false,
                evented: false,
                originX: 'center',
                originY: 'center',
                left: 256,
                top: 256
            });
            fabricInstance.add(boundaryBox);
            fabricInstance.sendToBack(boundaryBox);

            // Setup event listeners
            fabricInstance.on('selection:created', handleObjectSelected);
            fabricInstance.on('selection:updated', handleObjectSelected);
            fabricInstance.on('selection:cleared', () => setSelectedObject(null));
            fabricInstance.on('object:modified', updateTexture);
            fabricInstance.on('object:added', updateTexture);

            // Set object limits to keep designs within bounds
            fabricInstance.on('object:moving', function (e) {
                const obj = e.target;
                const bounds = {
                    top: obj.height * obj.scaleY / 2,
                    bottom: fabricInstance.height - (obj.height * obj.scaleY / 2),
                    left: obj.width * obj.scaleX / 2,
                    right: fabricInstance.width - (obj.width * obj.scaleX / 2)
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
            fabricInstance.on('object:scaling', function (e) {
                const obj = e.target;
                obj.setCoords();

                // Prevent oversized objects
                if (obj.scaleX * obj.width > fabricInstance.width * 0.8) {
                    obj.scaleX = fabricInstance.width * 0.8 / obj.width;
                }
                if (obj.scaleY * obj.height > fabricInstance.height * 0.8) {
                    obj.scaleY = fabricInstance.height * 0.8 / obj.height;
                }
            });

            // Store the canvas reference
            fabricCanvas.current = fabricInstance;

            console.log('Fabric canvas initialized successfully in useEffect');

            // Clean up on unmount
            return () => {
                try {
                    fabricInstance.dispose();
                    fabricCanvas.current = null;
                } catch (e) {
                    console.error('Error cleaning up fabric canvas:', e);
                }
            };
        } catch (e) {
            console.error('Error initializing fabric canvas in useEffect:', e);
        }
    }, [mode3DAvailable]);

    // Function to load 3D models
    const loadModel = (modelPath) => {
        if (!scene) return;

        setModelLoading(true);

        // Clear existing model
        if (currentModel) {
            scene.remove(currentModel);
        }

        // Check if model path is valid
        fetch(modelPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Model file not found (${response.status} ${response.statusText})`);
                }
                return response;
            })
            .then(() => {
                // Setup GLTF loader with DRACO compression support
                const dracoLoader = new DRACOLoader();
                dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.0/');

                const loader = new GLTFLoader();
                loader.setDRACOLoader(dracoLoader);

                loader.load(
                    modelPath,
                    (gltf) => {
                        const model = gltf.scene;

                        // Set up model for shadow casting and receiving
                        model.traverse((node) => {
                            if (node.isMesh) {
                                node.castShadow = true;
                                node.receiveShadow = true;
                                node.material = new THREE.MeshStandardMaterial({
                                    color: new THREE.Color(productColor),
                                    metalness: 0.1,
                                    roughness: 0.8
                                });
                            }
                        });

                        // Center model
                        const box = new THREE.Box3().setFromObject(model);
                        const center = box.getCenter(new THREE.Vector3());
                        model.position.sub(center);

                        // Scale model to fit view
                        const size = box.getSize(new THREE.Vector3());
                        const maxDim = Math.max(size.x, size.y, size.z);
                        const scale = 3 / maxDim;
                        model.scale.set(scale, scale, scale);

                        scene.add(model);
                        setCurrentModel(model);
                        updateProductColor(productColor);
                        setModelLoading(false);
                        setMode3DAvailable(true);

                        // Reset camera position
                        camera.position.set(0, 0, 5);
                        controls.update();

                        // Create initial texture if needed
                        if (fabricCanvas) {
                            updateTexture();
                        }
                    },
                    (xhr) => {
                        // Loading progress
                        console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
                    },
                    (error) => {
                        console.error('Error loading model:', error);
                        setModelLoading(false);
                        setMode3DAvailable(false);
                        toast.error('Failed to load 3D model: ' + error.message);
                    }
                );
            })
            .catch(error => {
                console.error('Error checking or loading model:', error);
                setModelLoading(false);
                setMode3DAvailable(false);
                toast.warning('3D models are not available. Using 2D preview mode instead.');
            });
    };

    // Function to update the model texture from the fabric canvas
    const updateTexture = () => {
        try {
            if (!fabricCanvas || !fabricCanvas.current) {
                console.warn('Cannot update texture: fabric canvas not initialized');
                return;
            }

            const dataURL = fabricCanvas.current.toDataURL({
                format: 'png',
                quality: 1
            });

            // If 3D model is available, update its texture
            if (currentModel) {
                const textureLoader = new THREE.TextureLoader();
                const texture = textureLoader.load(dataURL);
                texture.flipY = false;
                texture.encoding = THREE.sRGBEncoding;

                currentModel.traverse((node) => {
                    if (node.isMesh) {
                        // Only apply texture to the main part of the model
                        // This would need customization based on your specific models
                        if (node.name.includes('Body') || node.name.includes('Front')) {
                            const material = node.material.clone();
                            material.map = texture;
                            node.material = material;
                        }
                    }
                });
            }

            // The 2D mode automatically shows the fabric canvas design
            // because we're using the same canvas in the 2D view
        } catch (error) {
            console.error('Error updating texture:', error);
        }
    };

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

    // Function to add text to the canvas
    const addText = (text = "Your Text") => {
        if (!fabricCanvas.current) {
            console.error('Fabric canvas not initialized');
            initFabricCanvas();
            // Return early and retry after a short delay to ensure canvas is ready
            setTimeout(() => addText(text), 100);
            return;
        }

        const fabricText = new fabric.IText(text, {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: '#000000',
            left: 50,
            top: 50,
            originX: 'center',
            originY: 'center',
            centeredRotation: true,
            cornerColor: '#7F7FD5',
            borderColor: '#7F7FD5',
            cornerSize: 8,
            transparentCorners: false
        });

        fabricCanvas.current.add(fabricText);
        fabricCanvas.current.setActiveObject(fabricText);
        fabricText.enterEditing();
        fabricCanvas.current.renderAll();
        updateCanvasState();

        console.log('Text added to canvas');
    };

    // Function to add image to the canvas
    const addImage = (imageUrl) => {
        if (!fabricCanvas.current) {
            console.error('Fabric canvas not initialized');
            initFabricCanvas();
            // Return early and retry after a short delay to ensure canvas is ready
            setTimeout(() => addImage(imageUrl), 100);
            return;
        }

        fabric.Image.fromURL(imageUrl, (img) => {
            // Scale image to a reasonable size
            const maxDimension = 150;
            if (img.width > maxDimension || img.height > maxDimension) {
                const scaleFactor = Math.min(maxDimension / img.width, maxDimension / img.height);
                img.scale(scaleFactor);
            }

            img.set({
                left: 100,
                top: 100,
                originX: 'center',
                originY: 'center',
                cornerColor: '#7F7FD5',
                borderColor: '#7F7FD5',
                cornerSize: 8,
                transparentCorners: false
            });

            fabricCanvas.current.add(img);
            fabricCanvas.current.setActiveObject(img);
            fabricCanvas.current.renderAll();
            updateCanvasState();

            console.log('Image added to canvas');
        }, { crossOrigin: 'anonymous' });
    };

    // Event handlers for design tools
    const handleAddText = () => {
        addText("Custom Text");
    };

    const handleUploadImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            addImage(e.target.result);
        };
        reader.readAsDataURL(file);
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
            fabricCanvas.current.renderAll();
            updateTexture();
        }
    };

    // Handle image upload
    const handleImageUpload = (e) => {
        if (!fabricCanvas || !e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = function (event) {
            const imgObj = new Image();
            imgObj.src = event.target.result;

            imgObj.onload = function () {
                const image = new fabric.Image(imgObj);

                // Scale down the image if it's too large
                if (image.width > 200 || image.height > 200) {
                    const scale = Math.min(200 / image.width, 200 / image.height);
                    image.scale(scale);
                }

                // Center the image on the canvas
                image.set({
                    left: 256,
                    top: 256,
                    originX: 'center',
                    originY: 'center'
                });

                fabricCanvas.current.add(image);
                fabricCanvas.current.setActiveObject(image);
                setSelectedObject(image);
                fabricCanvas.current.renderAll();
                updateTexture();
                toast.success('Image added! You can drag and resize it.');
            };
        };

        reader.readAsDataURL(file);
        e.target.value = null; // Reset input
    };

    // Remove selected object
    const removeSelected = () => {
        if (!fabricCanvas || !selectedObject) return;

        fabricCanvas.current.remove(selectedObject);
        setSelectedObject(null);
        setShowLayerControls(false);
        fabricCanvas.current.renderAll();
        updateTexture();
        toast.info('Element removed');
    };

    // Bring selected object to front
    const bringToFront = () => {
        if (!fabricCanvas || !selectedObject) return;

        selectedObject.bringToFront();
        fabricCanvas.current.renderAll();
        updateTexture();
        toast.info('Brought to front');
    };

    // Send selected object to back
    const sendToBack = () => {
        if (!fabricCanvas || !selectedObject) return;

        selectedObject.sendToBack();
        fabricCanvas.current.renderAll();
        updateTexture();
        toast.info('Sent to back');
    };

    // Function to update text properties
    const updateTextProperty = (property, value) => {
        if (!selectedObject || !fabricCanvas.current) return;

        // Update the text object
        selectedObject.set(property, value);

        // Special handling for text content
        if (property === 'text') {
            selectedObject.setText(value);
        }

        // Render the changes
        fabricCanvas.current.renderAll();
        updateCanvasState();
        updateTexture();
    };

    // Function to update product color
    const updateProductColor = (color) => {
        // Set state for product color
        setProductColor(color);
        console.log(`Updating product color to: ${color}`);

        // Apply to 3D model if available
        if (currentModel) {
            currentModel.traverse((child) => {
                if (child.isMesh && child.material) {
                    // Update the material color
                    child.material.color.set(color);
                    console.log("3D model color updated successfully");
                }
            });
        } else {
            // For 2D fallback, update the color layer
            console.log("Updating 2D color layer");
            const colorLayer = document.querySelector('.product-color-layer');
            if (colorLayer) {
                colorLayer.style.backgroundColor = color;
            }
        }
    };

    // Change product type
    const changeProductType = (productId) => {
        const selectedProduct = products.find(p => p.id === productId);
        if (selectedProduct) {
            setProductType(productId);
            try {
                loadModel(selectedProduct.modelPath);
            } catch (error) {
                console.error("Failed to load model:", error);
                setMode3DAvailable(false);
            }
        }
    };

    // Toggle between front and back view
    const toggleViewMode = (mode) => {
        const newMode = mode === 'front' ? 'back' : 'front';
        setViewMode(newMode);

        if (controls && camera) {
            if (newMode === 'front') {
                camera.position.set(0, 0, 5);
            } else {
                camera.position.set(0, 0, -5);
            }
            controls.update();
        }
    };

    // Save the design
    const saveDesign = () => {
        if (!fabricCanvas) return;

        setLoading(true);

        try {
            // Get the customization texture
            const textureImage = fabricCanvas.current.toDataURL({
                format: 'png',
                quality: 1
            });

            // Get a screenshot of the view (3D or 2D)
            const modelViewImage = mode3DAvailable && renderer
                ? renderer.domElement.toDataURL('image/png')
                : document.querySelector('.fallback-preview')?.toDataURL('image/png') || textureImage;

            // Call the onSaveDesign callback with design data
            if (onSaveDesign) {
                onSaveDesign({
                    modelImage: modelViewImage,
                    textureImage: textureImage,
                    productType: productType,
                    color: productColor,
                    timestamp: new Date().getTime()
                });
            }

            toast.success('Design saved successfully!');
        } catch (error) {
            console.error('Error saving design:', error);
            toast.error('Failed to save design');
        }

        setLoading(false);
    };

    // Get the color name from its value
    const getColorName = (colorValue) => {
        const colorObj = colors.find(c => c.hex === colorValue);
        return colorObj ? colorObj.name : 'Custom';
    };

    useEffect(() => {
        // Log a message when switching to 2D mode
        if (!mode3DAvailable) {
            console.log('Using 2D fallback mode - 3D models not available');
            toast.info('Using 2D preview mode. 3D models should be placed in: /assets/models/{productType}.glb', {
                position: "top-center",
                autoClose: 5000
            });
        }
    }, [mode3DAvailable]);

    const initFabricCanvas = () => {
        console.log('Initializing fabric canvas...');

        // Check if canvas ref exists
        if (!canvasRef || !canvasRef.current) {
            console.error('Canvas element not found');
            return;
        }

        // Try to safely dispose any existing canvas
        try {
            if (fabricCanvas && fabricCanvas.current) {
                fabricCanvas.current.dispose();
                fabricCanvas.current = null;
            }
        } catch (e) {
            console.error('Error disposing existing fabric canvas:', e);
        }

        // Get the container dimensions for proper sizing
        const container = document.getElementById('canvas-container');
        if (!container) {
            console.error('Canvas container not found');
            return;
        }

        const containerWidth = container.clientWidth || 350;
        const containerHeight = container.clientHeight || 400;

        console.log(`Creating canvas with dimensions: ${containerWidth}x${containerHeight}`);

        try {
            // Initialize the fabric canvas with the correct dimensions
            const newCanvas = new fabric.Canvas(canvasRef.current, {
                width: containerWidth,
                height: containerHeight,
                backgroundColor: 'transparent'
            });

            // Store reference in state
            fabricCanvas.current = newCanvas;

            // Make sure the canvas is above the product image and color layer
            if (canvasRef.current) {
                canvasRef.current.style.position = 'relative';
                canvasRef.current.style.zIndex = '10';
            }

            // Enable text editing, scaling, and other operations
            newCanvas.selection = true;

            // Add a listener to update internal model when canvas objects change
            newCanvas.on('object:modified', updateCanvasState);

            // Set initial scaling to fit properly within the product
            setCanvasScale();

            console.log('Fabric canvas initialized successfully');
        } catch (e) {
            console.error('Error initializing fabric canvas:', e);
        }
    };

    // Function to update the design state when canvas changes
    const updateCanvasState = () => {
        try {
            if (fabricCanvas && fabricCanvas.current) {
                // Save the canvas state
                const json = fabricCanvas.current.toJSON();
                if (typeof setDesignData === 'function') {
                    setDesignData(json);
                    console.log('Canvas state updated');
                }
            }
        } catch (e) {
            console.error('Error updating canvas state:', e);
        }
    };

    // Function to set the canvas scale based on product
    const setCanvasScale = () => {
        try {
            if (!fabricCanvas || !fabricCanvas.current) {
                console.warn('Cannot set canvas scale: fabric canvas not initialized');
                return;
            }

            // Adjust these values based on your product sizing
            let scaleFactor = 0.8; // Default scale factor

            // Product-specific adjustments
            if (productType === 'tshirt') {
                scaleFactor = 0.7;
            } else if (productType === 'hoodie') {
                scaleFactor = 0.65;
            } else if (productType === 'mug') {
                scaleFactor = 0.5;
            } else if (productType === 'cap') {
                scaleFactor = 0.4;
            }

            // Apply constraints to the canvas
            fabricCanvas.current.setViewportTransform([scaleFactor, 0, 0, scaleFactor, 0, 0]);
            console.log(`Canvas scale set to ${scaleFactor} for ${productType}`);
        } catch (e) {
            console.error('Error setting canvas scale:', e);
        }
    };

    // Initialize 3D Canvas
    const init3DCanvas = () => {
        try {
            console.log('Initializing 3D canvas');

            if (!scene || !mountRef.current) {
                console.error('Cannot initialize 3D canvas: scene or mount ref is null');
                return;
            }

            // Load the selected product model
            const selectedProduct = products.find(p => p.id === productType);
            if (selectedProduct && selectedProduct.modelPath) {
                loadModel(selectedProduct.modelPath);
                console.log('3D model loading initiated for', selectedProduct.name);
            } else {
                console.error('No model path found for product type:', productType);
                setMode3DAvailable(false);
            }
        } catch (e) {
            console.error('Error initializing 3D canvas:', e);
            setMode3DAvailable(false);
        }
    };

    return (
        <div className="product-customizer">
            <div className="product-preview">
                {mode3DAvailable ? (
                    // 3D Preview Mode
                    <div className="canvas-3d-container">
                        <div
                            ref={mountRef}
                            className="three-container"
                            style={{ width: '100%', height: '400px' }}
                        />
                    </div>
                ) : (
                    // 2D Fallback Mode
                    <div className="fallback-preview">
                        <div className="product-image" style={{ backgroundColor: 'transparent' }}>
                            <img
                                src={products.find(p => p.id === productType)?.imagePath || '/assets/images/tshirt-placeholder.svg'}
                                alt={`${productType} preview`}
                                className="product-template-image"
                                onError={(e) => {
                                    // Fallback to a generic shape if SVG fails to load
                                    e.target.onerror = null;
                                    e.target.src = '/assets/placeholder.png';
                                }}
                            />
                            <div
                                className="product-color-layer"
                                style={{
                                    backgroundColor: productColor,
                                    maskImage: `url(${getProductMaskPath(productType)})`,
                                    WebkitMaskImage: `url(${getProductMaskPath(productType)})`
                                }}
                            ></div>
                            <div className="design-overlay">
                                <div className="fabric-preview">
                                    <div id="canvas-container">
                                        <canvas ref={canvasRef} className="fabric-canvas"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="product-info">
                            <h3>{products.find(p => p.id === productType)?.name || 'Product'}</h3>
                            <p>Customizable {productType} - {getColorName(productColor)}</p>
                        </div>
                        <div className="mode-note">
                            <p>Using 2D preview mode. 3D models should be placed in: /assets/models/{productType}.glb</p>
                        </div>
                    </div>
                )}

                {/* Product color selector */}
                <div className="color-options">
                    <h3>Choose Color</h3>
                    <div className="color-swatches">
                        {colors.map((color) => (
                            <div
                                key={color.hex}
                                className={`color-swatch ${productColor === color.hex ? 'active' : ''}`}
                                style={{ backgroundColor: color.hex }}
                                onClick={() => updateProductColor(color.hex)}
                                title={color.name}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Design Tools Section */}
            <div className="design-tools">
                <h3>Design Tools</h3>

                {/* Add Elements Section */}
                <div className="tool-section">
                    <h4>Add Elements</h4>
                    <div className="add-elements">
                        <button onClick={handleAddText}>Add Text</button>
                        <label className="upload-button">
                            Upload Image
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleUploadImage}
                                className="hidden"
                                accept="image/*"
                            />
                        </label>
                    </div>
                </div>

                {/* Layer Controls - Shown only when an object is selected */}
                {selectedObject && (
                    <div className="tool-section">
                        <h4>Selected Element</h4>
                        <div className="layer-controls">
                            <div className="element-actions">
                                <button onClick={bringToFront}>Bring Forward</button>
                                <button onClick={sendToBack}>Send Backward</button>
                                <button onClick={removeSelected} className="remove-btn">
                                    Remove
                                </button>
                            </div>

                            {/* Text Controls - Shown only for text objects */}
                            {selectedObject && selectedObject.type === 'text' && (
                                <div className="text-controls">
                                    <input
                                        type="text"
                                        value={selectedObject.text}
                                        onChange={(e) => updateTextProperty('text', e.target.value)}
                                        placeholder="Enter text"
                                    />
                                    <select
                                        value={selectedObject.fontFamily}
                                        onChange={(e) => updateTextProperty('fontFamily', e.target.value)}
                                    >
                                        {fonts.map((font) => (
                                            <option key={font} value={font}>
                                                {font}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="color-picker">
                                        {colors.map((color) => (
                                            <div
                                                key={color.hex}
                                                className={`color-swatch ${selectedObject.fill === color.hex ? 'active' : ''}`}
                                                style={{ backgroundColor: color.hex }}
                                                onClick={() => updateTextProperty('fill', color.hex)}
                                                title={color.name}
                                            ></div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Product Type Selector */}
                <div className="tool-section">
                    <h4>Product Type</h4>
                    <select
                        value={productType}
                        onChange={(e) => setProductType(e.target.value)}
                        className="product-select"
                    >
                        {products.map((product) => (
                            <option key={product.id} value={product.id}>
                                {product.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Save Design Button */}
                <button className="save-design-btn" onClick={saveDesign}>
                    Save Design
                </button>
            </div>

            <ToastContainer position="bottom-right" autoClose={3000} />
        </div>
    );
};

export default ProductCustomizer3D;