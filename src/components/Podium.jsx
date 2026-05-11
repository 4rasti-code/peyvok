import React from 'react';
import { motion as Motion } from 'framer-motion';
import FlagBadge from './FlagBadge';
import { toKuDigits } from '../utils/formatters';
import Avatar from './Avatar';

const PodiumStep = ({ player, rank, delay, onPlayerClick }) => {
  const isFirst = rank === 1;
  const isSecond = rank === 2;

  const renderAvatar = (player, size = "md") => {
    return (
      <div className={`${size === 'lg' ? 'w-16 h-16' : 'w-11 h-11'} rounded-2xl bg-white/5 border-2 ${isFirst ? 'border-[#d9a441] gold-glow' : isSecond ? 'border-white/30' : 'border-orange-500/30'} flex items-center justify-center overflow- shadow-2xl z-10 relative backdrop-blur-xl`}>
        <Avatar 
          src={player?.avatar_url} 
          updatedAt={player?.updated_at} 
          size={size === 'lg' ? 'xl' : 'lg'} 
          className="rounded-2xl w-full h-full"
          border={false}
        />
      </div>
    );
  };

  const getRankStyle = () => {
    if (isFirst) return { 
        bg: 'bg-white/10', 
        border: 'border-[#d9a441]/40', 
        height: 'h-40', 
        rankColor: 'text-[#d9a441]',
        textShadow: 'gold-glow'
    };
    if (isSecond) return { 
        bg: 'bg-white/5', 
        border: 'border-white/10', 
        height: 'h-32', 
        rankColor: 'text-white/40',
        textShadow: ''
    };
    return { 
        bg: 'bg-white/5', 
        border: 'border-white/5', 
        height: 'h-24 md:h-32', 
        rankColor: 'text-orange-500/30',
        textShadow: ''
    };
  };

  const style = getRankStyle();

  return (
    <Motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 120, damping: 18 }}
      className={`flex flex-col items-center flex-1 min-w-0 ${isFirst ? 'z-20' : 'z-10'} cursor-pointer active:scale-95 transition-transform`}
      onClick={() => onPlayerClick?.(player)}
    >
      {/* Avatar Container */}
      <div className="relative mb-4 group px-1">
        {isFirst && (
          <Motion.div 
            animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="absolute -top-7 left-1/2 -translate-x-1/2 text-[#d9a441]"
          >
            <span className="material-symbols-outlined text-2xl gold-glow">crown</span>
          </Motion.div>
        )}
        
        <div className={`relative ${isFirst ? 'scale-110' : 'scale-90'}`}>
          {renderAvatar(player, isFirst ? "lg" : "md")}
          <div className="absolute -bottom-1 -right-1 overflow-hidden shadow-2xl z-20 scale-90">
            <FlagBadge isInKurdistan={player?.is_kurdistan} countryCode={player?.country_code} size="xs" />
          </div>
        </div>
      </div>

      {/* Podium Block - Deep Glass */}
      <div className={`w-full ${style.height} ${style.bg} rounded-t-[40px] border-t border-x ${style.border} flex flex-col items-center pt-5 relative backdrop-blur-3xl overflow- shadow-2xl`}>
         <div className={`${style.rankColor} text-6xl font-black font-rabar opacity-10 absolute bottom-[-10px] leading-none select-none italic`}>
            {toKuDigits(rank || 0)}
         </div>
         
         <div className="px-3 text-center w-full z-10">
           <p className={`text-[13px] font-black font-rabar text-white truncate leading-tight ${style.textShadow}`}>
             {player?.nickname || 'مێڤان'}
           </p>
           <p className="text-[10px] font-black font-rabar text-white/20 mt-1 uppercase">
             {toKuDigits(Math.floor(player?.xp || 0))} XP
           </p>
         </div>
      </div>
    </Motion.div>
  );
};

export default function Podium({ topThree, onPlayerClick }) {
  if (!topThree || topThree.length === 0) return null;

  const podiumOrder = [
    { player: topThree[1], rank: 2, delay: 0.15 },
    { player: topThree[0], rank: 1, delay: 0 },
    { player: topThree[2], rank: 3, delay: 0.3 }
  ];

  return (
    <div className="flex items-end gap-1.5 md:gap-3 px-2 md:px-4 max-w-sm md:max-w-md mx-auto mb-6 pt-12">
      {podiumOrder.map((item) => (
        <PodiumStep 
          key={item.rank} 
          player={item.player} 
          rank={item.rank} 
          delay={item.delay} 
          onPlayerClick={onPlayerClick}
        />
      ))}
    </div>
  );
}


