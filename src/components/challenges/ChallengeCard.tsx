'use client';

import { motion } from 'framer-motion';
import { Calendar, Users, Trophy } from 'lucide-react';
import Link from 'next/link';
import type { Challenge } from '@/types';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';
import { getDifficultyName, formatDuration, formatNumber } from '@/lib/utils';

interface ChallengeCardProps {
  challenge: Challenge;
  index?: number;
}

export default function ChallengeCard({ challenge, index = 0 }: ChallengeCardProps) {
  const isInProgress = challenge.status === 'in_progress';
  const isCompleted = challenge.status === 'completed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={`/challenges/${challenge.id}`}>
        <Card
          hoverable
          animated={false}
          className="relative overflow-hidden group"
        >
          {/* Background gradient */}
          <div
            className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
            style={{
              background: `linear-gradient(135deg, ${challenge.color}40 0%, ${challenge.color}10 100%)`,
            }}
          />

          <div className="relative p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-xl text-2xl"
                  style={{ backgroundColor: `${challenge.color}20` }}
                >
                  {challenge.icon}
                </div>
                
                <div>
                  <h3 className="font-bold text-secondary-900 line-clamp-1 group-hover:text-primary-500 transition-colors">
                    {challenge.title}
                  </h3>
                  <p className="text-sm text-secondary-600 mt-0.5">
                    {getDifficultyName(challenge.difficulty)}
                  </p>
                </div>
              </div>

              {isCompleted && (
                <Badge variant="success" size="sm">
                  <Trophy className="w-3 h-3 mr-1" />
                  Completado
                </Badge>
              )}
              
              {isInProgress && (
                <Badge variant="primary" size="sm">
                  En curso
                </Badge>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-secondary-600 line-clamp-2 mb-4">
              {challenge.description}
            </p>

            {/* Progress Bar (if in progress) */}
            {isInProgress && (
              <div className="mb-4">
                <ProgressBar
                  value={challenge.progress}
                  size="sm"
                  variant="gradient"
                  showLabel
                  animated
                />
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-secondary-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDuration(challenge.duration)}</span>
                </div>
                
                <div className="flex items-center gap-1.5 text-secondary-600">
                  <Users className="w-4 h-4" />
                  <span>{formatNumber(challenge.participants)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 font-semibold text-primary-500">
                <Trophy className="w-4 h-4" />
                <span>+{challenge.points}</span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

