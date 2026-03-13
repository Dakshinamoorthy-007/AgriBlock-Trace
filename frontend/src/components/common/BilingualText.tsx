import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface BilingualTextProps {
  en: string;
  ta: string;
  className?: string;
  showBoth?: boolean;
  primaryClassName?: string;
  secondaryClassName?: string;
}

export const BilingualText: React.FC<BilingualTextProps> = ({
  en,
  ta,
  className,
  showBoth = true,
  primaryClassName,
  secondaryClassName,
}) => {
  const { language } = useLanguage();
  const primary = language === 'en' ? en : ta;
  const secondary = language === 'en' ? ta : en;

  if (!showBoth) {
    return <span className={cn(className, primaryClassName)}>{primary}</span>;
  }

  return (
    <span className={cn('bilingual', className)}>
      <span className={cn('bilingual-en', primaryClassName)}>{primary}</span>
      <span className={cn('bilingual-ta font-tamil', secondaryClassName)}>{secondary}</span>
    </span>
  );
};

export default BilingualText;
