"use client"

import { motion } from 'framer-motion';
import { Challenge } from '@/types';
import { Camera, X, Upload } from 'lucide-react';
import { useState } from 'react';

interface PhotoUploadModalProps {
    challenge: Challenge;
    onClose: () => void;
    onUpload: () => void;
}

export function PhotoUploadModal({ challenge, onClose, onUpload }: PhotoUploadModalProps) {
    const [isUploading, setIsUploading] = useState(false);

    const handleSimulatedUpload = () => {
        setIsUploading(true);
        // Simulate network upload time
        setTimeout(() => {
            setIsUploading(false);
            onUpload();
        }, 1200);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
        >
            <motion.div
                initial={{ y: 50, scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 20, scale: 0.95 }}
                className="bg-[#1D1B20] w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl border border-gray-800"
            >
                <div className="relative h-40" style={{ background: challenge.color || '#E9191C' }}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 p-2 rounded-full text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="absolute -bottom-10 left-6 w-20 h-20 bg-[#1D1B20] rounded-[16px] flex items-center justify-center text-4xl shadow-lg border-2 border-gray-800">
                        {challenge.icon || '🏆'}
                    </div>
                </div>

                <div className="pt-14 px-6 pb-6">
                    <h2 className="text-xl font-bold text-white mb-2">{challenge.title}</h2>
                    <p className="text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed">
                        {challenge.description}
                    </p>

                    <div className="bg-[#2A2831] rounded-[16px] border-2 border-dashed border-gray-600 p-6 flex flex-col items-center justify-center text-center">
                        <div className="bg-[#E9191C]/20 p-4 rounded-full mb-3 text-[#FC0230]">
                            <Camera size={28} />
                        </div>
                        <h3 className="text-white font-medium mb-1">Evidencia requerida</h3>
                        <p className="text-gray-500 text-xs mb-4">Sube una foto completando el reto para voltear la casilla y acercarte al Bingo.</p>

                        <button
                            onClick={handleSimulatedUpload}
                            disabled={isUploading}
                            className="w-full bg-gradient-to-r from-[#FC0230] to-[#E9191C] hover:opacity-90 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 py-3 px-4 rounded-[12px] transition-all"
                        >
                            {isUploading ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                />
                            ) : (
                                <>
                                    <Upload size={18} />
                                    <span>Subir Foto</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
