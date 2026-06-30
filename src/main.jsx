import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// Phase 3: multi-country
import { AdminCountryProvider } from './contexts/AdminCountryContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AdminCountryProvider>
      <App />
    </AdminCountryProvider>
  </StrictMode>,
)
