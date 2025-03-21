import React, { useState, useEffect, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { useComponentPerformance } from '../../utils/performanceMonitor';
import withStyles from '../../styles/withStyles';
import styleSystem from '../../styles/styleSystem';
import { combineStyles, conditionalStyles } from '../../styles/cssOptimizer';

// Define component-specific styles
const createTextControlsStyles = (props) => {
    // Get color and spacing from style system
    const { colors, spacing, borders, shadows, typography } = styleSystem;

    // Base styles
    const baseStyles = {
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[4],
        padding: spacing[4],
        backgroundColor: colors.background.paper,
        borderRadius: borders.radius.md,
        boxShadow: shadows.sm,
        maxWidth: '100%',
        width: '300px',

        // Disabled state
        '&.text-controls--disabled': {
            opacity: 0.7,
            cursor: 'not-allowed',
            backgroundColor: colors.gray[100],
        },

        // Control groups
        '.control-group': {
            display: 'flex',
            flexDirection: 'column',
            gap: spacing[2],
        },

        // Labels
        label: {
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.secondary,
        },

        // Form controls
        '.form-control': {
            fontFamily: typography.fontFamily.primary,
            fontSize: typography.fontSize.md,
            padding: `${spacing[2]} ${spacing[3]}`,
            border: `1px solid ${colors.gray[300]}`,
            borderRadius: borders.radius.md,
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',

            '&:hover': {
                borderColor: colors.gray[400],
            },

            '&:focus': {
                borderColor: colors.primary[500],
                boxShadow: `0 0 0 1px ${colors.primary[300]}`,
            },
        },

        // Message when no text is selected
        '.text-controls__message': {
            textAlign: 'center',
            padding: spacing[4],
            color: colors.text.secondary,
            fontSize: typography.fontSize.md,
        },

        // Button groups
        '.button-group': {
            display: 'flex',
            gap: spacing[1],
        },

        // Style buttons (bold, italic, underline)
        '.style-button, .align-button': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            backgroundColor: colors.background.paper,
            border: `1px solid ${colors.gray[300]}`,
            borderRadius: borders.radius.md,
            cursor: 'pointer',
            transition: 'all 0.2s',

            '&:hover': {
                backgroundColor: colors.gray[100],
            },

            '&.active': {
                backgroundColor: colors.primary[50],
                borderColor: colors.primary[500],
                color: colors.primary[700],
            },
        },

        // Color picker
        '.color-picker': {
            width: '100%',
            height: '36px',
            border: `1px solid ${colors.gray[300]}`,
            borderRadius: borders.radius.md,
            cursor: 'pointer',
        },

        // Value display (for sliders)
        '.value-display': {
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            marginLeft: spacing[2],
        },
    };

    return baseStyles;
};

/**
 * TextControls component for editing text objects in the t-shirt designer
 * Handles font family, size, color, alignment, and other text properties
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
    ],
    // Injected by withStyles
    className
}) => {
    const { trackRender } = useComponentPerformance('TextControls');
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

    // Handler for text change
    const handleTextChange = useCallback((e) => {
        const newText = e.target.value;
        setTextProps(prev => ({ ...prev, text: newText }));
        onUpdate('text', newText);
    }, [onUpdate]);

    // Handler for font family change
    const handleFontFamilyChange = useCallback((e) => {
        const newFontFamily = e.target.value;
        setTextProps(prev => ({ ...prev, fontFamily: newFontFamily }));
        onUpdate('fontFamily', newFontFamily);
    }, [onUpdate]);

    // Handler for font size change
    const handleFontSizeChange = useCallback((e) => {
        const newFontSize = parseInt(e.target.value, 10);
        setTextProps(prev => ({ ...prev, fontSize: newFontSize }));
        onUpdate('fontSize', newFontSize);
    }, [onUpdate]);

    // Handler for text alignment change
    const handleTextAlignChange = useCallback((alignment) => {
        setTextProps(prev => ({ ...prev, textAlign: alignment }));
        onUpdate('textAlign', alignment);
    }, [onUpdate]);

    // Handler for text color change
    const handleColorChange = useCallback((e) => {
        const newColor = e.target.value;
        setTextProps(prev => ({ ...prev, fill: newColor }));
        onUpdate('fill', newColor);
    }, [onUpdate]);

    // Handler for font style toggles
    const toggleFontStyle = useCallback((style) => {
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
    }, [onUpdate, textProps.fontWeight, textProps.fontStyle, textProps.underline]);

    // Generate additional class name if no text is selected
    const containerClassName = isTextSelected
        ? className
        : `${className} text-controls--disabled`;

    // If no text object is selected, show disabled controls
    if (!isTextSelected) {
        return (
            <div className={containerClassName}>
                <p className="text-controls__message">Select a text object to edit</p>
            </div>
        );
    }

    return (
        <div className={containerClassName}>
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
                    {fonts.map(font => (
                        <option key={font} value={font} style={{ fontFamily: font }}>
                            {font}
                        </option>
                    ))}
                </select>
            </div>

            <div className="control-group">
                <label htmlFor="fontSize">Size</label>
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
        </div>
    );
};

TextControls.propTypes = {
    selectedObject: PropTypes.object,
    onUpdate: PropTypes.func.isRequired,
    fonts: PropTypes.arrayOf(PropTypes.string),
    className: PropTypes.string // Added for withStyles
};

// Apply styles and memoize the component
const StyledTextControls = withStyles(createTextControlsStyles)(TextControls);
export default memo(StyledTextControls); 