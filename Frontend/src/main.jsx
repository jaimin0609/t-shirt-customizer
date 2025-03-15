import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Import tailwind directly - but don't do it twice
// import 'tailwindcss/tailwind.css'

// Force CSS to be reprocessed in production
console.log('Initializing app with Tailwind CSS:', new Date().toISOString())

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
