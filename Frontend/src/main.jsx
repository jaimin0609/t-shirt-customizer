import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Import tailwind directly - but don't do it twice
// import 'tailwindcss/tailwind.css'

// Force CSS to be reprocessed in production
if (process.env.NODE_ENV === 'production') {
  console.log('Production build initialized:', new Date().toISOString())
} else {
  console.log('Development mode active - CSS hot reloading enabled')
}

// Remove loading indicator once app is mounted
const removeLoadingIndicator = () => {
  const loadingElement = document.querySelector('.app-loading')
  if (loadingElement) {
    loadingElement.style.opacity = '0'
    loadingElement.style.transition = 'opacity 0.5s ease'
    setTimeout(() => {
      loadingElement.remove()
    }, 500)
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Remove loading indicator after a short delay to ensure app is visible
setTimeout(removeLoadingIndicator, 500)
