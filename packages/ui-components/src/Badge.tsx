import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  
  const variants = {
    default: 'border-transparent bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary)]/80',
    secondary: 'border-transparent bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:bg-[var(--color-secondary)]/80',
    destructive: 'border-transparent bg-red-500 text-white hover:bg-red-600',
    success: 'border-transparent bg-green-500 text-white hover:bg-green-600',
    warning: 'border-transparent bg-yellow-500 text-white hover:bg-yellow-600',
    outline: 'text-[var(--color-foreground)] border-[var(--color-border)]',
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props} />
  );
}
