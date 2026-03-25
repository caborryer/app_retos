"use client"

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface BingoCellProps {
  id: string;
  title: string;
  isCompleted: boolean;
  onClick: (id: string) => void;
}

export function BingoCell({ id, title, isCompleted, onClick }: BingoCellProps) {
  // We use Framer Motion for the 3D flip effect
  return (
    <div 
      className="relative w-full aspect-square cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={() => onClick(id)}
    >
      <motion.div
        className="w-full h-full relative preserve-3d"
        animate={{ rotateY: isCompleted ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front of the card (Incomplete) */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden rounded-2xl flex items-center justify-center p-2 shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
          style={{ 
            background: 'linear-gradient(180deg, #E9191C 0%, #2F0203 100%)',
            border: '2px solid rgba(255,255,255,0.1)'
          }}
        >
          <span className="text-white text-center font-bold text-[10px] sm:text-xs md:text-sm leading-tight drop-shadow-md">
            {title}
          </span>
        </div>

        {/* Back of the card (Completed) */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden rounded-2xl flex flex-col items-center justify-center shadow-inner"
          style={{ 
            backgroundColor: '#1D1B20',
            border: '2px solid #E9191C',
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden'
          }}
        >
          <div className="bg-green-500 rounded-full p-1 sm:p-2 mb-1 shadow-[0_0_15px_rgba(34,197,94,0.5)]">
            <Check size={16} className="text-white sm:w-6 sm:h-6" />
          </div>
          <span className="text-gray-300 text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider">
            ¡Hecho!
          </span>
        </div>
      </motion.div>
    </div>
  );
}
