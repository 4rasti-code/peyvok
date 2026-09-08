/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { safeStorageGet, safeStorageSet } from '../utils/safeParse';
import { supabase } from '../lib/supabase';
import { useUser } from './AuthContext';
import { 
 playPopSfx, 
 playNotifSfx, 
 playInviteSfx,
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
 playWrongPlaceSfx,
 setBackgroundMusicVolume,
 startBackgroundMusic, 
 stopBackgroundMusic,
 playHeartbeatSfx,
 playNoberaSfx,
 playPalawanSfx,
 playExpertSfx,
 playMamostaSfx,
 playShanaziKurdistanSfx,
 playShanaziJihaniSfx
} from '../utils/audio';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
 const { user, profileData } = useUser();
 const [appSfxVolume, setAppSfxVolume] = useState(() => {
 const saved = safeStorageGet('peyvchin_sfx_volume');
 return saved !== null ? Number(saved) : 20; 
 });
 const [bgMusicVolume, setBgMusicVolume] = useState(() => {
 const saved = safeStorageGet('peyvchin_bg_music_volume');
 return saved !== null ? Number(saved) : 3;
 });

 const setAppSfxVolumeGuarded = useCallback((val) => {
 setAppSfxVolume(prev => prev !== val ? val : prev);
 }, []);

 const setBgMusicVolumeGuarded = useCallback((val) => {
 setBgMusicVolume(prev => prev !== val ? val : prev);
 }, []);

 const appSoundsEnabled = appSfxVolume > 0;
 const audioStateRef = useRef({ user, appSfxVolume, bgMusicVolume });
 const dbSyncTimeoutRef = useRef(null);

 // Sync from DB to local when profile loads
 useEffect(() => {
 if (profileData?.sfx_volume !== undefined) {
 setAppSfxVolumeGuarded(profileData.sfx_volume);
 safeStorageSet('peyvchin_sfx_volume', profileData.sfx_volume.toString());
 }
 if (profileData?.bg_music_volume !== undefined) {
 setBgMusicVolumeGuarded(profileData.bg_music_volume);
 safeStorageSet('peyvchin_bg_music_volume', profileData.bg_music_volume.toString());
 }
 }, [profileData?.sfx_volume, profileData?.bg_music_volume, setAppSfxVolumeGuarded, setBgMusicVolumeGuarded]);

 useEffect(() => {
 audioStateRef.current = { user, appSfxVolume, bgMusicVolume };
 }, [user, appSfxVolume, bgMusicVolume]);

 const playPopSound = useCallback((bypass = false) => playPopSfx(appSoundsEnabled, bypass), [appSoundsEnabled]);
 const playHeartbeatSound = useCallback(() => playHeartbeatSfx(appSoundsEnabled), [appSoundsEnabled]);
 const playNotifSound = useCallback(() => playNotifSfx(appSoundsEnabled), [appSoundsEnabled]);
 const playInviteSound = useCallback(() => playInviteSfx(appSoundsEnabled), [appSoundsEnabled]);
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
 const playWrongPlaceSound = useCallback((vol = 1.0) => playWrongPlaceSfx(appSoundsEnabled, vol), [appSoundsEnabled]);
 const startSearchingSound = useCallback(() => { try { startSearchingSfx(); } catch { console.warn("Audio fail"); } }, []);
 const stopSearchingSound = useCallback((fade = true) => stopSearchingSfx(fade), []);
 const startBGM = useCallback(() => startBackgroundMusic(), []);
 const stopBGM = useCallback(() => stopBackgroundMusic(), []);

 const playNoberaSound = useCallback(() => playNoberaSfx(appSoundsEnabled), [appSoundsEnabled]);
 const playPalawanSound = useCallback(() => playPalawanSfx(appSoundsEnabled), [appSoundsEnabled]);
 const playExpertSound = useCallback(() => playExpertSfx(appSoundsEnabled), [appSoundsEnabled]);
 const playMamostaSound = useCallback(() => playMamostaSfx(appSoundsEnabled), [appSoundsEnabled]);
 const playShanaziKurdistanSound = useCallback(() => playShanaziKurdistanSfx(appSoundsEnabled), [appSoundsEnabled]);
 const playShanaziJihaniSound = useCallback(() => playShanaziJihaniSfx(appSoundsEnabled), [appSoundsEnabled]);

  // --- AUDIO EVENT BUS (Clash Royale Style Decoupling) ---
  useEffect(() => {
    const handleAudioEvent = (e) => {
      const action = e.detail?.action;
      if (action === 'startSearching') startSearchingSound();
      else if (action === 'stopSearching') stopSearchingSound();
      else if (action === 'playReward') playRewardSound();
    };
    window.addEventListener('AUDIO_EVENT', handleAudioEvent);
    return () => window.removeEventListener('AUDIO_EVENT', handleAudioEvent);
  }, [startSearchingSound, stopSearchingSound, playRewardSound]);

 const syncToDbDebounced = useCallback((updates) => {
 if (!audioStateRef.current.user?.id) return;
 if (dbSyncTimeoutRef.current) clearTimeout(dbSyncTimeoutRef.current);
 dbSyncTimeoutRef.current = setTimeout(async () => {
 try {
 await supabase.from('profiles').update(updates).eq('id', audioStateRef.current.user.id);
 } catch (e) {
 console.warn("Failed to sync volume to DB", e);
 }
 }, 1000); // 1 second debounce
 }, []);

 const updateMusicVolume = useCallback((val) => {
 setBgMusicVolumeGuarded(val);
 safeStorageSet('peyvchin_bg_music_volume', val.toString());
 setBackgroundMusicVolume(val / 100);
 syncToDbDebounced({ bg_music_volume: val });
 }, [setBgMusicVolumeGuarded, syncToDbDebounced]);

 const updateSfxVolume = useCallback((val) => {
 setAppSfxVolumeGuarded(val);
 safeStorageSet('peyvchin_sfx_volume', val.toString());
 import('../utils/audio').then(m => m.setSfxVolume(val / 100));
 syncToDbDebounced({ sfx_volume: val });
 }, [setAppSfxVolumeGuarded, syncToDbDebounced]);

 useEffect(() => { setBackgroundMusicVolume(bgMusicVolume / 100); }, [bgMusicVolume]);

 const value = useMemo(() => ({
 appSfxVolume, setAppSfxVolume, bgMusicVolume, setBgMusicVolume, appSoundsEnabled,
 playPopSound, playNotifSound, playInviteSound, playMessageSound, playMessageSentSound,
 playVictorySound, playRewardSound, playPurchaseSound, playBoosterSound,
 playBubblePopSound, playSettingsOpenSound, playSettingsCloseSound,
 playTabSound, playAlertSound, playBackSound, playSaveSound, playStartGameSound,
 playRightLetterSound, playWrongPlaceSound, playHeartbeatSound,
 startSearchingSound, stopSearchingSound, startBGM, stopBGM,
 updateMusicVolume, updateSfxVolume,
 playDailyOpenSfx, playDailyClaimSfx,
 playNoberaSound, playPalawanSound, playExpertSound, playMamostaSound, playShanaziKurdistanSound, playShanaziJihaniSound
 }), [
 appSfxVolume, bgMusicVolume, appSoundsEnabled, playPopSound, playNotifSound, playInviteSound, 
 playMessageSound, playMessageSentSound, playVictorySound, playRewardSound, 
 playPurchaseSound, playBoosterSound, playBubblePopSound, playSettingsOpenSound, 
 playSettingsCloseSound, playTabSound, playAlertSound, playBackSound, playSaveSound, 
 playStartGameSound, playRightLetterSound, playWrongPlaceSound, playHeartbeatSound, startSearchingSound, stopSearchingSound, startBGM, stopBGM, 
 updateMusicVolume, updateSfxVolume, playNoberaSound, playPalawanSound, playExpertSound, playMamostaSound, playShanaziKurdistanSound, playShanaziJihaniSound
 ]);

 return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = () => {
 const context = useContext(AudioContext);
 if (!context) throw new Error('useAudio must be used within an AudioProvider');
 return context;
};
