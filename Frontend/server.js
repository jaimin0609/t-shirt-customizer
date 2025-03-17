// Server-side rendering implementation for Uniqverse
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import compression from 'compression';
import serialize from 'serialize-javascript';
import { createRequire } from 'module';

// Get current directory using ES modules pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Import the App component (this path will be resolved after building)
import App from './dist/server/App.js';

// Import manifest for asset mapping
let manifest = {};
try {
  manifest = require('./dist/client/ssr-manifest.json');
} catch (err) {
  console.log('No manifest found. Running in development mode.');
}

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Enable gzip compression
app.use(compression());

// Serve static files
app.use(express.static(path.join(__dirname, 'dist/client'), {
  maxAge: '1y',
  etag: false
}));

// Parse JSON bodies
app.use(express.json());

// Route handler for all requests
app.get('*', async (req, res) => {
  try {
    // Read the index.html template
    let template = fs.readFileSync(
      path.join(__dirname, 'dist/client/index.html'),
      'utf-8'
    );

    // Initial state for dehydration (would be populated from API calls or database)
    const initialState = {
      auth: { isAuthenticated: false },
      cart: { items: [] },
      wishlist: { items: [] },
      settings: { theme: 'light' }
    };

    // Render the app to a string
    const appHtml = ReactDOMServer.renderToString(
      React.createElement(
        StaticRouter,
        { location: req.url },
        React.createElement(App, { initialState })
      )
    );

    // Inject the rendered app into the template
    const html = template
      .replace('<div id="root">', `<div id="root">${appHtml}`)
      .replace(
        '</head>',
        `<script>window.__INITIAL_STATE__ = ${serialize(initialState)}</script></head>`
      );

    // Set appropriate headers
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // Send the rendered HTML
    return res.send(html);
  } catch (error) {
    console.error('Error rendering app:', error);
    
    // In production, send a more generic error page
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).send('Server Error');
    }
    
    // In development, send the error details
    return res.status(500).send(`
      <h1>Server Error</h1>
      <pre>${error.stack}</pre>
    `);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
}); 