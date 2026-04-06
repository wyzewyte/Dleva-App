// This is the content for d:\Dleva\dleva-frontend\src\main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './modules/auth/context/AuthContext'; // 1. Import the AuthProvider
import { CartProvider } from './modules/buyer/context/CartContext'; // 2. Also import CartProvider

if (typeof window !== 'undefined') {
  window.__DLEVA_REACT__ = React;
  console.debug('[bootstrap] React runtime loaded', {
    version: React.version,
    sameAsGlobal: window.__DLEVA_REACT__ === React,
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 3. Wrap your entire App with the providers */}
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);
