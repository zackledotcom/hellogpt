import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Chat } from './components/Chat'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Chat />
  </StrictMode>,
)
