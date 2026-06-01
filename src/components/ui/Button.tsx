'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import BoxChallengeLoader from '@/components/brand/BoxChallengeLoader';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 shadow-lg shadow-primary-500/30',
      secondary:
        'bg-slate-700 text-slate-100 hover:bg-slate-600 focus:ring-slate-500',
      outline:
        'border-2 border-primary-500 text-primary-400 hover:bg-primary-500/10 focus:ring-primary-500',
      ghost:
        'text-slate-300 hover:bg-slate-800 focus:ring-slate-500',
    };

    const sizes = {
      sm: 'text-sm px-4 py-2',
      md: 'text-base px-6 py-3',
      lg: 'text-lg px-8 py-4',
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: 1.02 }}
        {...(props as any)}
      >
        {isLoading ? (
          <BoxChallengeLoader size="xs" compact showGlow={false} className="-ml-1 mr-2" />
        ) : leftIcon ? (
          <span className="mr-2">{leftIcon}</span>
        ) : null}
        
        {children}
        
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

