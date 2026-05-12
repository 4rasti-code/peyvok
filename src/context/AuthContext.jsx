/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { safeJSONParse } from '../utils/safeParse';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [authProgress, setAuthProgress] = useState(0);
  const [visualProgress, setVisualProgress] = useState(0);

  // Smooth Progress Logic: Gradually move visualProgress toward authProgress
  useEffect(() => {
    if (!loadingAuth) return;
    
    const interval = setInterval(() => {
      setVisualProgress(prev => {
        if (prev >= 100) return 100;
        const diff = authProgress - prev;
        let next;
        if (diff > 0) {
          next = prev + Math.max(0.5, diff * 0.1);
        } else {
          next = prev + (prev < 90 ? 0.2 : 0.05);
        }
        return next > 100 ? 100 : next;
      });
    }, 50);
    
    return () => clearInterval(interval);
  }, [authProgress, loadingAuth]);

  const [userNickname, setUserNickname] = useState('یاریزان');
  const [userAvatar, setUserAvatar] = useState('default');
  const [city, setCity] = useState('');
  const [isInKurdistan, setIsInKurdistan] = useState(true);
  const [countryCode, setCountryCode] = useState('IQ');
  const [lastNicknameUpdate, setLastNicknameUpdate] = useState(null);
  const [lastProfileUpdate, setLastProfileUpdate] = useState(() => Date.now());
  const [ownedAvatars, setOwnedAvatars] = useState(() => {
    const saved = localStorage.getItem('peyvchin_owned_avatars');
    return safeJSONParse(saved, ['default'], 'peyvchin_owned_avatars');
  });
  const [hapticEnabled, setHapticEnabled] = useState(() => {
    const saved = localStorage.getItem('peyvchin_haptic_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  
  // 3.3 VOICE SETTINGS: Persistent global states
  const [micEnabled, setMicEnabled] = useState(true);
  const [micVolume, setMicVolume] = useState(100);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [voiceVolume, setVoiceVolume] = useState(100);

  const [profileData, setProfileData] = useState(() => {
    const cached = localStorage.getItem('peyvchin_cached_profile');
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

    try {
      isSyncingRef.current = true;
      lastSyncTimeRef.current = now;
      
      // Lock immediately
      isProfileLoaded.current = true;

      console.log("[AuthContext] Fetching profile for:", activeUserId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeUserId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log("[AuthContext] No profile found.");
        }
        throw error;
      }

      if (data) {
        // 3. ATOMIC STATE UPDATES: Batch updates to minimize re-renders
        // We only set state if the values actually changed to prevent propagation
        
        setUserNickname(prev => prev !== data.nickname ? (data.nickname || 'یاریزان') : prev);
        setUserAvatar(prev => prev !== data.avatar_url ? (data.avatar_url || 'default') : prev);
        setCity(prev => prev !== data.city ? (data.city || '') : prev);
        setIsInKurdistan(prev => prev !== data.is_kurdistan ? (data.is_kurdistan ?? true) : prev);
        setCountryCode(prev => prev !== data.country_code ? (data.country_code || 'IQ') : prev);
        
        if (data.last_nickname_update) {
          setLastNicknameUpdate(data.last_nickname_update);
        }

        // 3.1 NEW SCHEMA SYNC: Avatars and Themes are now top-level columns
        setOwnedAvatars(prev => {
          const next = Array.isArray(data.owned_avatars) ? data.owned_avatars : ['default'];
          return JSON.stringify(prev) !== JSON.stringify(next) ? next : prev;
        });
        
        
        const haptic = data.haptic_enabled ?? true;
        setHapticEnabled(prev => {
          if (prev !== haptic) {
            localStorage.setItem('peyvchin_haptic_enabled', haptic.toString());
            return haptic;
          }
          return prev;
        });

        // 3.4 VOICE SETTINGS SYNC
        setMicEnabled(data.mic_enabled ?? true);
        setMicVolume(data.mic_volume ?? 100);
        setSpeakerEnabled(data.speaker_enabled ?? true);
        setVoiceVolume(data.voice_volume ?? 100);


        // 3.2 INVENTORY SELF-HEAL: REMOVED direct update due to potential trigger mismatch.
        // The user should run the database repair script instead.
        if (Array.isArray(data.inventory)) {
          console.warn("[AuthContext] Corrupt inventory detected (Array instead of Object). Please run the DB repair script.");
        }

        // Update Cache
        localStorage.setItem('peyvchin_cached_profile', JSON.stringify(data));
        
        // CRITICAL: Deep comparison to prevent Context Value thrashing
        setProfileData(prev => {
           if (!prev && !data) return null;
           if (prev && data && prev.xp === data.xp && prev.fils === data.fils && prev.updated_at === data.updated_at) {
             return prev;
           }
           return data;
        });

        if (onProfileLoaded) onProfileLoaded(data);
      }
    } catch (err) {
      console.warn("[AuthContext] Sync Note:", err.message);
      if (err.message !== "Sync timed out") isProfileLoaded.current = false;
    } finally {
      isSyncingRef.current = false;
      setLoadingAuth(false);
      setLoading(false);
    }
  }, []);

  // MANDATORY SESSION RECOVERY & AUTH LISTENER
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    console.log("[AuthContext] Initializing...");
    const initializeAuth = async () => {
      // Global safety timeout to prevent getting stuck on the sun loader forever
      const safetyTimeout = setTimeout(() => {
        if (loadingAuth) {
          console.warn("[AuthContext] Safety timeout reached! Forcing ready state.");
          setAuthProgress(100);
          setLoadingAuth(false);
          setLoading(false);
        }
      }, 4000); // Reduced to 4s for even faster fallback

      try {
        setAuthProgress(15);
        
        // OPTIMIZATION: Check for cached profile BEFORE session if possible
        // This allows us to show the UI even faster if we have a valid cache
        const cachedProfile = localStorage.getItem('peyvchin_cached_profile');
        if (cachedProfile) {
          console.log("[AuthContext] Found cached profile, pre-loading...");
          const data = safeJSONParse(cachedProfile, null, 'peyvchin_cached_profile');
          if (data) {
            setProfileData(data);
            setUserNickname(data.nickname || 'یاریزان');
            setUserAvatar(data.avatar_url || 'default');
          }
          // Don't unlock fully yet, we still need to verify session
        }

        console.log("[AuthContext] Checking session...");
        setAuthProgress(30);
        
        // Fast session check
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setAuthProgress(60);
          console.log("[AuthContext] Active session recovered:", session.user.id);
          setUser(session.user);
          
          if (cachedProfile) {
            console.log("[AuthContext] Instant unlock via cached profile.");
            setAuthProgress(100);
            setLoadingAuth(false);
            setLoading(false);
          }
          
          // Sync in background
          syncProfile(session.user.id);
        } else {
          setAuthProgress(100);
          console.log("[AuthContext] No active session found, proceeding as guest.");
        }
      } catch (err) {
        console.log("[AuthContext] [Notice] Auth check deferred:", err.message);
      } finally {
        clearTimeout(safetyTimeout);
        // Force completion if not already done
        setAuthProgress(100);
        setTimeout(() => {
          setLoadingAuth(false);
          setLoading(false);
        }, 100);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const newUser = session?.user || null;
      setUser(prev => {
        if (!prev && !newUser) return null;
        if (prev?.id === newUser?.id && prev?.email === newUser?.email) return prev;
        return newUser;
      });

      if (newUser) {
        if (!isProfileLoaded.current) {
          syncProfile(newUser.id);
        }
      } else {
        isProfileLoaded.current = false;
        setProfileData(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [syncProfile, loadingAuth]);

  // NEW: Real-time Profile Listener to keep profileData synced everywhere
  useEffect(() => {
    if (!user?.id) return;

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

  const updateProfile = useCallback(async (profileData) => {
    const { user: currentUser, userNickname, userAvatar, countryCode, isInKurdistan } = authStateRef.current;
    if (!currentUser?.id) return { success: false, error: "Must be logged in" };

    if (profileData.nickname !== undefined) setUserNickname(profileData.nickname);
    if (profileData.avatar_url !== undefined) setUserAvatar(profileData.avatar_url);
    if (profileData.city !== undefined) setCity(profileData.city);
    if (profileData.is_kurdistan !== undefined) setIsInKurdistan(profileData.is_kurdistan);
    if (profileData.country_code !== undefined) setCountryCode(profileData.country_code);

    if (profileData.haptic_enabled !== undefined) {
      setHapticEnabled(profileData.haptic_enabled);
      localStorage.setItem('peyvchin_haptic_enabled', profileData.haptic_enabled.toString());
    }

    if (profileData.mic_enabled !== undefined) setMicEnabled(profileData.mic_enabled);
    if (profileData.mic_volume !== undefined) setMicVolume(profileData.mic_volume);
    if (profileData.speaker_enabled !== undefined) setSpeakerEnabled(profileData.speaker_enabled);
    if (profileData.voice_volume !== undefined) setVoiceVolume(profileData.voice_volume);

    try {
      // 1. Update Identity via RPC
      const { error: rpcError } = await supabase.rpc('update_profile_identity', {
        p_nickname: profileData.nickname || userNickname,
        p_avatar_url: profileData.avatar_url || userAvatar,
        p_country_code: profileData.country_code || countryCode,
        p_is_in_kurdistan: profileData.is_kurdistan ?? isInKurdistan
      });
      if (rpcError) throw rpcError;

      // Sync metadata to auth.users so it shows up in the Supabase Auth Dashboard
      if (profileData.nickname !== undefined || profileData.avatar_url !== undefined) {
        await supabase.auth.updateUser({
          data: {
            nickname: profileData.nickname || userNickname,
            name: profileData.nickname || userNickname,
            avatar_url: profileData.avatar_url || userAvatar,
          }
        });
      }

      // 2. Update Voice Settings & Haptic via direct update (as columns are new)
      const directUpdates = {};
      if (profileData.mic_enabled !== undefined) directUpdates.mic_enabled = profileData.mic_enabled;
      if (profileData.mic_volume !== undefined) directUpdates.mic_volume = profileData.mic_volume;
      if (profileData.speaker_enabled !== undefined) directUpdates.speaker_enabled = profileData.speaker_enabled;
      if (profileData.voice_volume !== undefined) directUpdates.voice_volume = profileData.voice_volume;
      if (profileData.haptic_enabled !== undefined) directUpdates.haptic_enabled = profileData.haptic_enabled;

      if (Object.keys(directUpdates).length > 0) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update(directUpdates)
          .eq('id', currentUser.id);
        if (updateError) throw updateError;
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
    micEnabled, setMicEnabled, micVolume, setMicVolume, speakerEnabled, setSpeakerEnabled, voiceVolume, setVoiceVolume,
    lastProfileUpdate, setLastProfileUpdate,
    syncProfile, refreshProfile: syncProfile, updateProfile, handleToggleBlock, checkBlockStatus,
    isProfileLoaded
  }), [
    user, loadingAuth, loading, visualProgress, userNickname, userAvatar, city, isInKurdistan, 
    countryCode, ownedAvatars, hapticEnabled, micEnabled, micVolume, speakerEnabled, voiceVolume, syncProfile, 
    updateProfile, handleToggleBlock, checkBlockStatus, profileData, lastProfileUpdate, lastNicknameUpdate
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useUser = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useUser must be used within an AuthProvider');
  return context;
};
