/**
 * Performance Report Generator
 * 
 * This utility aggregates benchmark results and generates comprehensive
 * performance reports for the T-Shirt Customizer application.
 */

import {
  runAllBenchmarks,
  compareTextControlsPerformance
} from './benchmarkExamples';
import { generatePerformanceReport } from './performanceBenchmark';

/**
 * Generate a comprehensive performance report covering all major components
 * and operations in the T-Shirt Customizer application
 * 
 * @returns {Promise<string>} HTML report content
 */
export async function generateComprehensiveReport() {
  try {
    console.log('🔍 Generating comprehensive performance report...');
    
    // 1. Run all benchmarks to get current performance data
    const benchmarkResults = await runAllBenchmarks();
    
    // 2. Get specific before/after comparison for TextControls
    const textControlsComparison = await compareTextControlsPerformance();
    
    // 3. Generate HTML report
    return createHTMLReport(benchmarkResults, textControlsComparison);
  } catch (error) {
    console.error('Error generating performance report:', error);
    return `
      <div class="error-report">
        <h2>Error Generating Performance Report</h2>
        <p>${error.message}</p>
        <pre>${error.stack}</pre>
      </div>
    `;
  }
}

/**
 * Create a formatted HTML report from benchmark results
 * 
 * @param {Object} benchmarkResults - Results from runAllBenchmarks
 * @param {Object} textControlsComparison - Results from compareTextControlsPerformance
 * @returns {string} HTML content
 */
function createHTMLReport(benchmarkResults, textControlsComparison) {
  const {
    designerResults,
    imageControlsResults,
    canvasResults
  } = benchmarkResults;
  
  const { report: textControlsReport } = textControlsComparison;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>T-Shirt Customizer Performance Report</title>
      <style>
        :root {
          --primary-color: #3b82f6;
          --success-color: #28a745;
          --warning-color: #dc3545;
          --neutral-color: #6c757d;
          --background-color: #f8f9fa;
          --card-background: white;
          --text-color: #333;
          --border-color: #dee2e6;
          --light-text: #6c757d;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: var(--text-color);
          background: var(--background-color);
          margin: 0;
          padding: 20px;
        }
        
        .report-container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 30px;
        }
        
        h1, h2, h3, h4 {
          margin-top: 0;
          color: var(--text-color);
        }
        
        h1 {
          text-align: center;
          margin-bottom: 30px;
          color: var(--primary-color);
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 15px;
        }
        
        .report-section {
          margin-bottom: 40px;
        }
        
        .report-card {
          background: var(--card-background);
          border-radius: 8px;
          border: 1px solid var(--border-color);
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .metric-card {
          background: var(--card-background);
          border-radius: 8px;
          padding: 20px;
          border: 1px solid var(--border-color);
          text-align: center;
        }
        
        .metric-value {
          font-size: 28px;
          font-weight: bold;
          color: var(--primary-color);
          margin: 10px 0;
        }
        
        .metric-label {
          font-size: 14px;
          color: var(--light-text);
        }
        
        .improved {
          color: var(--success-color);
        }
        
        .degraded {
          color: var(--warning-color);
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }
        
        th {
          background-color: rgba(0, 0, 0, 0.03);
        }
        
        .comparison-embed {
          margin: 30px 0;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 20px;
        }
        
        .recommendations {
          background: #e8f4fc;
          border-radius: 8px;
          padding: 20px;
          margin-top: 30px;
          border-left: 4px solid var(--primary-color);
        }
        
        .recommendations h3 {
          margin-top: 0;
        }
        
        .recommendations ul {
          margin-bottom: 0;
        }
        
        footer {
          text-align: center;
          margin-top: 40px;
          color: var(--light-text);
          font-size: 14px;
        }
        
        .timestamp {
          display: inline-block;
          padding: 4px 10px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 30px;
          margin-top: 5px;
        }
        
        .chart-container {
          height: 300px;
          margin: 30px 0;
        }
        
        .error-report {
          background: #fbe9e7;
          color: #c62828;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #c62828;
        }
        
        .error-report pre {
          background: rgba(0, 0, 0, 0.05);
          padding: 10px;
          border-radius: 4px;
          overflow: auto;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <h1>T-Shirt Customizer Performance Report</h1>
        
        <div class="report-section">
          <h2>Executive Summary</h2>
          <p>
            This report provides a comprehensive analysis of the performance optimizations 
            implemented in the T-Shirt Customizer application. The benchmarks were run on 
            ${new Date().toLocaleDateString()} and represent the current state of the application.
          </p>
          
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">TShirtDesigner Render Time</div>
              <div class="metric-value">${designerResults.timing.mean.toFixed(2)}ms</div>
              <div>Average of ${designerResults.iterations} renders</div>
            </div>
            
            <div class="metric-card">
              <div class="metric-label">TextControls Optimization</div>
              <div class="metric-value improved">
                ${Math.abs(textControlsComparison.comparison.comparisons[0].timing.percentChange).toFixed(2)}%
              </div>
              <div>Performance improvement</div>
            </div>
            
            <div class="metric-card">
              <div class="metric-label">Canvas Operations</div>
              <div class="metric-value">${canvasResults.manipulationResults.timing.mean.toFixed(2)}ms</div>
              <div>Average manipulation time</div>
            </div>
            
            <div class="metric-card">
              <div class="metric-label">Image Updates</div>
              <div class="metric-value">${imageControlsResults.timing.mean.toFixed(2)}ms</div>
              <div>Average update operation time</div>
            </div>
          </div>
        </div>
        
        <div class="report-section">
          <h2>Component Optimization Results</h2>
          
          <div class="report-card">
            <h3>TextControls Component</h3>
            <p>Comparison between optimized and unoptimized implementations:</p>
            
            <div class="comparison-embed">
              ${textControlsReport}
            </div>
            
            <h4>Key Optimizations:</h4>
            <ul>
              <li>Applied React.memo() to prevent unnecessary re-renders</li>
              <li>Memoized event handlers with useCallback()</li>
              <li>Memoized expensive calculations with useMemo()</li>
              <li>Optimized state updates</li>
              <li>Added comprehensive dependency arrays</li>
            </ul>
          </div>
          
          <div class="report-card">
            <h3>TShirtDesigner Component</h3>
            
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Mean Render Time</td>
                  <td>${designerResults.timing.mean.toFixed(2)}ms</td>
                  <td>Average time to render the component</td>
                </tr>
                <tr>
                  <td>Median Render Time</td>
                  <td>${designerResults.timing.median.toFixed(2)}ms</td>
                  <td>Median time to render the component</td>
                </tr>
                <tr>
                  <td>P95 Render Time</td>
                  <td>${designerResults.timing.p95.toFixed(2)}ms</td>
                  <td>95th percentile render time</td>
                </tr>
                <tr>
                  <td>Standard Deviation</td>
                  <td>${designerResults.timing.stdDev.toFixed(2)}ms</td>
                  <td>Variation in render times</td>
                </tr>
              </tbody>
            </table>
            
            <h4>Key Refactorings:</h4>
            <ul>
              <li>Split 600+ line component into focused sub-components</li>
              <li>Created dedicated DesignCanvas for fabric.js operations</li>
              <li>Separated text and image editing controls</li>
              <li>Implemented proper component communication</li>
              <li>Added error boundaries for resilience</li>
            </ul>
          </div>
        </div>
        
        <div class="report-section">
          <h2>Operation Performance</h2>
          
          <div class="report-card">
            <h3>Canvas Operations</h3>
            
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Export Operation</div>
                <div class="metric-value">${canvasResults.exportResults.timing.mean.toFixed(2)}ms</div>
                <div>Average of ${canvasResults.exportResults.iterations} operations</div>
              </div>
              
              <div class="metric-card">
                <div class="metric-label">Object Manipulation</div>
                <div class="metric-value">${canvasResults.manipulationResults.timing.mean.toFixed(2)}ms</div>
                <div>Average of ${canvasResults.manipulationResults.iterations} operations</div>
              </div>
            </div>
            
            <h4>Optimizations:</h4>
            <ul>
              <li>Batch canvas operations where possible</li>
              <li>Optimized object selection and manipulation</li>
              <li>Deferred rendering until all changes are applied</li>
              <li>Limited unnecessary canvas redraws</li>
            </ul>
          </div>
          
          <div class="report-card">
            <h3>Component Updates</h3>
            <p>
              This benchmark measures the time to update properties in the ImageControls component,
              including opacity, brightness, and contrast adjustments.
            </p>
            
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Mean Update Time</td>
                  <td>${imageControlsResults.timing.mean.toFixed(2)}ms</td>
                </tr>
                <tr>
                  <td>Median Update Time</td>
                  <td>${imageControlsResults.timing.median.toFixed(2)}ms</td>
                </tr>
                <tr>
                  <td>P95 Update Time</td>
                  <td>${imageControlsResults.timing.p95.toFixed(2)}ms</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="recommendations">
          <h3>Recommendations for Further Optimization</h3>
          <ul>
            <li>
              <strong>Code Splitting and Lazy Loading:</strong> Apply lazy loading to more routes and heavy components
              to reduce initial load time
            </li>
            <li>
              <strong>Virtualization:</strong> Implement virtualized lists for components that display large datasets
            </li>
            <li>
              <strong>Precompute Complex Operations:</strong> Cache or memoize expensive canvas operations to reduce 
              processing time
            </li>
            <li>
              <strong>Web Workers:</strong> Move heavy computations to web workers to prevent UI blocking
            </li>
            <li>
              <strong>Browser Rendering Optimizations:</strong> Optimize CSS animations and transitions to use GPU
              acceleration where possible
            </li>
          </ul>
        </div>
        
        <footer>
          <p>
            Generated on ${new Date().toLocaleString()}
            <br>
            <span class="timestamp">T-Shirt Customizer Performance Report</span>
          </p>
        </footer>
      </div>
    </body>
    </html>
  `;
}

/**
 * Save the performance report to a file
 * 
 * @param {string} reportHTML - HTML content of the report
 * @returns {Promise<string>} - Path to the saved file
 */
export async function saveReportToFile(reportHTML) {
  // Note: This function would use FileSystem APIs in a Node.js environment
  // For browser environments, we'll use the download attribute or Blob
  try {
    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `tshirt-customizer-performance-report-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return a.download;
  } catch (error) {
    console.error('Error saving report:', error);
    throw error;
  }
}

/**
 * Generate and display the report in a new window
 * 
 * @returns {Promise<Window>} - Window object containing the report
 */
export async function showReportInWindow() {
  try {
    const reportHTML = await generateComprehensiveReport();
    const reportWindow = window.open('', '_blank');
    
    if (!reportWindow) {
      throw new Error('Unable to open new window. Please check your popup blocker settings.');
    }
    
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
    
    return reportWindow;
  } catch (error) {
    console.error('Error showing report:', error);
    throw error;
  }
} 