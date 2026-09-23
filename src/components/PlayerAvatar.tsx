import React from 'react';
import { Shield, Sparkles, BookOpen, Crown, Zap } from 'lucide-react';

interface PlayerAvatarProps {
  level: number;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ level, name, size = 'md' }) => {
  // Determine avatar rank tier based on level:
  // Level 1-4: Basic Apprentice Scholar
  // Level 5-9: Adept Scholar (Study Accessories)
  // Level 10-19: Advanced Archon
  // Level 20+: Grandmaster of Consistency
  let tierName = 'Novice Scholar';
  let badgeColor = 'from-blue-600 to-indigo-600';
  let auraGlow = 'rgba(59, 130, 246, 0.2)';
  let frameBorder = 'border-blue-500/40';

  if (level >= 20) {
    tierName = 'Elite Consistency Grandmaster';
    badgeColor = 'from-amber-400 via-orange-500 to-purple-600';
    auraGlow = 'rgba(245, 158, 11, 0.4)';
    frameBorder = 'border-amber-400/80';
  } else if (level >= 10) {
    tierName = 'Advanced Archon Scholar';
    badgeColor = 'from-purple-500 to-pink-600';
    auraGlow = 'rgba(168, 85, 247, 0.3)';
    frameBorder = 'border-purple-500/60';
  } else if (level >= 5) {
    tierName = 'Adept Focus Vanguard';
    badgeColor = 'from-emerald-500 to-teal-600';
    auraGlow = 'rgba(16, 185, 129, 0.3)';
    frameBorder = 'border-emerald-500/50';
  }

  const dimensionClasses = {
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-20 h-20 text-2xl',
    xl: 'w-28 h-28 text-4xl',
  }[size];

  return (
    <div className="relative inline-flex items-center justify-center group" title={`${name} • Level ${level} (${tierName})`}>
      {/* Outer Glow Halo */}
      <div 
        className="absolute inset-0 rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ backgroundColor: auraGlow }}
      />

      {/* Frame */}
      <div className={`relative ${dimensionClasses} rounded-2xl bg-gradient-to-br ${badgeColor} p-[2px] shadow-lg ${frameBorder}`}>
        <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center font-gamer font-black text-neutral-100 relative overflow-hidden">
          
          {/* Subtle gamer pattern inside avatar */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px]" />

          {/* Avatar Icon / Character Graphic */}
          <span className="relative z-10 font-black tracking-tighter">
            {name.charAt(0)}
          </span>

          {/* Cosmetic accessory badges based on level tier */}
          {level >= 20 ? (
            <Crown className="absolute top-1 right-1 w-3.5 h-3.5 text-amber-400 fill-current opacity-90" />
          ) : level >= 10 ? (
            <Sparkles className="absolute top-1 right-1 w-3 h-3 text-purple-400 fill-current opacity-90" />
          ) : level >= 5 ? (
            <Zap className="absolute top-1 right-1 w-3 h-3 text-emerald-400 fill-current opacity-90" />
          ) : null}
        </div>
      </div>

      {/* Level Tag (if size is md, lg, or xl) */}
      {size !== 'sm' && (
        <div className="absolute -bottom-1.5 -right-1.5 bg-neutral-950 border border-neutral-700 text-neutral-100 font-gamer font-black text-[10px] px-1.5 py-0.2 rounded-md shadow-md">
          L{level}
        </div>
      )}
    </div>
  );
};
