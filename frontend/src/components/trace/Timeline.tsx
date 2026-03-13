import React from 'react';
import { 
  Truck, 
  Warehouse, 
  ClipboardCheck, 
  IndianRupee, 
  HandshakeIcon,
  Sprout,
  MapPin,
  Calendar,
  User,
  Package
} from 'lucide-react';
import { MiddlemanAction, Batch, ActionType } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TimelineProps {
  batch: Batch;
  actions: MiddlemanAction[];
  className?: string;
}

// Normalize any backend or frontend action type string to a known ActionType
const normalizeActionType = (type: string): ActionType => {
  const map: Record<string, ActionType> = {
    // frontend values (passthrough)
    transport:       'transport',
    storage:         'storage',
    'quality-check': 'quality-check',
    pricing:         'pricing',
    handover:        'handover',
    // backend enum values
    TRANSPORT:       'transport',
    STORAGE:         'storage',
    PRICE_UPDATE:    'pricing',
    SALE:            'handover',
  };
  return map[type] ?? 'transport'; // fallback to transport if unknown
};

const actionIcons: Record<ActionType, typeof Truck> = {
  transport: Truck,
  storage: Warehouse,
  'quality-check': ClipboardCheck,
  pricing: IndianRupee,
  handover: HandshakeIcon,
};

const actionColors: Record<ActionType, string> = {
  transport: 'bg-blue-500',
  storage: 'bg-amber-500',
  'quality-check': 'bg-emerald-500',
  pricing: 'bg-purple-500',
  handover: 'bg-rose-500',
};

const actionLabels: Record<ActionType, { en: string; ta: string }> = {
  transport:       { en: 'Transport',     ta: 'போக்குவரத்து' },
  storage:         { en: 'Storage',       ta: 'சேமிப்பு' },
  'quality-check': { en: 'Quality Check', ta: 'தர சோதனை' },
  pricing:         { en: 'Pricing',       ta: 'விலை நிர்ணயம்' },
  handover:        { en: 'Handover',      ta: 'ஒப்படைப்பு' },
};

export const Timeline: React.FC<TimelineProps> = ({ batch, actions, className }) => {
  const { language } = useLanguage();

  return (
    <div className={cn('relative', className)}>
      {/* Timeline line */}
      <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary via-secondary to-muted" />

      {/* Origin - Farmer */}
      <div className="relative flex gap-4 pb-8">
        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
          <Sprout className="h-6 w-6" />
        </div>
        <div className="flex-1 pt-1">
          <div className="card-govt">
            <div className="card-govt-header">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Sprout className="h-4 w-4 text-primary" />
                {language === 'en' ? 'Origin - Farm' : 'தோற்றம் - பண்ணை'}
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('farmer', language)}:</span>
                <span className="font-medium">{batch.farmerName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('location', language)}:</span>
                <span className="font-medium">
                  {[batch.village, batch.district].filter(Boolean).join(', ') || batch.location}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('harvestDate', language)}:</span>
                <span className="font-medium">
                  {format(new Date(batch.harvestDate), 'dd MMM yyyy')}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {language === 'en' ? batch.cropName : batch.cropNameTamil}
                  </span>
                  <span className="font-semibold text-primary">
                    {batch.quantity} {batch.unit}
                  </span>
                </div>
                {(batch.sellingPricePerKg || batch.totalSellingPrice) && (
                  <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      {language === 'en' ? "Farmer's selling price" : 'விவசாயி விற்பனை விலை'}
                    </span>
                    <div className="text-right">
                      {batch.sellingPricePerKg && (
                        <span className="text-sm font-semibold text-emerald-600">
                          ₹{batch.sellingPricePerKg}/kg
                        </span>
                      )}
                      {batch.sellingPricePerKg && batch.totalSellingPrice && (
                        <span className="text-muted-foreground mx-1 text-xs">·</span>
                      )}
                      {batch.totalSellingPrice && (
                        <span className="text-sm font-semibold text-emerald-600">
                          ₹{batch.totalSellingPrice} total
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {actions.map((action, index) => {
        const normalizedType = normalizeActionType(action.actionType as string);
        const Icon = actionIcons[normalizedType] ?? Package;
        const colorClass = actionColors[normalizedType] ?? 'bg-gray-500';
        const label = actionLabels[normalizedType];

        return (
          <div 
            key={action.id} 
            className="relative flex gap-4 pb-8 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={cn(
              'relative z-10 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg',
              colorClass
            )}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 pt-1">
              <div className="card-govt">
                <div className="card-govt-header">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">
                      {label ? label[language] : action.actionType}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(action.timestamp), 'dd MMM yyyy, HH:mm')}
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{action.middlemanName}</span>
                  </div>

                  {action.description && (
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  )}

                  {action.fromLocation && action.toLocation && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{action.fromLocation}</span>
                      <span className="text-muted-foreground">→</span>
                      <span>{action.toLocation}</span>
                    </div>
                  )}

                  {action.pricePerKg && (
                    <div className="flex items-center gap-2 text-sm">
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-primary">
                        ₹{action.pricePerKg}/{language === 'en' ? 'kg' : 'கிலோ'}
                      </span>
                    </div>
                  )}

                  {(action.temperature || action.humidity) && (
                    <div className="flex gap-4 text-sm">
                      {action.temperature && (
                        <span className="text-muted-foreground">🌡️ {action.temperature}°C</span>
                      )}
                      {action.humidity && (
                        <span className="text-muted-foreground">💧 {action.humidity}%</span>
                      )}
                    </div>
                  )}

                  {action.blockchainTxHash && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        TX: {action.blockchainTxHash}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;