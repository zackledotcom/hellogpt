import React from 'react';
import ReactDOM from 'react-dom/client';
import Chat from './components/Chat.tsx';
import './index.css';

console.log('Renderer process started and main.jsx is executing.');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Chat />
  </React.StrictMode>,
);
