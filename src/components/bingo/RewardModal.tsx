"use client"

import { motion } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface RewardModalProps {
    onClose: () => void;
}

export function RewardModal({ onClose }: RewardModalProps) {
    // Simple Confetti simulation using Framer motion
    const confettiPieces = Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * -500,
        color: ['#E9191C', '#FF5327', '#10B981', '#3B82F6', '#F59E0B'][Math.floor(Math.random() * 5)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
    }));

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md overflow-hidden"
        >
            {/* Confetti */}
            {confettiPieces.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{ x: p.x, y: p.y, rotate: p.rotation, opacity: 1 }}
                    animate={{
                        y: window.innerHeight + 100,
                        rotate: p.rotation + 360,
                    }}
                    transition={{
                        duration: Math.random() * 2 + 2,
                        ease: "linear",
                        repeat: Infinity
                    }}
                    className="absolute rounded-sm"
                    style={{
                        backgroundColor: p.color,
                        width: p.size,
                        height: p.size,
                        zIndex: 1
                    }}
                />
            ))}

            <motion.div
                initial={{ y: 50, scale: 0.8 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 20, scale: 0.8 }}
                className="bg-[#1D1B20] w-full max-w-sm rounded-[32px] p-8 shadow-2xl border-2 border-[#E9191C] relative z-10 flex flex-col items-center text-center"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 p-2 rounded-full text-gray-300 transition-colors"
                >
                    <X size={20} />
                </button>

                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 15, delay: 0.2 }}
                    className="w-24 h-24 bg-gradient-to-tr from-[#FF5327] to-[#F59E0B] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,83,39,0.5)] mb-6"
                >
                    <Trophy size={48} className="text-white" />
                </motion.div>

                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">
                    ¡BINGO!
                </h2>

                <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                    ¡Has completado una línea de retos! Tu disciplina y esfuerzo dan resultados. Sigue así.
                </p>

                <div className="w-full bg-[#2A2831] rounded-2xl p-4 border border-gray-700 mb-6">
                    <p className="text-sm font-semibold text-white mb-1">Recompensa Desbloqueada</p>
                    <p className="text-2xl font-bold text-[#FF5327]">+500 Pts</p>
                </div>

                <button
                    onClick={onClose}
                    className="w-full bg-white text-black font-bold flex items-center justify-center gap-2 py-3 px-4 rounded-[16px] hover:bg-gray-200 transition-all active:scale-95"
                >
                    Continuar
                </button>
            </motion.div>
        </motion.div>
    );
}
