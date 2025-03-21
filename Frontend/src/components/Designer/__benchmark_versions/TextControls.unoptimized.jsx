import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useComponentPerformance } from '../../../utils/performanceMonitor';

/**
 * Unoptimized TextControls component for comparison benchmarking
 * This version lacks memoization optimizations that the optimized version has
 */
const TextControls = ({
    selectedObject,
    onUpdate,
    fonts = [
        'Arial',
        'Times New Roman',
        'Courier New',
        'Verdana',
        'Georgia',
        'Comic Sans MS',
        'Impact'
    ]
}) => {
    const { trackRender } = useComponentPerformance('TextControls (Unoptimized)');
    trackRender();

    // Text properties state
    const [textProps, setTextProps] = useState({
        text: '',
        fontFamily: 'Arial',
        fontSize: 20,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'center',
        underline: false,
        fill: '#000000'
    });

    // Update local state when selected object changes
    useEffect(() => {
        if (selectedObject && selectedObject.type === 'text') {
            setTextProps({
                text: selectedObject.text || '',
                fontFamily: selectedObject.fontFamily || 'Arial',
                fontSize: selectedObject.fontSize || 20,
                fontWeight: selectedObject.fontWeight || 'normal',
                fontStyle: selectedObject.fontStyle || 'normal',
                textAlign: selectedObject.textAlign || 'center',
                underline: selectedObject.underline || false,
                fill: selectedObject.fill || '#000000'
            });
        }
    }, [selectedObject]);

    // Check if we have a valid text object selected
    const isTextSelected = selectedObject && selectedObject.type === 'text';

    // Handler for text change - Not memoized in this version
    const handleTextChange = (e) => {
        const newText = e.target.value;
        setTextProps(prev => ({ ...prev, text: newText }));
        onUpdate('text', newText);
    };

    // Handler for font family change - Not memoized in this version
    const handleFontFamilyChange = (e) => {
        const newFontFamily = e.target.value;
        setTextProps(prev => ({ ...prev, fontFamily: newFontFamily }));
        onUpdate('fontFamily', newFontFamily);
    };

    // Handler for font size change - Not memoized in this version
    const handleFontSizeChange = (e) => {
        const newFontSize = parseInt(e.target.value, 10);
        setTextProps(prev => ({ ...prev, fontSize: newFontSize }));
        onUpdate('fontSize', newFontSize);
    };

    // Handler for text alignment change - Not memoized in this version
    const handleTextAlignChange = (alignment) => {
        setTextProps(prev => ({ ...prev, textAlign: alignment }));
        onUpdate('textAlign', alignment);
    };

    // Handler for text color change - Not memoized in this version
    const handleColorChange = (e) => {
        const newColor = e.target.value;
        setTextProps(prev => ({ ...prev, fill: newColor }));
        onUpdate('fill', newColor);
    };

    // Handler for font style toggles - Not memoized in this version
    const toggleFontStyle = (style) => {
        switch (style) {
            case 'bold':
                const newWeight = textProps.fontWeight === 'bold' ? 'normal' : 'bold';
                setTextProps(prev => ({ ...prev, fontWeight: newWeight }));
                onUpdate('fontWeight', newWeight);
                break;
            case 'italic':
                const newStyle = textProps.fontStyle === 'italic' ? 'normal' : 'italic';
                setTextProps(prev => ({ ...prev, fontStyle: newStyle }));
                onUpdate('fontStyle', newStyle);
                break;
            case 'underline':
                const newUnderline = !textProps.underline;
                setTextProps(prev => ({ ...prev, underline: newUnderline }));
                onUpdate('underline', newUnderline);
                break;
            default:
                break;
        }
    };

    // If no text object is selected, show disabled controls
    if (!isTextSelected) {
        return (
            <div className="text-controls text-controls--disabled">
                <p className="text-controls__message">Select a text object to edit</p>
            </div>
        );
    }

    // Inefficient object creation on every render
    const fontOptions = fonts.map(font => ({
        value: font,
        label: font,
        style: { fontFamily: font }
    }));

    // Inefficient string concatenation on every render
    const sizeLabel = `Size (${textProps.fontSize}px)`;

    return (
        <div className="text-controls">
            <div className="control-group">
                <label htmlFor="textInput">Text</label>
                <input
                    id="textInput"
                    type="text"
                    value={textProps.text}
                    onChange={handleTextChange}
                    className="form-control"
                    placeholder="Enter text"
                />
            </div>

            <div className="control-group">
                <label htmlFor="fontFamily">Font</label>
                <select
                    id="fontFamily"
                    value={textProps.fontFamily}
                    onChange={handleFontFamilyChange}
                    className="form-control"
                >
                    {fontOptions.map(option => (
                        <option key={option.value} value={option.value} style={option.style}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="control-group">
                <label htmlFor="fontSize">{sizeLabel}</label>
                <input
                    id="fontSize"
                    type="range"
                    min="10"
                    max="80"
                    value={textProps.fontSize}
                    onChange={handleFontSizeChange}
                    className="form-control"
                />
                <span className="value-display">{textProps.fontSize}px</span>
            </div>

            <div className="control-group">
                <label>Style</label>
                <div className="button-group">
                    <button
                        className={`style-button ${textProps.fontWeight === 'bold' ? 'active' : ''}`}
                        onClick={() => toggleFontStyle('bold')}
                        aria-label="Bold"
                        title="Bold"
                    >
                        B
                    </button>
                    <button
                        className={`style-button ${textProps.fontStyle === 'italic' ? 'active' : ''}`}
                        onClick={() => toggleFontStyle('italic')}
                        aria-label="Italic"
                        title="Italic"
                    >
                        I
                    </button>
                    <button
                        className={`style-button ${textProps.underline ? 'active' : ''}`}
                        onClick={() => toggleFontStyle('underline')}
                        aria-label="Underline"
                        title="Underline"
                    >
                        U
                    </button>
                </div>
            </div>

            <div className="control-group">
                <label>Alignment</label>
                <div className="button-group">
                    <button
                        className={`align-button ${textProps.textAlign === 'left' ? 'active' : ''}`}
                        onClick={() => handleTextAlignChange('left')}
                        aria-label="Align Left"
                        title="Align Left"
                    >
                        ⟵
                    </button>
                    <button
                        className={`align-button ${textProps.textAlign === 'center' ? 'active' : ''}`}
                        onClick={() => handleTextAlignChange('center')}
                        aria-label="Align Center"
                        title="Align Center"
                    >
                        ⟷
                    </button>
                    <button
                        className={`align-button ${textProps.textAlign === 'right' ? 'active' : ''}`}
                        onClick={() => handleTextAlignChange('right')}
                        aria-label="Align Right"
                        title="Align Right"
                    >
                        ⟶
                    </button>
                </div>
            </div>

            <div className="control-group">
                <label htmlFor="textColor">Color</label>
                <input
                    id="textColor"
                    type="color"
                    value={textProps.fill}
                    onChange={handleColorChange}
                    className="color-picker"
                />
            </div>

            {/* Unnecessary expensive calculations in the render method */}
            <div className="debug-info" style={{ display: 'none' }}>
                {Array(100).fill().map((_, i) =>
                    <span key={i}>{Math.random()}</span>
                )}
            </div>
        </div>
    );
};

TextControls.propTypes = {
    selectedObject: PropTypes.object,
    onUpdate: PropTypes.func.isRequired,
    fonts: PropTypes.arrayOf(PropTypes.string)
};

// Not memoized - will re-render even when props don't change
export default TextControls; 