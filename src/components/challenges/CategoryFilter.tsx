'use client';

import { motion } from 'framer-motion';
import { ChallengeCategory } from '@/types';
import { cn, getCategoryName } from '@/lib/utils';

interface CategoryFilterProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
}

const categories = [
  { value: null, label: 'Todos', icon: '🏆' },
  { value: ChallengeCategory.RUNNING, label: getCategoryName('running'), icon: '🏃' },
  { value: ChallengeCategory.CYCLING, label: getCategoryName('cycling'), icon: '🚴' },
  { value: ChallengeCategory.GYM, label: getCategoryName('gym'), icon: '💪' },
  { value: ChallengeCategory.SWIMMING, label: getCategoryName('swimming'), icon: '🏊' },
  { value: ChallengeCategory.YOGA, label: getCategoryName('yoga'), icon: '🧘' },
];

export default function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="overflow-x-auto scrollbar-hide -mx-6 px-6">
      <div className="flex gap-2 pb-2">
        {categories.map((category) => {
          const isSelected = selected === category.value;

          return (
            <motion.button
              key={category.label}
              onClick={() => onSelect(category.value)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all',
                isSelected
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                  : 'bg-white text-secondary-700 border-2 border-secondary-200 hover:border-primary-300'
              )}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-lg">{category.icon}</span>
              <span>{category.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

