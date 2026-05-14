import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { AVATARS } from '../data/avatars';

export default function NotificationsView({ 
  notifications = [], 
  onClose, 
  onAction 
}) {
  const groups = {
    new: [],
    today: [],
    earlier: []
  };

  const now = new Date();
  notifications.forEach(notif => {
    const created = new Date(notif.created_at);
    const diffMs = now - created;
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 1) groups.new.push(notif);
    else if (diffHours < 24) groups.today.push(notif);
    else groups.earlier.push(notif);
  });

  const renderItem = (item) => {
    const avatar = AVATARS.find(a => a.id === item.user_avatar)?.symbol || '👤';
    const timeAgo = formatTimeAgo(item.created_at);
    
    return (
      <Motion.div
        key={item.id}
        initial={{ x: 10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        onClick={(e) => { e.stopPropagation(); triggerHaptic(10); onAction(item); }}
        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-mono-100 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-mono-200 dark:hover:border-white/5 bg-mono-50 dark:bg-white/[0.02] mb-1.5"
      >
        <div className="w-10 h-10 rounded-full bg-mono-200 dark:bg-slate-800 flex items-center justify-center text-xl border border-mono-300 dark:border-white/10 shrink-0 relative">
          {avatar}
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center shadow-lg border-2 border-mono-white dark:border-slate-900 ${
            item.type === 'message' ? 'bg-blue-500' : 'bg-green-500'
          }`}>
            <span className="material-symbols-outlined text-[10px] text-white">
              {item.type === 'message' ? 'chat' : 'person_add'}
            </span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-mono-900 dark:text-white/90 leading-tight">
            <span className="text-primary font-black">{item.user_nickname}</span>
            {item.type === 'message' ? ' نامە' : ' داخوازى'}
          </p>
          <span className="text-[9px] text-mono-400 dark:text-white/30 font-bold uppercase">{timeAgo}</span>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
      </Motion.div>
    );
  };

  return (
    <>
      {/* Backdrop to close when clicking outside */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      <Motion.div 
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="absolute top-full mt-2 right-0 w-80 max-h-[480px] z-50 bg-mono-white/95 dark:bg-black/95 backdrop-blur-2xl rounded-2xl border border-mono-200 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Arrow */}
        <div className="absolute -top-1.5 right-6 w-3 h-3 bg-mono-white dark:bg-black border-l border-t border-mono-200 dark:border-white/10 rotate-45" />

        <div className="p-4 border-b border-mono-100 dark:border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-black text-mono-900 dark:text-white">ئاگەھدارى</h3>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black">
            {notifications.length} نوکە
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
          {notifications.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center opacity-40">
              <span className="material-symbols-outlined text-4xl mb-2 text-mono-400">notifications_off</span>
              <p className="text-xs font-bold font-rabar text-mono-500">چ ئاگەھدارى نینن</p>
            </div>
          ) : (
            <>
              {groups.new.length > 0 && (
                <div className="mb-4">
                  <h4 className="px-2 mb-2 text-[9px] font-black text-mono-400 dark:text-white/20 uppercase">یێن نوى</h4>
                  {groups.new.map(renderItem)}
                </div>
              )}
              {groups.today.length > 0 && (
                <div className="mb-4">
                  <h4 className="px-2 mb-2 text-[9px] font-black text-mono-400 dark:text-white/20 uppercase">ئەڤرۆ</h4>
                  {groups.today.map(renderItem)}
                </div>
              )}
              {groups.earlier.length > 0 && (
                <div>
                  <h4 className="px-2 mb-2 text-[9px] font-black text-mono-400 dark:text-white/20 uppercase">یێن دیدى</h4>
                  {groups.earlier.map(renderItem)}
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="p-3 border-t border-mono-100 dark:border-white/5 text-center">
          <button 
            onClick={() => { triggerHaptic(10); onClose(); }}
            className="text-[11px] font-bold text-mono-400 hover:text-mono-900 dark:text-slate-500 dark:hover:text-white transition-colors"
          >
            داخستن
          </button>
        </div>
      </Motion.div>
    </>
  );
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'نوکە';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

