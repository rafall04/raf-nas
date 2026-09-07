import React from 'react';
import { createRoot } from 'react-dom/client';
import { initTheme } from './lib/theme';
import { SessionProvider } from './state/session';
import { ToastProvider } from './state/toasts';
import { App } from './App';
import './styles/tokens.css';
import './styles/categories.css';
import './styles/global.css';

initTheme();

const el = document.getElementById('root');
if (!el) throw new Error('#root tidak ditemukan');

createRoot(el).render(
  <React.StrictMode>
    <SessionProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </SessionProvider>
  </React.StrictMode>,
);
