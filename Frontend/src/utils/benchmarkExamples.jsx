/**
 * Benchmark Examples
 * 
 * This file contains examples of how to use the performance benchmark utility
 * to measure component rendering performance and compare optimizations.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  runBenchmark,
  runBenchmarkComparison,
  benchmarkComponent,
  saveBenchmarkResults,
  generatePerformanceReport
} from './performanceBenchmark';

// Import report generator
import {
  generateComprehensiveReport,
  saveReportToFile,
  showReportInWindow
} from './generatePerformanceReport';

// Import components to benchmark
import TShirtDesigner from '../components/Designer/TShirtDesigner';
import TextControls from '../components/Designer/TextControls';
import ImageControls from '../components/Designer/ImageControls';

/**
 * Example: Benchmark a React component render
 */
export async function benchmarkTShirtDesigner() {
  // Create a container for rendering
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  
  // Mock props
  const mockProps = {
    initialColor: '#FFFFFF',
    onSaveDesign: () => Promise.resolve()
  };
  
  // Run the benchmark
  const results = await benchmarkComponent({
    component: TShirtDesigner,
    render: (Component, props) => {
      root.render(<Component {...props} />);
      return new Promise(resolve => setTimeout(resolve, 100)); // Wait for render to complete
    },
    unmount: () => {
      root.unmount();
      return new Promise(resolve => setTimeout(resolve, 50)); // Wait for unmount to complete
    },
    props: mockProps,
    iterations: 20 // Fewer iterations for complex components
  });
  
  // Clean up
  document.body.removeChild(container);
  
  // Save results
  saveBenchmarkResults('tshirt_designer', results);
  
  return results;
}

/**
 * Example: Compare performance before and after optimizations
 */
export async function compareTextControlsPerformance() {
  // Import the unoptimized version (you would need to save this file)
  const { default: UnoptimizedTextControls } = await import('../components/Designer/__benchmark_versions/TextControls.unoptimized.jsx');
  
  // Create a container for rendering
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  
  // Mock props
  const mockSelectedObject = {
    type: 'text',
    text: 'Sample Text',
    fontFamily: 'Arial',
    fontSize: 24,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'center',
    underline: false,
    fill: '#000000'
  };
  
  const mockProps = {
    selectedObject: mockSelectedObject,
    onUpdate: () => {}
  };
  
  // Set up the render and unmount functions
  const render = (Component, props) => {
    root.render(<Component {...props} />);
    return new Promise(resolve => setTimeout(resolve, 50));
  };
  
  const unmount = () => {
    root.unmount();
    return new Promise(resolve => setTimeout(resolve, 50));
  };
  
  // Run benchmark comparison
  const comparison = await runBenchmarkComparison([
    {
      name: 'TextControls (Unoptimized)',
      setup: () => {},
      operation: () => render(UnoptimizedTextControls, mockProps),
      teardown: unmount,
      iterations: 50
    },
    {
      name: 'TextControls (Optimized)',
      setup: () => {},
      operation: () => render(TextControls, mockProps),
      teardown: unmount,
      iterations: 50
    }
  ]);
  
  // Clean up
  document.body.removeChild(container);
  
  // Generate an HTML report
  const before = comparison.benchmarks[0];
  const after = comparison.benchmarks[1];
  const report = generatePerformanceReport(before, after);
  
  // In a real application, you might want to display this report in the UI
  // or save it to a file for documentation
  console.log('Performance report generated');
  
  return { comparison, report };
}

/**
 * Example: Benchmark component updates
 */
export async function benchmarkImageControlsUpdates() {
  // Create a container for rendering
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  
  // Mock props
  const createMockImage = (opacity = 1, brightness = 0, contrast = 0) => ({
    type: 'image',
    opacity,
    _filters: [
      { brightness },
      { contrast }
    ],
    flipX: false,
    flipY: false
  });
  
  const mockProps = {
    selectedObject: createMockImage(),
    onAddImage: () => {},
    onUpdate: () => {}
  };
  
  // Render the component first
  root.render(<ImageControls {...mockProps} />);
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Benchmark a series of updates
  const results = await runBenchmark({
    name: 'ImageControls: Property Updates',
    setup: () => {},
    operation: async () => {
      // Update opacity
      root.render(<ImageControls {...mockProps} selectedObject={createMockImage(0.8)} />);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Update brightness
      root.render(<ImageControls {...mockProps} selectedObject={createMockImage(0.8, 0.2)} />);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Update contrast
      root.render(<ImageControls {...mockProps} selectedObject={createMockImage(0.8, 0.2, 0.3)} />);
      await new Promise(resolve => setTimeout(resolve, 50));
    },
    teardown: () => {},
    iterations: 20
  });
  
  // Clean up
  root.unmount();
  document.body.removeChild(container);
  
  return results;
}

/**
 * Example: Benchmark a function
 */
export async function benchmarkCanvasOperations() {
  // Import the canvas reference implementation
  const { fabricCanvas } = await import('../components/Designer/__benchmark_versions/CanvasOperations.js');
  
  // Create a mock canvas with 50 objects for testing
  const createMockCanvas = () => {
    const canvas = fabricCanvas.createCanvas(500, 500);
    
    // Add some mock objects
    for (let i = 0; i < 50; i++) {
      if (i % 2 === 0) {
        canvas.addText(`Text ${i}`, {
          left: Math.random() * 400,
          top: Math.random() * 400,
          fontSize: 20 + Math.random() * 20
        });
      } else {
        canvas.addImage('/assets/images/icons/star-icon.png', {
          left: Math.random() * 400,
          top: Math.random() * 400,
          scale: 0.5 + Math.random() * 0.5
        });
      }
    }
    
    return canvas;
  };
  
  // Benchmark canvas export operation
  const exportResults = await runBenchmark({
    name: 'Canvas: Export Operation',
    setup: createMockCanvas,
    operation: (canvas) => canvas.toDataURL({ format: 'png' }),
    teardown: (canvas) => canvas.dispose(),
    iterations: 20
  });
  
  // Benchmark canvas object manipulation
  const manipulationResults = await runBenchmark({
    name: 'Canvas: Object Manipulation',
    setup: createMockCanvas,
    operation: (canvas) => {
      // Select random objects and manipulate them
      const objects = canvas.getObjects();
      for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * objects.length);
        const obj = objects[randomIndex];
        
        obj.set({
          angle: Math.random() * 360,
          scaleX: 0.8 + Math.random() * 0.4,
          scaleY: 0.8 + Math.random() * 0.4
        });
      }
      canvas.renderAll();
    },
    teardown: (canvas) => canvas.dispose(),
    iterations: 50
  });
  
  return {
    exportResults,
    manipulationResults
  };
}

/**
 * Run all benchmark examples
 */
export async function runAllBenchmarks() {
  console.log('Running all benchmarks...');
  
  console.log('1. Benchmarking TShirtDesigner component');
  const designerResults = await benchmarkTShirtDesigner();
  
  console.log('2. Comparing TextControls performance');
  const textControlsComparison = await compareTextControlsPerformance();
  
  console.log('3. Benchmarking ImageControls updates');
  const imageControlsResults = await benchmarkImageControlsUpdates();
  
  console.log('4. Benchmarking canvas operations');
  const canvasResults = await benchmarkCanvasOperations();
  
  console.log('All benchmarks completed!');
  
  return {
    designerResults,
    textControlsComparison,
    imageControlsResults,
    canvasResults
  };
}

// Function to add a benchmark button to the UI in development mode
export function addBenchmarkButton() {
  if (process.env.NODE_ENV !== 'development') return;
  
  // Create a fixed button in the corner of the screen
  const button = document.createElement('button');
  button.innerText = 'Run Benchmarks';
  button.style.position = 'fixed';
  button.style.bottom = '20px';
  button.style.right = '20px';
  button.style.zIndex = '9999';
  button.style.padding = '10px 15px';
  button.style.backgroundColor = '#007bff';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  
  button.addEventListener('click', async () => {
    button.disabled = true;
    button.innerText = 'Running...';
    
    try {
      const results = await runAllBenchmarks();
      console.log('Benchmark results:', results);
      
      // Show a result summary
      alert('Benchmarks completed! Check the console for detailed results.');
    } catch (error) {
      console.error('Benchmark error:', error);
      alert('Error running benchmarks. Check console for details.');
    } finally {
      button.disabled = false;
      button.innerText = 'Run Benchmarks';
    }
  });
  
  // Also add a report button to generate comprehensive performance report
  const reportButton = document.createElement('button');
  reportButton.innerText = 'Generate Report';
  reportButton.style.position = 'fixed';
  reportButton.style.bottom = '20px';
  reportButton.style.right = '160px';
  reportButton.style.zIndex = '9999';
  reportButton.style.padding = '10px 15px';
  reportButton.style.backgroundColor = '#28a745';
  reportButton.style.color = 'white';
  reportButton.style.border = 'none';
  reportButton.style.borderRadius = '5px';
  reportButton.style.cursor = 'pointer';
  reportButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  
  reportButton.addEventListener('click', async () => {
    reportButton.disabled = true;
    reportButton.innerText = 'Generating...';
    
    try {
      await showReportInWindow();
      console.log('Performance report generated and displayed');
    } catch (error) {
      console.error('Report generation error:', error);
      alert('Error generating performance report. Check console for details.');
    } finally {
      reportButton.disabled = false;
      reportButton.innerText = 'Generate Report';
    }
  });
  
  // Add download report button
  const downloadButton = document.createElement('button');
  downloadButton.innerText = 'Download Report';
  downloadButton.style.position = 'fixed';
  downloadButton.style.bottom = '20px';
  downloadButton.style.right = '300px';
  downloadButton.style.zIndex = '9999';
  downloadButton.style.padding = '10px 15px';
  downloadButton.style.backgroundColor = '#6c757d';
  downloadButton.style.color = 'white';
  downloadButton.style.border = 'none';
  downloadButton.style.borderRadius = '5px';
  downloadButton.style.cursor = 'pointer';
  downloadButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  
  downloadButton.addEventListener('click', async () => {
    downloadButton.disabled = true;
    downloadButton.innerText = 'Generating...';
    
    try {
      const report = await generateComprehensiveReport();
      await saveReportToFile(report);
      console.log('Performance report saved');
    } catch (error) {
      console.error('Report download error:', error);
      alert('Error downloading performance report. Check console for details.');
    } finally {
      downloadButton.disabled = false;
      downloadButton.innerText = 'Download Report';
    }
  });
  
  document.body.appendChild(button);
  document.body.appendChild(reportButton);
  document.body.appendChild(downloadButton);
} 