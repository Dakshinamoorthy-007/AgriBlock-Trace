import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ScanLine, AlertCircle, ChevronRight, ShieldCheck, Wheat, MapPin, TrendingUp, IndianRupee, ArrowRight, Info, Camera, X, Upload, ImageIcon } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Timeline from '@/components/trace/Timeline';
import { useLanguage } from '@/contexts/LanguageContext';
import { Batch, MiddlemanAction } from '@/lib/types';
import { getBatchByCode, getBatchActions } from '@/lib/api';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Html5Qrcode } from 'html5-qrcode';

// ── Helpers (same as ConsumerDashboard) ───────────────────────────────────

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
      label: 'Farm Gate', labelTa: 'பண்ணை வாயில்',
      actor: batch.farmerName,
      pricePerKg: batch.sellingPricePerKg,
      location: batch.village || batch.location,
      date: new Date(batch.createdAt),
      isOrigin: true,
    });
  }
  actions.filter(a => a.pricePerKg != null).forEach(a => {
    const typeMap: Record<string, { en: string; ta: string }> = {
      transport: { en: 'Transport', ta: 'போக்குவரத்து' },
      storage: { en: 'Storage', ta: 'சேமிப்பு' },
      'quality-check': { en: 'Quality Check', ta: 'தர சோதனை' },
      pricing: { en: 'Market Price', ta: 'சந்தை விலை' },
      price_update: { en: 'Price Update', ta: 'விலை மாற்றம்' },
      sale: { en: 'Sale', ta: 'விற்பனை' },
      handover: { en: 'Handover', ta: 'ஒப்படைப்பு' },
    };
    const type = typeMap[a.actionType?.toLowerCase()] || { en: a.actionType, ta: a.actionType };
    stages.push({
      label: type.en, labelTa: type.ta,
      actor: a.middlemanName,
      pricePerKg: a.pricePerKg!,
      location: a.fromLocation,
      date: new Date(a.timestamp),
    });
  });
  return stages;
};

// ── Component ──────────────────────────────────────────────────────────────

const Trace: React.FC = () => {
  const { batchCode: urlBatchCode } = useParams<{ batchCode: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [batchCode, setBatchCode] = useState(urlBatchCode || '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [batch, setBatch] = useState<Batch | null>(null);
  const [actions, setActions] = useState<MiddlemanAction[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState('');
  const [isReadingImage, setIsReadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'qr-scanner-container';

  // Auto-trace if batch code comes from URL (QR scan)
  useEffect(() => {
    if (urlBatchCode) {
      handleTrace(urlBatchCode);
    }
  }, [urlBatchCode]);

  const handleTrace = async (code?: string) => {
    const target = (code || batchCode).trim();
    if (!target) return;
    setIsSearching(true);
    setSearchError('');
    setBatch(null);

    try {
      const [batchData, actionsData] = await Promise.all([
        getBatchByCode(target),
        getBatchActions(target),
      ]);
      setBatch(normalizeBatch(batchData));
      setActions(actionsData.map(normalizeAction));
      // Update URL without reload so sharing works
      if (!urlBatchCode) {
        navigate(`/trace/${target}`, { replace: true });
      }
    } catch (err: any) {
      setSearchError(
        err?.response?.status === 404
          ? (language === 'en' ? 'Batch not found. Please check the code.' : 'தொகுதி கண்டறியப்படவில்லை.')
          : (language === 'en' ? 'Something went wrong. Try again.' : 'பிழை ஏற்பட்டது.')
      );
    } finally {
      setIsSearching(false);
    }
  };

  const startScanner = async () => {
    setCameraError('');
    setShowScanner(true);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (_) {}
      scannerRef.current = null;
    }
    setShowScanner(false);
  };

  // Extract batch code from a scanned/decoded QR string
  const extractBatchCode = (decodedText: string): string => {
    let code = decodedText.trim();
    try {
      const parsed = JSON.parse(decodedText);
      code = parsed.batchCode || decodedText;
    } catch {
      const match = decodedText.match(/\/trace\/([A-Z0-9-]+)/);
      if (match) code = match[1];
    }
    return code;
  };

  // Scan QR from an image File object
  const scanImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageError(language === 'en' ? 'Please upload an image file.' : 'படக் கோப்பை பதிவேற்றவும்.');
      return;
    }
    setImageError('');
    setIsReadingImage(true);

    try {
      // Use a temp div for html5-qrcode file scanning
      const tempDivId = 'qr-image-temp';
      let tempDiv = document.getElementById(tempDivId);
      if (!tempDiv) {
        tempDiv = document.createElement('div');
        tempDiv.id = tempDivId;
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);
      }

      const scanner = new Html5Qrcode(tempDivId);
      const result = await scanner.scanFile(file, false);
      scanner.clear();
      tempDiv.remove();

      const code = extractBatchCode(result);
      setBatchCode(code);
      handleTrace(code);
    } catch (err) {
      setImageError(
        language === 'en'
          ? 'No QR code found in this image. Please try another.'
          : 'இந்த படத்தில் QR குறியீடு இல்லை. வேறொன்றை முயற்சிக்கவும்.'
      );
    } finally {
      setIsReadingImage(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) scanImageFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) scanImageFile(file);
    // Reset so same file can be re-selected
    e.target.value = '';
  };
  useEffect(() => {
    if (!showScanner) return;

    const startCamera = async () => {
      try {
        const scanner = new Html5Qrcode(scannerDivId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' }, // rear camera
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            // QR may contain a URL or JSON — extract batch code
            const code = extractBatchCode(decodedText);
            stopScanner();
            setBatchCode(code);
            handleTrace(code);
          },
          () => {} // ignore per-frame errors
        );
      } catch (err: any) {
        setCameraError(
          language === 'en'
            ? 'Could not access camera. Please allow camera permissions.'
            : 'கேமரா அணுக முடியவில்லை. அனுமதி வழங்கவும்.'
        );
        setShowScanner(false);
      }
    };

    // Small delay to ensure div is rendered
    const timeout = setTimeout(startCamera, 100);
    return () => {
      clearTimeout(timeout);
      stopScanner();
    };
  }, [showScanner]);

  // Stop scanner on unmount
  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const priceJourney = batch ? buildPriceJourney(batch, actions) : [];
  const firstPrice = priceJourney[0]?.pricePerKg;
  const lastPrice = priceJourney[priceJourney.length - 1]?.pricePerKg;
  const totalMarkup = firstPrice && lastPrice && firstPrice !== lastPrice
    ? { abs: (lastPrice - firstPrice).toFixed(2), pct: (((lastPrice - firstPrice) / firstPrice) * 100).toFixed(1) }
    : null;

  return (
    <Layout hideFooter>
      <div className="container mx-auto px-4 py-6 max-w-lg space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronRight className="h-5 w-5 rotate-180" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            {language === 'en' ? 'Trace Batch' : 'தொகுதியை கண்காணி'}
          </h1>
        </div>

        {/* Camera scanner modal */}
        {showScanner && (
          <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
            <div className="bg-background rounded-2xl overflow-hidden w-full max-w-sm">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-semibold text-foreground">
                  {language === 'en' ? 'Scan QR Code' : 'QR குறியீட்டை ஸ்கேன் செய்'}
                </h2>
                <Button variant="ghost" size="icon" onClick={stopScanner}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div id={scannerDivId} className="w-full" style={{ minHeight: 300 }} />
              <p className="text-center text-sm text-muted-foreground p-4">
                {language === 'en'
                  ? 'Point your camera at the batch QR code'
                  : 'தொகுதி QR குறியீட்டில் கேமராவை நோக்குங்கள்'}
              </p>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
        />

        {/* Drag & Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all',
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border hover:border-primary/50 hover:bg-muted/30'
          )}
        >
          {isReadingImage ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">
                {language === 'en' ? 'Reading QR code...' : 'QR குறியீட்டை படிக்கிறது...'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className={cn(
                'h-12 w-12 rounded-xl flex items-center justify-center transition-colors',
                isDragging ? 'bg-primary/20' : 'bg-muted'
              )}>
                {isDragging
                  ? <ImageIcon className="h-6 w-6 text-primary" />
                  : <Upload className="h-6 w-6 text-muted-foreground" />}
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">
                  {isDragging
                    ? (language === 'en' ? 'Drop image here' : 'படத்தை இங்கே விடுங்கள்')
                    : (language === 'en' ? 'Drop a QR image or click to upload' : 'QR படத்தை இழுத்து விடுங்கள் அல்லது கிளிக் செய்யவும்')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'en' ? 'PNG, JPG, WEBP supported' : 'PNG, JPG, WEBP ஆதரிக்கப்படுகிறது'}
                </p>
              </div>
            </div>
          )}
        </div>

        {imageError && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">{imageError}</p>
          </div>
        )}

        {/* Search bar — always visible */}
        <div className="card-govt">
          <div className="p-4 flex gap-2">
            <Input
              type="text"
              placeholder={language === 'en' ? 'Enter batch code...' : 'தொகுதி குறியீட்டை உள்ளிடவும்...'}
              value={batchCode}
              onChange={(e) => { setBatchCode(e.target.value.toUpperCase()); setSearchError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleTrace()}
              className="h-12 font-mono flex-1"
            />
            <Button
              variant="outline"
              className="h-12 px-4"
              onClick={startScanner}
              title={language === 'en' ? 'Scan with camera' : 'கேமராவுடன் ஸ்கேன் செய்'}
            >
              <Camera className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              className="h-12 px-5"
              onClick={() => handleTrace()}
              disabled={isSearching || !batchCode.trim()}
            >
              {isSearching
                ? <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                : <ScanLine className="h-4 w-4" />}
            </Button>
          </div>
          {searchError && (
            <div className="px-4 pb-4">
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm">{searchError}</p>
              </div>
            </div>
          )}
          {cameraError && (
            <div className="px-4 pb-4">
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm">{cameraError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {batch && (
          <>
            {/* Verified badge */}
            <div className="rounded-2xl p-5 flex items-center gap-4 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800">
              <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-emerald-700 dark:text-emerald-400">
                  {language === 'en' ? '✓ Verified & Authentic' : '✓ சரிபார்க்கப்பட்டது & நம்பகமானது'}
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-500 font-mono mt-0.5">{batch.batchCode}</p>
              </div>
            </div>

            {/* Batch overview */}
            <div className="card-govt">
              <div className="card-govt-header">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Wheat className="h-4 w-4 text-primary" />
                  {language === 'en' ? 'Batch Overview' : 'தொகுதி சுருக்கம்'}
                </h2>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground block">{language === 'en' ? 'Crop' : 'பயிர்'}</span><p className="font-semibold mt-0.5">{batch.cropName}</p></div>
                <div><span className="text-muted-foreground block">{language === 'en' ? 'Quantity' : 'அளவு'}</span><p className="font-semibold mt-0.5">{batch.quantity} {batch.unit}</p></div>
                <div><span className="text-muted-foreground block">{language === 'en' ? 'Origin' : 'தோற்றம்'}</span><p className="font-semibold mt-0.5">{batch.village || batch.location}</p></div>
                <div><span className="text-muted-foreground block">{language === 'en' ? 'Harvested' : 'அறுவடை'}</span><p className="font-semibold mt-0.5">{format(new Date(batch.harvestDate), 'dd MMM yyyy')}</p></div>
                <div><span className="text-muted-foreground block">{language === 'en' ? 'Farmer' : 'விவசாயி'}</span><p className="font-semibold mt-0.5">{batch.farmerName}</p></div>
                <div><span className="text-muted-foreground block">{language === 'en' ? 'Stages' : 'நிலைகள்'}</span><p className="font-semibold mt-0.5">{actions.length} {language === 'en' ? 'recorded' : 'பதிவு'}</p></div>
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
                </div>
                <div className="p-4 space-y-3">
                  {priceJourney.map((stage, i) => {
                    const prev = priceJourney[i - 1];
                    const diff = prev ? stage.pricePerKg - prev.pricePerKg : 0;
                    const pct = prev ? ((diff / prev.pricePerKg) * 100).toFixed(1) : null;
                    return (
                      <div key={i}>
                        <div className={cn('rounded-xl p-4 border', stage.isOrigin ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : 'bg-muted/40 border-border')}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-sm">{language === 'en' ? stage.label : stage.labelTa}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{stage.actor}</p>
                              {stage.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{stage.location}</p>}
                            </div>
                            <div className="text-right">
                              <p className={cn('text-lg font-bold', stage.isOrigin ? 'text-emerald-600' : 'text-foreground')}>₹{stage.pricePerKg}/kg</p>
                              {prev && (
                                <p className={cn('text-xs font-medium mt-0.5', diff > 0 ? 'text-orange-500' : diff < 0 ? 'text-emerald-500' : 'text-muted-foreground')}>
                                  {diff !== 0 ? `${diff > 0 ? '+' : ''}₹${Math.abs(diff).toFixed(2)} (${diff > 0 ? '+' : ''}${pct}%)` : 'No change'}
                                </p>
                              )}
                              {stage.isOrigin && <p className="text-xs text-emerald-600 font-medium mt-0.5">{language === 'en' ? 'Farm Gate' : 'பண்ணை விலை'}</p>}
                            </div>
                          </div>
                        </div>
                        {i < priceJourney.length - 1 && (
                          <div className="flex justify-center my-1">
                            <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {totalMarkup && (
                    <div className="mt-2 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm">{language === 'en' ? 'Total Price Markup' : 'மொத்த விலை உயர்வு'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">₹{firstPrice}/kg → ₹{lastPrice}/kg</p>
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

            {priceJourney.length === 0 && (
              <div className="card-govt p-5 flex items-center gap-3">
                <Info className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'No price data recorded for this batch yet.' : 'இந்த தொகுதிக்கு இன்னும் விலை தரவு இல்லை.'}
                </p>
              </div>
            )}

            {/* Timeline */}
            <div className="card-govt">
              <div className="card-govt-header">
                <h2 className="font-semibold text-foreground">{language === 'en' ? 'Full Journey Timeline' : 'முழு பயண காலவரிசை'}</h2>
                <p className="text-xs text-muted-foreground mt-1">{actions.length} {language === 'en' ? 'action(s) recorded' : 'செயல்(கள்) பதிவு'}</p>
              </div>
              <div className="p-4">
                {actions.length === 0
                  ? <p className="text-center text-muted-foreground text-sm py-6">{language === 'en' ? 'No actions recorded beyond farm origin.' : 'பண்ணை தோற்றத்திற்கு அப்பால் செயல்கள் இல்லை.'}</p>
                  : <Timeline batch={batch} actions={actions} />}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Trace;