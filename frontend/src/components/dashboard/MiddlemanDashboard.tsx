import React, { useState, useEffect } from 'react';
import { 
  ScanLine, 
  Package, 
  Truck,
  Warehouse,
  ClipboardCheck,
  IndianRupee,
  ChevronRight,
  Plus,
  Check,
  ShoppingCart,
  Clock,
  AlertCircle
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { t } from '@/lib/translations';
import Timeline from '@/components/trace/Timeline';
import VerificationBadge from '@/components/common/VerificationBadge';
import { Batch, MiddlemanAction } from '@/lib/types';
import { format } from 'date-fns';
import { getBatchByCode, getBatchActions, logMiddlemanAction, getMyActions } from '@/lib/api';
import QRScanner from '@/components/common/QRScanner';

// Map frontend action types to backend enum values
const ACTION_TYPE_MAP: Record<string, string> = {
  transport:      'TRANSPORT',
  storage:        'STORAGE',
  'quality-check': 'STORAGE',   // closest backend equivalent
  pricing:        'PRICE_UPDATE',
  sale:           'SALE',
};

// Map backend enum back to display labels
const BACKEND_TO_DISPLAY: Record<string, { en: string; ta: string }> = {
  TRANSPORT:    { en: 'Transport',     ta: 'போக்குவரத்து' },
  STORAGE:      { en: 'Storage',       ta: 'சேமிப்பு' },
  PRICE_UPDATE: { en: 'Price Update',  ta: 'விலை மாற்றம்' },
  SALE:         { en: 'Sale',          ta: 'விற்பனை' },
};

type FrontendActionType = 'transport' | 'storage' | 'quality-check' | 'pricing' | 'sale';

interface BackendAction {
  _id: string;
  batch: { batchCode: string; crop: string; location: string } | string;
  actor: { name: string; phone: string } | string;
  actionType: string;
  location?: string;
  price?: number;
  notes?: string;
  timestamp: string;
  createdAt: string;
}

// Normalize a backend batch object to match the frontend Batch type
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
});

// Normalize a backend action to the frontend MiddlemanAction type
const normalizeAction = (a: BackendAction): MiddlemanAction => ({
  id: a._id,
  batchId: typeof a.batch === 'string' ? a.batch : (a.batch as any)?._id || '',
  middlemanId: typeof a.actor === 'string' ? a.actor : (a.actor as any)?._id || '',
  middlemanName: typeof a.actor === 'object' ? (a.actor as any).name || (a.actor as any).phone : 'Middleman',
  actionType: (a.actionType?.toLowerCase() as any) || 'transport',
  description: a.notes,
  pricePerKg: a.price,
  fromLocation: a.location,
  timestamp: new Date(a.timestamp || a.createdAt),
});

const MiddlemanDashboard: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [view, setView] = useState<'home' | 'scan' | 'batch' | 'action' | 'history'>('home');
  const [scannedBatch, setScannedBatch] = useState<Batch | null>(null);
  const [batchActions, setBatchActions] = useState<MiddlemanAction[]>([]);
  const [myActions, setMyActions] = useState<BackendAction[]>([]);
  const [batchCode, setBatchCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [statsCount, setStatsCount] = useState({ batches: 0, actions: 0 });

  // Action form state
  const [actionType, setActionType] = useState<FrontendActionType>('transport');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);

  // Load action history + stats on mount
  useEffect(() => {
    if (!user) return;
    getMyActions()
      .then((data: BackendAction[]) => {
        setMyActions(data);
        const uniqueBatches = new Set(
          data.map(a => typeof a.batch === 'string' ? a.batch : (a.batch as any)?._id)
        );
        setStatsCount({ batches: uniqueBatches.size, actions: data.length });
      })
      .catch(console.error);
  }, [user]);

  const handleScan = async (code?: string) => {
    const target = (code || batchCode).trim();
    if (!target) return;
    setIsScanning(true);
    setScanError('');

    try {
      const [batchData, actionsData] = await Promise.all([
        getBatchByCode(target),
        getBatchActions(target),
      ]);
      setScannedBatch(normalizeBatch(batchData));
      setBatchActions(actionsData.map(normalizeAction));
      setView('batch');
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setScanError(
          language === 'en'
            ? 'Batch not found. Please check the code.'
            : 'தொகுதி கண்டறியப்படவில்லை. குறியீட்டைச் சரிபார்க்கவும்.'
        );
      } else {
        setScanError(language === 'en' ? 'Something went wrong. Try again.' : 'பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddAction = async () => {
    if (!scannedBatch || !notes) return;
    setIsSubmitting(true);

    try {
      await logMiddlemanAction(scannedBatch.batchCode, {
        actionType: ACTION_TYPE_MAP[actionType],
        location: location || undefined,
        price: price ? parseFloat(price) : undefined,
        notes,
      });

      // Refresh actions for this batch
      const updated = await getBatchActions(scannedBatch.batchCode);
      setBatchActions(updated.map(normalizeAction));

      // Refresh stats
      const allActions = await getMyActions();
      setMyActions(allActions);
      const uniqueBatches = new Set(
        allActions.map((a: BackendAction) => typeof a.batch === 'string' ? a.batch : (a.batch as any)?._id)
      );
      setStatsCount({ batches: uniqueBatches.size, actions: allActions.length });

      setActionSuccess(true);
      setNotes('');
      setLocation('');
      setPrice('');

      setTimeout(() => {
        setActionSuccess(false);
        setView('batch');
      }, 2000);
    } catch (err) {
      console.error('Action failed:', err);
      alert(language === 'en' ? 'Failed to record action.' : 'செயலை பதிவு செய்ய முடியவில்லை.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionTypes: { type: FrontendActionType; icon: typeof Truck; labelEn: string; labelTa: string }[] = [
    { type: 'transport',      icon: Truck,          labelEn: 'Transport',     labelTa: 'போக்குவரத்து' },
    { type: 'storage',        icon: Warehouse,      labelEn: 'Storage',       labelTa: 'சேமிப்பு' },
    { type: 'quality-check',  icon: ClipboardCheck, labelEn: 'Quality Check', labelTa: 'தர சோதனை' },
    { type: 'pricing',        icon: IndianRupee,    labelEn: 'Pricing',       labelTa: 'விலை நிர்ணயம்' },
    { type: 'sale',           icon: ShoppingCart,   labelEn: 'Sale',          labelTa: 'விற்பனை' },
  ];

  // ─── VIEWS ────────────────────────────────────────────────────────────────

  const renderHome = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          {language === 'en' ? `Welcome, ${user?.name}` : `வரவேற்கிறோம், ${user?.name}`}
        </h1>
        <p className="text-muted-foreground">
          {language === 'en' ? 'Middleman Dashboard' : 'இடைத்தரகர் டாஷ்போர்டு'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card-govt p-6 text-center">
          <div className="text-3xl font-bold text-primary mb-1">{statsCount.batches}</div>
          <div className="text-sm text-muted-foreground">
            {language === 'en' ? 'Batches Handled' : 'கையாளப்பட்ட தொகுதிகள்'}
          </div>
        </div>
        <div className="card-govt p-6 text-center">
          <div className="text-3xl font-bold text-secondary mb-1">{statsCount.actions}</div>
          <div className="text-sm text-muted-foreground">
            {language === 'en' ? 'Actions Recorded' : 'பதிவு செய்யப்பட்ட செயல்கள்'}
          </div>
        </div>
      </div>

      {/* Main Action */}
      <div className="card-govt p-8 text-center">
        <ScanLine className="h-16 w-16 mx-auto text-primary mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">
          {language === 'en' ? 'Scan Batch QR Code' : 'தொகுதி QR குறியீட்டை ஸ்கேன் செய்'}
        </h2>
        <p className="text-muted-foreground mb-6">
          {language === 'en'
            ? 'Scan a batch QR code to view details and log actions'
            : 'விவரங்களைக் காணவும் செயல்களைப் பதிவு செய்யவும் QR ஸ்கேன் செய்யவும்'}
        </p>
        <Button variant="default" size="xl" onClick={() => setView('scan')}>
          <ScanLine className="h-5 w-5" />
          {t('scanQR', language)}
        </Button>
      </div>

      {/* Action History preview */}
      {myActions.length > 0 && (
        <div className="card-govt">
          <div className="card-govt-header flex items-center justify-between">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              {language === 'en' ? 'Recent Actions' : 'சமீபத்திய செயல்கள்'}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setView('history')}>
              {language === 'en' ? 'View All' : 'அனைத்தையும் காண்'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="divide-y divide-border">
            {myActions.slice(0, 3).map((action) => {
              const label = BACKEND_TO_DISPLAY[action.actionType];
              const batch = action.batch as any;
              return (
                <div key={action._id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {label ? (language === 'en' ? label.en : label.ta) : action.actionType}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {typeof batch === 'object' ? batch?.batchCode : batch}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(action.timestamp || action.createdAt), 'dd MMM')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderScan = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setView('home')}>
          <ChevronRight className="h-5 w-5 rotate-180" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {t('scanQR', language)}
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
            placeholder={t('enterBatchCode', language)}
            value={batchCode}
            onChange={(e) => {
              setBatchCode(e.target.value.toUpperCase());
              setScanError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            className="h-14 text-lg font-mono"
          />

          {scanError && (
            <div className="p-4 rounded-xl bg-destructive/10 text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm font-medium">{scanError}</p>
            </div>
          )}

          <Button
            variant="default"
            size="xl"
            className="w-full"
            onClick={() => handleScan()}
            disabled={isScanning || !batchCode.trim()}
          >
            {isScanning ? (
              <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                <ScanLine className="h-5 w-5" />
                {language === 'en' ? 'Find Batch' : 'தொகுதியைக் கண்டறி'}
              </>
            )}
          </Button>

          <div className="relative flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">
              {language === 'en' ? 'or' : 'அல்லது'}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Camera + Drag/Drop QR Scanner */}
          <QRScanner
            onScan={(code) => {
              setBatchCode(code);
              handleScan(code);
            }}
          />
        </div>
      </div>
    </div>
  );

  const renderBatch = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => { setView('scan'); }}>
          <ChevronRight className="h-5 w-5 rotate-180" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {language === 'en' ? 'Batch Details' : 'தொகுதி விவரங்கள்'}
        </h1>
      </div>

      {scannedBatch && (
        <>
          <div className="card-govt">
            <div className="card-govt-header">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-foreground">
                    {language === 'en' ? scannedBatch.cropName : scannedBatch.cropNameTamil}
                  </h2>
                  <p className="text-sm text-muted-foreground font-mono">
                    {scannedBatch.batchCode}
                  </p>
                </div>
                <VerificationBadge status="verified" />
              </div>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t('quantity', language)}</span>
                <p className="font-medium">{scannedBatch.quantity} {scannedBatch.unit}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t('farmer', language)}</span>
                <p className="font-medium">{scannedBatch.farmerName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t('location', language)}</span>
                <p className="font-medium">{scannedBatch.village || scannedBatch.location}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t('harvestDate', language)}</span>
                <p className="font-medium">{format(new Date(scannedBatch.harvestDate), 'dd MMM yyyy')}</p>
              </div>
            </div>
          </div>

          <Button variant="default" size="xl" className="w-full" onClick={() => setView('action')}>
            <Plus className="h-5 w-5" />
            {t('addAction', language)}
          </Button>

          {/* Timeline */}
          <div className="card-govt">
            <div className="card-govt-header">
              <h2 className="font-semibold text-foreground">
                {language === 'en' ? 'Journey Timeline' : 'பயண காலவரிசை'}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {batchActions.length} {language === 'en' ? 'action(s) recorded' : 'செயல்(கள்) பதிவு செய்யப்பட்டன'}
              </p>
            </div>
            <div className="p-4">
              {batchActions.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-6">
                  {language === 'en' ? 'No actions recorded yet.' : 'இன்னும் செயல்கள் பதிவு செய்யப்படவில்லை.'}
                </p>
              ) : (
                <Timeline batch={scannedBatch} actions={batchActions} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderAction = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setView('batch')}>
          <ChevronRight className="h-5 w-5 rotate-180" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {t('addAction', language)}
        </h1>
      </div>

      {actionSuccess ? (
        <div className="card-govt p-12 text-center">
          <div className="h-20 w-20 rounded-full bg-verified/10 flex items-center justify-center mx-auto mb-4">
            <Check className="h-10 w-10 text-verified" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            {language === 'en' ? 'Action Recorded!' : 'செயல் பதிவு செய்யப்பட்டது!'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'en' ? 'Successfully saved to the database' : 'தரவுத்தளத்தில் வெற்றிகரமாக சேமிக்கப்பட்டது'}
          </p>
        </div>
      ) : (
        <div className="card-govt">
          <div className="card-govt-header">
            <h2 className="font-semibold text-foreground">
              {language === 'en' ? 'Action Details' : 'செயல் விவரங்கள்'}
            </h2>
            {scannedBatch && (
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                {scannedBatch.batchCode}
              </p>
            )}
          </div>
          <div className="p-6 space-y-6">
            {/* Action Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                {language === 'en' ? 'Action Type' : 'செயல் வகை'} *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {actionTypes.map(({ type, icon: Icon, labelEn, labelTa }) => (
                  <button
                    key={type}
                    onClick={() => setActionType(type)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      actionType === type
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      {language === 'en' ? labelEn : labelTa}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {language === 'en' ? 'Notes' : 'குறிப்புகள்'} *
              </label>
              <Textarea
                placeholder={language === 'en' ? 'Enter action details...' : 'செயல் விவரங்களை உள்ளிடவும்...'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('location', language)}
              </label>
              <Input
                placeholder={language === 'en' ? 'Current location' : 'தற்போதைய இடம்'}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-12"
              />
            </div>

            {/* Price - shown for pricing and sale */}
            {(actionType === 'pricing' || actionType === 'sale') && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('pricePerKg', language)}
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="h-12 pl-12"
                  />
                </div>
              </div>
            )}

            <Button
              variant="default"
              size="xl"
              className="w-full"
              onClick={handleAddAction}
              disabled={isSubmitting || !notes}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {language === 'en' ? 'Saving...' : 'சேமிக்கிறது...'}
                </div>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  {t('addAction', language)}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setView('home')}>
          <ChevronRight className="h-5 w-5 rotate-180" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {language === 'en' ? 'Action History' : 'செயல் வரலாறு'}
        </h1>
      </div>

      {myActions.length === 0 ? (
        <div className="card-govt p-12 text-center">
          <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {language === 'en' ? 'No actions recorded yet.' : 'இன்னும் செயல்கள் பதிவு செய்யப்படவில்லை.'}
          </p>
          <Button className="mt-4" onClick={() => setView('scan')}>
            <ScanLine className="h-4 w-4" />
            {language === 'en' ? 'Scan a Batch' : 'தொகுதியை ஸ்கேன் செய்'}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {myActions.map((action) => {
            const label = BACKEND_TO_DISPLAY[action.actionType];
            const batch = action.batch as any;
            return (
              <div key={action._id} className="card-govt p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">
                        {label ? (language === 'en' ? label.en : label.ta) : action.actionType}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {typeof batch === 'object' ? batch?.batchCode : batch}
                      </p>
                      {action.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{action.notes}</p>
                      )}
                      {action.location && (
                        <p className="text-xs text-muted-foreground mt-0.5">📍 {action.location}</p>
                      )}
                      {action.price != null && (
                        <p className="text-xs text-primary font-medium mt-0.5">₹{action.price}/kg</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {format(new Date(action.timestamp || action.createdAt), 'dd MMM yyyy')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <Layout hideFooter>
      <div className="container mx-auto px-4 py-6 max-w-lg">
        {view === 'home'    && renderHome()}
        {view === 'scan'    && renderScan()}
        {view === 'batch'   && renderBatch()}
        {view === 'action'  && renderAction()}
        {view === 'history' && renderHistory()}
      </div>
    </Layout>
  );
};

export default MiddlemanDashboard;