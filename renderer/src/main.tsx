import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppLayout } from './components/AppLayout';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppLayout />
      <Toaster position="bottom-right" />
    </ThemeProvider>
  </React.StrictMode>
); 