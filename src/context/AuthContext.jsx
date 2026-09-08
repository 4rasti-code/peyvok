/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { safeJSONParse, safeStorageGet, safeStorageSet } from '../utils/safeParse';

const AuthContext = createContext();

const getDeviceOS = () => {
 const userAgent = window.navigator.userAgent || window.navigator.vendor || window.opera;
 if (/android/i.test(userAgent)) return "Android";
 if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return "iOS";
 if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent)) return "Mac";
 if (/Win32|Win64|Windows|WinCE/.test(userAgent)) return "Windows";
 return "Unknown";
};

export const AuthProvider = ({ children }) => {
 const [user, setUser] = useState(null);
 const [loadingAuth, setLoadingAuth] = useState(true);
 const [loading, setLoading] = useState(true);
 const [authProgress, setAuthProgress] = useState(0);
 const [visualProgress, setVisualProgress] = useState(0);

 // Smooth Progress Logic: Gradually move visualProgress toward authProgress
 useEffect(() => {
 if (visualProgress === authProgress) return;

 const timeout = setTimeout(() => {
 setVisualProgress(prev => {
 if (prev === authProgress) return prev;
 const diff = authProgress - prev;
 let next;
 if (diff > 0) {
 next = prev + Math.max(0.5, diff * 0.1);
 } else {
 next = prev + (prev < 90 ? 0.2 : 0.05);
 }
 return next >= authProgress ? authProgress : next;
 });
 }, 50);

 return () => clearTimeout(timeout);
 }, [authProgress, visualProgress]);

 const [userNickname, setUserNickname] = useState('یاریزان');
 const [userAvatar, setUserAvatar] = useState('default');
 const [city, setCity] = useState('');
 const [isInKurdistan, setIsInKurdistan] = useState(true);
 const [countryCode, setCountryCode] = useState('IQ');
 const [lastNicknameUpdate, setLastNicknameUpdate] = useState(null);
 const [lastProfileUpdate, setLastProfileUpdate] = useState(() => Date.now());
 const [ownedAvatars, setOwnedAvatars] = useState(() => {
 const saved = safeStorageGet('peyvchin_owned_avatars');
 return safeJSONParse(saved, ['default'], 'peyvchin_owned_avatars');
 });
 const [equippedNameStyle, setEquippedNameStyle] = useState('default');
 const [ownedNameStyles, setOwnedNameStyles] = useState(() => {
 const saved = safeStorageGet('peyvchin_owned_name_styles');
 return safeJSONParse(saved, ['default'], 'peyvchin_owned_name_styles');
 });
 const [equippedFont, setEquippedFont] = useState('default');
 const [ownedFonts, setOwnedFonts] = useState(() => {
 const saved = safeStorageGet('peyvchin_owned_fonts');
 return safeJSONParse(saved, ['default'], 'peyvchin_owned_fonts');
 });
 const [equippedBundle, setEquippedBundle] = useState('default');
 const [ownedBundles, setOwnedBundles] = useState(() => {
 const saved = safeStorageGet('peyvchin_owned_bundles');
 return safeJSONParse(saved, ['default'], 'peyvchin_owned_bundles');
 });
 const [hapticEnabled, setHapticEnabled] = useState(() => {
 const saved = safeStorageGet('peyvchin_haptic_enabled');
 return saved !== null ? saved === 'true' : true;
 });

 // 3.3 VOICE SETTINGS: Persistent global states (Removed)

 const [profileData, setProfileData] = useState(() => {
 const cached = safeStorageGet('peyvchin_cached_profile');
 return safeJSONParse(cached, null, 'peyvchin_cached_profile');
 });

 const isProfileLoaded = useRef(false);
 const hasInitializedRef = useRef(false);

 // Cross-context state ref for stable callbacks
 const authStateRef = useRef({ user, userNickname, userAvatar, countryCode, isInKurdistan });
 useEffect(() => {
 authStateRef.current = { user, userNickname, userAvatar, countryCode, isInKurdistan };
 }, [user, userNickname, userAvatar, countryCode, isInKurdistan]);

 const isSyncingRef = useRef(false);
 const lastSyncTimeRef = useRef(0);

 const syncProfileExtended = useCallback(async (userId) => {
 try {
 const { data, error } = await supabase
 .from('profiles')
 .select(`
 inventory, claimed_medals, last_notified_level,
 statistics, solved_words,
 games_won, games_played, flawless_wins, total_words_found, pvp_wins, fever_highscore
 `)
 .eq('id', userId);

 if (!error && data && data.length > 0) {
 const extendedData = data[0];

 // Merge safely into local states
 if (extendedData.inventory !== undefined) {
 setOwnedAvatars(prev => {
 const next = Array.isArray(extendedData.inventory?.owned_avatars) ? extendedData.inventory.owned_avatars : ['default'];
 return JSON.stringify(prev) !== JSON.stringify(next) ? next : prev;
 });
 }

 setProfileData(prev => {
 if (!prev) return extendedData;
 const merged = { ...prev, ...extendedData };
 safeStorageSet('peyvchin_cached_profile', JSON.stringify(merged));
 return merged;
 });
 }
 } catch (err) {
 console.warn("[AuthContext] Extended sync failed:", err.message);
 }
 }, []);

 const syncProfile = useCallback(async (userId, onProfileLoaded, force = false) => {
 const activeUserId = userId || authStateRef.current.user?.id;
 if (!activeUserId || activeUserId === 'undefined' || typeof activeUserId !== 'string' || activeUserId.length < 5) return;

 // 1. LOBBYING GUARD: Prevent rapid fire calls
 const now = Date.now();
 if (!force && now - lastSyncTimeRef.current < 2000) {
 return;
 }

 // 2. CONCURRENCY GUARD: Prevent overlapping requests
 if (!force && isSyncingRef.current) {
 return;
 }

 const isInitialLoad = !isProfileLoaded.current;

 try {
 isSyncingRef.current = true;
 lastSyncTimeRef.current = now;
 // Lock immediately
 isProfileLoaded.current = true;

 console.log("[AuthContext] Fetching core profile for:", activeUserId);
 if (isInitialLoad) setAuthProgress(45);

 // FAST FETCH: Only fetch the bare minimum needed to enter the lobby + Daily Rewards
 const { data, error } = await supabase
 .from('profiles')
 .select(`
 id, nickname, avatar_url, fils, derhem, dinar, xp,
 is_kurdistan, country_code,
 last_nickname_update, haptic_enabled, sfx_volume, bg_music_volume, magnets, hints, skips,
 onboarded,
 daily_streak, reward_streak, last_reward_claimed_at, last_streak_at,
 last_spin_date, last_mystery_box_date, mystery_boxes_count, spin_tickets,
 has_completed_install_guide, equipped_name_style, owned_name_styles,
 equipped_font, owned_fonts, equipped_bundle, owned_bundles,
 claimed_medals, has_completed_tutorial
 `)
 .eq('id', activeUserId);

 if (isInitialLoad) setAuthProgress(75);

 if (error || !data || data.length === 0) {
 // If it's empty, we need to create it
 if (!data || data.length === 0 || error?.code === 'PGRST116' || error?.status === 406) {
 console.warn("[AuthContext] No profile found. Attempting client-side self-heal for:", activeUserId);

 let currentUser = authStateRef.current.user;
 if (!currentUser) {
 const { data: sessionData } = await supabase.auth.getSession();
 if (sessionData?.session?.user) {
 currentUser = sessionData.session.user;
 }
 }

 // Extract base nickname from metadata, handling both Google and Discord formats safely
 let rawName = currentUser?.user_metadata?.nickname ||
 currentUser?.user_metadata?.username ||
 currentUser?.user_metadata?.global_name ||
 currentUser?.user_metadata?.full_name ||
 currentUser?.user_metadata?.name ||
 '';

 // Always assign a random Monster Avatar upon registration, ignoring Google/Discord metadata
 const randomMonsterIndex = Math.floor(Math.random() * 9) + 1;
 let extractedAvatar = `/Monster_Avatars/Monster_Avatars-0${randomMonsterIndex}.svg`;

 let nickname = '';

 if (!rawName || rawName.trim() === '') {
 // If no name is provided, fetch a sequential guest name from the database
 const { data: seqName } = await supabase.rpc('get_next_guest_name');
 const seqNum = seqName ? seqName.split('_')[1] : Math.floor(1000 + Math.random() * 9000);
 const kuDigits = String(seqNum).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
 nickname = `بێناڤ ${kuDigits}`;
 } else {
 // Remove spaces, allow alphanumeric and Kurdish/Arabic characters
 rawName = rawName.replace(/[^a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');
 if (rawName.length < 3) {
 const { data: seqName } = await supabase.rpc('get_next_guest_name');
 const seqNum = seqName ? seqName.split('_')[1] : Math.floor(1000 + Math.random() * 9000);
 const kuDigits = String(seqNum).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
 nickname = `بێناڤ ${kuDigits}`;
 } else {
 nickname = rawName;
 }
 }

 const maxRetries = 5;
 let retryCount = 0;
 let profileCreated = false;

 while (retryCount < maxRetries && !profileCreated) {
 if (isInitialLoad) setAuthProgress(75 + retryCount * 2);
 await new Promise(res => setTimeout(res, 200));
 const { data: checkData } = await supabase.from('profiles').select('id, nickname, avatar_url, fils, xp, onboarded, has_completed_tutorial').eq('id', activeUserId);

 if (checkData && checkData.length > 0) {
 console.log("[AuthContext] Profile materialized during retry!");
 profileCreated = true;
 return handleProfileData(checkData[0], onProfileLoaded);
 }

 console.log(`[AuthContext] Self-heal attempt ${retryCount + 1}/${maxRetries}... Inserting fallback profile.`);
 const { data: insertData, error: insertError } = await supabase.from('profiles').insert([{
 id: activeUserId,
 nickname: nickname,
 avatar_url: extractedAvatar,
 country_code: 'IQ',
 is_kurdistan: true,
 fils: 500,
 derhem: 10,
 dinar: 5,
 onboarded: false,
 has_completed_tutorial: false
 }]).select();

 if (!insertError && insertData && insertData.length > 0) {
 console.log("[AuthContext] Self-heal created profile.");
 profileCreated = true;
 return handleProfileData(insertData[0], onProfileLoaded);
 } else {
 console.warn("[AuthContext] Insert failed:", insertError);
 }
 retryCount++;
 }

 if (!profileCreated) {
 throw new Error("Failed to heal profile after 3 attempts.");
 }
 } else {
 throw error;
 }
 } else {
 console.log("[AuthContext] Profile core fetch successful.");
 handleProfileData(data[0], onProfileLoaded);
 
 // Silently fetch and update IP address for security tracking
 (async () => {
 try {
 let ip = null;
 try {
 const res = await fetch('https://api.ipify.org?format=json');
 const data = await res.json();
 ip = data.ip;
 } catch (_err) {
 const res2 = await fetch('https://jsonip.com');
 const data2 = await res2.json();
 ip = data2.ip;
 }
 if (ip) {
 const { error } = await supabase.from('profiles').update({ last_ip: ip }).eq('id', activeUserId);
 if (error) console.error("[AuthContext] Supabase IP Update Error:", error);
 else console.log("[AuthContext] IP updated successfully.");
 }
 } catch (e) {
 console.error("[AuthContext] Failed to track IP:", e);
 }
 })();

 
 // Ping daily activity logic to ensure streak is updated just by opening the app
 supabase.rpc('ping_daily_activity').then(({ data: pingData, error: pingError }) => {
 if (!pingError && pingData?.updated) {
 console.log("[AuthContext] Daily activity pinged successfully:", pingData);
 setProfileData(prev => {
 if (!prev) return prev;
 const merged = { ...prev, daily_streak: pingData.daily_streak };
 safeStorageSet('peyvchin_cached_profile', JSON.stringify(merged));
 return merged;
 });
 }
 }).catch(err => console.warn("Failed to ping daily activity", err));

 // Start the extended sync in the background so it doesn't hold up the loading screen
 syncProfileExtended(activeUserId);
 }
 } catch (err) {
 console.warn("[AuthContext] Sync Note:", err.message);
 if (err.message !== "Sync timed out") isProfileLoaded.current = false;
 // Release aggressive lock by populating an empty profile so the user can play offline/default
 setProfileData({});
 } finally {
 isSyncingRef.current = false;
 if (isInitialLoad) {
 setAuthProgress(100);
 setLoadingAuth(false);
 setLoading(false);
 }
 }
 }, [syncProfileExtended]);

 // Helper to process profile data consistently
 const handleProfileData = (data, onProfileLoaded) => {
 // ENFORCE NO SPACES RULE: If existing user has a space in their nickname, force onboarding
 if (data.nickname && data.nickname.includes(' ')) {
 data.onboarded = false;
 }
 if (data.nickname !== undefined) setUserNickname(prev => prev !== data.nickname ? (data.nickname || 'یاریزان') : prev);
 // Auto-assign random monster avatar if they have the legacy 'default', null, or a Google/Discord avatar
 let processedAvatar = data.avatar_url;
 const isOAuthAvatar = processedAvatar && (processedAvatar.includes('googleusercontent.com') || processedAvatar.includes('cdn.discordapp.com'));
 
 if (!processedAvatar || processedAvatar === 'default' || isOAuthAvatar) {
 const randomIndex = Math.floor(Math.random() * 9) + 1;
 processedAvatar = `/Monster_Avatars/Monster_Avatars-0${randomIndex}.svg`;
 if (data.id) {
 // Run asynchronously without awaiting to not block profile load
 supabase.from('profiles').update({ avatar_url: processedAvatar }).eq('id', data.id).then(() => {
 console.log("[AuthContext] Upgraded default avatar to monster avatar");
 }).catch(err => console.warn("Failed to update monster avatar", err));
 }
 }
 
 if (processedAvatar !== undefined) setUserAvatar(prev => prev !== processedAvatar ? processedAvatar : prev);
 if (data.city !== undefined) setCity(prev => prev !== data.city ? (data.city || '') : prev);
 if (data.is_kurdistan !== undefined) setIsInKurdistan(prev => prev !== data.is_kurdistan ? (data.is_kurdistan ?? true) : prev);
 if (data.country_code !== undefined) setCountryCode(prev => prev !== data.country_code ? (data.country_code || 'IQ') : prev);

 if (data.last_nickname_update) {
 setLastNicknameUpdate(data.last_nickname_update);
 }

 if (data.inventory !== undefined) {
 setOwnedAvatars(prev => {
 const next = Array.isArray(data.inventory?.owned_avatars) ? data.inventory.owned_avatars : ['default'];
 return JSON.stringify(prev) !== JSON.stringify(next) ? next : prev;
 });
 }

 if (data.equipped_name_style !== undefined) {
 setEquippedNameStyle(prev => prev !== data.equipped_name_style ? (data.equipped_name_style || 'default') : prev);
 }

 if (data.owned_name_styles !== undefined) {
 setOwnedNameStyles(prev => {
 const next = Array.isArray(data.owned_name_styles) ? data.owned_name_styles : ['default'];
 if (JSON.stringify(prev) !== JSON.stringify(next)) {
 safeStorageSet('peyvchin_owned_name_styles', JSON.stringify(next));
 return next;
 }
 return prev;
 });
 }

 if (data.equipped_font !== undefined) {
 setEquippedFont(prev => prev !== data.equipped_font ? (data.equipped_font || 'default') : prev);
 }

 if (data.owned_fonts !== undefined) {
 setOwnedFonts(prev => {
 const next = Array.isArray(data.owned_fonts) ? data.owned_fonts : ['default'];
 if (JSON.stringify(prev) !== JSON.stringify(next)) {
 safeStorageSet('peyvchin_owned_fonts', JSON.stringify(next));
 return next;
 }
 return prev;
 });
 }

 if (data.equipped_bundle !== undefined) {
 setEquippedBundle(prev => prev !== data.equipped_bundle ? (data.equipped_bundle || 'default') : prev);
 }

 if (data.owned_bundles !== undefined) {
 setOwnedBundles(prev => {
 const next = Array.isArray(data.owned_bundles) ? data.owned_bundles : ['default'];
 if (JSON.stringify(prev) !== JSON.stringify(next)) {
 safeStorageSet('peyvchin_owned_bundles', JSON.stringify(next));
 return next;
 }
 return prev;
 });
 }

 if (data.haptic_enabled !== undefined) {
 const haptic = data.haptic_enabled ?? true;
 setHapticEnabled(prev => {
 if (prev !== haptic) {
 safeStorageSet('peyvchin_haptic_enabled', haptic.toString());
 return haptic;
 }
 return prev;
 });
 }

 // Create a safe merge
 setProfileData(prev => {
 const nextData = prev ? { ...prev, ...data } : data;
 safeStorageSet('peyvchin_cached_profile', JSON.stringify(nextData));
 return nextData;
 });

 if (typeof onProfileLoaded === 'function') onProfileLoaded(data);
 return data;
 };

 // MANDATORY SESSION RECOVERY & AUTH LISTENER
 useEffect(() => {
 if (hasInitializedRef.current) return;
 hasInitializedRef.current = true;

 console.log("[AuthContext] Initializing...");
 const initializeAuth = async () => {
 // Immediate check for OAuth redirect tokens, PKCE codes, or recovery tokens in the URL
 const hasToken = (window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('type=recovery'))) ||
 (window.location.search && (window.location.search.includes('code=') || window.location.search.includes('error=')));

 // Global safety timeout to prevent getting stuck on the sun loader forever
 // Give OAuth redirects much more time (8s) to complete the network exchange
 const timeoutDuration = hasToken ? 8000 : 2000;
 let hasFinished = false;
 const safetyTimeout = setTimeout(() => {
 if (!hasFinished) {
 console.warn(`[AuthContext] Safety timeout (${timeoutDuration}ms) reached! Forcing ready state.`);
 setAuthProgress(100);
 setLoadingAuth(false);
 setLoading(false);
 }
 }, timeoutDuration);

 try {
 setAuthProgress(15);

 // OPTIMIZATION: Check for cached profile BEFORE session if possible
 const cachedProfile = safeStorageGet('peyvchin_cached_profile');
 if (cachedProfile) {
 const data = safeJSONParse(cachedProfile, null, 'peyvchin_cached_profile');
 if (data) {
 setProfileData(data);
 setUserNickname(data.nickname || 'یاریزان');
 setUserAvatar(data.avatar_url || 'default');
 }
 }

 console.log("[AuthContext] Checking session...");
 setAuthProgress(30);

 if (hasToken) {
 console.log("[AuthContext] Auth token/code detected in URL, adding delay for Supabase processing...");
 setAuthProgress(50);
 // Small delay to let Supabase process the URL before we call getSession
 await new Promise(resolve => setTimeout(resolve, 1000));
 }

 // Fast session check
 const { data: { session } } = await supabase.auth.getSession();

 if (session?.user) {
 setAuthProgress(80);
 console.log("[AuthContext] Active session recovered:", session.user.id);
 setUser(session.user);

 if (cachedProfile) {
 setAuthProgress(100);
 setLoadingAuth(false);
 setLoading(false);
 }

 // Sync in background
 await syncProfile(session.user.id);
 } else if (hasToken) {
 // If we have a token/code but getSession failed, wait a bit longer for onAuthStateChange
 console.log("[AuthContext] Token exists but session null, waiting for AuthChange event...");
 await new Promise(resolve => setTimeout(resolve, 1500));
 } else {
 setAuthProgress(100);
 console.log("[AuthContext] No active session found.");
 }
 } catch (err) {
 console.log("[AuthContext] [Notice] Auth check deferred:", err.message);
 } finally {
 hasFinished = true;
 clearTimeout(safetyTimeout);
 setAuthProgress(100);
 setTimeout(() => {
 setLoadingAuth(false);
 setLoading(false);
 }, 200);
 }
 };

 initializeAuth();

 const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
 console.log(`[AuthContext] 🔔 Auth Event: ${event}`, session?.user ? `User: ${session.user.id}` : "No Session");

 const newUser = session?.user || null;
 setUser(prev => {
 if (!prev && !newUser) return null;
 if (prev?.id === newUser?.id && prev?.email === newUser?.email) return prev;
 return newUser;
 });

 if (newUser) {
 if (!isProfileLoaded.current) {
 console.log("[AuthContext] User detected via event, syncing profile...");
 setLoadingAuth(true);
 setAuthProgress(30);
 syncProfile(newUser.id);
 }
 } else {
 console.log("[AuthContext] Session cleared via event.");
 isProfileLoaded.current = false;
 setProfileData(null);
 }
 });

 return () => {
 subscription?.unsubscribe();
 };
 }, [syncProfile]);

 // NEW: Real-time Profile Listener to keep profileData synced everywhere
 useEffect(() => {
 if (!user?.id) return;

 // Track Device & Language
 const os = getDeviceOS();
 const lang = navigator.language || navigator.userLanguage || "Unknown";
 supabase.from('profiles').update({ device_type: os, device_language: lang }).eq('id', user.id).then(({ error }) => {
 if (error) console.error("Failed to update device info:", error);
 });

 const channel = supabase
 .channel(`profile-auth-sync-${user.id}`)
 .on(
 'postgres_changes',
 {
 event: 'UPDATE',
 schema: 'public',
 table: 'profiles',
 filter: `id=eq.${user.id}`
 },
 (payload) => {
 console.log("🔄 [AuthContext] Profile Sync Update:", payload.new);
 setProfileData(payload.new);

 // Update derived identity states if they changed
 if (payload.new.nickname) setUserNickname(payload.new.nickname);
 if (payload.new.avatar_url) setUserAvatar(payload.new.avatar_url);
 if (payload.new.last_nickname_update) setLastNicknameUpdate(payload.new.last_nickname_update);
 }
 )
 .subscribe();

 return () => {
 supabase.removeChannel(channel);
 };
 }, [user?.id]);



 const completeOnboarding = useCallback(async (nickname) => {
 if (!user?.id) return { success: false, error: "Must be logged in" };
 try {
 const { error } = await supabase.rpc('complete_onboarding', { p_nickname: nickname });
 if (error) throw error;

 // Update local state immediately
 setUserNickname(nickname);
 setProfileData(prev => {
 const next = { ...prev, nickname, onboarded: true };
 safeStorageSet('peyvchin_cached_profile', JSON.stringify(next));
 return next;
 });

 // Also update auth metadata
 await supabase.auth.updateUser({
 data: {
 nickname: nickname,
 name: nickname,
 }
 });

 return { success: true };
 } catch (err) {
 console.error("Onboarding failed:", err);
 return { success: false, error: err.message };
 }
 }, [user?.id]);

 const updateProfile = useCallback(async (profileData) => {
 let currentUser = authStateRef.current.user;
 let currentCountryCode = authStateRef.current.countryCode;
 let currentIsInKurdistan = authStateRef.current.isInKurdistan;
 let currentNickname = authStateRef.current.userNickname;
 let currentAvatar = authStateRef.current.userAvatar;

 if (!currentUser?.id) {
 const { data } = await supabase.auth.getSession();
 if (data?.session?.user) {
 currentUser = data.session.user;
 }
 }

 if (!currentUser?.id) return { success: false, error: "Must be logged in" };

 if (profileData?.nickname !== undefined) setUserNickname(profileData?.nickname);
 if (profileData?.avatar_url !== undefined) setUserAvatar(profileData?.avatar_url);
 if (profileData?.city !== undefined) setCity(profileData?.city);
 if (profileData?.is_kurdistan !== undefined) setIsInKurdistan(profileData?.is_kurdistan);
 if (profileData?.country_code !== undefined) setCountryCode(profileData?.country_code);
 if (profileData?.onboarded !== undefined) setProfileData(prev => ({ ...prev, onboarded: profileData?.onboarded }));
 
 if (profileData?.equipped_name_style !== undefined) setEquippedNameStyle(profileData?.equipped_name_style);
 if (profileData?.owned_name_styles !== undefined) setOwnedNameStyles(profileData?.owned_name_styles);
 if (profileData?.equipped_font !== undefined) setEquippedFont(profileData?.equipped_font);
 if (profileData?.owned_fonts !== undefined) setOwnedFonts(profileData?.owned_fonts);
 if (profileData?.equipped_bundle !== undefined) setEquippedBundle(profileData?.equipped_bundle);
 if (profileData?.owned_bundles !== undefined) setOwnedBundles(profileData?.owned_bundles);

 if (profileData?.haptic_enabled !== undefined) {
 setHapticEnabled(profileData?.haptic_enabled);
 safeStorageSet('peyvchin_haptic_enabled', profileData?.haptic_enabled.toString());
 }

 try {
 // 1. Update Identity via RPC
 const { error: rpcError } = await supabase.rpc('update_profile_identity', {
 p_nickname: profileData?.nickname || currentNickname || 'یاریزان',
 p_avatar_url: profileData?.avatar_url || currentAvatar || 'default',
 p_country_code: profileData?.country_code || currentCountryCode || 'IQ',
 p_is_in_kurdistan: profileData?.is_kurdistan ?? currentIsInKurdistan ?? true
 });
 if (rpcError) {
 console.warn("[AuthContext] RPC update_profile_identity failed, relying on fallback direct updates:", rpcError);
 }

 // Sync metadata to auth.users so it shows up in the Supabase Auth Dashboard
 if (profileData?.nickname !== undefined || profileData?.avatar_url !== undefined) {
 await supabase.auth.updateUser({
 data: {
 nickname: profileData?.nickname || currentNickname || 'یاریزان',
 name: profileData?.nickname || currentNickname || 'یاریزان',
 avatar_url: profileData?.avatar_url || currentAvatar || 'default',
 }
 });
 }

 // 2. Update Voice Settings & Haptic via direct update (as columns are new)
 const directUpdates = {};
 if (profileData?.haptic_enabled !== undefined) directUpdates.haptic_enabled = profileData?.haptic_enabled;
 if (profileData?.onboarded !== undefined) directUpdates.onboarded = profileData?.onboarded;

 // Fallback: Also update avatar_url and nickname directly in case the RPC fails or is missing
 if (profileData?.avatar_url !== undefined) directUpdates.avatar_url = profileData?.avatar_url;
 if (profileData?.nickname !== undefined) directUpdates.nickname = profileData?.nickname;
 
 if (profileData?.equipped_name_style !== undefined) directUpdates.equipped_name_style = profileData?.equipped_name_style;
 if (profileData?.owned_name_styles !== undefined) directUpdates.owned_name_styles = profileData?.owned_name_styles;
 if (profileData?.equipped_font !== undefined) directUpdates.equipped_font = profileData?.equipped_font;
 if (profileData?.owned_fonts !== undefined) directUpdates.owned_fonts = profileData?.owned_fonts;
 if (profileData?.equipped_bundle !== undefined) directUpdates.equipped_bundle = profileData?.equipped_bundle;
 if (profileData?.owned_bundles !== undefined) directUpdates.owned_bundles = profileData?.owned_bundles;

 if (Object.keys(directUpdates).length > 0) {
 const { error: updateError } = await supabase
 .from('profiles')
 .update(directUpdates)
 .eq('id', currentUser?.id);
 if (updateError) throw updateError;
 }

 // 3. Update Inventory if ownedAvatars was changed (e.g. from purchasing)
 if (profileData?.ownedAvatars !== undefined) {
 setOwnedAvatars(profileData?.ownedAvatars);
 const { data: currentProfile } = await supabase.from('profiles').select('inventory').eq('id', currentUser?.id).single();
 const currentInv = currentProfile?.inventory || {};
 await supabase.from('profiles').update({
 inventory: { ...currentInv, owned_avatars: profileData?.ownedAvatars }
 }).eq('id', currentUser?.id);
 }

 setLastProfileUpdate(Date.now());
 return { success: true };
 } catch (err) {
 console.error("Profile update failed:", err);
 return { success: false, error: err.message };
 }
 }, []);

 const handleToggleBlock = useCallback(async (targetId, currentStatus) => {
 if (!user?.id) return;
 try {
 if (currentStatus) { await supabase.from('blocks').delete().eq('blocker_id', user.id).eq('blocked_id', targetId); }
 else { await supabase.from('blocks').insert([{ blocker_id: user.id, blocked_id: targetId }]); }
 return true;
 } catch { return false; }
 }, [user]);

 const checkBlockStatus = useCallback(async (targetId) => {
 if (!user?.id) return false;
 try {
 const { data, error } = await supabase.from('blocks').select('id').eq('blocker_id', user.id).eq('blocked_id', targetId).maybeSingle();
 if (error && error.code !== 'PGRST116') throw error;
 return !!data;
 } catch { return false; }
 }, [user]);

 const value = useMemo(() => ({
 user, setUser, loadingAuth, loading, authProgress: visualProgress,
 userNickname, setUserNickname, userAvatar, setUserAvatar, city, setCity,
 isInKurdistan, setIsInKurdistan, countryCode, setCountryCode,
 profileData, lastNicknameUpdate,
 ownedAvatars, setOwnedAvatars, hapticEnabled, setHapticEnabled,
 equippedNameStyle, setEquippedNameStyle, ownedNameStyles, setOwnedNameStyles,
 equippedFont, setEquippedFont, ownedFonts, setOwnedFonts,
 equippedBundle, setEquippedBundle, ownedBundles, setOwnedBundles,
 lastProfileUpdate, setLastProfileUpdate,
 syncProfile, refreshProfile: syncProfile, updateProfile, completeOnboarding, handleToggleBlock, checkBlockStatus,
 isProfileLoaded
 }), [
 user, loadingAuth, loading, visualProgress, userNickname, userAvatar, city, isInKurdistan,
 countryCode, ownedAvatars, hapticEnabled, equippedNameStyle, ownedNameStyles, equippedFont, ownedFonts, 
 equippedBundle, ownedBundles, syncProfile,
 updateProfile, completeOnboarding, handleToggleBlock, checkBlockStatus, profileData, lastProfileUpdate, lastNicknameUpdate
 ]);

 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useUser = () => {
 const context = useContext(AuthContext);
 if (!context) throw new Error('useUser must be used within an AuthProvider');
 return context;
};
