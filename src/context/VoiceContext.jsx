import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { supabase } from '../lib/supabase';

// Disable log upload to prevent adblocker ERR_BLOCKED_BY_CLIENT spam
AgoraRTC.disableLogUpload();
// Set log level to ERROR to prevent console spam
AgoraRTC.setLogLevel(3);

AgoraRTC.onAutoplayFailed = () => {
 alert("براوزەرەکەت ڕێگری کرد لە لێدانی دەنگ! تکایە کرتەیەک (کلیک) لەسەر شاشەکە بکە بۆ ئەوەی دەنگی یاریزانەکە ببیستیت.");
};

const VoiceContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useVoice = () => {
 const context = useContext(VoiceContext);
 if (!context) {
 throw new Error('useVoice must be used within a VoiceProvider');
 }
 return context;
};

export const VoiceProvider = ({ children }) => {
 const [client, setClient] = useState(null);
 const [localAudioTrack, setLocalAudioTrack] = useState(null);
 const [isInChannel, setIsInChannel] = useState(false);
 const [isMuted, setIsMuted] = useState(() => localStorage.getItem('voice_muted') === 'true');
 const [remoteUsers, setRemoteUsers] = useState({});
 const [isDeafened, setIsDeafened] = useState(() => localStorage.getItem('voice_deafened') === 'true');
 const isDeafenedRef = useRef(localStorage.getItem('voice_deafened') === 'true');
 const remoteUsersRef = useRef({});
 const [activeSpeakers, setActiveSpeakers] = useState({});
 const [appId, setAppId] = useState(null);

 const clientRef = useRef(null);

 // Fetch Agora App ID from Supabase on mount
 useEffect(() => {
 const fetchAppId = async () => {
 try {
 // We assume the App ID is stored in 'app_settings' table
 const { data, error } = await supabase
 .from('app_settings')
 .select('value')
 .eq('key', 'agora_app_id')
 .single();

 if (error) {
 console.error("Failed to fetch Agora App ID from Supabase:", error);
 setAppId('c1d5e8e055f44d5fa88d6193fd8c471c'); // Unsecure fallback
 return;
 }

 if (data && data.value) {
 // If the DB still has the old secure token, force the unsecure one for now
 if (data.value === 'abd8d6e8729546f69c47ebfc8a617069') {
 setAppId('c1d5e8e055f44d5fa88d6193fd8c471c');
 } else {
 setAppId(data.value);
 }
 } else {
 setAppId('c1d5e8e055f44d5fa88d6193fd8c471c'); // Unsecure fallback
 }
 } catch (err) {
 console.error("Error fetching Agora App ID:", err);
 }
 };

 fetchAppId();
 }, []);

 const isJoiningRef = useRef(false);

 // Initialize client and setup event listeners
 useEffect(() => {
 if (!appId) return;

 const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

 // Defer the state update to avoid synchronous setState inside an effect
 Promise.resolve().then(() => {
 setClient(agoraClient);
 });

 clientRef.current = agoraClient;

 const handleUserPublished = async (user, mediaType) => {
 await agoraClient.subscribe(user, mediaType);
 if (mediaType === 'audio') {
 if (!isDeafenedRef.current && user.audioTrack) {
 user.audioTrack.setVolume(400); // Boost remote playback volume significantly
 user.audioTrack.play();
 }
 setRemoteUsers(prev => {
 const next = { ...prev, [user.uid]: user };
 remoteUsersRef.current = next;
 return next;
 });
 }
 };

 const handleUserUnpublished = (user) => {
 setRemoteUsers(prev => {
 const next = { ...prev };
 delete next[user.uid];
 remoteUsersRef.current = next;
 return next;
 });
 };

 const handleUserLeft = (user) => {
 setRemoteUsers(prev => {
 const next = { ...prev };
 delete next[user.uid];
 remoteUsersRef.current = next;
 return next;
 });
 };

 const handleVolumeIndicator = (volumes) => {
 setActiveSpeakers(prev => {
 // Reset all to false first if they aren't in this volume batch
 const currentSpeakers = {};
 volumes.forEach(vol => {
 if (vol.level > 5) {
 // vol.uid is numeric for remote, or string if custom uid, but for local it might be 0? 
 // Agora uses 0 or the string UID for local user in volume indicator sometimes depending on config.
 // Usually uid is what we provided.
 const speakerUid = vol.uid;
 currentSpeakers[speakerUid] = true;
 }
 });

 // Check if changed
 if (Object.keys(currentSpeakers).length !== Object.keys(prev).length) {
 return currentSpeakers;
 }

 for (const uid in currentSpeakers) {
 if (!prev[uid]) return currentSpeakers;
 }
 for (const uid in prev) {
 if (!currentSpeakers[uid]) return currentSpeakers;
 }

 return prev; // No change
 });
 };

 // Global tap-to-resume for iOS Safari autoplay policy
 const handleGlobalClick = () => {
 if (isDeafenedRef.current) return;
 Object.values(remoteUsersRef.current).forEach(user => {
 if (user.audioTrack && !user.audioTrack.isPlaying) {
 try {
 user.audioTrack.setVolume(400); // Ensure volume is boosted when unlocking
 user.audioTrack.play();
 } catch (e) {
 console.debug("Silent swallow: attempt to unlock audio failed", e);
 }
 }
 });
 };

 document.addEventListener('click', handleGlobalClick);
 document.addEventListener('touchstart', handleGlobalClick);

 agoraClient.enableAudioVolumeIndicator();
 agoraClient.on('volume-indicator', handleVolumeIndicator);
 agoraClient.on('user-published', handleUserPublished);
 agoraClient.on('user-unpublished', handleUserUnpublished);
 agoraClient.on('user-left', handleUserLeft);

 return () => {
 agoraClient.off('volume-indicator', handleVolumeIndicator);
 agoraClient.off('user-published', handleUserPublished);
 agoraClient.off('user-unpublished', handleUserUnpublished);
 agoraClient.off('user-left', handleUserLeft);
 };
 }, [appId]);

 const joinVoiceChannel = useCallback(async (channelName, uid = null) => {
 if (!clientRef.current || !appId) {
 console.warn("Agora client or App ID not ready");
 return;
 }

 if (isJoiningRef.current) {
 console.log("[VoiceContext] Skipping join, another join is currently in progress");
 return;
 }

 isJoiningRef.current = true;

 // Prevent "Client already in connecting/connected state" error
 const state = clientRef.current.connectionState;
 if (state === 'CONNECTED') {
 console.log("[VoiceContext] Client already connected, restoring state");
 if (!localAudioTrack) {
 try {
 const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
 audioTrack.setVolume(200); // Boost local microphone capture volume
 const savedMuted = localStorage.getItem('voice_muted') === 'true';
 await audioTrack.setEnabled(!savedMuted);
 setLocalAudioTrack(audioTrack);
 await clientRef.current.publish([audioTrack]);
 setIsMuted(savedMuted);
 } catch (e) {
 console.error("Failed to restore audio track:", e);
 }
 }
 setIsInChannel(true);
 isJoiningRef.current = false;
 return;
 }
 if (state === 'CONNECTING' || state === 'RECONNECTING') {
 console.log(`[VoiceContext] Skipping join, client is already ${state}`);
 isJoiningRef.current = false;
 return;
 }

 try {
 // Use a token if available, otherwise pass null for testing if tokens are disabled on Agora dashboard
 await clientRef.current.join(appId, channelName, null, uid);

 try {
 const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
 audioTrack.setVolume(200); // Boost local microphone capture volume
 const savedMuted = localStorage.getItem('voice_muted') === 'true';
 await audioTrack.setEnabled(!savedMuted);
 setLocalAudioTrack(audioTrack);
 await clientRef.current.publish([audioTrack]);
 setIsMuted(savedMuted);
 } catch (micError) {
 console.warn("Could not create/publish microphone track. User might have denied permission or has no mic:", micError);
 // We set muted to true since they have no mic
 setIsMuted(true);
 if (micError.name === 'NotAllowedError' || (micError.message && micError.message.includes('Permission denied'))) {
 console.warn("User denied microphone permission.");
 } else {
 console.warn("Issue with microphone:", micError);
 }
 }

 setIsInChannel(true);

 } catch (error) {
 const errMsg = error?.message || '';
 if (error?.code === 'OPERATION_ABORTED' || errMsg.includes('OPERATION_ABORTED') || errMsg.includes('cancel token') || errMsg.includes('WS_ABORT') || errMsg.includes('LEAVE') || errMsg.includes('INVALID_OPERATION') || errMsg.includes('already in connecting/connected state')) {
 console.debug("Silent swallow: Join aborted during unmount or concurrency:", error);
 } else {
 console.error("Error joining voice channel:", error);
 }
 } finally {
 isJoiningRef.current = false;
 }
 }, [appId, localAudioTrack]);

 const leaveVoiceChannel = useCallback(async () => {
 try {
 if (localAudioTrack) {
 localAudioTrack.stop();
 localAudioTrack.close();
 setLocalAudioTrack(null);
 }

 if (clientRef.current) {
 try {
 if (clientRef.current.connectionState === 'CONNECTED') {
 await clientRef.current.unpublish();
 }
 } catch (e) {
 console.debug("Silent swallow: unpublish ignored:", e);
 }

 try {
 // Always call leave to clear CONNECTING or CONNECTED states from previous renders
 await clientRef.current.leave();
 } catch (e) {
 console.debug("Silent swallow: leave ignored:", e);
 }
 }

 setIsInChannel(false);
 setRemoteUsers({});
 // Do NOT force reset isMuted to false, keep the user's preference
 } catch (error) {
 console.error("Error leaving voice channel:", error);
 }
 }, [localAudioTrack]);

 const toggleMute = useCallback(async () => {
 const newMutedState = !isMuted;
 setIsMuted(newMutedState);
 localStorage.setItem('voice_muted', newMutedState.toString());

 if (localAudioTrack) {
 // Using setEnabled instead of setMuted completely turns off the hardware mic LED
 await localAudioTrack.setEnabled(!newMutedState);
 }
 }, [localAudioTrack, isMuted]);

 const toggleDeafen = useCallback(() => {
 const newDeafenedState = !isDeafened;
 setIsDeafened(newDeafenedState);
 isDeafenedRef.current = newDeafenedState;
 localStorage.setItem('voice_deafened', newDeafenedState.toString());
 Object.values(remoteUsers).forEach(user => {
 if (user.audioTrack) {
 if (newDeafenedState) {
 user.audioTrack.stop();
 } else {
 user.audioTrack.setVolume(400); // Re-apply boost just in case
 user.audioTrack.play();
 }
 }
 });
 }, [isDeafened, remoteUsers]);

 const isVoiceReady = !!appId && !!client;

 const value = useMemo(() => ({
 client,
 isVoiceReady,
 isInChannel,
 isMuted,
 isDeafened,
 remoteUsers,
 activeSpeakers,
 joinVoiceChannel,
 leaveVoiceChannel,
 toggleMute,
 toggleDeafen
 }), [
 client, isVoiceReady, isInChannel, isMuted, isDeafened, remoteUsers, activeSpeakers,
 joinVoiceChannel, leaveVoiceChannel, toggleMute, toggleDeafen
 ]);

 return (
 <VoiceContext.Provider value={value}>
 {children}
 </VoiceContext.Provider>
 );
};
