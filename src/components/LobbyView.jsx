import React, { useRef, useState, useEffect, memo, useCallback } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { AlarmClock } from 'lucide-react';
import { DerhemIcon } from './CurrencyIcon';
import { triggerHaptic } from '../utils/haptics';
import { useAudio } from '../context/AudioContext';
import { useUser } from '../context/AuthContext';
import { usePresence } from '../context/PresenceContext';
import { useGameStore } from '../store/gameStore';
import Avatar from './Avatar';
import ClashingSwords from './ClashingSwords';
import ClassicIcon from './ClassicIcon';
import MamakIcon from './MamakIcon';
import CubeIcon from './CubeIcon';
import TimerIcon from './TimerIcon';
import LuckyWheelModal from './LuckyWheelModal';
import MysteryBoxModal from './MysteryBoxModal';
import ClipboardIcon from './ClipboardIcon';
import LuckyWheelIcon from './LuckyWheelIcon';
import MysteryBoxIcon from './MysteryBoxIcon';
import { MagicalDust } from './GiftPopup';
import TypewriterText from './TypewriterText';
import ReportIcon from './ReportIcon';
import { MEDALS } from '../constants/medals';
import DownloadIcon from './DownloadIcon';
import TutorialIcon from './TutorialIcon';
import { getLevelFromXP } from '../utils/progression';
import { useMultiplayerStore } from '../store/multiplayerStore';
import PublicProfileModal from './PublicProfileModal';
import ReportModal from './ReportModal';
import GiftPopup from './GiftPopup';

import WordSuggestionModal from './WordSuggestionModal';
import OnboardingOverlay from './OnboardingOverlay';
import AdBanner from './AdBanner';
import { supabase } from '../lib/supabase';
import { toKuDigits } from '../utils/formatters';
import { NAME_FONTS } from '../constants/nameFonts';
import { NAME_STYLES } from '../constants/nameStyles';
import { BUNDLES } from '../constants/bundles';
import PremiumName from './PremiumName';
import { AlarmClockIcon } from './AlarmClockIcon';
import CloseButton from './CloseButton';

const CooldownTimerOverlay = ({ targetDate, isMidnightReset = false }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!targetDate) return;

    const update = () => {
      const now = new Date();
      let end;

      if (isMidnightReset) {
        // Calculate time until next midnight local time
        end = new Date(now);
        end.setHours(24, 0, 0, 0);
      } else {
        const target = new Date(targetDate);
        end = new Date(target.getTime() + 24 * 60 * 60 * 1000);
      }

      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft('');
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
      const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
      setTimeLeft(h === '00' ? `${m}:${s}` : `${h}:${m}:${s}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate, isMidnightReset]);

  if (!timeLeft) return null;
  return (
    <div className="bg-mono-200 dark:bg-mono-800 px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg border border-black/15 dark:border-white/10 flex items-center justify-center gap-1 shadow-sm mx-auto w-max whitespace-nowrap">
      <span className="text-[8px] md:text-[9px] leading-none font-black text-amber-500 tabular-nums tracking-widest drop-shadow-md pt-px" dir="ltr">
        {toKuDigits(timeLeft)}
      </span>
      <AlarmClockIcon className="w-3.5 h-3.5 md:w-4 md:h-4 drop-shadow-sm" />
    </div>
  );
};
const LobbyView = memo(({
  onStartClassic,
  onStartMamak,
  onStartHardWords,
  onStartWordFever,
  onStartMultiplayer,
  onDailyRewardClick,
  _dailyStreak,
  _notificationCount = 0,
  onOpenHowToPlay,
  onOpenChat,
  onStartTutorial,
  isUpdateNotesCleared
}) => {
  const bgRef = useRef(null);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [showMultiplayerModal, setShowMultiplayerModal] = useState(false);
  const [showLuckyWheel, setShowLuckyWheel] = useState(false);
  const [showMysteryBox, setShowMysteryBox] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [inviteStep, setInviteStep] = useState('select');
  const [onlineProfiles, setOnlineProfiles] = useState([]);
  const [loadingOnline, setLoadingOnline] = useState(false);
  const [sentInvites, setSentInvites] = useState(new Set());
  const [invitedUserProfile, setInvitedUserProfile] = useState(null);
  const [inviteTimeLeft, setInviteTimeLeft] = useState(15);
  const [inviteAlert, setInviteAlert] = useState(null);
  const [inviteCooldowns, setInviteCooldowns] = useState({});
  const [inviteStrikes, setInviteStrikes] = useState({});
  const [busyUsers, setBusyUsers] = useState({});
  const [localLocationEnabled, setLocalLocationEnabled] = useState(() => {
    return localStorage.getItem('use_location_matchmaking') === 'true';
  });
  const inviteTimerRef = useRef(null);
  const invitedUserProfileRef = useRef(null);

  useEffect(() => {
    invitedUserProfileRef.current = invitedUserProfile;
  }, [invitedUserProfile]);

  const { playDailyOpenSfx } = useAudio();
  const { user, userNickname, userAvatar, profileData, equippedFont, equippedNameStyle, equippedBundle, syncProfile } = useUser();
  const { onlineUsers, onlineUserStatuses, reconnectPresence } = usePresence();
  const lastRewardClaimedAt = useGameStore(s => s.lastRewardClaimedAt);
    const spinTicketCount = useGameStore(s => s.spinTicketCount);
  const createPrivateMatch = useMultiplayerStore(s => s.createPrivateMatch);
  const multiplayerState = useMultiplayerStore(s => s.multiplayerState);
  const activeMatch = useMultiplayerStore(s => s.activeMatch);
  const cancelMatch = useMultiplayerStore(s => s.cancelMatch);
  const hostAcceptJoiner = useMultiplayerStore(s => s.hostAcceptJoiner);
  const opponent = useMultiplayerStore(s => s.opponent);
  const [showGiftPopup, setShowGiftPopup] = useState(false);

  useEffect(() => {
    if (profileData?.can_claim_beta_gift) {
      setShowGiftPopup(true);
    }
  }, [profileData?.can_claim_beta_gift]);

  const handleGiftClose = useCallback(() => {
    setShowGiftPopup(false);
    if (user?.id) syncProfile(user.id);
  }, [user?.id, syncProfile]);

  // Clear sent invites when returning to idle state (e.g. after a match finishes or is cancelled)
  useEffect(() => {
    if (multiplayerState === 'idle') {
      setSentInvites(new Set());
    }
  }, [multiplayerState]);

  // Enforce DB truth for location matchmaking state
  useEffect(() => {
    if (profileData) {
      const hasLocationInDB = profileData.latitude != null && profileData.longitude != null;
      
      if (!hasLocationInDB) {
        // Force OFF if no location in DB (user skipped LocationPrompt or didn't allow GPS)
        setLocalLocationEnabled(false);
        localStorage.setItem('use_location_matchmaking', 'false');
      } else {
        // Default to ON if they have location, unless explicitly turned off
        const localPref = localStorage.getItem('use_location_matchmaking');
        if (localPref === null) {
          setLocalLocationEnabled(true);
          localStorage.setItem('use_location_matchmaking', 'true');
        } else {
          setLocalLocationEnabled(localPref === 'true');
        }
      }
    }
  }, [profileData]);

  const canShowTutorial = profileData && 
    profileData.has_completed_tutorial === false &&
    localStorage.getItem(`peyvok_tutorial_completed_${user?.id}`) !== 'true' &&
    profileData.has_completed_install_guide !== false &&
    isUpdateNotesCleared &&
    (!(!profileData.latitude || !profileData.longitude) || localStorage.getItem('has_seen_location_prompt'));

  const recordInviteStrike = useCallback(async (targetId) => {
    if (!user?.id || !targetId) return;
    try {
      const { data } = await supabase
        .from('invite_tracking')
        .select('*')
        .eq('sender_id', user.id)
        .eq('receiver_id', targetId)
        .maybeSingle();

      let newStrikes = (data?.strike_count || 0) + 1;
      let blockedUntil = null;

      if (newStrikes >= 3) {
        blockedUntil = new Date(Date.now() + 2.5 * 60 * 1000).toISOString(); // 2.5 min block
        newStrikes = 0; // Reset for next time after block expires
        setInviteCooldowns(prev => ({ ...prev, [targetId]: blockedUntil }));
      }
      setInviteStrikes(prev => ({ ...prev, [targetId]: newStrikes }));

      if (data) {
        await supabase.from('invite_tracking')
          .update({ strike_count: newStrikes, blocked_until: blockedUntil, updated_at: new Date().toISOString() })
          .eq('id', data.id);
      } else {
        await supabase.from('invite_tracking')
          .insert({ sender_id: user.id, receiver_id: targetId, strike_count: newStrikes, blocked_until: blockedUntil });
      }
    } catch (err) {
      console.error("Error recording strike:", err);
    }
  }, [user?.id]);

  const isDailyAvailable = (() => {
    if (!lastRewardClaimedAt) return true;
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Baghdad',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const lastClaimStr = formatter.format(new Date(lastRewardClaimedAt));
      const todayStr = formatter.format(new Date());
      return lastClaimStr !== todayStr;
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    if (!user?.id || multiplayerState !== 'private_lobby') return;

    const channel = supabase.channel(`host_replies_${user.id}`, { config: { broadcast: { ack: true } } });
    channel.on('broadcast', { event: 'match_invite_rejected' }, (payload) => {
      if (payload.payload.roomId === activeMatch?.id) {
        cancelMatch();
        setInviteAlert("ئەو کەسە داخوازنامە ڕەتکر");
        if (invitedUserProfileRef.current) recordInviteStrike(invitedUserProfileRef.current.id);
        setInvitedUserProfile(null);
        if (inviteTimerRef.current) clearInterval(inviteTimerRef.current);
      }
    })
      .on('broadcast', { event: 'match_invite_busy' }, (payload) => {
        if (payload.payload.roomId === activeMatch?.id) {
          cancelMatch();
          const busyMode = payload.payload?.busyMode;
          if (invitedUserProfileRef.current) {
            const targetId = invitedUserProfileRef.current.id;
            setBusyUsers(prev => ({ ...prev, [targetId]: busyMode }));
            setTimeout(() => {
              setBusyUsers(prev => {
                const next = { ...prev };
                delete next[targetId];
                return next;
              });
            }, 10000);
          }
          setInvitedUserProfile(null);
          if (inviteTimerRef.current) clearInterval(inviteTimerRef.current);
        }
      })
      .on('broadcast', { event: 'match_invite_accepted' }, (payload) => {
        if (payload.payload.roomId === activeMatch?.id) {
          console.log('[LobbyView] Invite explicitly accepted! Transitioning host instantly...');
          if (inviteTimerRef.current) clearInterval(inviteTimerRef.current);
          setInvitedUserProfile(null);
          setInviteTimeLeft(15);
          if (hostAcceptJoiner) hostAcceptJoiner(payload.payload.joinerId);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, multiplayerState, activeMatch?.id, cancelMatch, hostAcceptJoiner, recordInviteStrike]);

  useEffect(() => {
    if (multiplayerState === 'private_lobby' && inviteTimeLeft === 0 && invitedUserProfile) {
      cancelMatch();
      setInviteAlert("بەرسڤا داخوازنامەیێ نەهاتە دان");
      broadcastInviteEvent(invitedUserProfile.id, 'invite_cancelled', { roomId: activeMatch?.id });
      recordInviteStrike(invitedUserProfile.id);
      setInvitedUserProfile(null);
      if (inviteTimerRef.current) clearInterval(inviteTimerRef.current);
    }
  }, [inviteTimeLeft, multiplayerState, invitedUserProfile, activeMatch, cancelMatch, recordInviteStrike]);

  const broadcastInviteEvent = async (targetUserId, event, payload) => {
    const topic = `user_invites_${targetUserId}`;
    let channel = supabase.getChannels().find(c => c.topic === `realtime:${topic}`);
    
    if (channel && channel.state === 'joined') {
      await channel.send({ type: 'broadcast', event, payload });
      return;
    }

    if (channel) {
      supabase.removeChannel(channel);
    }

    const newChannel = supabase.channel(topic, { config: { broadcast: { ack: true } } });
    newChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        try {
          await newChannel.send({ type: 'broadcast', event, payload });
        } catch (e) {
          console.error("Broadcast send failed", e);
        } finally {
          setTimeout(() => {
            supabase.removeChannel(newChannel);
          }, 1000);
        }
      }
    });
  };

  const handleHostCancelInvite = async () => {
    triggerHaptic(10);
    cancelMatch();

    if (invitedUserProfile && activeMatch) {
      await broadcastInviteEvent(invitedUserProfile.id, 'invite_cancelled', { roomId: activeMatch.id });
    }

    // Clean up local state
    setInvitedUserProfile(null);
    if (inviteTimerRef.current) clearInterval(inviteTimerRef.current);
  };
  const freeSpins = (() => {
    if (!profileData?.last_spin_date) return 1;
    const lastSpin = new Date(profileData.last_spin_date);
    const now = new Date();
    return (now - lastSpin) >= (24 * 60 * 60 * 1000) ? 1 : 0;
  })();
  const totalSpinsAvailable = spinTicketCount + freeSpins;
  const isLuckyWheelAvailable = totalSpinsAvailable > 0;

  const freeBoxes = (() => {
    if (!profileData?.last_mystery_box_date) return 1;
    const lastOpen = new Date(profileData.last_mystery_box_date);
    const now = new Date();
    return (now - lastOpen) >= (24 * 60 * 60 * 1000) ? 1 : 0;
  })();
  const totalBoxesAvailable = (profileData?.mystery_boxes_count || 0) + freeBoxes;
  const isMysteryBoxAvailable = totalBoxesAvailable > 0;

  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget || e.target.classList.contains('bg-trigger-zone')) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      bgRef.current?.pulse(x, y);
    }
  };

  const fetchOnlineProfiles = useCallback(async (isBackgroundSync = false) => {
    if (!isBackgroundSync) setLoadingOnline(true);
    try {
      const { supabase } = await import('../lib/supabase');
      const BOT_ID = '9a813c24-b662-477d-a74a-6f822d17bbf1';
      const onlineIds = Array.from(onlineUsers || new Set()).filter(id => id !== user?.id && id !== BOT_ID);

      if (onlineIds.length === 0) {
        setOnlineProfiles([]);
        setLoadingOnline(false);
        return;
      }

      let profilesQuery = supabase
        .from('profiles')
        .select('id, nickname, avatar_url, xp, equipped_font, equipped_name_style, equipped_bundle, claimed_medals')
        .in('id', onlineIds)
        .neq('id', user?.id || '')
        .neq('nickname', 'Admin_4rasti')
        .neq('nickname', 'ADMIN_PEYVOK')
        .neq('id', '9a813c24-b662-477d-a74a-6f822d17bbf1')
        .neq('id', '66bbf4d5-333a-4748-8529-ecd5bae9f3a4')
        .limit(50);

      const [profilesRes, friendsRes, trackRes] = await Promise.all([
        profilesQuery,
        supabase
          .from('friendships')
          .select('user_id, friend_id')
          .eq('status', 'accepted')
          .or(`user_id.eq.${user?.id},friend_id.eq.${user?.id}`),
        supabase
          .from('invite_tracking')
          .select('receiver_id, blocked_until, strike_count')
          .eq('sender_id', user?.id)
      ]);

      if (!profilesRes.error && profilesRes.data) {
        const friendIds = new Set();
        if (friendsRes.data) {
          friendsRes.data.forEach(f => {
            friendIds.add(f.user_id === user?.id ? f.friend_id : f.user_id);
          });
        }

        if (trackRes && trackRes.data) {
          const cooldowns = {};
          const strikes = {};
          const now = new Date();
          trackRes.data.forEach(row => {
            if (row.blocked_until && new Date(row.blocked_until) > now) {
              cooldowns[row.receiver_id] = row.blocked_until;
            }
            strikes[row.receiver_id] = row.strike_count || 0;
          });
          setInviteCooldowns(cooldowns);
          setInviteStrikes(strikes);
        }

        const profilesWithFriendStatus = profilesRes.data.map(p => ({
          ...p,
          isFriend: friendIds.has(p.id)
        }));

        setOnlineProfiles(profilesWithFriendStatus);
      } else {
        setOnlineProfiles([]);
      }
    } catch (err) {
      console.error("Error fetching online profiles", err);
    } finally {
      if (!isBackgroundSync) setLoadingOnline(false);
    }
  }, [onlineUsers, user?.id]);

  const fetchOnlineProfilesRef = useRef(fetchOnlineProfiles);
  useEffect(() => {
    fetchOnlineProfilesRef.current = fetchOnlineProfiles;
  }, [fetchOnlineProfiles]);

  useEffect(() => {
    // If the modal is open, we pass false so it spins the refresh icon to show live sync.
    // If the modal is closed, we pass true to fetch silently in the background, 
    // ensuring activeProfiles is always populated for the Multiplayer Card badge.
    const isModalOpen = showMultiplayerModal && inviteStep === 'invite';
    fetchOnlineProfilesRef.current(!isModalOpen);
  }, [showMultiplayerModal, inviteStep, onlineUsers]);

  const handleSendInviteToUser = async (targetUserId) => {
    triggerHaptic(10);
    setSentInvites(prev => new Set(prev).add(targetUserId));

    try {
      const newRoomId = await createPrivateMatch();
      if (!newRoomId) {
        setInviteAlert('کێشەیەک دروست بوو د چێکرنا ژوورێ دا.');
        setSentInvites(prev => {
          const next = new Set(prev);
          next.delete(targetUserId);
          return next;
        });
        return;
      }

      const targetProfile = onlineProfiles.find(p => p.id === targetUserId);
      setInvitedUserProfile(targetProfile);
      setInviteTimeLeft(15);
      if (inviteTimerRef.current) clearInterval(inviteTimerRef.current);
      inviteTimerRef.current = setInterval(() => {
        setInviteTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(inviteTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      console.log('1. Attempting to broadcast to user:', targetUserId);
      await broadcastInviteEvent(targetUserId, 'match_invite', {
        roomId: newRoomId,
        hostName: userNickname || 'هەڤالەکێ تە',
        hostAvatar: userAvatar || profileData?.avatar_url || user?.user_metadata?.avatar_url || 'default',
        hostId: user.id
      });
      console.log('2. Broadcast match_invite complete');
    } catch (err) {
      console.error("Invite error", err);
      setSentInvites(prev => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const bentoMotionProps = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { type: "spring", stiffness: 400, damping: 17 }
  };

  const CooldownTimer = ({ blockedUntil }) => {
    const [timeLeft, setTimeLeft] = useState('');
    useEffect(() => {
      const update = () => {
        const ms = new Date(blockedUntil) - new Date();
        if (ms <= 0) { setTimeLeft(''); return; }
        const totalSecs = Math.ceil(ms / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        if (mins > 0) {
          setTimeLeft(`${toKuDigits(mins)}:${toKuDigits(secs).padStart(2, '٠')}`);
        } else {
          setTimeLeft(`${toKuDigits(secs)} چرکە`);
        }
      };
      update();
      const int = setInterval(update, 1000);
      return () => clearInterval(int);
    }, [blockedUntil]);

    if (!timeLeft) return null;
    return <span className="text-[11px] whitespace-nowrap">{timeLeft}</span>;
  };

  const renderProfileRow = (profile) => {
    const isSent = sentInvites.has(profile.id);
    const blockedUntil = inviteCooldowns[profile.id];
    const isBlocked = blockedUntil && new Date(blockedUntil) > new Date();
    const rawBusyMode = onlineUserStatuses?.[profile.id] || busyUsers[profile.id];
    const busyMode = rawBusyMode === 'idle' ? null : rawBusyMode;

    const getBusyModeText = (mode) => {
      switch (mode) {
        case 'classic': return "پەیڤۆک";
        case 'hard_words': return "پەیڤێن دژوار";
        case 'word_fever': return "تایا پەیڤان";
        case 'mamak': return "مامک";
        case 'multiplayer': return "ھەڤڕکی";
        default: return "یاریێ دکەت";
      }
    };

    const getBusyIcon = (mode) => {
      switch (mode) {
        case 'classic': return (
          <div className="transition-all duration-300 ease-out group-hover:scale-110 group-hover:-translate-y-0.5">
            <ClassicIcon className="w-4 h-4 drop-shadow-sm opacity-90" />
          </div>
        );
        case 'hard_words': return (
          <div className="relative w-4 h-4 flex items-center justify-center transition-all duration-300 ease-out group-hover:scale-110 group-hover:-translate-y-0.5">
            <div className="absolute transform scale-[0.35] origin-center">
              <CubeIcon className="" />
            </div>
          </div>
        );
        case 'word_fever': return (
          <div className="transition-all duration-300 ease-out group-hover:scale-110 group-hover:-rotate-12">
            <TimerIcon className="w-4 h-4 drop-shadow-sm opacity-90" />
          </div>
        );
        case 'mamak': return (
          <div className="transition-all duration-300 ease-out group-hover:scale-110 group-hover:-translate-y-0.5">
            <MamakIcon className="w-4 h-4 drop-shadow-sm opacity-90" />
          </div>
        );
        case 'multiplayer': return (
          <div className="transition-all duration-300 ease-out group-hover:scale-110 group-hover:-rotate-3">
            <ClashingSwords className="w-4 h-4 drop-shadow-sm opacity-90" />
          </div>
        );
        default: return <span className="material-symbols-outlined text-[15px] group-hover:scale-110 transition-all">sports_esports</span>;
      }
    };

    const getBusyColorClass = (mode) => {
      switch (mode) {
        case 'classic': return "bg-[#ffcc00] shadow-[0_3px_0_#cc9900] border-none text-amber-950";
        case 'hard_words': return "bg-[#ef4444] shadow-[0_3px_0_#dc2626] border-none text-white";
        case 'word_fever': return "bg-[#0ea5e9] shadow-[0_3px_0_#0284c7] border-none text-white";
        case 'mamak': return "bg-[#22c55e] shadow-[0_3px_0_#16a34a] border-none text-white";
        case 'multiplayer': return "bg-[linear-gradient(90deg,#2563eb_50%,#dc2626_50%)] shadow-[0_3px_0_#7c3aed] border-none text-white";
        default: return "bg-mono-200 dark:bg-mono-700 shadow-[0_3px_0_#d4d4d8] dark:shadow-[0_3px_0_#3f3f46] border-none text-mono-600 dark:text-mono-300";
      }
    };

    return (
      <div 
        key={profile.id} 
        className={`relative flex items-center justify-between p-2.5 rounded-[10px] transition-all ${
          isBlocked 
            ? 'bg-[linear-gradient(to_bottom,#fce8e8_50%,#f3c8c8_50%)] border-[1.5px] border-b-4 border-[#8a1414]' 
            : 'bg-[linear-gradient(to_bottom,#b8c6dc_50%,#9caecc_50%)] border-[1.5px] border-b-4 border-[#2c3951] shadow-sm'
        }`} 
      >
        <div
          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 mr-2"
          onClick={() => {
            triggerHaptic(10);
            setSelectedProfile(profile);
          }}
        >
          <div className="relative shrink-0 mr-1">
            <Avatar
              src={profile.avatar_url}
              size="md"
              badgeSize="sm"
              border={false}
              level={profile.xp !== undefined ? getLevelFromXP(profile.xp) : null}
              className="border-[2.5px] border-green-500 shadow-sm"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-[2.5px] border-white dark:border-mono-800 rounded-full shadow-sm z-20"></div>
          </div>
          <div
            className="flex flex-col items-start flex-1 min-w-0 pr-2"
            style={{ containerType: 'inline-size' }}
          >
            {(() => {
              const fontObj = NAME_FONTS[profile.equipped_font] || NAME_FONTS['default-ku'];
              const styleObj = NAME_STYLES[profile.equipped_name_style] || {};
              const bundleObj = BUNDLES[profile.equipped_bundle] || BUNDLES['default'];

              const name = profile.nickname || 'یاریکەر';
              const nameLen = Math.max(name.length, 1);
              const wideFonts = ['press-start-2p', 'bangers', 'blunt-wide', 'digiface', 'digital', 'lcd', 'runiga', 'god-of-war', 'fungky-brow', 'ncl-halloween-danger', 'awesome-christmas'];
              const actualFontClass = bundleObj.id !== 'default' ? bundleObj.fontKurdish : profile.equipped_font;
              const isWideFont = wideFonts.some(wf => actualFontClass?.includes(wf));

              const baseSize = fontObj.style?.fontSize ? parseFloat(fontObj.style.fontSize) : 1.05;
              const charWidthRatio = isWideFont ? 1.3 : 0.85;
              const maxCqw = 100 / (nameLen * charWidthRatio);
              const dynamicFontSize = `min(${baseSize}em, ${maxCqw}cqw)`;

              return (
                <PremiumName
                  text={name}
                  styleId={bundleObj.id !== 'default' ? null : styleObj.id}
                  className={`text-sm font-bold leading-tight whitespace-nowrap overflow-visible ${bundleObj.id !== 'default' ? (bundleObj.fontKurdish + ' ' + bundleObj.textStyle) : 'text-white'}`}
                  style={{
                    ...(bundleObj.id !== 'default' ? {} : fontObj.style),
                    fontSize: dynamicFontSize
                  }}
                />
              );
            })()}
            {(() => {
              const getLatestMedal = () => {
                if (!profile.claimed_medals || profile.claimed_medals.length === 0) return null;
                const latestId = profile.claimed_medals[profile.claimed_medals.length - 1];
                return MEDALS.find(m => m.id === latestId) || null;
              };
              const latestMedal = getLatestMedal();
              if (!latestMedal) return null;

              const MedalIcon = latestMedal.IconComponent;
              return (
                <div className="flex items-center gap-1 mt-0.5 text-[10px] text-mono-500 font-medium">
                  <MedalIcon className={`${latestMedal.id === 'palawan' ? 'w-2.75 h-2.75' : 'w-4 h-4'} ${latestMedal.color}`} />
                  <span className="pt-px">{latestMedal.name}</span>
                </div>
              );
            })()}
          </div>
        </div>
        <button
          onClick={() => {
            if (isSent || busyMode) return;
            if (isBlocked) {
              triggerHaptic(10);
              setInviteAlert("د نۆکە دا تو نەشێی یاریێ ل گەل ئەڤی یاریزانی بکەی!");
            } else {
              handleSendInviteToUser(profile.id);
            }
          }}
          className={`group relative overflow-hidden transition-all flex items-center justify-center gap-1 ${busyMode
              ? `${getBusyColorClass(busyMode)} rounded-md cursor-default px-2 py-2.5 border-[1.5px] border-[#121316]`
              : isSent
                ? 'h-8 px-4 min-w-20 rounded-md bg-green-500/10 text-green-600 border-[1.5px] border-green-500/30 font-black text-[11px] cursor-default'
                : isBlocked
                  ? 'h-8 px-4 min-w-20 rounded-md bg-mono-100 text-red-500 border-[1.5px] border-red-200 font-black text-[11px] cursor-pointer shadow-sm'
                  : 'h-8 px-4 min-w-20 rounded-md bg-linear-to-b from-[#4aa1ff] to-[#1e86ff] hover:from-[#60aeff] hover:to-[#298dff] border-[1.5px] border-[#121316] text-white cursor-pointer font-black text-[11px] shadow-[inset_0_2.5px_0_rgba(255,255,255,0.35),inset_0_-2.5px_0_rgba(0,0,0,0.25)] active:scale-95'
            }`}
        >
          <span className="relative z-10 flex items-center justify-center gap-1 -translate-y-px" style={(!busyMode && !isSent && !isBlocked) ? { textShadow: '-1px -1px 0 #121316, 1px -1px 0 #121316, -1px 1px 0 #121316, 1px 1px 0 #121316, 0 1.5px 0 #121316' } : {}}>
            {busyMode ? (
            <div className="flex items-center justify-center gap-1" dir="ltr">
              <span className="font-heading font-black text-[10px] drop-shadow-sm pt-0.75 whitespace-nowrap">
                {getBusyModeText(busyMode)}
              </span>
              <div className="scale-75">
                {getBusyIcon(busyMode)}
              </div>
            </div>
          ) : isSent ? (
            <>
              <span className="material-symbols-outlined text-[15px]">check</span>
              چوو
            </>
          ) : isBlocked ? (
            <>
              <span className="material-symbols-outlined text-[16px]">lock_clock</span>
              <CooldownTimer blockedUntil={blockedUntil} />
            </>
          ) : (
            `داخوازی (${(3 - (inviteStrikes[profile.id] || 0)).toLocaleString('ar-EG')})`
          )}
          </span>
        </button>
      </div>
    );
  };

  const activeProfiles = React.useMemo(() => {
    return onlineProfiles.filter(p => onlineUsers?.has(p.id));
  }, [onlineProfiles, onlineUsers]);

  return (
    <Motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      onClick={handleBackgroundClick}
      className="flex-1 w-full max-w-full px-4 pt-4 pb-28 md:pb-32 overflow-x-hidden bg-transparent relative h-full bg-trigger-zone transition-colors duration-500"
    >


      {/* Fixed Docks Wrapper (Does not scroll with cards) */}
      <div className="fixed inset-y-0 w-full max-w-screen-sm md:max-w-240 left-1/2 -translate-x-1/2 pointer-events-none z-50">
        {/* Left Column removed because its icons were moved above the Multiplayer card */}

        {/* Right Column removed because its icons were moved above the Multiplayer card */}

      </div>
      <div className="relative z-10 w-full mt-6 sm:mt-10 md:mt-16 mb-12">

        {/* Middle Column (Cards) - Optimized for both Mobile and Desktop */}
        <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 md:px-6 relative z-10">
          <div className="flex flex-col gap-6 md:gap-8">

            {/* Top Rewards & Menus Area */}
            <div className="flex flex-col items-center justify-center w-full mb-6 md:mb-8 -mt-6 md:-mt-10 relative z-20 gap-8 md:gap-12">

              {/* --- ROW 1 (Pills) --- */}
              <div className="flex flex-row flex-nowrap items-center justify-center gap-1.5 min-[375px]:gap-2 sm:gap-3 md:gap-6 w-full mt-1 px-1">

                {/* Download */}
                <Motion.button
                  id="btn-download-game"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { triggerHaptic(10); window.dispatchEvent(new CustomEvent('openInstallModal')); }}
                  className="flex flex-row items-center justify-center gap-1 md:gap-1.5 px-2 py-1.5 md:px-4 md:py-2 cursor-pointer btn-clash-sm btn-clash-sm-cyan"
                >
                  <span className="material-symbols-outlined text-[12px] md:text-[14px] text-white drop-shadow-md">download</span>
                  <span className="text-[9px] min-[375px]:text-[10px] md:text-[12px] font-bold font-heading text-white drop-shadow-md tracking-normal pt-px">داگرتن</span>
                </Motion.button>

                {/* Word Suggestion */}
                <Motion.button
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { triggerHaptic(10); setIsWordModalOpen(true); }}
                  className="flex flex-row items-center justify-center gap-1 md:gap-1.5 px-2 py-1.5 md:px-4 md:py-2 cursor-pointer btn-clash-sm btn-clash-sm-green"
                >
                  <span className="material-symbols-outlined text-[12px] md:text-[14px] text-white drop-shadow-md">edit_document</span>
                  <span className="text-[9px] min-[375px]:text-[10px] md:text-[12px] font-bold font-heading text-white drop-shadow-md tracking-normal pt-px">پەیڤ</span>
                </Motion.button>

                {/* Report */}
                <Motion.button
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { triggerHaptic(10); setIsReportModalOpen(true); }}
                  className="flex flex-row items-center justify-center gap-1 md:gap-1.5 px-2 py-1.5 md:px-4 md:py-2 cursor-pointer btn-clash-sm btn-clash-sm-orange"
                >
                  <span className="material-symbols-outlined text-[12px] md:text-[14px] text-white drop-shadow-md">campaign</span>
                  <span className="text-[9px] min-[375px]:text-[10px] md:text-[12px] font-bold font-heading text-white drop-shadow-md tracking-normal pt-px">پێشنیار</span>
                </Motion.button>

                {/* Tutorial */}
                <Motion.button
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { triggerHaptic(10); if (onOpenHowToPlay) onOpenHowToPlay(); }}
                  className="flex flex-row items-center justify-center gap-1 md:gap-1.5 px-2 py-1.5 md:px-4 md:py-2 cursor-pointer btn-clash-sm btn-clash-sm-purple"
                >
                  <span className="material-symbols-outlined text-[12px] md:text-[14px] text-white drop-shadow-md">help</span>
                  <span className="text-[9px] min-[375px]:text-[10px] md:text-[12px] font-bold font-heading text-white drop-shadow-md tracking-normal pt-px">فێرکاری</span>
                </Motion.button>

              </div>

              {/* --- ROW 2 (Rewards) --- */}
              <div className="flex flex-row items-end justify-center gap-6 sm:gap-8 md:gap-12 w-full">
                {/* Daily Tasks */}
                <Motion.button
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic(15);
                    onDailyRewardClick?.();
                  }}
                  className="flex flex-col items-center justify-center cursor-pointer relative pb-5 md:pb-7"
                >
                  <div className="relative flex items-center justify-center w-12 h-12 md:w-16 md:h-16 shrink-0 z-10">
                    <ClipboardIcon className={`w-12 h-12 md:w-16 md:h-16 translate-y-0.75 md:translate-y-[4.5px] ${!isDailyAvailable ? 'grayscale opacity-80' : 'drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]'}`} />
                  </div>
                  {!isDailyAvailable && (
                    <div className="absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 z-20">
                      <CooldownTimerOverlay targetDate={lastRewardClaimedAt} isMidnightReset={true} />
                    </div>
                  )}
                </Motion.button>

                {/* Divider 1 */}
                <div className="w-[1.5px] h-8 md:h-12 mb-3 md:mb-4 bg-mono-400 dark:bg-white/30 rounded-full" />

                {/* Lucky Wheel */}
                <Motion.button
                  id="nav-lucky-wheel"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    playDailyOpenSfx();
                    setShowLuckyWheel(true);
                  }}
                  className="flex flex-col items-center justify-center cursor-pointer relative pb-5 md:pb-7"
                >
                  <div className="relative flex items-center justify-center w-11 h-11 md:w-14 md:h-14 shrink-0 z-10">
                    <LuckyWheelIcon isIdleAnimated={isLuckyWheelAvailable} className={`w-11 h-11 md:w-14 md:h-14 ${!isLuckyWheelAvailable ? 'grayscale opacity-80' : 'drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]'}`} />
                  </div>
                  {!isLuckyWheelAvailable && (
                    <div className="absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 z-20">
                      <CooldownTimerOverlay targetDate={profileData?.last_spin_date} />
                    </div>
                  )}
                </Motion.button>

                {/* Divider 2 */}
                <div className="w-[1.5px] h-8 md:h-12 mb-3 md:mb-4 bg-mono-400 dark:bg-white/30 rounded-full" />

                {/* Mystery Box */}
                <Motion.button
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic(15);
                    playDailyOpenSfx();
                    setShowMysteryBox(true);
                  }}
                  className="flex flex-col items-center justify-center cursor-pointer relative pb-5 md:pb-7"
                >
                  <div className="relative flex items-center justify-center w-12 h-12 md:w-16 md:h-16 shrink-0 z-10">
                    {isMysteryBoxAvailable && (
                      <MagicalDust spread={40} count={12} zIndex={40} baseScale={0.5} />
                    )}
                    <MysteryBoxIcon isIdleAnimated={isMysteryBoxAvailable} className={`w-12 h-12 md:w-16 md:h-16 translate-y-1.25 md:translate-y-1.75 ${!isMysteryBoxAvailable ? 'grayscale opacity-80' : 'relative z-10 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]'}`} />
                  </div>
                  {!isMysteryBoxAvailable && (
                    <div className="absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 z-20">
                      <CooldownTimerOverlay targetDate={profileData?.last_mystery_box_date} />
                    </div>
                  )}
                </Motion.button>

              </div>
            </div>
            <div className="relative group w-full mb-2 md:mb-3">
              <Motion.button
                variants={itemVariants}
                onClick={() => {
                  triggerHaptic(15);
                  setShowMultiplayerModal(true);
                  setInviteStep('select');
                }}
                {...bentoMotionProps}
                className="w-full block relative h-25 md:h-32.5 group bg-transparent btn-clash btn-clash-split"
              >

                {/* Main Button Content Layer */}
                <div className="absolute inset-0 rounded-md overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
                  <div className="relative z-10 grid grid-cols-2 h-full">
                    <div className="flex items-center justify-center">
                      <div className="flex flex-col items-center text-center">
                        <h3 className="text-2xl md:text-[34px] font-black font-salar text-white drop-shadow-md text-stroke-clash">هـەڤڕکی</h3>
                      </div>
                    </div>
                    <div className="flex items-center justify-center relative">
                      <div className="transition-all duration-300 ease-out">
                        <ClashingSwords className="w-14 h-14 md:w-20 md:h-20 drop-shadow-md text-white/90 group-hover:text-white group-hover:scale-110 group-hover:-rotate-3" />
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-black/80 hover:bg-black/90 transition-colors px-2 py-0.5 rounded-md border-t-2 border-t-black/60 border-b border-b-white/10 border-x border-x-black/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-online-glow"></span>
                    <span className="text-[10px] font-bold text-white/95 mt-0.5" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                      {toKuDigits(activeProfiles.length)}
                    </span>
                  </div>
                </div>
              </Motion.button>
            </div>

            {/* GLOBAL DARK OVERLAY FOR TUTORIAL */}
            {canShowTutorial && (
              <div className="fixed inset-0 bg-black/90 z-90 pointer-events-none transition-opacity duration-500" />
            )}

            <div className={`relative group w-full ${canShowTutorial ? 'z-100' : ''}`}>
              {/* Tooltip Dialog for Tutorial */}
              {canShowTutorial && (
                <>
                  {/* Tooltip Box */}
                  <div className="absolute bottom-[calc(100%+36px)] left-1/2 -translate-x-1/2 flex flex-col items-center w-[90vw] max-w-85 z-110 pointer-events-none">
                      <div className="bg-[#f8fafc] p-4 md:p-5 rounded-[18px] shadow-[inset_0_-8px_0_#cbd5e1,0_15px_35px_rgba(0,0,0,0.5)] border-4 border-[#121316] text-right relative w-full" dir="rtl">
                         {/* Inner 3D Highlight Layer */}
                         <div className="absolute inset-0 rounded-[14px] border-2 border-t-white border-x-transparent border-b-transparent pointer-events-none z-0" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 1%, black 15%, black 85%, transparent 99%)' }}></div>
                         {/* Inner 3D Shadow Layer */}
                         <div className="absolute inset-0 rounded-[14px] border-2 border-b-black/10 border-x-black/5 border-t-transparent pointer-events-none z-0"></div>

                         {/* Triangle pointing down */}
                         <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#f8fafc] border-b-4 border-r-4 border-[#121316] transform rotate-45 z-0 rounded-sm"></div>
                         
                         <div className="relative z-20 w-full text-right" dir="rtl">
                           {/* Hidden text to force exact dimensions */}
                           <span 
                             className="text-[17px] md:text-[20px] font-black font-rabar leading-normal md:leading-relaxed block px-2 whitespace-pre-line invisible pointer-events-none text-right!"
                           >
                             {"بخێرهاتی بۆ یاریا پەیڤۆک!\nدا ئەم فێری یاریێ ببین.\nتلا خوە ل کارتا مۆدێ پەیڤۆک بدە."}
                           </span>
                           
                           <span 
                             className="text-[17px] md:text-[20px] font-black font-rabar text-[#181a20] leading-normal md:leading-relaxed absolute inset-0 block px-2 whitespace-pre-line text-right!"
                             style={{ textShadow: `0px 1px 0px white` }}
                           >
                             <TypewriterText 
                                text={"بخێرهاتی بۆ یاریا پەیڤۆک!\nدا ئەم فێری یاریێ ببین.\nتلا خوە ل کارتا مۆدێ پەیڤۆک بدە."}
                                isTypingComplete={isTypingComplete} 
                                onComplete={() => setIsTypingComplete(true)} 
                             />
                           </span>
                         </div>
                      </div>
                  </div>
                  
                  {/* INVISIBLE CLICK CATCHER to speed up typing */}
                  {!isTypingComplete && (
                     <div 
                       className="fixed inset-0 z-100" 
                       onClick={(e) => {
                         e.stopPropagation();
                         setIsTypingComplete(true);
                       }}
                     />
                  )}
                  
                  {/* Bouncing Hand Icon overlapping the card */}
                  <Motion.div 
                    animate={{ y: [0, -12, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 text-[55px] drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] z-120 pointer-events-none"
                  >
                    👇
                  </Motion.div>
                </>
              )}

              <Motion.button
                variants={itemVariants}
                onClick={() => { 
                  triggerHaptic(10); 
                  if (profileData && profileData.has_completed_tutorial === false && onStartTutorial) {
                    onStartTutorial();
                  } else {
                    onStartClassic();
                  }
                }}
                {...bentoMotionProps}
                className="w-full block relative h-25 md:h-32.5 btn-clash btn-clash-yellow"
              >
                {/* Pattern Overlay */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
                </div>
                <div className="relative z-10 flex items-center justify-between px-8 h-full">
                  <div className="flex flex-col items-start text-right">
                    <h3 className="text-2xl md:text-[34px] font-black font-salar text-white drop-shadow-md text-stroke-clash-brown">پەیڤـۆک</h3>
                  </div>
                  <div className="flex items-center justify-center relative">
                    <div className="transition-all duration-300 ease-out">
                      <ClassicIcon className="w-32 h-10 md:w-45 md:h-14" />
                    </div>
                  </div>
                </div>
              </Motion.button>
            </div>

            <div className="relative group w-full">
              <Motion.button
                variants={itemVariants}
                onClick={() => { triggerHaptic(10); onStartMamak(); }}
                {...bentoMotionProps}
                className="w-full block relative h-25 md:h-32.5 btn-clash btn-clash-green"
              >
                {/* Pattern Overlay */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
                </div>
                <div className="relative z-10 flex items-center justify-between px-8 h-full">
                  <div className="flex flex-col items-start text-right">
                    <h3 className="text-2xl md:text-[34px] font-black font-salar text-white drop-shadow-md text-stroke-clash">مـامـك</h3>
                  </div>
                  <div className="flex items-center justify-center relative">
                    <div className="transition-all duration-300 ease-out group-hover:scale-110 group-hover:-translate-y-1">
                      <MamakIcon className="w-16 h-16 md:w-21 md:h-21" />
                    </div>
                  </div>
                </div>
              </Motion.button>
            </div>

            <div className="relative group w-full">
              <Motion.button
                variants={itemVariants}
                onClick={() => { triggerHaptic(10); onStartHardWords(); }}
                {...bentoMotionProps}
                className="w-full block relative h-25 md:h-32.5 btn-clash btn-clash-red"
              >
                {/* Pattern Overlay */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
                </div>
                <div className="relative z-10 flex items-center justify-between px-8 h-full">
                  <div className="flex flex-col items-start text-right">
                    <h3 className="text-2xl md:text-[34px] font-black font-salar text-white drop-shadow-md text-stroke-clash">پەیڤـێن دژوار</h3>
                  </div>
                  <div className="flex items-center justify-center relative">
                    <div className="transition-all duration-300 ease-out group-hover:scale-110 group-hover:-translate-y-1">
                      <CubeIcon className="w-16 h-16 md:w-21 md:h-21" />
                    </div>
                  </div>
                </div>
              </Motion.button>
            </div>

            <div className="relative group w-full">
              <Motion.button
                variants={itemVariants}
                onClick={() => { triggerHaptic(10); onStartWordFever(); }}
                {...bentoMotionProps}
                className="w-full block relative h-25 md:h-32.5 btn-clash btn-clash-cyan"
              >
                {/* Pattern Overlay */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
                </div>
                <div className="relative z-10 flex items-center justify-between px-8 h-full">
                  <div className="flex flex-col items-start text-right">
                    <h3 className="text-2xl md:text-[34px] font-black font-salar text-white drop-shadow-md text-stroke-clash">تایا  پەیڤـان</h3>
                  </div>
                  <div className="flex items-center justify-center relative">
                    <div className="transition-all duration-300 ease-out group-hover:scale-110 group-hover:-rotate-12">
                      <TimerIcon className="w-13 h-13" />
                    </div>
                  </div>
                </div>
              </Motion.button>
            </div>

            {/* Dynamic Ad Banner Space */}
            <AdBanner />
          </div>
        </div>

      </div>

      <AnimatePresence>
        {showMultiplayerModal && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/90 transition-colors duration-500 overflow-hidden"
            onClick={() => setShowMultiplayerModal(false)}
            dir="rtl"
          >
            <Motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-100 flex flex-col bg-[#636a7c] rounded-[18px] shadow-[inset_0_-8px_0_rgba(0,0,0,0.4),0_15px_35px_rgba(0,0,0,0.6)] relative font-rabar border-4 border-[#121316] overflow-hidden max-h-[85vh]"
            >
              {/* Inner 3D Highlight Layer */}
              <div 
                 className="absolute inset-0 rounded-[14px] border-2 border-t-white/80 border-x-transparent border-b-transparent pointer-events-none z-0"
                 style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 1%, black 15%, black 85%, transparent 99%)' }}
              ></div>
              
              {/* Inner 3D Shadow Layer */}
              <div className="absolute inset-0 rounded-[14px] border-2 border-b-black/40 border-x-black/20 border-t-transparent pointer-events-none z-0"></div>

              {/* Glassy Header Highlight */}
              <div className="absolute top-1.5 inset-x-1.5 h-7 bg-[#727888] pointer-events-none z-0 rounded-t-[8px]"></div>

              {inviteStep === 'select' ? (
                <>
                  {/* Header */}
                  <div className="w-full relative z-10 flex items-center justify-center pt-5 pb-4 shrink-0">
                     <h2 
                        className="text-[20px] font-black text-white leading-none relative z-10" 
                        style={{ 
                           textShadow: `-2px -2px 0 #1a1c23, -1px -2px 0 #1a1c23, 0 -2px 0 #1a1c23, 1px -2px 0 #1a1c23, 2px -2px 0 #1a1c23, -2px -1px 0 #1a1c23, 2px -1px 0 #1a1c23, -2px 0 0 #1a1c23, 2px 0 0 #1a1c23, -2px 1px 0 #1a1c23, 2px 1px 0 #1a1c23, -2px 2px 0 #1a1c23, -1px 2px 0 #1a1c23, 0 2px 0 #1a1c23, 1px 2px 0 #1a1c23, 2px 2px 0 #1a1c23, -2px 3px 0 #1a1c23, -1px 3px 0 #1a1c23, 0 3px 0 #1a1c23, 1px 3px 0 #1a1c23, 2px 3px 0 #1a1c23, -2px 4px 0 #1a1c23, -1px 4px 0 #1a1c23, 0 4px 0 #1a1c23, 1px 4px 0 #1a1c23, 2px 4px 0 #1a1c23, -2px 5px 0 #1a1c23, -1px 5px 0 #1a1c23, 0 5px 0 #1a1c23, 1px 5px 0 #1a1c23, 2px 5px 0 #1a1c23, 0 5px 10px rgba(0,0,0,0.4)`
                        }}
                     >
                        شێوەیێ یاریکرنێ هەلبژێرە
                     </h2>
                     <button
                        onClick={() => setShowMultiplayerModal(false)}
                        className="absolute right-3 top-3 w-8 h-8 rounded-[8px] bg-linear-to-b from-[#ff6b6b] to-[#d62020] hover:from-[#ff7a7a] hover:to-[#e62b2b] flex items-center justify-center text-white transition-all active:scale-95 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-4px_0_#960f0f] border-[1.5px] border-[#181a20] z-20 overflow-hidden"
                     >
                        {/* Glass Reflection Highlight */}
                        <div className="absolute top-0.5 inset-x-0.5 bottom-1 bg-white/20 pointer-events-none rounded-sm"></div>
                        <svg viewBox="0 0 24 24" className="w-4 h-4 -translate-y-px relative z-10" style={{ filter: 'drop-shadow(0px 2px 0px rgba(0,0,0,0.3))' }}>
                           <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" stroke="#121316" strokeWidth="9" strokeLinecap="round" />
                           <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" stroke="#121316" strokeWidth="9" strokeLinecap="round" />
                           <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" stroke="white" strokeWidth="5" strokeLinecap="round" />
                           <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" stroke="white" strokeWidth="5" strokeLinecap="round" />
                        </svg>
                     </button>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 self-stretch flex flex-col relative mx-3 sm:mx-4 mb-4 rounded-[12px] bg-[#e6ebf0] shadow-[0_4px_6px_rgba(0,0,0,0.2)] overflow-hidden min-h-0">
                     <div className="absolute inset-0 rounded-[12px] border-[2.5px] border-t-white/90 border-l-white/80 border-r-black/5 border-b-transparent pointer-events-none z-10"></div>
                     
                     <div className="relative z-20 flex flex-col items-center p-4 pt-5 pb-5 gap-3">
                        <div className="flex items-stretch gap-2 h-11.25 w-full">
                           <button
                             onClick={() => {
                               triggerHaptic(10);
                               if (localLocationEnabled) {
                                 setLocalLocationEnabled(false);
                                 localStorage.setItem('use_location_matchmaking', 'false');
                               } else {
                                 setLocalLocationEnabled(true);
                                 localStorage.setItem('use_location_matchmaking', 'true');
                                 if (navigator.geolocation) {
                                   navigator.geolocation.getCurrentPosition(
                                     async (position) => {
                                       try {
                                         const { latitude, longitude } = position.coords;
                                         await supabase.from('profiles').update({ latitude, longitude }).eq('id', user?.id);
                                       } catch (_err) {
                                         // ignore
                                       }
                                     },
                                     (_error) => {
                                       // ignore
                                     }
                                   );
                                 }
                               }
                             }}
                             className={`w-15 sm:w-17.5 shrink-0 rounded-[8px] flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border-[1.5px] border-[#121316] overflow-hidden ${localLocationEnabled ? 'bg-[#333742]' : 'bg-[#292c35]'}`}
                             style={{
                               boxShadow: 'inset 0 2.5px 0 rgba(255,255,255,0.1), inset 0 -3px 0 rgba(0,0,0,0.2), 0 2px 3px rgba(0,0,0,0.2)'
                             }}
                           >
                             <div dir="ltr" className={`w-9 h-5 rounded-full p-1 flex items-center shrink-0 transition-colors duration-300 ease-in-out ${localLocationEnabled ? 'bg-[#40ea00]' : 'bg-black/50'}`}>
                               <div className={`bg-white w-3 h-3 rounded-full shadow-sm shrink-0 transition-transform duration-300 ease-in-out transform ${localLocationEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                             </div>
                             <span className={`text-[9px] font-bold transition-colors duration-300 ${localLocationEnabled ? 'text-white' : 'text-white/70'}`}>
                               {localLocationEnabled ? 'هەمان ئاست' : 'هەر ئاستەک'}
                             </span>
                           </button>

                           <button
                             onClick={() => {
                               triggerHaptic(10);
                               setShowMultiplayerModal(false);
                               onStartMultiplayer();
                             }}
                             className="flex-1 rounded-[8px] flex items-center justify-center gap-2 transition-transform active:scale-95 border-[1.5px] border-[#121316] overflow-hidden bg-linear-to-b from-[#ff3b3b] to-[#d62020] hover:from-[#ff5252] hover:to-[#e62b2b]"
                             style={{
                               boxShadow: 'inset 0 2.5px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.25), 0 2px 3px rgba(0,0,0,0.15)'
                             }}
                           >
                             <span className="text-white text-[14px] font-black tracking-wide flex items-center gap-2 relative z-10 -translate-y-px" style={{ textShadow: '-1px -1px 0 #121316, 1px -1px 0 #121316, -1px 1px 0 #121316, 1px 1px 0 #121316, 0 1.5px 0 #121316' }}>
                               <span className="material-symbols-outlined text-[18px]">public</span>
                               لێگەڕیانا گشتی
                             </span>
                           </button>
                        </div>
                        
                        <button
                          onClick={() => {
                            triggerHaptic(10);
                            setInviteStep('invite');
                          }}
                          className="w-full h-11.25 rounded-[8px] flex items-center justify-center gap-2 transition-transform active:scale-95 border-[1.5px] border-[#121316] overflow-hidden bg-linear-to-b from-[#4aa1ff] to-[#1e86ff] hover:from-[#60aeff] hover:to-[#298dff]"
                          style={{
                            boxShadow: 'inset 0 2.5px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.25), 0 2px 3px rgba(0,0,0,0.15)'
                          }}
                        >
                           <span className="text-white text-[14px] font-black tracking-wide flex items-center gap-2 relative z-10 -translate-y-px" style={{ textShadow: '-1px -1px 0 #121316, 1px -1px 0 #121316, -1px 1px 0 #121316, 1px 1px 0 #121316, 0 1.5px 0 #121316' }}>
                             <span className="material-symbols-outlined text-[20px]">person_add</span>
                             داخوازکرنا تایبەت
                           </span>
                        </button>
                     </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-full relative z-10 flex items-center justify-between pt-4 pb-3 px-4 shrink-0">
                     <button 
                        onClick={() => setInviteStep('select')}
                        className="w-8 h-8 rounded-[8px] bg-linear-to-b from-[#8a92a0] to-[#727888] flex items-center justify-center text-white transition-all active:scale-95 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-4px_0_rgba(0,0,0,0.2)] border-[1.5px] border-[#181a20] z-20 overflow-hidden shrink-0"
                     >
                        <span className="material-symbols-outlined text-[20px] relative z-10" style={{ filter: 'drop-shadow(0px 2px 0px rgba(0,0,0,0.3))' }}>arrow_forward</span>
                     </button>

                     <h2 
                        className="text-[17px] font-black text-white leading-none relative z-10 flex-1 text-center flex items-center justify-center gap-2" 
                        style={{ 
                           textShadow: `-2px -2px 0 #1a1c23, -1px -2px 0 #1a1c23, 0 -2px 0 #1a1c23, 1px -2px 0 #1a1c23, 2px -2px 0 #1a1c23, -2px -1px 0 #1a1c23, 2px -1px 0 #1a1c23, -2px 0 0 #1a1c23, 2px 0 0 #1a1c23, -2px 1px 0 #1a1c23, 2px 1px 0 #1a1c23, -2px 2px 0 #1a1c23, -1px 2px 0 #1a1c23, 0 2px 0 #1a1c23, 1px 2px 0 #1a1c23, 2px 2px 0 #1a1c23, -2px 3px 0 #1a1c23, -1px 3px 0 #1a1c23, 0 3px 0 #1a1c23, 1px 3px 0 #1a1c23, 2px 3px 0 #1a1c23, 0 5px 10px rgba(0,0,0,0.4)`
                        }}
                     >
                        یاریزانێن سەرهێل
                      </h2>

                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         triggerHaptic(10);
                         reconnectPresence();
                         fetchOnlineProfiles();
                       }}
                       disabled={loadingOnline}
                       className="w-8 h-8 rounded-[8px] bg-linear-to-b from-[#4aa1ff] to-[#1e86ff] flex items-center justify-center text-white transition-all active:scale-95 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-4px_0_#115ab5] border-[1.5px] border-[#181a20] z-20 overflow-hidden shrink-0"
                     >
                        <span className={`material-symbols-outlined text-[17px] relative z-10 ${loadingOnline ? 'animate-spin' : ''}`} style={{ filter: 'drop-shadow(0px 2px 0px rgba(0,0,0,0.3))' }}>sync</span>
                     </button>
                  </div>

                  <div className="flex-1 self-stretch flex flex-col relative mx-3 sm:mx-4 mb-4 rounded-[12px] bg-[#a3b3cc] shadow-[0_4px_6px_rgba(0,0,0,0.2)] overflow-hidden min-h-0">
                     <div className="relative z-20 flex flex-col h-[75vh] max-h-112.5 p-3 overflow-y-auto custom-scrollbar transition-opacity duration-300 gap-2">
                      {loadingOnline && activeProfiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-50">
                          <span className="material-symbols-outlined animate-spin text-3xl text-mono-500 mb-2">sync</span>
                          <p className="text-sm font-bold text-mono-500">لێگەڕیان ل یاریزانان...</p>
                        </div>
                      ) : (() => {
                        if (activeProfiles.length === 0) {
                          return (
                            <div className="flex flex-col items-center justify-center h-full text-center px-4">
                              <div className="w-12 h-12 rounded-[10px] bg-mono-200 border border-black/10 flex items-center justify-center mb-3 text-mono-400 shadow-inner">
                                <span className="material-symbols-outlined text-2xl">person_off</span>
                              </div>
                              <p className="text-[13px] font-bold text-mono-500">چ یاریزانێن دی نۆکە سەرهێل نینە.</p>
                            </div>
                          );
                        }

                        const isProfileBusy = (p) => !!(onlineUserStatuses?.[p.id] || busyUsers[p.id]);
                        const friendsNotInGame = activeProfiles.filter(p => p.isFriend && !isProfileBusy(p));
                        const othersNotInGame = activeProfiles.filter(p => !p.isFriend && !isProfileBusy(p));
                        const playersInGame = activeProfiles.filter(p => isProfileBusy(p));

                        return (
                          <>
                            {friendsNotInGame.length > 0 && (
                              <>
                                <div className="text-[13px] font-black text-[#3b4c68] drop-shadow-[0_1px_0_rgba(255,255,255,0.3)] mt-1 mb-1 px-1 text-right w-full block">هەڤالێن تە</div>
                                {friendsNotInGame.map(renderProfileRow)}
                              </>
                            )}
                            {othersNotInGame.length > 0 && (
                              <>
                                <div className={`text-[13px] font-black text-[#3b4c68] drop-shadow-[0_1px_0_rgba(255,255,255,0.3)] mb-1 px-1 text-right w-full block ${friendsNotInGame.length > 0 ? 'mt-4' : 'mt-1'}`}>یاریزانێن دی</div>
                                {othersNotInGame.map(renderProfileRow)}
                              </>
                            )}
                            {playersInGame.length > 0 && (
                              <>
                                <div className={`text-[13px] font-black text-[#3b4c68] drop-shadow-[0_1px_0_rgba(255,255,255,0.3)] mb-1 px-1 text-right w-full block ${(friendsNotInGame.length > 0 || othersNotInGame.length > 0) ? 'mt-4' : 'mt-1'}`}>د یاریێ دانە</div>
                                {playersInGame.map(renderProfileRow)}
                              </>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </>
              )}
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(multiplayerState === 'private_lobby' || multiplayerState === 'match_starting') && activeMatch && (
          <Motion.div
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="fixed inset-0 z-999 flex flex-col items-center justify-between bg-mono-50 dark:bg-mono-950 pb-20 pt-12 px-4"
          >
            {/* Top Right Close Button (Hide during match_starting) */}
            {multiplayerState === 'private_lobby' && (
              <button
                onClick={handleHostCancelInvite}
                className="absolute top-6 right-6 z-50 w-8 h-8 rounded-full bg-white dark:bg-mono-800 text-mono-400 hover:text-mono-900 dark:hover:text-white flex items-center justify-center transition-colors shadow-lg border border-mono-200 dark:border-transparent"
              >
                <span className="material-symbols-outlined font-black text-2xl">close</span>
              </button>
            )}

            {/* Top Center: Opponent */}
            <div className="flex flex-col items-center mt-12">
              <div className={`w-24 h-24 rounded-full bg-white dark:bg-mono-800 overflow-hidden border-2 mb-4 flex items-center justify-center relative ${(!activeMatch || activeMatch?.host_id === user?.id)
                ? 'shadow-[0_0_25px_rgba(239,68,68,0.6)] border-red-500'
                : 'shadow-[0_0_25px_rgba(59,130,246,0.6)] border-blue-500'
                }`}>
                {(invitedUserProfile?.avatar_url || opponent?.avatar_url) ? (
                  <Avatar src={invitedUserProfile?.avatar_url || opponent?.avatar_url} size="full" border={false} />
                ) : (
                  <span className={`material-symbols-outlined text-4xl ${(!activeMatch || activeMatch?.host_id === user?.id) ? 'text-red-400' : 'text-blue-400'
                    }`}>person</span>
                )}
              </div>
              {(() => {
                const targetObj = invitedUserProfile || opponent || {};
                const oppFont = NAME_FONTS[targetObj.equipped_font] || NAME_FONTS['default-ku'];
                const oppStyle = NAME_STYLES[targetObj.equipped_name_style] || {};
                const oppBundle = BUNDLES[targetObj.equipped_bundle] || BUNDLES['default'];

                const name = targetObj.nickname || 'یاریزان';
                const nameLen = Math.max(name.length, 1);
                const wideFonts = ['press-start-2p', 'bangers', 'blunt-wide', 'digiface', 'digital', 'lcd', 'runiga', 'god-of-war', 'fungky-brow', 'ncl-halloween-danger', 'awesome-christmas'];
                const isWideFont = wideFonts.includes(targetObj.equipped_font);

                const baselineLen = isWideFont ? 3 : 6;
                const scaleFactor = Math.min(1.15, Math.max(0.25, baselineLen / nameLen));
                const baseSize = oppFont.style?.fontSize ? parseFloat(oppFont.style.fontSize) : 1.4;
                const dynamicFontSize = `${baseSize * scaleFactor}em`;

                return (
                  <PremiumName
                    text={name}
                    styleId={oppBundle.id !== 'default' ? null : oppStyle.id}
                    dir="auto"
                    className={`font-black text-lg sm:text-xl tracking-normal drop-shadow-sm dark:drop-shadow-md whitespace-nowrap block max-w-62.5 overflow-visible py-2 px-3 text-center mx-auto ${oppBundle.id !== 'default' ? (oppBundle.fontKurdish + ' ' + oppBundle.textStyle) : 'text-white'}`}
                    style={{
                      ...(oppBundle.id !== 'default' ? {} : oppFont.style),
                      fontSize: dynamicFontSize
                    }}
                  />
                );
              })()}
            </div>

            {/* Middle Center: Timer or Loading Spinner */}
            <div className="flex flex-col items-center justify-center flex-1">
              {multiplayerState === 'match_starting' ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[64px] text-primary dark:text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] mb-4">progress_activity</span>
                  <p className="text-mono-500 dark:text-mono-300 font-bold text-sm mt-2 animate-pulse">ئامادەکرنا تابلۆیا یاریێ...</p>
                </>
              ) : (
                <>
                  <div className="text-[64px] font-black text-mono-900 dark:text-white font-mono drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] tracking-wider">
                    00:{inviteTimeLeft.toString().padStart(2, '0')}
                  </div>
                  <p className="text-mono-500 dark:text-mono-300 font-bold text-sm mt-2 animate-pulse">چاڤەڕێی بەرسڤێیە...</p>
                </>
              )}
            </div>

            {/* Bottom Center: Current User */}
            <div className="flex flex-col items-center mb-8">
              <div className={`w-24 h-24 rounded-full bg-white dark:bg-mono-800 overflow-hidden border-2 mb-4 flex items-center justify-center relative ${(!activeMatch || activeMatch?.host_id === user?.id)
                ? 'shadow-[0_0_25px_rgba(59,130,246,0.6)] border-blue-500'
                : 'shadow-[0_0_25px_rgba(239,68,68,0.6)] border-red-500'
                }`}>
                {profileData?.avatar_url || user?.user_metadata?.avatar_url ? (
                  <Avatar src={profileData?.avatar_url || user?.user_metadata?.avatar_url} size="full" border={false} />
                ) : (
                  <span className={`material-symbols-outlined text-4xl ${(!activeMatch || activeMatch?.host_id === user?.id) ? 'text-blue-400' : 'text-red-400'
                    }`}>person</span>
                )}
              </div>
              {(() => {
                const myFont = NAME_FONTS[equippedFont] || NAME_FONTS['default-ku'];
                const myStyle = NAME_STYLES[equippedNameStyle] || {};
                const myBundle = BUNDLES[equippedBundle] || BUNDLES['default'];

                const name = userNickname || 'یاریزان';
                const nameLen = Math.max(name.length, 1);
                const wideFonts = ['press-start-2p', 'bangers', 'blunt-wide', 'digiface', 'digital', 'lcd', 'runiga', 'god-of-war', 'fungky-brow', 'ncl-halloween-danger', 'awesome-christmas'];
                const isWideFont = wideFonts.includes(equippedFont);

                const baselineLen = isWideFont ? 3 : 6;
                const scaleFactor = Math.min(1.15, Math.max(0.25, baselineLen / nameLen));
                const baseSize = myFont.style?.fontSize ? parseFloat(myFont.style.fontSize) : 1.4;
                const dynamicFontSize = `${baseSize * scaleFactor}em`;

                return (
                  <PremiumName
                    text={name}
                    styleId={myBundle.id !== 'default' ? null : myStyle.id}
                    dir="auto"
                    className={`font-black text-lg sm:text-xl tracking-normal drop-shadow-sm dark:drop-shadow-md whitespace-nowrap block max-w-62.5 overflow-visible py-2 px-3 text-center mx-auto ${myBundle.id !== 'default' ? (myBundle.fontKurdish + ' ' + myBundle.textStyle) : 'text-white'}`}
                    style={{
                      ...(myBundle.id !== 'default' ? {} : myFont.style),
                      fontSize: dynamicFontSize
                    }}
                  />
                );
              })()}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

              {/* Custom Alert Modal */}
        <GiftPopup isVisible={showGiftPopup} onClose={handleGiftClose} />
      <AnimatePresence>
        {inviteAlert && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-9999 flex items-center justify-center bg-black/90 p-4"
          >
            <Motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-mono-100 dark:bg-mono-900 rounded p-6 shadow-2xl border border-mono-200 dark:border-mono-800 max-w-xs w-full flex flex-col items-center gap-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-red-500 text-2xl">error</span>
              </div>
              <p className="text-sm font-bold text-mono-900 dark:text-white leading-relaxed">{inviteAlert}</p>
              <button
                onClick={() => setInviteAlert(null)}
                className="w-full py-2.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors mt-2"
              >
                باشە
              </button>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      <LuckyWheelModal isOpen={showLuckyWheel} onClose={() => setShowLuckyWheel(false)} />
      <MysteryBoxModal isOpen={showMysteryBox} onClose={() => setShowMysteryBox(false)} />

      <AnimatePresence>
        {selectedProfile && (
          <PublicProfileModal
            profile={selectedProfile}
            currentUser={user}
            onClose={() => setSelectedProfile(null)}
            onOpenChat={(player) => {
              setSelectedProfile(null);
              if (onOpenChat) onOpenChat(player);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isReportModalOpen && (
          <ReportModal
            key="report-modal"
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            user={user}
          />
        )}
        {isWordModalOpen && (
          <WordSuggestionModal 
            key="word-modal"
            isOpen={isWordModalOpen}
            onClose={() => setIsWordModalOpen(false)}
            user={user}
          />
        )}
      </AnimatePresence>

      {/* Onboarding Tour */}
      {profileData && 
       profileData.has_completed_install_guide === false && 
       !tourCompleted && 
       (!(!profileData.latitude || !profileData.longitude) || localStorage.getItem('has_seen_location_prompt')) && (
        <OnboardingOverlay
          steps={[
            {
              targetId: 'btn-download-game',
              title: 'یاریێ دابگرە',
              text: 'ژ بۆ ئەزموونەکا باشتر و بێ ئاریشە، پێدڤییە یاریێ ب شێوەیەکێ سەرەکی دابگریە سەر شاشەیا خوە. کلیکێ ل ڤێ دوگمەیێ بکە دا کو فێرکاریێ ببینی.',
              position: 'bottom'
            }
          ]}
          onComplete={() => {
            setTourCompleted(true);
            window.dispatchEvent(new CustomEvent('openInstallModal'));
          }}
        />
      )}
    </Motion.div>
  );
});

export default LobbyView;

