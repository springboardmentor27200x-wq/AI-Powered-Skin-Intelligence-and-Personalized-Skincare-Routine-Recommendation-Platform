import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// Dynamic API hostname rewriting:
// When running on AWS EC2 or any remote host, automatically redirect
// all 127.0.0.1:5000 or localhost:5000 requests to the current server IP on port 5000.
const currentHost = window.location.hostname;
const isLocal = currentHost === 'localhost' || currentHost === '127.0.0.1';
const targetApiHost = isLocal ? '127.0.0.1' : currentHost;

axios.interceptors.request.use((config) => {
  if (config.url) {
    if (config.url.includes('127.0.0.1:5000')) {
      config.url = config.url.replace('127.0.0.1:5000', `${targetApiHost}:5000`);
    } else if (config.url.includes('localhost:5000')) {
      config.url = config.url.replace('localhost:5000', `${targetApiHost}:5000`);
    }
  }
  return config;
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
