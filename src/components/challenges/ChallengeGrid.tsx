'use client';

import { motion } from 'framer-motion';
import PhotoUpload from './PhotoUpload';

interface ChallengeGridProps {
  title?: string;
  count?: number;
  challengeId: string;
  tasks?: Array<{
    id: string;
    photoUrl?: string;
    validationStatus?: 'pending' | 'approved' | 'rejected';
  }>;
  onPhotoUpload?: (taskId: string, photoUrl: string) => void;
}

export default function ChallengeGrid({ 
  title = 'Reto a completar', 
  count = 9,
  challengeId,
  tasks = [],
  onPhotoUpload
}: ChallengeGridProps) {
  // Create array for grid, filling with empty slots if needed
  const gridItems = Array.from({ length: count }, (_, i) => tasks[i] || { id: `placeholder-${i}` });

  const handlePhotoUpload = (taskId: string, photoUrl: string) => {
    if (onPhotoUpload) {
      onPhotoUpload(taskId, photoUrl);
    }
  };

  return (
    <div className="space-y-4">
      {title && (
        <h2 className="text-lg font-bold text-secondary-900">
          {title}
        </h2>
      )}

      <div className="grid grid-cols-3 gap-3">
        {gridItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <PhotoUpload
              taskId={item.id}
              challengeId={challengeId}
              existingPhoto={item.photoUrl}
              onPhotoUpload={handlePhotoUpload}
              validationStatus={item.validationStatus}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
