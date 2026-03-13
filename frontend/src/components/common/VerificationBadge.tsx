import React from 'react';
import { Shield, ShieldCheck, ShieldAlert, ShieldQuestion, Clock } from 'lucide-react';
import { VerificationStatus } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  status: VerificationStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const statusConfig = {
  verified: {
    icon: ShieldCheck,
    className: 'badge-verified',
    translationKey: 'verified' as const,
  },
  tampered: {
    icon: ShieldAlert,
    className: 'badge-tampered',
    translationKey: 'tampered' as const,
  },
  'not-registered': {
    icon: ShieldQuestion,
    className: 'badge-pending',
    translationKey: 'notRegistered' as const,
  },
  pending: {
    icon: Clock,
    className: 'badge-pending',
    translationKey: 'pending' as const,
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  status,
  size = 'md',
  showLabel = true,
  className,
}) => {
  const { language } = useLanguage();
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn(config.className, sizeClasses[size], className)}>
      <Icon className={cn(iconSizes[size], status === 'verified' && 'pulse-verified')} />
      {showLabel && (
        <span>{t(config.translationKey, language)}</span>
      )}
    </div>
  );
};

export default VerificationBadge;
