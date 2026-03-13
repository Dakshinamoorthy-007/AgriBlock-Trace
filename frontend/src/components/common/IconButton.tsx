import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface IconButtonProps {
  icon: LucideIcon;
  labelEn: string;
  labelTa: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

const variantClasses = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
  outline: 'border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground',
};

const sizeClasses = {
  sm: 'p-3 gap-1.5',
  md: 'p-4 gap-2',
  lg: 'p-6 gap-3',
};

const iconSizes = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

const textSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  labelEn,
  labelTa,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
}) => {
  const { language } = useLanguage();
  const primaryLabel = language === 'en' ? labelEn : labelTa;
  const secondaryLabel = language === 'en' ? labelTa : labelEn;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'btn-large flex flex-col items-center justify-center rounded-2xl transition-all duration-200',
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <Icon className={cn(iconSizes[size])} />
      <span className={cn('font-semibold', textSizes[size])}>{primaryLabel}</span>
      <span className={cn('text-current/70 font-tamil', 
        size === 'sm' ? 'text-[10px]' : size === 'md' ? 'text-xs' : 'text-sm'
      )}>
        {secondaryLabel}
      </span>
    </button>
  );
};

export default IconButton;
