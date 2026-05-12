import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './context/AuthContext';
import { AudioProvider } from './context/AudioContext';
import { GameProvider } from './context/GameContext';
import { MultiplayerProvider } from './context/MultiplayerContext';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <Router>
        <AuthProvider>
          <AudioProvider>
            <GameProvider>
              <MultiplayerProvider>
                <App />
              </MultiplayerProvider>
            </GameProvider>
          </AudioProvider>
        </AuthProvider>
      </Router>
    </GlobalErrorBoundary>
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW reg fail:', err));
  });
}
