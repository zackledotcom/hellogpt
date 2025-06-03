import React from 'react';
import ReactDOM from 'react-dom/client';
import AppLayout from './components/AppLayout';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import './index.css';

console.log('Renderer process started and main.tsx is executing.');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppLayout />
    </ThemeProvider>
    <Toaster position="bottom-right" />
  </React.StrictMode>,
);
