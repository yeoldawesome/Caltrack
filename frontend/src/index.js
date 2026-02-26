import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
// Remove default body margin and match app background to avoid white border
document.body.style.margin = '0';
document.body.style.background = '#181c20';
document.body.style.color = '#f5f6fa';
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
