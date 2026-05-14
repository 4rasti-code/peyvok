/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useUser } from './AuthContext';
import { 
  playPopSfx, 
  playNotifSfx, 
  playMessageSfx,
  playMessageSentSfx,
  playVictorySfx,
  playRewardSfx, 
  playPurchaseSfx, 
  playBoosterSfx, 
  playBubblePopSfx,
  playSettingsOpenSfx, 
  playSettingsCloseSfx,
  playDailyOpenSfx,
  playDailyClaimSfx,
  playTabSfx,
  playAlertSfx,
  playBackSfx,
  playSaveSfx,
  playStartGameSfx,
  startSearchingSfx,
  stopSearchingSfx,
  playRightLetterSfx,
  setBackgroundMusicVolume,
  startBackgroundMusic, 
  stopBackgroundMusic
} from '../utils/audio';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const { user } = useUser();
  const [appSfxVolume, setAppSfxVolume] = useState(() => {
    const saved = localStorage.getItem('peyvchin_sfx_volume');
    return saved !== null ? Number(saved) : 20; 
  });
  const [bgMusicVolume, setBgMusicVolume] = useState(() => {
    const saved = localStorage.getItem('peyvchin_bg_music_volume');
    return saved !== null ? Number(saved) : 10;
  });

  const setAppSfxVolumeGuarded = useCallback((val) => {
    setAppSfxVolume(prev => prev !== val ? val : prev);
  }, []);

  const setBgMusicVolumeGuarded = useCallback((val) => {
    setBgMusicVolume(prev => prev !== val ? val : prev);
  }, []);

  const appSoundsEnabled = appSfxVolume > 0;
  const audioStateRef = useRef({ user, appSfxVolume, bgMusicVolume });

  useEffect(() => {
    audioStateRef.current = { user, appSfxVolume, bgMusicVolume };
  }, [user, appSfxVolume, bgMusicVolume]);

  const playPopSound = useCallback((bypass = false) => playPopSfx(appSoundsEnabled, bypass), [appSoundsEnabled]);
  const playNotifSound = useCallback(() => playNotifSfx(appSoundsEnabled), [appSoundsEnabled]);
  const playMessageSound = useCallback(() => playMessageSfx(appSoundsEnabled), [appSoundsEnabled]);
  const playMessageSentSound = useCallback(() => playMessageSentSfx(appSoundsEnabled), [appSoundsEnabled]);
  const playVictorySound = useCallback(() => playVictorySfx(appSoundsEnabled), [appSoundsEnabled]);
  const playRewardSound = useCallback(() => playRewardSfx(appSoundsEnabled), [appSoundsEnabled]);
  const playPurchaseSound = useCallback(() => playPurchaseSfx(appSoundsEnabled), [appSoundsEnabled]);
  const playBoosterSound = useCallback(() => playBoosterSfx(appSoundsEnabled), [appSoundsEnabled]);
  const playBubblePopSound = useCallback(() => playBubblePopSfx(appSoundsEnabled), [appSoundsEnabled]);
  const playSettingsOpenSound = useCallback(() => playSettingsOpenSfx(appSoundsEnabled), [appSoundsEnabled]);
  const playSettingsCloseSound = useCallback(() => playSettingsCloseSfx(appSoundsEnabled), [appSoundsEnabled]);
  const playTabSound = useCallback(() => playTabSfx(appSoundsEnabled), [appSoundsEnabled]);
  const playAlertSound = useCallback(() => playAlertSfx(appSoundsEnabled), [appSoundsEnabled]);
  const playBackSound = useCallback(() => playBackSfx(appSoundsEnabled), [appSoundsEnabled]);
  const playSaveSound = useCallback(() => playSaveSfx(appSoundsEnabled), [appSoundsEnabled]);
  const playStartGameSound = useCallback(() => { try { playStartGameSfx(appSoundsEnabled); } catch { console.warn("Audio fail"); } }, [appSoundsEnabled]);
  const playRightLetterSound = useCallback((vol = 1.0) => playRightLetterSfx(appSoundsEnabled, vol), [appSoundsEnabled]);
  const startSearchingSound = useCallback(() => { try { startSearchingSfx(); } catch { console.warn("Audio fail"); } }, []);
  const stopSearchingSound = useCallback((fade = true) => stopSearchingSfx(fade), []);
  const startBGM = useCallback(() => startBackgroundMusic(), []);
  const stopBGM = useCallback(() => stopBackgroundMusic(), []);

  const updateMusicVolume = useCallback((val) => {
    setBgMusicVolumeGuarded(val);
    localStorage.setItem('peyvchin_bg_music_volume', val.toString());
    setBackgroundMusicVolume(val / 100);
  }, [setBgMusicVolumeGuarded]);

  const updateSfxVolume = useCallback((val) => {
    setAppSfxVolumeGuarded(val);
    localStorage.setItem('peyvchin_sfx_volume', val.toString());
    import('../utils/audio').then(m => m.setSfxVolume(val / 100));
  }, [setAppSfxVolumeGuarded]);

  useEffect(() => { setBackgroundMusicVolume(bgMusicVolume / 100); }, [bgMusicVolume]);

  const value = useMemo(() => ({
    appSfxVolume, setAppSfxVolume, bgMusicVolume, setBgMusicVolume, appSoundsEnabled,
    playPopSound, playNotifSound, playMessageSound, playMessageSentSound,
    playVictorySound, playRewardSound, playPurchaseSound, playBoosterSound,
    playBubblePopSound, playSettingsOpenSound, playSettingsCloseSound,
    playTabSound, playAlertSound, playBackSound, playSaveSound, playStartGameSound,
    playRightLetterSound,
    startSearchingSound, stopSearchingSound, startBGM, stopBGM,
    updateMusicVolume, updateSfxVolume,
    playDailyOpenSfx, playDailyClaimSfx
  }), [
    appSfxVolume, bgMusicVolume, appSoundsEnabled, playPopSound, playNotifSound, 
    playMessageSound, playMessageSentSound, playVictorySound, playRewardSound, 
    playPurchaseSound, playBoosterSound, playBubblePopSound, playSettingsOpenSound, 
    playSettingsCloseSound, playTabSound, playAlertSound, playBackSound, playSaveSound, 
    playStartGameSound, playRightLetterSound, startSearchingSound, stopSearchingSound, startBGM, stopBGM, 
    updateMusicVolume, updateSfxVolume
  ]);

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within an AudioProvider');
  return context;
};
