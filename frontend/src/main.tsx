import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import App from './App';

// Ensure theme is set on initial load
if (!document.documentElement.classList.contains('dark') && !document.documentElement.classList.contains('light')) {
  const savedTheme = localStorage.getItem('matabumi-theme') || 'dark';
  document.documentElement.classList.add(savedTheme);
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
