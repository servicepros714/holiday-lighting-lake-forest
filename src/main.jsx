// Global CSS is imported FIRST so component CSS modules load after it and can
// extend `.container` / `.btn` without being overridden (container-specificity fix).
import './styles/global.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
