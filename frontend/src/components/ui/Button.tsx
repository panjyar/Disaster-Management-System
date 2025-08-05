import React from 'react';
import { motion } from 'framer-motion';
import { Icon, IconName } from './Icon';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 focus:ring-blue-500',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 focus:ring-blue-500',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent focus:ring-blue-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600 focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 text-white border-green-600 focus:ring-green-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  const classes = clsx(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    {
      'w-full': fullWidth,
      'opacity-50 cursor-not-allowed': disabled || loading,
    },
    className
  );

  const iconSize = size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm';

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      transition={{ duration: 0.15 }}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Icon 
          name="Loader2" 
          size={iconSize} 
          className="animate-spin" 
        />
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <Icon name={icon} size={iconSize} />
      )}
      
      {children}
      
      {!loading && icon && iconPosition === 'right' && (
        <Icon name={icon} size={iconSize} />
      )}
    </motion.button>
  );
};