import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TextControls from '../TextControls';

// Mock the performance monitoring hook
jest.mock('../../../utils/performanceMonitor', () => ({
    useComponentPerformance: () => ({
        trackRender: jest.fn(),
        trackOperation: jest.fn().mockReturnValue(jest.fn())
    })
}));

describe('TextControls Component', () => {
    const mockSelectedObject = {
        type: 'i-text',
        text: 'Test text',
        fontSize: 24,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'center',
        fill: '#000000',
        underline: false
    };

    const mockOnUpdate = jest.fn();

    beforeEach(() => {
        mockOnUpdate.mockClear();
    });

    test('renders with no selected object', () => {
        render(<TextControls onUpdate={mockOnUpdate} />);

        expect(screen.getByText(/Select a text object to edit/i)).toBeInTheDocument();
    });

    test('renders controls when text object is selected', () => {
        render(
            <TextControls
                selectedObject={mockSelectedObject}
                onUpdate={mockOnUpdate}
                fonts={['Arial', 'Times New Roman']}
            />
        );

        // Check if text input is rendered with correct value
        expect(screen.getByDisplayValue('Test text')).toBeInTheDocument();

        // Check if font family select is rendered
        expect(screen.getByRole('combobox')).toBeInTheDocument();

        // Check if font size input is rendered
        expect(screen.getByLabelText(/font size/i)).toBeInTheDocument();

        // Check if color picker is rendered
        expect(screen.getByLabelText(/color/i)).toBeInTheDocument();
    });

    test('calls onUpdate when text is changed', () => {
        render(
            <TextControls
                selectedObject={mockSelectedObject}
                onUpdate={mockOnUpdate}
            />
        );

        const textInput = screen.getByDisplayValue('Test text');
        fireEvent.change(textInput, { target: { value: 'New text value' } });

        expect(mockOnUpdate).toHaveBeenCalledWith('text', 'New text value');
    });

    test('calls onUpdate when font size is changed', () => {
        render(
            <TextControls
                selectedObject={mockSelectedObject}
                onUpdate={mockOnUpdate}
            />
        );

        const fontSizeInput = screen.getByLabelText(/font size/i);
        fireEvent.change(fontSizeInput, { target: { value: '36' } });

        expect(mockOnUpdate).toHaveBeenCalledWith('fontSize', 36);
    });

    test('calls onUpdate when font family is changed', () => {
        render(
            <TextControls
                selectedObject={mockSelectedObject}
                onUpdate={mockOnUpdate}
                fonts={['Arial', 'Times New Roman']}
            />
        );

        const fontSelect = screen.getByRole('combobox');
        fireEvent.change(fontSelect, { target: { value: 'Times New Roman' } });

        expect(mockOnUpdate).toHaveBeenCalledWith('fontFamily', 'Times New Roman');
    });

    test('toggles bold style when bold button is clicked', () => {
        render(
            <TextControls
                selectedObject={mockSelectedObject}
                onUpdate={mockOnUpdate}
            />
        );

        const boldButton = screen.getByRole('button', { name: /bold/i });
        fireEvent.click(boldButton);

        expect(mockOnUpdate).toHaveBeenCalledWith('fontWeight', 'bold');
    });

    test('toggles italic style when italic button is clicked', () => {
        render(
            <TextControls
                selectedObject={mockSelectedObject}
                onUpdate={mockOnUpdate}
            />
        );

        const italicButton = screen.getByRole('button', { name: /italic/i });
        fireEvent.click(italicButton);

        expect(mockOnUpdate).toHaveBeenCalledWith('fontStyle', 'italic');
    });

    test('toggles underline style when underline button is clicked', () => {
        render(
            <TextControls
                selectedObject={mockSelectedObject}
                onUpdate={mockOnUpdate}
            />
        );

        const underlineButton = screen.getByRole('button', { name: /underline/i });
        fireEvent.click(underlineButton);

        expect(mockOnUpdate).toHaveBeenCalledWith('underline', true);
    });

    test('calls onUpdate when text alignment is changed', () => {
        render(
            <TextControls
                selectedObject={mockSelectedObject}
                onUpdate={mockOnUpdate}
            />
        );

        const rightAlignButton = screen.getByRole('button', { name: /align right/i });
        fireEvent.click(rightAlignButton);

        expect(mockOnUpdate).toHaveBeenCalledWith('textAlign', 'right');
    });

    test('updates local state when selectedObject changes', () => {
        const { rerender } = render(
            <TextControls
                selectedObject={mockSelectedObject}
                onUpdate={mockOnUpdate}
            />
        );

        // Initial text should be "Test text"
        expect(screen.getByDisplayValue('Test text')).toBeInTheDocument();

        // Change the selected object
        const updatedObject = {
            ...mockSelectedObject,
            text: 'Updated text',
            fontSize: 36
        };

        rerender(
            <TextControls
                selectedObject={updatedObject}
                onUpdate={mockOnUpdate}
            />
        );

        // Text should now be "Updated text"
        expect(screen.getByDisplayValue('Updated text')).toBeInTheDocument();

        // Font size should now be 36
        expect(screen.getByLabelText(/font size/i).value).toBe('36');
    });
}); 