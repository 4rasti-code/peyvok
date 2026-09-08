/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './AuthContext';

const PresenceContext = createContext({});

export const usePresence = () => {
 return useContext(PresenceContext);
};

export const PresenceProvider = ({ children }) => {
 const { user, userNickname } = useUser();
 const [onlineUsers, setOnlineUsers] = useState(new Set());
 const [onlineUserStatuses, setOnlineUserStatuses] = useState({});
 const [onlineCount, setOnlineCount] = useState(0);
 const [reconnectTrigger, setReconnectTrigger] = useState(0);

 const presenceChannelRef = useRef(null);
 const currentBusyModeRef = useRef('idle');
 const trackTimeoutRef = useRef(null);

 const reconnectPresence = useCallback(() => {
 setReconnectTrigger(prev => prev + 1);
 }, []);

 // Expose the update status function
 const updatePresenceStatus = useCallback((busyMode) => {
 currentBusyModeRef.current = busyMode;
 if (trackTimeoutRef.current) clearTimeout(trackTimeoutRef.current);
 
 const sendTrackRequest = async () => {
 try {
 if (presenceChannelRef.current && user?.id && (presenceChannelRef.current.state === 'joined' || presenceChannelRef.current.state === 'SUBSCRIBED')) {
 const isAdmin = user?.email === '4rasti@gmail.com' 
 || userNickname === 'Admin_4rasti' 
 || userNickname === 'ADMIN_PEYVOK' 
 || user?.id === '9a813c24-b662-477d-a74a-6f822d17bbf1' 
 || user?.id === '66bbf4d5-333a-4748-8529-ecd5bae9f3a4';
 
 if (!isAdmin) {
 await presenceChannelRef.current.track({ busy_mode: currentBusyModeRef.current, online_at: new Date().toISOString() });
 }
 }
 } catch (e) {
 console.error("Presence track error:", e);
 }
 };

 if (busyMode === 'idle') {
 sendTrackRequest();
 } else {
 trackTimeoutRef.current = setTimeout(sendTrackRequest, 1000);
 }
 }, [user, userNickname]);

 useEffect(() => {
 if (!user?.id) return;

 const isAdmin = user?.email === '4rasti@gmail.com' 
 || userNickname === 'Admin_4rasti' 
 || userNickname === 'ADMIN_PEYVOK' 
 || user?.id === '9a813c24-b662-477d-a74a-6f822d17bbf1' 
 || user?.id === '66bbf4d5-333a-4748-8529-ecd5bae9f3a4';
 let isMounted = true;

 const initializeChannel = () => {
 // Clean up old channel if it exists
 if (presenceChannelRef.current) {
 supabase.removeChannel(presenceChannelRef.current);
 }

 // Optimization #2: Keyed Presence
 const channel = supabase.channel('global:app_presence_v2', {
 config: {
 presence: {
 key: user.id
 }
 }
 });
 presenceChannelRef.current = channel;

 // System Event Listener for silent drops/errors
 channel.on('system', { event: '*' }, (payload) => {
 if (payload?.type === 'error' || payload?.event === 'error' || payload?.status === 'error') {
 console.warn("[Presence] System error detected on channel. Rebuilding...", payload);
 setTimeout(() => {
 if (isMounted) initializeChannel();
 }, 1000);
 }
 });

 // Optimization #3: Efficient state management with keyed payloads
 channel.on('presence', { event: 'sync' }, () => {
 if (!isMounted) return;
 const state = channel.presenceState();
 
 const newOnlineUsers = new Set();
 const newStatuses = {};

 Object.keys(state).forEach(presenceKey => {
 let latestPresence = state[presenceKey][0];
 for (let i = 1; i < state[presenceKey].length; i++) {
 if (new Date(state[presenceKey][i].online_at) > new Date(latestPresence.online_at)) {
 latestPresence = state[presenceKey][i];
 }
 }

 const realId = latestPresence.user_id || presenceKey;

 if (realId !== '9a813c24-b662-477d-a74a-6f822d17bbf1' && realId !== '66bbf4d5-333a-4748-8529-ecd5bae9f3a4' && realId !== user.id) {
 newOnlineUsers.add(realId);

 if (latestPresence?.busy_mode && latestPresence.busy_mode !== 'idle') {
 newStatuses[realId] = latestPresence.busy_mode;
 }
 }
 });

 setOnlineUsers(prev => {
 if (prev.size !== newOnlineUsers.size) return newOnlineUsers;
 let isDifferent = false;
 for (const id of newOnlineUsers) {
 if (!prev.has(id)) {
 isDifferent = true;
 break;
 }
 }
 return isDifferent ? newOnlineUsers : prev;
 });
 setOnlineUserStatuses(newStatuses);
 setOnlineCount(newOnlineUsers.size);
 });

 channel.subscribe(async (status) => {
 if (status === 'SUBSCRIBED' && isMounted) {
 if (!isAdmin) {
 await channel.track({ busy_mode: currentBusyModeRef.current, online_at: new Date().toISOString() });
 }
 }
 });
 };

 // Initial setup
 initializeChannel();

 // Heartbeat / Periodic Hard-Sync for long-lived sessions
 const heartbeatInterval = setInterval(() => {
 console.log("[Presence] Heartbeat triggered. Hard-syncing presence state...");
 if (isMounted) initializeChannel();
 }, 3.5 * 60 * 1000); // 3.5 minutes

 let visibilityWakeTimeout = null;

 const handleVisibilityChange = async () => {
 if (document.visibilityState === 'visible') {
 // Sleep state could make the connection a zombie. Treat it as completely untrustworthy.
 console.log("[Presence] App woke up. Aggressively rebuilding channel...");
 if (visibilityWakeTimeout) clearTimeout(visibilityWakeTimeout);
 visibilityWakeTimeout = setTimeout(() => {
 if (isMounted) {
 initializeChannel();
 }
 }, 800); // Small timeout to allow network adapter to reconnect
 } else {
 // Optimization: When the user minimizes the app, instantly show them as offline to others
 // This prevents them from receiving invites while they aren't looking at the screen.
 if (visibilityWakeTimeout) clearTimeout(visibilityWakeTimeout);
 if (!isAdmin && presenceChannelRef.current?.state === 'joined') {
 presenceChannelRef.current.untrack().catch(() => {});
 }
 }
 };
 
 // Optimization: Instant disconnect on tab close
 const handleBeforeUnload = () => {
 if (presenceChannelRef.current) {
 // Run untrack and remove synchronously
 presenceChannelRef.current.untrack();
 supabase.removeChannel(presenceChannelRef.current);
 }
 };

 document.addEventListener('visibilitychange', handleVisibilityChange);
 window.addEventListener('beforeunload', handleBeforeUnload);

 return () => {
 isMounted = false;
 clearInterval(heartbeatInterval);
 if (visibilityWakeTimeout) clearTimeout(visibilityWakeTimeout);
 document.removeEventListener('visibilitychange', handleVisibilityChange);
 window.removeEventListener('beforeunload', handleBeforeUnload);
 if (presenceChannelRef.current) {
 presenceChannelRef.current.untrack();
 supabase.removeChannel(presenceChannelRef.current);
 }
 presenceChannelRef.current = null;
 };
 }, [user, userNickname, reconnectTrigger]);

 const value = useMemo(() => ({
 onlineUsers,
 onlineUserStatuses,
 onlineCount,
 updatePresenceStatus,
 reconnectPresence
 }), [onlineUsers, onlineUserStatuses, onlineCount, updatePresenceStatus, reconnectPresence]);

 return (
 <PresenceContext.Provider value={value}>
 {children}
 </PresenceContext.Provider>
 );
};
