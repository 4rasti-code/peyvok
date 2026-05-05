import React, { useState, useEffect } from 'react';
import AgoraRTC, {
  AgoraRTCProvider,
  useLocalMicrophoneTrack,
  useJoin,
  usePublish,
  useRemoteUsers,
} from "agora-rtc-react";
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/AuthContext';
import { useMultiplayer } from '../context/MultiplayerContext';
import { useGame } from '../context/GameContext';
import Avatar from './Avatar';

// --- AGORA CONFIG ---
const APP_ID = "c1d5e8e055f44d5fa88d6193fd8c471c";

/**
 * PlayerRow - A simple flat row for a player in the voice menu.
 */
function PlayerRow({ avatar, nickname, isLocal, isActive, onToggle, isSpeaking }) {
  return (
    <div className="flex items-center justify-between p-1 hover:bg-mono-50 dark:hover:bg-white/5 rounded-sm transition-colors">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar src={avatar} size="sm" />
          {isSpeaking && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#1a2e20] animate-pulse" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-black text-mono-900 dark:text-white font-noto-sans-arabic leading-tight">{nickname}</span>
        </div>
      </div>

      <button
        onClick={onToggle}
        className={`w-6 h-6 rounded-sm flex items-center justify-center transition-all duration-300 ${isActive
          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-600/10 dark:bg-emerald-400/20'
          : 'bg-mono-200 dark:bg-white/10 text-mono-500 dark:text-white/40'
          }`}
      >
        <span className="material-symbols-outlined text-base" style={{ fontWeight: 300 }}>
          {isLocal 
            ? (isActive ? 'mic' : 'mic_off') 
            : (isActive ? 'volume_up' : 'volume_off')}
        </span>
      </button>
    </div>
  );
}

/**
 * VoiceControls - Internal component managing Agora and UI.
 */
function VoiceControls({ matchId, onHelp, onExit }) {
  const [isOpen, setIsOpen] = useState(false);
  const { userNickname, userAvatar, micEnabled, speakerEnabled, updateProfile } = useUser();
  const { opponent } = useMultiplayer();
  const { level: userLevel } = useGame();
  
  const [localVolume, setLocalVolume] = useState(0);
  const [isVoiceExpanded, setIsVoiceExpanded] = useState(false);

  // 1. Agora Hooks
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(true);
  
  const { isLoading, error: joinError } = useJoin({
    appid: APP_ID,
    channel: matchId,
    token: null,
  }, !!matchId);

  usePublish([localMicrophoneTrack], micEnabled && !!localMicrophoneTrack);
  
  const remoteUsers = useRemoteUsers();

  // Handle Local Mic Mute State
  useEffect(() => {
    if (localMicrophoneTrack) {
      localMicrophoneTrack.setMuted(!micEnabled);
    }
  }, [localMicrophoneTrack, micEnabled]);

  // Remote Audio Management
  useEffect(() => {
    remoteUsers.forEach(user => {
      if (user.audioTrack) {
        if (speakerEnabled) {
          user.audioTrack.play();
        } else {
          user.audioTrack.stop();
        }
      }
    });
  }, [remoteUsers, speakerEnabled]);

  // Volume detection for speaking indicators
  useEffect(() => {
    if (!localMicrophoneTrack || !micEnabled) {
      const timer = setTimeout(() => setLocalVolume(0), 0);
      return () => clearTimeout(timer);
    }
    const interval = setInterval(() => {
      setLocalVolume(localMicrophoneTrack.getVolumeLevel() * 100);
    }, 200);
    return () => clearInterval(interval);
  }, [localMicrophoneTrack, micEnabled]);

  const isLocalSpeaking = localVolume > 5;
  const remoteUser = remoteUsers[0];
  const isOpponentSpeaking = remoteUser?.hasAudio && speakerEnabled;

  return (
    <div className="relative pointer-events-auto">
      {/* 1. HAMBURGER TRIGGER */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 mt-1 flex items-center justify-center text-mono-900 dark:text-white active:scale-90 transition-transform"
      >
        <span className="material-symbols-outlined text-2xl" style={{ fontWeight: 300 }}>
          {isOpen ? 'close' : 'menu'}
        </span>
      </button>

      {/* 2. DROPDOWN PANEL & BACKDROP */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Transparent Backdrop to catch clicks outside */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />

            <Motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="absolute right-0 mt-2 w-[180px] bg-white dark:bg-mono-950 border border-mono-200 dark:border-white/10 rounded-sm shadow-2xl z-50 overflow-hidden p-1 flex flex-col gap-0.5"
              dir="rtl"
            >
              {joinError && (
                <div className="px-1 pb-1.5 mb-1.5 border-b border-mono-100 dark:border-white/5 text-center">
                  <span className="text-[7px] font-bold text-red-500 uppercase tracking-tighter">Connection Error (Token Required?)</span>
                </div>
              )}
              {isLoading && (
                <div className="px-1 pb-1.5 mb-1.5 border-b border-mono-100 dark:border-white/5 text-center">
                  <span className="text-[7px] font-bold text-mono-400 dark:text-white/40 animate-pulse">Connecting...</span>
                </div>
              )}

              {/* Voice Sub-menu Toggle */}
              <button
                onClick={() => setIsVoiceExpanded(!isVoiceExpanded)}
                className="flex items-center justify-between w-full p-2 hover:bg-mono-50 dark:hover:bg-white/5 rounded-sm transition-all"
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-emerald-500" style={{ fontWeight: 300 }}>graphic_eq</span>
                  <span className="text-[10px] font-black text-mono-900 dark:text-white">دەنگ</span>
                </div>
                <span className={`material-symbols-outlined text-sm text-mono-400 transition-transform duration-300 ${isVoiceExpanded ? 'rotate-180' : ''}`} style={{ fontWeight: 300 }}>
                  expand_more
                </span>
              </button>

              <AnimatePresence>
                {isVoiceExpanded && (
                  <Motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden flex flex-col gap-1.5"
                  >
                    {/* Local Player Row */}
                    <PlayerRow
                      avatar={userAvatar}
                      nickname={userNickname}
                      level={userLevel}
                      isLocal={true}
                      isActive={micEnabled}
                      onToggle={() => updateProfile({ mic_enabled: !micEnabled })}
                      isSpeaking={isLocalSpeaking}
                    />

                    {/* Opponent Row */}
                    <PlayerRow
                      avatar={opponent?.avatar_url}
                      nickname={opponent?.nickname || 'چاڤەڕێ...'}
                      level={opponent?.xp ? Math.floor(Math.sqrt(opponent.xp / 100)) + 1 : 1}
                      isLocal={false}
                      isActive={speakerEnabled}
                      onToggle={() => updateProfile({ speaker_enabled: !speakerEnabled })}
                      isSpeaking={isOpponentSpeaking}
                    />
                  </Motion.div>
                )}
              </AnimatePresence>

            {/* Utility Buttons Row - MINIMAL STACK */}
            <div className="flex flex-col gap-0.5 pt-1 border-t border-mono-100 dark:border-white/5">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onHelp?.();
                }}
                className="flex items-center justify-between w-full p-1 hover:bg-mono-50 dark:hover:bg-white/5 rounded-sm transition-all"
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-emerald-500" style={{ fontWeight: 300 }}>help</span>
                  <span className="text-[10px] font-black text-mono-900 dark:text-white">ڕێنمایی</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  onExit?.();
                }}
                className="flex items-center justify-between w-full p-1 hover:bg-mono-50 dark:hover:bg-white/5 rounded-sm transition-all"
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-red-500" style={{ fontWeight: 300 }}>logout</span>
                  <span className="text-[10px] font-black text-mono-900 dark:text-white">دەرکەفتن</span>
                </div>
              </button>
            </div>
          </Motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const agoraClient = AgoraRTC.createClient({ codec: "vp8", mode: "rtc" });

export default function VoiceManager({ matchId, onHelp, onExit }) {
  if (!matchId) return null;

  return (
    <AgoraRTCProvider client={agoraClient}>
      <VoiceControls matchId={matchId} onHelp={onHelp} onExit={onExit} />
    </AgoraRTCProvider>
  );
}
