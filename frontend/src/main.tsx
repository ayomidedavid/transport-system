import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './app/globals.css';

if (typeof window !== 'undefined' && window.location.pathname === '/') {
  document.body.classList.add('landing-theme');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
