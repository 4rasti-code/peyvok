import React, { useState, useEffect, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/AuthContext';
import { useMultiplayerStore } from '../store/multiplayerStore';
import { supabase } from '../lib/supabase';
import { triggerHaptic } from '../utils/haptics';
import { useAudio } from '../context/AudioContext';
import Avatar from './Avatar';

const GlobalInviteToast = ({ setGameMode, currentView, setCurrentView, gameMode }) => {
  const { user } = useUser();
  const { playInviteSound } = useAudio();
  const joinPrivateMatch = useMultiplayerStore(s => s.joinPrivateMatch);
  const multiplayerState = useMultiplayerStore(s => s.multiplayerState);

  const currentViewRef = useRef(currentView);
  const multiplayerStateRef = useRef(multiplayerState);
  const gameModeRef = useRef(gameMode);

  useEffect(() => {
    currentViewRef.current = currentView;
    multiplayerStateRef.current = multiplayerState;
    gameModeRef.current = gameMode;
  }, [currentView, multiplayerState, gameMode]);

  const broadcastReply = async (hostId, event, payload) => {
    const topic = `host_replies_${hostId}`;
    let channel = supabase.getChannels().find(c => c.topic === `realtime:${topic}`);
    
    if (channel && channel.state === 'joined') {
      await channel.send({ type: 'broadcast', event, payload });
      return;
    }

    if (channel) {
      supabase.removeChannel(channel);
    }

    const newChannel = supabase.channel(topic, { config: { broadcast: { ack: true } } });
    
    return new Promise((resolve) => {
      newChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await newChannel.send({ type: 'broadcast', event, payload });
          } catch (e) {
            console.error("Broadcast reply failed", e);
          } finally {
            setTimeout(() => {
              supabase.removeChannel(newChannel);
            }, 1000);
            resolve();
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          resolve();
        }
      });
    });
  };

  const [invite, setInvite] = useState(null);
  const [cancelAlert, setCancelAlert] = useState(null);
  const inviteRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    inviteRef.current = invite;
  }, [invite]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel(`user_invites_${user.id}`);

    channel.on(
      'broadcast',
      { event: 'match_invite' },
      async (payload) => {
        console.log('Received Invite Payload:', payload);
        const inviteData = payload.payload;

        // VERIFY AGAINST GHOST INVITES: Check if room is actually still waiting
        const { data: roomCheck } = await supabase
          .from('online_matches')
          .select('status')
          .eq('id', inviteData.roomId)
          .single();

        if (!roomCheck || roomCheck.status !== 'private_waiting') {
          console.warn('[GlobalInviteToast] Ignored ghost invite (room deleted or started).', inviteData.roomId);
          return;
        }

        const isBusy = currentViewRef.current === 'game' || (multiplayerStateRef.current && multiplayerStateRef.current !== 'idle');

        if (isBusy) {
          console.log('User is busy, auto-rejecting invite.');
          broadcastReply(inviteData.hostId, 'match_invite_busy', { roomId: inviteData.roomId, joinerId: user.id, busyMode: gameModeRef.current });
          return;
        }

        setInvite({
          hostId: inviteData.hostId,
          hostName: inviteData.hostName,
          hostAvatar: inviteData.hostAvatar,
          roomId: inviteData.roomId,
          timestamp: Date.now()
        });

        playInviteSound();
        triggerHaptic(10);

        // Auto-dismiss after 14 seconds
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setInvite(null);
        }, 14000);
      }
    )
      .on('broadcast', { event: 'invite_cancelled' }, (payload) => {
        if (payload.payload.roomId === inviteRef.current?.roomId) {
          setInvite(null);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          triggerHaptic(50);
          const hostName = inviteRef.current?.hostName || 'یاریزان';
          setCancelAlert(hostName);
        }
      })
      .subscribe((status) => {
        console.log('B. Receiver channel status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [user?.id, playInviteSound]);

  useEffect(() => {
    if (cancelAlert) {
      const timer = setTimeout(() => {
        setCancelAlert(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [cancelAlert]);


  const handleAccept = async () => {
    triggerHaptic(15);

    // 1. FORCE BLUR: Close OS keyboard and clear focus from chat inputs
    if (document.activeElement) {
      document.activeElement.blur();
    }

    // 2. DISPATCH EVENT: Tell SocialHub to clean up internal state
    window.dispatchEvent(new Event('forceCloseChat'));

    if (setGameMode) setGameMode('multiplayer');
    if (setCurrentView) setCurrentView('game'); // STRICTLY ROUTE TO GAME VIEW

    if (invite?.roomId && invite?.hostId) {
      joinPrivateMatch(invite.roomId);

      // Broadcast acceptance to host for INSTANT transition
      // Broadcast acceptance to host for INSTANT transition
      await broadcastReply(invite.hostId, 'match_invite_accepted', { roomId: invite.roomId, joinerId: user.id });
    } else if (invite?.roomId) {
      joinPrivateMatch(invite.roomId);
    }
    setInvite(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleDecline = async () => {
    triggerHaptic(10);

    if (invite?.hostId && invite?.roomId) {
      // Broadcast rejection to host
      // Broadcast rejection to host
      await broadcastReply(invite.hostId, 'match_invite_rejected', { roomId: invite.roomId });
    }

    setInvite(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  return (
    <>
      <AnimatePresence>
        {invite && (
          <Motion.div
            initial={{ opacity: 0, y: -100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed top-[calc(env(safe-area-inset-top,0px)+16px)] left-0 right-0 z-9999 flex justify-center px-4 pointer-events-none"
          >
            <div className="rounded p-4 shadow-[0_10px_25px_rgba(0,0,0,0.5)] border-none pointer-events-auto max-w-sm w-full flex flex-col gap-3 relative overflow-hidden bg-blue-600">
              <div
                className="absolute inset-0 bg-red-600 z-0"
                style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }}
              />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay z-0" />

              <div className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-black/60 to-transparent z-0 pointer-events-none" />

              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20 relative overflow-hidden shadow-sm">
                  {invite.hostAvatar ? (
                    <Avatar src={invite.hostAvatar} size="full" border={false} />
                  ) : (
                    <span className="material-symbols-outlined text-white">swords</span>
                  )}
                </div>
                <p className="text-[13px] font-bold text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  <span className="text-white font-black">{invite.hostName}</span> داخوازا یارییەکا هەڤڕکی ژ تە دکەت!
                </p>
              </div>

              <div className="relative z-10 flex gap-8 mt-2">
                <button
                  onClick={handleDecline}
                  className="flex-1 py-2 rounded-sm bg-white/15 hover:bg-white/25 border border-white/20 transition-colors shadow-sm"
                >
                  <div className="text-white font-bold text-xs flex items-center justify-center">
                    رەتکرن
                  </div>
                </button>
                <button
                  onClick={handleAccept}
                  className="flex-1 py-2 rounded-sm bg-white shadow-md hover:bg-blue-50 transition-colors"
                >
                  <div className="text-blue-700 font-black text-xs flex items-center justify-center">
                    قەبوولکرن
                  </div>
                </button>
              </div>

              {/* Countdown bar indicator */}
              <Motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 15, ease: "linear" }}
                className="absolute bottom-0 left-0 h-1 bg-white opacity-80 z-20"
              />
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cancelAlert && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-auto"
          >
            <Motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-mono-100 dark:bg-mono-900 rounded-md p-5 shadow-2xl border border-mono-200 dark:border-mono-800 max-w-65 w-full flex flex-col items-center gap-3 text-center"
              dir="rtl"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-red-500 text-2xl">error</span>
              </div>
              <p className="text-sm font-bold text-mono-900 dark:text-white leading-relaxed">
                داخوازنامە ژ لایێ <span className="text-red-500 dark:text-red-400 mx-1">{cancelAlert}</span> ڤە هاتە هەلوەشاندن
              </p>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalInviteToast;
