import React, { useState } from 'react';
import {
  ScanLine,
  ShieldCheck,
  ShieldX,
  ChevronRight,
  Wheat,
  MapPin,
  Calendar,
  User,
  TrendingUp,
  IndianRupee,
  Package,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Info,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { t } from '@/lib/translations';
import Timeline from '@/components/trace/Timeline';
import { Batch, MiddlemanAction } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getBatchByCode, getBatchActions } from '@/lib/api';

// ── Helpers ────────────────────────────────────────────────────────────────

const normalizeBatch = (b: any): Batch => ({
  id: b._id,
  batchCode: b.batchCode,
  cropName: b.crop,
  cropNameTamil: b.crop,
  quantity: b.quantity,
  unit: 'kg',
  harvestDate: new Date(b.harvestDate),
  location: b.location,
  village: b.location,
  farmerId: b.farmer?._id || b.farmer || '',
  farmerName: b.farmer?.phone || 'Farmer',
  status: 'registered',
  createdAt: new Date(b.createdAt),
  sellingPricePerKg: b.sellingPricePerKg ?? null,
  totalSellingPrice: b.totalSellingPrice ?? null,
});

const normalizeAction = (a: any): MiddlemanAction => ({
  id: a._id,
  batchId: typeof a.batch === 'string' ? a.batch : a.batch?._id || '',
  middlemanId: typeof a.actor === 'string' ? a.actor : a.actor?._id || '',
  middlemanName: typeof a.actor === 'object' ? a.actor?.name || a.actor?.phone : 'Middleman',
  actionType: a.actionType?.toLowerCase() as any,
  description: a.notes,
  pricePerKg: a.price,
  fromLocation: a.location,
  timestamp: new Date(a.timestamp || a.createdAt),
});

// Build price journey: farmer origin + each middleman action that has a price
interface PriceStage {
  label: string;
  labelTa: string;
  actor: string;
  pricePerKg: number;
  location?: string;
  date: Date;
  isOrigin?: boolean;
}

const buildPriceJourney = (batch: Batch, actions: MiddlemanAction[]): PriceStage[] => {
  const stages: PriceStage[] = [];

  if (batch.sellingPricePerKg) {
    stages.push({
      label: 'Farm Gate',
      labelTa: 'பண்ணை வாயில்',
      actor: batch.farmerName,
      pricePerKg: batch.sellingPricePerKg,
      location: batch.village || batch.location,
      date: new Date(batch.createdAt),
      isOrigin: true,
    });
  }

  actions
    .filter(a => a.pricePerKg != null)
    .forEach(a => {
      const typeMap: Record<string, { en: string; ta: string }> = {
        transport:       { en: 'Transport',    ta: 'போக்குவரத்து' },
        storage:         { en: 'Storage',      ta: 'சேமிப்பு' },
        'quality-check': { en: 'Quality Check',ta: 'தர சோதனை' },
        pricing:         { en: 'Market Price', ta: 'சந்தை விலை' },
        price_update:    { en: 'Price Update', ta: 'விலை மாற்றம்' },
        sale:            { en: 'Sale',         ta: 'விற்பனை' },
        handover:        { en: 'Handover',     ta: 'ஒப்படைப்பு' },
      };
      const type = typeMap[a.actionType?.toLowerCase()] || { en: a.actionType, ta: a.actionType };
      stages.push({
        label: type.en,
        labelTa: type.ta,
        actor: a.middlemanName,
        pricePerKg: a.pricePerKg!,
        location: a.fromLocation,
        date: new Date(a.timestamp),
      });
    });

  return stages;
};

// ── Component ──────────────────────────────────────────────────────────────

const ConsumerDashboard: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [view, setView] = useState<'home' | 'trace' | 'result'>('home');
  const [batchCode, setBatchCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [batch, setBatch] = useState<Batch | null>(null);
  const [actions, setActions] = useState<MiddlemanAction[]>([]);

  const handleTrace = async () => {
    if (!batchCode.trim()) return;
    setIsSearching(true);
    setSearchError('');

    try {
      const [batchData, actionsData] = await Promise.all([
        getBatchByCode(batchCode.trim()),
        getBatchActions(batchCode.trim()),
      ]);
      setBatch(normalizeBatch(batchData));
      setActions(actionsData.map(normalizeAction));
      setView('result');
    } catch (err: any) {
      setSearchError(
        err?.response?.status === 404
          ? (language === 'en'
              ? 'Batch not found. Please check the code.'
              : 'தொகுதி கண்டறியப்படவில்லை.')
          : (language === 'en' ? 'Something went wrong. Try again.' : 'பிழை ஏற்பட்டது.')
      );
    } finally {
      setIsSearching(false);
    }
  };

  // ── Render: Home ──────────────────────────────────────────────────────────

  const renderHome = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          {language === 'en'
            ? `Welcome, ${user?.name || 'Consumer'}`
            : `வரவேற்கிறோம், ${user?.name || 'நுகர்வோர்'}`}
        </h1>
        <p className="text-muted-foreground">
          {language === 'en' ? 'Know where your food comes from' : 'உங்கள் உணவு எங்கிருந்து வருகிறது என்று தெரிந்துகொள்ளுங்கள்'}
        </p>
      </div>

      {/* Hero CTA */}
      <div className="card-govt p-8 text-center">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          {language === 'en' ? 'Trace Your Food' : 'உங்கள் உணவை கண்காணிக்கவும்'}
        </h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
          {language === 'en'
            ? 'Scan or enter a batch code to see the complete farm-to-fork journey and price transparency'
            : 'பண்ணையிலிருந்து உணவு வரை முழு பயணத்தையும் காண QR ஸ்கேன் செய்யவும்'}
        </p>
        <Button variant="default" size="xl" onClick={() => setView('trace')}>
          <ScanLine className="h-5 w-5" />
          {language === 'en' ? 'Trace a Batch' : 'தொகுதியை கண்காணி'}
        </Button>
      </div>

      {/* What you can see */}
      <div className="card-govt">
        <div className="card-govt-header">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            {language === 'en' ? 'What you can verify' : 'நீங்கள் சரிபார்க்கலாம்'}
          </h2>
        </div>
        <div className="divide-y divide-border">
          {[
            { icon: Wheat,        en: 'Crop origin & harvest date',         ta: 'பயிர் தோற்றம் & அறுவடை தேதி' },
            { icon: MapPin,       en: 'Farm location & farmer details',      ta: 'பண்ணை இடம் & விவசாயி விவரங்கள்' },
            { icon: TrendingUp,   en: 'Price at every stage of the journey', ta: 'பயணத்தின் ஒவ்வொரு கட்டத்திலும் விலை' },
            { icon: IndianRupee,  en: 'Farm gate vs. market price markup',   ta: 'பண்ணை விலை vs சந்தை விலை வித்தியாசம்' },
            { icon: ShieldCheck,  en: 'Authenticity verification',           ta: 'நம்பகத்தன்மை சரிபார்ப்பு' },
          ].map(({ icon: Icon, en, ta }) => (
            <div key={en} className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {language === 'en' ? en : ta}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Render: Trace Input ───────────────────────────────────────────────────

  const renderTrace = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setView('home')}>
          <ChevronRight className="h-5 w-5 rotate-180" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {language === 'en' ? 'Trace a Batch' : 'தொகுதியை கண்காணி'}
        </h1>
      </div>

      <div className="card-govt">
        <div className="card-govt-header">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-primary" />
            {language === 'en' ? 'Enter Batch Code' : 'தொகுதி குறியீட்டை உள்ளிடவும்'}
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <Input
            type="text"
            placeholder={language === 'en' ? 'e.g. AGRI-A1B2C3D4' : 'எ.கா. AGRI-A1B2C3D4'}
            value={batchCode}
            onChange={(e) => { setBatchCode(e.target.value.toUpperCase()); setSearchError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleTrace()}
            className="h-14 text-lg font-mono"
          />

          {searchError && (
            <div className="p-4 rounded-xl bg-destructive/10 text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm font-medium">{searchError}</p>
            </div>
          )}

          <Button
            variant="default"
            size="xl"
            className="w-full"
            onClick={handleTrace}
            disabled={isSearching || !batchCode.trim()}
          >
            {isSearching ? (
              <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                <ScanLine className="h-5 w-5" />
                {language === 'en' ? 'Trace Now' : 'இப்போது கண்காணி'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  // ── Render: Result ────────────────────────────────────────────────────────

  const renderResult = () => {
    if (!batch) return null;
    const priceJourney = buildPriceJourney(batch, actions);
    const firstPrice = priceJourney[0]?.pricePerKg;
    const lastPrice = priceJourney[priceJourney.length - 1]?.pricePerKg;
    const totalMarkup = firstPrice && lastPrice
      ? { abs: (lastPrice - firstPrice).toFixed(2), pct: (((lastPrice - firstPrice) / firstPrice) * 100).toFixed(1) }
      : null;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setView('trace')}>
            <ChevronRight className="h-5 w-5 rotate-180" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            {language === 'en' ? 'Batch Trace' : 'தொகுதி கண்காணிப்பு'}
          </h1>
        </div>

        {/* Verification Badge */}
        <div className={cn(
          'rounded-2xl p-5 flex items-center gap-4',
          'bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
        )}>
          <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-7 w-7 text-emerald-600" />
          </div>
          <div>
            <p className="font-bold text-emerald-700 dark:text-emerald-400">
              {language === 'en' ? '✓ Verified & Authentic' : '✓ சரிபார்க்கப்பட்டது & நம்பகமானது'}
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-500 font-mono mt-0.5">
              {batch.batchCode}
            </p>
          </div>
        </div>

        {/* Batch Summary */}
        <div className="card-govt">
          <div className="card-govt-header">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Wheat className="h-4 w-4 text-primary" />
              {language === 'en' ? 'Batch Overview' : 'தொகுதி சுருக்கம்'}
            </h2>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block">{language === 'en' ? 'Crop' : 'பயிர்'}</span>
              <p className="font-semibold text-foreground mt-0.5">{batch.cropName}</p>
            </div>
            <div>
              <span className="text-muted-foreground block">{t('quantity', language)}</span>
              <p className="font-semibold text-foreground mt-0.5">{batch.quantity} {batch.unit}</p>
            </div>
            <div>
              <span className="text-muted-foreground block">{t('location', language)}</span>
              <p className="font-semibold text-foreground mt-0.5">{batch.village || batch.location}</p>
            </div>
            <div>
              <span className="text-muted-foreground block">{t('harvestDate', language)}</span>
              <p className="font-semibold text-foreground mt-0.5">
                {format(new Date(batch.harvestDate), 'dd MMM yyyy')}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground block">{t('farmer', language)}</span>
              <p className="font-semibold text-foreground mt-0.5">{batch.farmerName}</p>
            </div>
            <div>
              <span className="text-muted-foreground block">{language === 'en' ? 'Stages' : 'நிலைகள்'}</span>
              <p className="font-semibold text-foreground mt-0.5">{actions.length} {language === 'en' ? 'recorded' : 'பதிவு'}</p>
            </div>
          </div>
        </div>

        {/* Price Journey */}
        {priceJourney.length >= 2 && (
          <div className="card-govt">
            <div className="card-govt-header">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                {language === 'en' ? 'Price Journey' : 'விலை பயணம்'}
              </h2>
              {totalMarkup && (
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'en'
                    ? `Total markup from farm to last recorded stage`
                    : `பண்ணையிலிருந்து கடைசி நிலை வரை மொத்த விலை உயர்வு`}
                </p>
              )}
            </div>
            <div className="p-4 space-y-3">
              {/* Stage-by-stage */}
              {priceJourney.map((stage, i) => {
                const prev = priceJourney[i - 1];
                const diff = prev ? stage.pricePerKg - prev.pricePerKg : 0;
                const pct = prev ? ((diff / prev.pricePerKg) * 100).toFixed(1) : null;

                return (
                  <div key={i}>
                    <div className={cn(
                      'rounded-xl p-4 border',
                      stage.isOrigin
                        ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800'
                        : 'bg-muted/40 border-border'
                    )}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground text-sm">
                            {language === 'en' ? stage.label : stage.labelTa}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{stage.actor}</p>
                          {stage.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />{stage.location}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            'text-lg font-bold',
                            stage.isOrigin ? 'text-emerald-600' : 'text-foreground'
                          )}>
                            ₹{stage.pricePerKg}/kg
                          </p>
                          {prev && (
                            <p className={cn(
                              'text-xs font-medium mt-0.5',
                              diff > 0 ? 'text-orange-500' : diff < 0 ? 'text-emerald-500' : 'text-muted-foreground'
                            )}>
                              {diff > 0 ? '+' : ''}{diff > 0 || diff < 0 ? `₹${Math.abs(diff).toFixed(2)}` : 'No change'}
                              {pct && ` (${diff > 0 ? '+' : ''}${pct}%)`}
                            </p>
                          )}
                          {stage.isOrigin && (
                            <p className="text-xs text-emerald-600 font-medium mt-0.5">
                              {language === 'en' ? 'Farm Gate' : 'பண்ணை விலை'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Arrow between stages */}
                    {i < priceJourney.length - 1 && (
                      <div className="flex justify-center my-1">
                        <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Total markup summary */}
              {totalMarkup && (
                <div className="mt-4 pt-4 border-t border-border rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-foreground text-sm">
                        {language === 'en' ? 'Total Price Markup' : 'மொத்த விலை உயர்வு'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {language === 'en'
                          ? `₹${firstPrice}/kg (farm) → ₹${lastPrice}/kg (market)`
                          : `₹${firstPrice}/kg (பண்ணை) → ₹${lastPrice}/kg (சந்தை)`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600">+₹{totalMarkup.abs}/kg</p>
                      <p className="text-sm font-semibold text-orange-500">+{totalMarkup.pct}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No price data notice */}
        {priceJourney.length === 0 && (
          <div className="card-govt p-5 flex items-center gap-3">
            <Info className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              {language === 'en'
                ? 'No price data recorded for this batch yet.'
                : 'இந்த தொகுதிக்கு இன்னும் விலை தரவு பதிவு செய்யப்படவில்லை.'}
            </p>
          </div>
        )}

        {/* Full Timeline */}
        <div className="card-govt">
          <div className="card-govt-header">
            <h2 className="font-semibold text-foreground">
              {language === 'en' ? 'Full Journey Timeline' : 'முழு பயண காலவரிசை'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {actions.length} {language === 'en' ? 'action(s) recorded' : 'செயல்(கள்) பதிவு செய்யப்பட்டன'}
            </p>
          </div>
          <div className="p-4">
            {actions.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">
                {language === 'en'
                  ? 'No journey actions recorded yet beyond the farm origin.'
                  : 'பண்ணை தோற்றத்திற்கு அப்பால் இன்னும் பயண செயல்கள் பதிவு செய்யப்படவில்லை.'}
              </p>
            ) : (
              <Timeline batch={batch} actions={actions} />
            )}
          </div>
        </div>

        {/* Trace another */}
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => { setBatchCode(''); setView('trace'); }}
        >
          <ScanLine className="h-4 w-4" />
          {language === 'en' ? 'Trace Another Batch' : 'மற்றொரு தொகுதியை கண்காணி'}
        </Button>
      </div>
    );
  };

  return (
    <Layout hideFooter>
      <div className="container mx-auto px-4 py-6 max-w-lg">
        {view === 'home'   && renderHome()}
        {view === 'trace'  && renderTrace()}
        {view === 'result' && renderResult()}
      </div>
    </Layout>
  );
};

export default ConsumerDashboard;