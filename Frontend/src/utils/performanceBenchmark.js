/**
 * Performance Benchmark Utility
 * 
 * This utility helps measure component performance and generate benchmark reports
 * for comparing performance before and after optimizations.
 */

import { startTiming } from './performanceMonitor';

// Constants for benchmark configuration
const DEFAULT_ITERATIONS = 50;
const WARMUP_ITERATIONS = 5;

/**
 * Run a performance benchmark for a specific operation
 * 
 * @param {Object} options - Benchmark options
 * @param {string} options.name - Name of the benchmark
 * @param {Function} options.setup - Setup function to run before each iteration
 * @param {Function} options.teardown - Teardown function to run after each iteration
 * @param {Function} options.operation - Function to benchmark
 * @param {number} options.iterations - Number of iterations to run (default: 50)
 * @param {boolean} options.useWarmup - Whether to use warmup iterations (default: true)
 * @returns {Object} - Benchmark results
 */
export async function runBenchmark({
  name,
  setup = () => {},
  teardown = () => {},
  operation,
  iterations = DEFAULT_ITERATIONS,
  useWarmup = true
}) {
  if (!operation || typeof operation !== 'function') {
    throw new Error('A valid operation function is required for benchmarking');
  }

  console.log(`🔍 Starting benchmark: ${name}`);
  
  // Perform warmup iterations if enabled
  if (useWarmup && WARMUP_ITERATIONS > 0) {
    console.log(`🔥 Performing ${WARMUP_ITERATIONS} warmup iterations...`);
    for (let i = 0; i < WARMUP_ITERATIONS; i++) {
      await setup();
      await operation();
      await teardown();
    }
  }

  // Run the actual benchmark iterations
  const durations = [];
  const memoryUsage = [];
  
  for (let i = 0; i < iterations; i++) {
    // Setup
    await setup();
    
    // Collect garbage if possible to reduce noise
    if (window.gc) {
      window.gc();
    }
    
    // Measure memory before operation
    const memoryBefore = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    // Measure operation
    const endTiming = startTiming(`benchmark:${name}:iteration${i}`);
    await operation();
    const result = endTiming();
    
    // Measure memory after operation
    const memoryAfter = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    // Record measurements
    durations.push(result.duration);
    memoryUsage.push(memoryAfter - memoryBefore);
    
    // Teardown
    await teardown();
    
    // Log progress for long benchmarks
    if (iterations > 10 && (i + 1) % 10 === 0) {
      console.log(`⏱️ Completed ${i + 1}/${iterations} iterations`);
    }
  }

  // Calculate statistics
  const stats = calculateStats(durations);
  const memoryStats = calculateStats(memoryUsage);
  
  const results = {
    name,
    iterations,
    timing: {
      ...stats,
      raw: durations
    },
    memory: memoryUsage[0] > 0 ? {
      ...memoryStats,
      raw: memoryUsage
    } : null
  };
  
  console.log(`✅ Benchmark completed: ${name}`);
  console.log(`📊 Results: Avg: ${stats.mean.toFixed(2)}ms, Min: ${stats.min.toFixed(2)}ms, Max: ${stats.max.toFixed(2)}ms`);
  
  return results;
}

/**
 * Run multiple benchmarks and generate a comparison report
 * 
 * @param {Object[]} benchmarks - Array of benchmark configurations
 * @returns {Object} - Comparison report
 */
export async function runBenchmarkComparison(benchmarks) {
  if (!Array.isArray(benchmarks) || benchmarks.length < 2) {
    throw new Error('At least two benchmarks are required for comparison');
  }
  
  console.log(`🔍 Starting benchmark comparison with ${benchmarks.length} benchmarks`);
  
  const results = [];
  
  for (const benchmark of benchmarks) {
    const result = await runBenchmark(benchmark);
    results.push(result);
  }
  
  // Generate comparison
  const comparison = {
    benchmarks: results,
    comparisons: []
  };
  
  // Compare benchmarks (comparing each to the first one)
  const baseline = results[0];
  
  for (let i = 1; i < results.length; i++) {
    const current = results[i];
    
    const timingDiff = calculateDifference(
      baseline.timing.mean, 
      current.timing.mean
    );
    
    let memoryDiff = null;
    if (baseline.memory && current.memory) {
      memoryDiff = calculateDifference(
        baseline.memory.mean,
        current.memory.mean
      );
    }
    
    comparison.comparisons.push({
      baseline: baseline.name,
      current: current.name,
      timing: timingDiff,
      memory: memoryDiff
    });
    
    console.log(`📊 Comparison: ${current.name} vs ${baseline.name}`);
    console.log(`   Time:   ${timingDiff.percentChange > 0 ? '🔴' : '🟢'} ${Math.abs(timingDiff.percentChange).toFixed(2)}% (${timingDiff.absoluteChange.toFixed(2)}ms)`);
    
    if (memoryDiff) {
      console.log(`   Memory: ${memoryDiff.percentChange > 0 ? '🔴' : '🟢'} ${Math.abs(memoryDiff.percentChange).toFixed(2)}% (${formatBytes(memoryDiff.absoluteChange)})`);
    }
  }
  
  return comparison;
}

/**
 * Benchmark React component rendering performance
 * 
 * @param {Object} options - Benchmark options
 * @param {JSX.Element} options.component - Component to benchmark
 * @param {Function} options.render - Function to render the component
 * @param {Function} options.unmount - Function to unmount the component
 * @param {Object} options.props - Props to pass to the component
 * @param {number} options.iterations - Number of iterations (default: 50)
 * @returns {Object} - Benchmark results
 */
export async function benchmarkComponent({
  component,
  render,
  unmount,
  props = {},
  iterations = DEFAULT_ITERATIONS
}) {
  return runBenchmark({
    name: `Component: ${component.displayName || component.name || 'Anonymous'}`,
    setup: () => {},
    operation: () => render(component, props),
    teardown: unmount,
    iterations
  });
}

/**
 * Calculate basic statistics for an array of values
 * 
 * @param {number[]} values - Array of numeric values
 * @returns {Object} - Statistics object
 */
function calculateStats(values) {
  if (!values.length) return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0 };
  
  // Sort values for percentile calculations
  const sortedValues = [...values].sort((a, b) => a - b);
  
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  
  const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
  const variance = squaredDifferences.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    min: sortedValues[0],
    max: sortedValues[sortedValues.length - 1],
    mean,
    median: calculateMedian(sortedValues),
    p95: calculatePercentile(sortedValues, 95),
    p99: calculatePercentile(sortedValues, 99),
    stdDev
  };
}

/**
 * Calculate the median value of a sorted array
 * 
 * @param {number[]} sortedValues - Sorted array of values
 * @returns {number} - Median value
 */
function calculateMedian(sortedValues) {
  const mid = Math.floor(sortedValues.length / 2);
  return sortedValues.length % 2 === 0
    ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
    : sortedValues[mid];
}

/**
 * Calculate a percentile value from a sorted array
 * 
 * @param {number[]} sortedValues - Sorted array of values
 * @param {number} percentile - Percentile to calculate (0-100)
 * @returns {number} - Percentile value
 */
function calculatePercentile(sortedValues, percentile) {
  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  return sortedValues[Math.min(index, sortedValues.length - 1)];
}

/**
 * Calculate difference statistics between two values
 * 
 * @param {number} baseline - Baseline value
 * @param {number} current - Current value
 * @returns {Object} - Difference statistics
 */
function calculateDifference(baseline, current) {
  const absoluteChange = current - baseline;
  const percentChange = baseline === 0 
    ? (current === 0 ? 0 : Infinity) 
    : (absoluteChange / baseline) * 100;
    
  return {
    baseline,
    current,
    absoluteChange,
    percentChange,
    improved: percentChange < 0
  };
}

/**
 * Format bytes as a human-readable string
 * 
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted string
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Save benchmark results to localStorage
 * 
 * @param {string} key - Storage key
 * @param {Object} results - Benchmark results
 */
export function saveBenchmarkResults(key, results) {
  try {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      results
    };
    
    // Load existing data
    const existingData = loadBenchmarkHistory(key) || [];
    
    // Add new entry
    existingData.push(entry);
    
    // Save back to localStorage
    localStorage.setItem(`benchmark_${key}`, JSON.stringify(existingData));
    
    console.log(`📝 Benchmark results saved with key: ${key}`);
    return true;
  } catch (error) {
    console.error('Failed to save benchmark results:', error);
    return false;
  }
}

/**
 * Load benchmark history from localStorage
 * 
 * @param {string} key - Storage key
 * @returns {Object[]} - Array of benchmark entries
 */
export function loadBenchmarkHistory(key) {
  try {
    const data = localStorage.getItem(`benchmark_${key}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load benchmark history:', error);
    return null;
  }
}

/**
 * Generate a performance report comparing before/after optimizations
 * 
 * @param {Object} before - Before benchmark results
 * @param {Object} after - After benchmark results
 * @returns {string} - HTML report
 */
export function generatePerformanceReport(before, after) {
  if (!before || !after) {
    return '<div>Missing benchmark data</div>';
  }
  
  const comparison = {
    timing: calculateDifference(
      before.timing.mean,
      after.timing.mean
    ),
    memory: before.memory && after.memory ? calculateDifference(
      before.memory.mean,
      after.memory.mean
    ) : null
  };
  
  // Generate HTML report
  const improvedClass = comparison.timing.improved ? 'improved' : 'degraded';
  const timingIcon = comparison.timing.improved ? '✅' : '⚠️';
  const memoryIcon = comparison.memory?.improved ? '✅' : '⚠️';
  
  return `
    <style>
      .benchmark-report {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .benchmark-report h2 {
        margin-top: 0;
        color: #333;
      }
      .benchmark-report table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      .benchmark-report th, .benchmark-report td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }
      .benchmark-report th {
        background-color: #f1f1f1;
      }
      .benchmark-report .summary {
        display: flex;
        margin-bottom: 20px;
        gap: 20px;
      }
      .benchmark-report .metric {
        flex: 1;
        padding: 15px;
        border-radius: 6px;
        background: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .benchmark-report .metric h3 {
        margin-top: 0;
        margin-bottom: 5px;
        color: #555;
      }
      .benchmark-report .change {
        font-size: 24px;
        font-weight: bold;
      }
      .benchmark-report .improved {
        color: #28a745;
      }
      .benchmark-report .degraded {
        color: #dc3545;
      }
      .benchmark-report .chart-container {
        margin-top: 20px;
        height: 300px;
      }
    </style>
    
    <div class="benchmark-report">
      <h2>Performance Optimization Report</h2>
      
      <div class="summary">
        <div class="metric">
          <h3>Render Time ${timingIcon}</h3>
          <div class="change ${improvedClass}">
            ${comparison.timing.improved ? '↓' : '↑'} ${Math.abs(comparison.timing.percentChange).toFixed(2)}%
          </div>
          <div>
            Before: ${before.timing.mean.toFixed(2)}ms
            <br />
            After: ${after.timing.mean.toFixed(2)}ms
          </div>
        </div>
        
        ${comparison.memory ? `
        <div class="metric">
          <h3>Memory Usage ${memoryIcon}</h3>
          <div class="change ${comparison.memory.improved ? 'improved' : 'degraded'}">
            ${comparison.memory.improved ? '↓' : '↑'} ${Math.abs(comparison.memory.percentChange).toFixed(2)}%
          </div>
          <div>
            Before: ${formatBytes(before.memory.mean)}
            <br />
            After: ${formatBytes(after.memory.mean)}
          </div>
        </div>
        ` : ''}
      </div>
      
      <h3>Detailed Timing Statistics</h3>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Before</th>
            <th>After</th>
            <th>Change</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Mean</td>
            <td>${before.timing.mean.toFixed(2)}ms</td>
            <td>${after.timing.mean.toFixed(2)}ms</td>
            <td class="${improvedClass}">${comparison.timing.improved ? '-' : '+'}${Math.abs(comparison.timing.absoluteChange).toFixed(2)}ms</td>
          </tr>
          <tr>
            <td>Median</td>
            <td>${before.timing.median.toFixed(2)}ms</td>
            <td>${after.timing.median.toFixed(2)}ms</td>
            <td class="${before.timing.median > after.timing.median ? 'improved' : 'degraded'}">${before.timing.median > after.timing.median ? '-' : '+'}${Math.abs(before.timing.median - after.timing.median).toFixed(2)}ms</td>
          </tr>
          <tr>
            <td>95th Percentile</td>
            <td>${before.timing.p95.toFixed(2)}ms</td>
            <td>${after.timing.p95.toFixed(2)}ms</td>
            <td class="${before.timing.p95 > after.timing.p95 ? 'improved' : 'degraded'}">${before.timing.p95 > after.timing.p95 ? '-' : '+'}${Math.abs(before.timing.p95 - after.timing.p95).toFixed(2)}ms</td>
          </tr>
          <tr>
            <td>Standard Deviation</td>
            <td>${before.timing.stdDev.toFixed(2)}ms</td>
            <td>${after.timing.stdDev.toFixed(2)}ms</td>
            <td class="${before.timing.stdDev > after.timing.stdDev ? 'improved' : 'degraded'}">${before.timing.stdDev > after.timing.stdDev ? '-' : '+'}${Math.abs(before.timing.stdDev - after.timing.stdDev).toFixed(2)}ms</td>
          </tr>
        </tbody>
      </table>
      
      <h3>Summary</h3>
      <p>
        The optimized version shows a <strong class="${improvedClass}">${Math.abs(comparison.timing.percentChange).toFixed(2)}% ${comparison.timing.improved ? 'improvement' : 'degradation'}</strong> 
        in render time compared to the original version.
        ${comparison.memory ? 
          `Memory usage ${comparison.memory.improved ? 'decreased' : 'increased'} by 
          <strong class="${comparison.memory.improved ? 'improved' : 'degraded'}">${Math.abs(comparison.memory.percentChange).toFixed(2)}%</strong>.` 
          : ''}
      </p>
    </div>
  `;
} 