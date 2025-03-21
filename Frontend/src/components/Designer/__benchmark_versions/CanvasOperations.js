/**
 * Mock Canvas Operations for Benchmarking
 * 
 * This file provides a simplified mock implementation of fabric.js canvas operations
 * for use in performance benchmarking.
 */

// Mock objects
class MockObject {
  constructor(options = {}) {
    this.id = Math.random().toString(36).substring(2, 9);
    this.width = options.width || 100;
    this.height = options.height || 100;
    this.left = options.left || 0;
    this.top = options.top || 0;
    this.angle = options.angle || 0;
    this.scaleX = options.scaleX || 1;
    this.scaleY = options.scaleY || 1;
    this.flipX = options.flipX || false;
    this.flipY = options.flipY || false;
    this.opacity = options.opacity !== undefined ? options.opacity : 1;
    this.fill = options.fill || '#000000';
    this.stroke = options.stroke || null;
    this.strokeWidth = options.strokeWidth || 0;
    this.selectable = options.selectable !== undefined ? options.selectable : true;
    this.hasControls = options.hasControls !== undefined ? options.hasControls : true;
    this.hasBorders = options.hasBorders !== undefined ? options.hasBorders : true;
    this.lockMovementX = options.lockMovementX || false;
    this.lockMovementY = options.lockMovementY || false;
    
    // Apply any additional properties
    Object.keys(options).forEach(key => {
      if (this[key] === undefined) {
        this[key] = options[key];
      }
    });
  }
  
  set(options) {
    Object.keys(options).forEach(key => {
      this[key] = options[key];
    });
    return this;
  }
  
  getBoundingRect() {
    const width = this.width * this.scaleX;
    const height = this.height * this.scaleY;
    return {
      left: this.left - width / 2,
      top: this.top - height / 2,
      width: width,
      height: height
    };
  }
  
  getScaledWidth() {
    return this.width * this.scaleX;
  }
  
  getScaledHeight() {
    return this.height * this.scaleY;
  }
  
  clone() {
    const clone = new MockObject({});
    Object.keys(this).forEach(key => {
      clone[key] = this[key];
    });
    clone.id = Math.random().toString(36).substring(2, 9);
    return clone;
  }
}

// Text object
class MockText extends MockObject {
  constructor(text, options = {}) {
    super(options);
    this.type = 'text';
    this.text = text || '';
    this.fontFamily = options.fontFamily || 'Arial';
    this.fontSize = options.fontSize || 20;
    this.fontWeight = options.fontWeight || 'normal';
    this.fontStyle = options.fontStyle || 'normal';
    this.textAlign = options.textAlign || 'left';
    this.underline = options.underline || false;
  }
}

// Image object
class MockImage extends MockObject {
  constructor(src, options = {}) {
    super(options);
    this.type = 'image';
    this.src = src || '';
    this._filters = options._filters || [];
  }
  
  setSrc(src, callback) {
    this.src = src;
    if (callback) callback(this);
    return this;
  }
}

// Canvas
class MockCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.objects = [];
    this.backgroundImage = null;
    this.backgroundColor = '#ffffff';
    this.eventListeners = {};
    this.viewportTransform = [1, 0, 0, 1, 0, 0];
    this.activeObject = null;
  }
  
  add(obj) {
    this.objects.push(obj);
    return this;
  }
  
  remove(obj) {
    this.objects = this.objects.filter(o => o !== obj);
    if (this.activeObject === obj) {
      this.activeObject = null;
    }
    return this;
  }
  
  clear() {
    this.objects = [];
    this.activeObject = null;
    return this;
  }
  
  renderAll() {
    // Mock rendering operation
    return this;
  }
  
  setActiveObject(obj) {
    this.activeObject = obj;
    this.fire('selection:created', { target: obj });
    return this;
  }
  
  discardActiveObject() {
    const prev = this.activeObject;
    this.activeObject = null;
    if (prev) {
      this.fire('selection:cleared', { target: prev });
    }
    return this;
  }
  
  getActiveObject() {
    return this.activeObject;
  }
  
  getObjects() {
    return [...this.objects];
  }
  
  getObjectByID(id) {
    return this.objects.find(o => o.id === id);
  }
  
  setBackgroundImage(img, callback) {
    this.backgroundImage = img;
    if (callback) callback();
    return this;
  }
  
  setDimensions({ width, height }) {
    this.width = width || this.width;
    this.height = height || this.height;
    return this;
  }
  
  setViewportTransform(transform) {
    this.viewportTransform = [...transform];
    return this;
  }
  
  getCenter() {
    return {
      top: this.height / 2,
      left: this.width / 2
    };
  }
  
  toDataURL(options = {}) {
    // Mock data URL - in a real implementation this would create a base64-encoded image
    return `data:image/png;base64,${this.objects.length}`;
  }
  
  dispose() {
    this.objects = [];
    this.eventListeners = {};
  }
  
  // Event handling
  on(eventName, handler) {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }
    this.eventListeners[eventName].push(handler);
    return this;
  }
  
  off(eventName, handler) {
    if (!this.eventListeners[eventName]) return this;
    if (!handler) {
      this.eventListeners[eventName] = [];
    } else {
      this.eventListeners[eventName] = this.eventListeners[eventName].filter(h => h !== handler);
    }
    return this;
  }
  
  fire(eventName, options) {
    const handlers = this.eventListeners[eventName] || [];
    handlers.forEach(handler => handler(options));
    return this;
  }
  
  // Canvas creation helper
  static createCanvas(width, height) {
    return new MockCanvas(width, height);
  }
  
  // Utility functions for benchmarking
  addText(text, options = {}) {
    const textObj = new MockText(text, options);
    this.add(textObj);
    return textObj;
  }
  
  addImage(src, options = {}) {
    const imgObj = new MockImage(src, options);
    this.add(imgObj);
    return imgObj;
  }
  
  addRect(options = {}) {
    const rectObj = new MockObject({
      ...options,
      type: 'rect'
    });
    this.add(rectObj);
    return rectObj;
  }
  
  addCircle(options = {}) {
    const circleObj = new MockObject({
      ...options,
      type: 'circle'
    });
    this.add(circleObj);
    return circleObj;
  }
  
  // Benchmark operations that simulate complex operations
  runComplexOperation() {
    // Simulate a complex operation for benchmarking
    for (let i = 0; i < this.objects.length; i++) {
      const obj = this.objects[i];
      obj.set({
        left: Math.random() * this.width,
        top: Math.random() * this.height,
        angle: Math.random() * 360
      });
    }
    this.renderAll();
  }
  
  applyFilter(obj, type, value) {
    if (!obj) return;
    
    // Find existing filter of this type
    const filterIndex = obj._filters ? 
      obj._filters.findIndex(f => f && f[type] !== undefined) : -1;
    
    // Create _filters array if it doesn't exist
    if (!obj._filters) {
      obj._filters = [];
    }
    
    // Update existing filter or add new one
    if (filterIndex >= 0) {
      obj._filters[filterIndex] = { [type]: value };
    } else {
      obj._filters.push({ [type]: value });
    }
    
    this.renderAll();
  }
}

// Exported mock fabric library
export const fabricCanvas = {
  createCanvas: MockCanvas.createCanvas,
  MockObject,
  MockText,
  MockImage,
  MockCanvas
}; 