import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider>
        <App />
        {/* 🔥 Ekdum perfect single-tag syntax */}
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#1f1f26',
              color: '#fff',
              border: '1px solid #2e2e38'
            }
          }} 
        />
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>,
);