// import { StrictMode } from 'react'  // Removed to prevent double API calls
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// StrictMode removed to prevent double API calls in development
// Re-enable for production builds if needed
createRoot(document.getElementById('root')!).render(
  <App />
)
