import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, MessageCircle, MapPin, Sparkles, Trash2 } from 'lucide-react';
import { HealingSpot } from '../types';

interface SpotCardProps {
  key?: string;
  spot: HealingSpot;
  onLike: (id: string, e: React.MouseEvent) => void;
  onSelect: (spot: HealingSpot) => void;
  index: number;
  isAdmin?: boolean;
  onDeleteAdmin?: (id: string, e: React.MouseEvent) => void;
}

export default function SpotCard({ spot, onLike, onSelect, index, isAdmin, onDeleteAdmin }: SpotCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Evenly distribute slight tilt angles based on the index to mimic a cozy scattered polaroid table
  const tilts = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-3', 'rotate-3'];
  const tiltClass = tilts[index % tilts.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className={`break-inside-avoid pb-8 pt-2`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        onClick={() => onSelect(spot)}
        className={`bg-white p-4 pb-8 transform transition-all duration-500 cursor-pointer polaroid-shadow border border-outline-variant/30 group ${
          isHovered ? 'scale-104 -translate-y-3 rotate-0' : tiltClass
        }`}
        style={{ borderRadius: '4px' }}
      >
        {/* Aspect Container */}
        <div className="relative aspect-[4/5] bg-cream-dark/40 overflow-hidden mb-5">
          <img
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
            src={spot.imageUrl}
            alt={spot.title}
            referrerPolicy="no-referrer"
          />
          {/* Subtle Category Tag */}
          <div className="absolute top-3 left-3 bg-primary/95 backdrop-blur-md text-cream px-3 py-1 rounded-full text-[11px] font-sans font-semibold tracking-wider uppercase border border-primary-light/40 flex items-center gap-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-moss-light animate-pulse" />
            {spot.category}
          </div>

          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-bark px-2.5 py-1 rounded-md text-[10px] font-sans font-medium shadow-sm flex items-center gap-1 border border-outline-variant/40">
            <MapPin className="w-3 h-3 text-primary-light" />
            <span className="truncate max-w-[80px]">{spot.locationName.split(' ')[0]}</span>
          </div>

          {isAdmin && onDeleteAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteAdmin(spot.id, e);
              }}
              title="관리자 권한으로 이 안식처 카드 삭제"
              className="absolute bottom-3 right-3 bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-full shadow-lg active:scale-95 hover:scale-110 transition-all z-10 cursor-pointer border border-white/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Written style Title */}
        <h4 className="font-handwritten text-3xl text-bark text-center tracking-wide leading-tight px-1 mb-4 select-none">
          {spot.title}
        </h4>

        {/* Info Area */}
        <div className="flex justify-between items-center px-2 pt-2 border-t border-cream-dark/80">
          <button
            onClick={(e) => onLike(spot.id, e)}
            className="flex items-center gap-1.5 text-bark/70 hover:text-red-500 transition-all active:scale-90 group/btn"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                spot.likes > 24 
                  ? 'fill-red-500 text-red-500' 
                  : 'text-bark/50 group-hover/btn:text-red-400'
              }`}
            />
            <span className="text-xs font-sans font-medium">{spot.likes}</span>
          </button>

          <div className="flex items-center gap-3">
            {spot.comments.length > 0 && (
              <div className="flex items-center gap-1 text-bark/50 text-xs">
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="font-medium">{spot.comments.length}</span>
              </div>
            )}
            <span className="text-[11px] font-sans tracking-wide text-bark/60 font-medium bg-cream-dark/45 px-2 py-0.5 rounded-md">
              {spot.author}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
