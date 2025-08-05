import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  hover = true,
  padding = 'md',
  onClick
}) => {
  const baseClasses = 'bg-white rounded-lg transition-all duration-200';
  
  const variantClasses = {
    default: 'border border-gray-200',
    elevated: 'shadow-md',
    outlined: 'border-2 border-gray-300',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const classes = clsx(
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    {
      'cursor-pointer': onClick,
    },
    className
  );

  const motionProps = {
    whileHover: hover && onClick ? { 
      scale: 1.02, 
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' 
    } : hover ? { 
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' 
    } : {},
    whileTap: onClick ? { scale: 0.98 } : {},
    transition: { duration: 0.2 }
  };

  return (
    <motion.div
      className={classes}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};