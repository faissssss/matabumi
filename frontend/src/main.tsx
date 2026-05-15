import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import App from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

// Set initial theme
const theme = localStorage.getItem('matabumi-theme') || 'dark';
document.documentElement.classList.add(theme);

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
