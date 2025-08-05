import React from 'react';
import * as LucideIcons from 'lucide-react';
import { motion } from 'framer-motion';

export type IconName = keyof typeof LucideIcons;

interface IconProps {
  name: IconName;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4', 
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8'
};

export const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 'md', 
  className = '', 
  animated = false,
  onClick 
}) => {
  const IconComponent = LucideIcons[name] as React.ComponentType<any>;
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in Lucide icons`);
    return null;
  }

  const iconElement = (
    <IconComponent 
      className={`${sizeClasses[size]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    />
  );

  if (animated) {
    return (
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.15 }}
      >
        {iconElement}
      </motion.div>
    );
  }

  return iconElement;
};