import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import { cn } from '@/lib/utils';

interface QRCodeDisplayProps {
  batchCode: string;
  size?: 'sm' | 'md' | 'lg';
  showActions?: boolean;
  className?: string;
  batchDetails?: {
    crop?: string;
    quantity?: number;
    location?: string;
    harvestDate?: string;
  };
}

const sizePx = { sm: 128, md: 192, lg: 256 };

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  batchCode,
  size = 'md',
  showActions = true,
  className,
  batchDetails,
}) => {
  const { language } = useLanguage();
  const [copied, setCopied] = React.useState(false);

  const traceUrl = `https://agrichain.gov/trace/${batchCode}`;

  const qrValue = JSON.stringify({
    batchCode,
    traceUrl,
    ...(batchDetails ?? {}),
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(traceUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const canvas = document.querySelector<HTMLCanvasElement>('#qr-canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${batchCode}.png`;
    a.click();
  };

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="p-3 bg-white rounded-xl shadow-sm">
        <QRCodeCanvas
          id="qr-canvas"
          value={qrValue}
          size={sizePx[size]}
          level="H"
          includeMargin={false}
        />
      </div>

      <div className="text-center">
        <p className="text-sm font-mono font-semibold text-foreground">
          {batchCode}
        </p>
        <p className="text-xs text-muted-foreground mt-1 break-all max-w-xs">
          {traceUrl}
        </p>
      </div>

      {showActions && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check className="h-4 w-4 text-verified" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied
              ? language === 'en' ? 'Copied!' : 'நகலெடுக்கப்பட்டது!'
              : language === 'en' ? 'Copy Link' : 'இணைப்பை நகலெடு'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            {t('download', language)}
          </Button>
        </div>
      )}
    </div>
  );
};

export default QRCodeDisplay;