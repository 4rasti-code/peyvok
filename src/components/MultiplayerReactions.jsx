import React, { useState, useRef, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useMultiplayerStore } from '../store/multiplayerStore';
import { useVoice } from '../context/VoiceContext';
import { useAudio } from '../context/AudioContext';
import { triggerHaptic } from '../utils/haptics';

const SpeakingIndicator = () => (
  <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center justify-center h-5">
    <span className="material-symbols-outlined text-emerald-400 font-bold drop-shadow-[0_0_4px_rgba(52,211,153,0.8)]" style={{ fontSize: '18px' }}>volume_up</span>
  </div>
);

const EMOJIS = ['😂', '😡', '👏', '🤯', '💔', '🧠'];
const QUICK_CHATS = [
  "هـهـهـهـ",
  "دێ ڕحێ!",
  "چ لێ هات؟",
  "ئەڤە چیە؟",
  "ئەز نزانم!",
  "دی زی!",
  "مێشکێ من سەکنی!",
  "ساناهیە ماڵا تە!",
  "ئەز نە کوردم!"
];

export default function MultiplayerReactions() {
  const broadcastReaction = useMultiplayerStore(s => s.broadcastReaction);
  const { activeSpeakers, isDeafened, remoteUsers } = useVoice();
  const { playPopSound } = useAudio();
  const [isQuickChatOpen, setIsQuickChatOpen] = useState(false);
  const quickChatRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (quickChatRef.current && !quickChatRef.current.contains(e.target)) {
        setIsQuickChatOpen(false);
      }
    };
    if (isQuickChatOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isQuickChatOpen]);

  const handleSendReaction = (emoji) => {
    triggerHaptic(15);
    try { playPopSound(); } catch (_e) { /* ignore */ }
    broadcastReaction(emoji);
    setIsQuickChatOpen(false);
  };

  const isOpponentSpeaking = Object.keys(activeSpeakers).some(uid => !!remoteUsers[uid]);
  const isRemoteSpeaking = !isDeafened && isOpponentSpeaking;

  return (
    <>
      {/* SENDING UI: Unified Vertical List on the right side */}
      <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex flex-col items-center bg-white/70 dark:bg-black/60 backdrop-blur-xl py-1 px-0 rounded-md border border-slate-200/50 dark:border-white/10 pointer-events-auto z-8002 shadow-xl transition-all duration-300">
        
        {isRemoteSpeaking && <SpeakingIndicator />}

        {/* Quick Chat Menu & Toggle */}
        <div className="relative flex justify-center w-full" ref={quickChatRef}>
          <button
            onClick={() => {
              triggerHaptic(10);
              setIsQuickChatOpen(!isQuickChatOpen);
            }}
            className={`flex items-center justify-center hover:scale-110 transition-transform active:scale-95 drop-shadow-md my-0.5 ${
              isQuickChatOpen 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-mono-700 dark:text-mono-300'
            }`}
            style={{
              width: 'clamp(30px, 8vw, 44px)',
              height: 'clamp(30px, 8vw, 44px)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 'clamp(20px, 5vw, 24px)' }}>
              chat
            </span>
          </button>

          {/* Quick Chat Dropdown */}
          <AnimatePresence>
            {isQuickChatOpen && (
              <Motion.div
                initial={{ opacity: 0, scale: 0.9, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 10 }}
                transition={{ duration: 0.2 }}
                dir="rtl"
                className="absolute right-[110%] top-0 w-max overflow-hidden bg-white/95 dark:bg-black/95 backdrop-blur-xl rounded-md border border-slate-200 dark:border-mono-700 shadow-2xl py-1.5 flex flex-col"
              >
                {QUICK_CHATS.map((chat, idx) => {
                  const cleanChat = chat.replace(/\u200E|\u200F|\uFE0F/g, '');

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendReaction(chat)}
                      className="w-full flex items-center justify-start px-2.5 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors active:bg-blue-100 dark:active:bg-blue-900/50"
                    >
                      <span className="text-[12px] font-medium text-mono-800 dark:text-mono-200 whitespace-nowrap">{cleanChat}</span>
                    </button>
                  );
                })}
              </Motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-px bg-slate-300/50 dark:bg-white/10 w-[80%] mx-auto my-0.5" />

        {/* Existing Emoji List */}
        {EMOJIS.map((emoji, idx) => (
          <React.Fragment key={emoji}>
            {idx > 0 && <div className="h-px bg-slate-300/50 dark:bg-white/10 w-[80%] mx-auto my-0.5" />}
            <button
              onClick={() => handleSendReaction(emoji)}
              className="flex items-center justify-center hover:scale-125 transition-transform active:scale-95 drop-shadow-md my-0.5"
              style={{
                width: 'clamp(30px, 8vw, 44px)',
                height: 'clamp(30px, 8vw, 44px)',
                fontSize: 'clamp(18px, 5vw, 26px)'
              }}
            >
              {emoji}
            </button>
          </React.Fragment>
        ))}
      </div>
    </>
  );
}

