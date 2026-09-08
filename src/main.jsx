import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './context/AuthContext';
import { PresenceProvider } from './context/PresenceContext';
import { AudioProvider } from './context/AudioContext';


import { VoiceProvider } from './context/VoiceContext';
import { GameEngineSync } from './store/gameStore';
import { MultiplayerEngineSync } from './store/multiplayerStore';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';
import App from './App.jsx'
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const renderApp = () => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <GlobalErrorBoundary>
        <Router>
          <AuthProvider>
            <PresenceProvider>
              <AudioProvider>
                  <VoiceProvider>
                      <App />
                      <GameEngineSync />
                      <MultiplayerEngineSync />
                  </VoiceProvider>
              </AudioProvider>
            </PresenceProvider>
          </AuthProvider>
        </Router>
      </GlobalErrorBoundary>
    </StrictMode>,
  );
};

const hydrateAndPatchStorage = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const prefKeys = await Preferences.keys();

    // 1. Migration Logic: If Native Storage is empty, but localStorage has data
    if (prefKeys.keys.length === 0 && localStorage.length > 0) {
      console.log('[Native Storage] First boot: Migrating existing localStorage to Native Preferences...');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        if (value !== null) {
          await Preferences.set({ key, value });
        }
      }
      console.log('[Native Storage] Migration complete.');
    } else {
      // 2. Normal Boot: Hydrate localStorage from Native Preferences
      for (const key of prefKeys.keys) {
        const { value } = await Preferences.get({ key });
        if (value !== null) {
          localStorage.setItem(key, value);
        }
      }
    }

    // 3. Monkey-Patch localStorage.setItem, removeItem, and clear
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (key, value) {
      originalSetItem.apply(this, arguments);
      Preferences.set({ key, value: String(value) }).catch(e => console.warn('[Native Storage] Set failed:', e));
    };

    const originalRemoveItem = localStorage.removeItem;
    localStorage.removeItem = function (key) {
      originalRemoveItem.apply(this, arguments);
      Preferences.remove({ key }).catch(e => console.warn('[Native Storage] Remove failed:', e));
    };
    
    const originalClear = localStorage.clear;
    localStorage.clear = function () {
      originalClear.apply(this, arguments);
      Preferences.clear().catch(e => console.warn('[Native Storage] Clear failed:', e));
    };

    console.log('[Native Storage] Monkey-patch successful.');
  } catch (e) {
    console.error('[Native Storage] Initialization failed:', e);
  }
};

const initApp = async () => {
  await hydrateAndPatchStorage();

  // Ensure the splash screen animation completes its 2s loops without getting cut off
  const splashStart = window.__SPLASH_START_TIME__ || Date.now();
  const elapsed = Date.now() - splashStart;
  const loopDuration = 2000; 

  let waitTime = 0;
  if (elapsed < loopDuration) {
      waitTime = loopDuration - elapsed; // Wait for the first loop to finish
  } else {
      const remainder = elapsed % loopDuration;
      if (remainder > 50) {
          waitTime = loopDuration - remainder; // Wait for the current loop to finish
      }
  }

  if (waitTime > 0) {
      setTimeout(renderApp, waitTime);
  } else {
      renderApp();
  }

  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW reg fail:', err));
    });
  }
};

initApp();
