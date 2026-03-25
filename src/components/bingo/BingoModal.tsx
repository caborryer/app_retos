'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';

interface BingoModalProps {
  open: boolean;
  boardNumber: number;
  totalPoints: number;
  onContinue: () => void;
}

const confettiColors = [
  '#FF5327', '#FC0230', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899',
];

function Confetti() {
  const pieces = Array.from({ length: 30 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {pieces.map((_, i) => {
        const color = confettiColors[i % confettiColors.length];
        const left = `${(i * 37 + 10) % 100}%`;
        const delay = (i * 0.07) % 1;
        const size = 6 + (i % 5) * 2;
        return (
          <motion.div
            key={i}
            className="absolute rounded-sm"
            style={{ left, top: -size, width: size, height: size, background: color }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{ y: 420, opacity: [1, 1, 0], rotate: 360 * (i % 2 === 0 ? 1 : -1) }}
            transition={{ duration: 1.8 + delay, delay, repeat: Infinity, ease: 'easeIn' }}
          />
        );
      })}
    </div>
  );
}

export default function BingoModal({ open, boardNumber, totalPoints, onContinue }: BingoModalProps) {
  // Bloquear scroll cuando el modal está abierto
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Card */}
          <motion.div
            className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl"
            initial={{ scale: 0.7, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 18, stiffness: 260 }}
          >
            <Confetti />

            {/* Header naranja */}
            <div
              className="relative flex flex-col items-center pt-8 pb-6 px-6"
              style={{ background: 'linear-gradient(180deg, #FF5327 0%, #FC0230 100%)' }}
            >
              {/* Icono trofeo */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
                className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-3"
              >
                <Trophy className="w-10 h-10 text-white" strokeWidth={1.5} />
              </motion.div>

              {/* Estrellas */}
              <div className="flex gap-1 mb-3">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.25 + i * 0.1 }}
                  >
                    <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                  </motion.div>
                ))}
              </div>

              <motion.h2
                className="text-4xl font-black text-white tracking-widest"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                ¡BINGO!
              </motion.h2>
              <p className="text-white/90 text-sm mt-1 font-medium">
                Tablero {boardNumber} completado
              </p>
            </div>

            {/* Cuerpo */}
            <div className="px-6 py-6 text-center">
              <p className="text-secondary-700 text-sm mb-2">
                ¡Completaste todos los retos del tablero!
              </p>
              <div className="flex items-center justify-center gap-2 mb-5">
                <Trophy className="w-5 h-5 text-primary-500" />
                <span className="text-2xl font-bold text-secondary-900">
                  +{totalPoints} pts
                </span>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={onContinue}
                rightIcon={<ChevronRight className="w-5 h-5" />}
              >
                Continuar con el siguiente tablero
              </Button>

              <p className="text-xs text-secondary-400 mt-3">
                Nuevos retos te esperan en el tablero {boardNumber + 1}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
