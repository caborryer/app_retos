'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered' | 'gradient';
  hoverable?: boolean;
  animated?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      hoverable = false,
      animated = true,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'rounded-2xl overflow-hidden transition-all duration-300';

    const variants = {
      default: 'bg-white',
      elevated: 'bg-white shadow-card',
      bordered: 'bg-white border-2 border-secondary-200',
      gradient: 'bg-gradient-to-br from-primary-500 to-accent-500 text-white',
    };

    const hoverStyles = hoverable
      ? 'hover:shadow-card-hover hover:-translate-y-1 cursor-pointer'
      : '';

    const animationProps = animated
      ? {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 },
        }
      : {};

    if (animated) {
      return (
        <motion.div
          ref={ref}
          className={cn(baseStyles, variants[variant], hoverStyles, className)}
          {...animationProps}
          {...(props as any)}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], hoverStyles, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;

