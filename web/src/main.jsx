import React from 'react';
import { createRoot } from 'react-dom/client';
import Shop from './Shop.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Shop />
  </React.StrictMode>
);
