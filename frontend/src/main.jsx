import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Ensure browser tab favicon dynamically updates to the DermaIQ brand logo
if (typeof document !== 'undefined') {
  const setTabFavicon = () => {
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/svg+xml';
    link.href = '/favicon.svg?v=dermaiq_' + Date.now();
  };
  setTabFavicon();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
