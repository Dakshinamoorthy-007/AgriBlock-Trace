import React, { useState } from 'react';
import { 
  Plus, 
  Package, 
  QrCode, 
  Calendar, 
  MapPin, 
  Wheat,
  ChevronRight,
  Download,
  Eye,
  IndianRupee
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { t } from '@/lib/translations';
import IconButton from '@/components/common/IconButton';
import QRCodeDisplay from '@/components/common/QRCodeDisplay';
import { mockBatches, crops, generateBatchCode } from '@/lib/mockData';
import { Batch } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {createBatch} from "@/lib/api";
import { useEffect } from 'react';
import {getMyBatches} from "@/lib/api";


const FarmerDashboard: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [view, setView] = useState<'home' | 'create' | 'list' | 'qr'>('home');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  // Form state
  const [cropName, setCropName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<'kg' | 'tonnes'>('kg');
  const [village, setVillage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [sellingPricePerKg, setSellingPricePerKg] = useState('');
  const [totalSellingPrice, setTotalSellingPrice] = useState('');

  // Auto-calculate total price when perKg or quantity changes
  const handlePricePerKgChange = (val: string) => {
    setSellingPricePerKg(val);
    if (val && quantity) {
      setTotalSellingPrice((parseFloat(val) * parseFloat(quantity)).toFixed(2));
    }
  };

  const handleTotalPriceChange = (val: string) => {
    setTotalSellingPrice(val);
    if (val && quantity && parseFloat(quantity) > 0) {
      setSellingPricePerKg((parseFloat(val) / parseFloat(quantity)).toFixed(2));
    }
  };

  const handleCreateBatch = async () => {
    if (!cropName || !quantity || !village) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setIsCreating(true);
      console.log("Form values:", cropName, quantity, village);

      const response = await createBatch({
        crop: cropName,
        quantity: Number(quantity),
        location: village,
        harvestDate: new Date().toISOString(),
        sellingPricePerKg: sellingPricePerKg ? parseFloat(sellingPricePerKg) : undefined,
        totalSellingPrice: totalSellingPrice ? parseFloat(totalSellingPrice) : undefined,
      });

      console.log("Batch created:", response);

      const batch = {
        ...response,
        id: response._id,
        cropName: response.crop,
        cropNameTamil: response.crop,
        village: response.location,
        harvestDate: response.harvestDate,
        sellingPricePerKg: response.sellingPricePerKg,
        totalSellingPrice: response.totalSellingPrice,
        unit: unit
      };

      setBatches(prev => [batch, ...prev]);
      setSelectedBatch(batch);
      setView("qr");

      setCropName("");
      setQuantity("");
      setVillage("");
      setSellingPricePerKg("");
      setTotalSellingPrice("");

    } catch (err) {
      console.error("Batch creation failed:", err);
      alert("Failed to create batch");
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchBatches = async () => {
      try {
        const data = await getMyBatches();
        // Normalize fetched batches to match local shape
        const normalized = data.map((b: any) => ({
          ...b,
          id: b._id,
          cropName: b.crop,
          cropNameTamil: b.crop,
          village: b.location,
          harvestDate: b.harvestDate,
          unit: b.unit || 'kg',
        }));
        setBatches(normalized);
      } catch (err) {
        console.error("Failed to load Batches!", err);
      }
    };

    fetchBatches();
  }, [user]);

  const renderHome = () => (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          {language === 'en' ? `Welcome, ${user?.name || 'User'}` : `வரவேற்கிறோம், ${user?.name || 'பயனர்'}`}
        </h1>
        <p className="text-muted-foreground">
          {language === 'en' ? 'Farmer Dashboard' : 'விவசாயி டாஷ்போர்டு'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card-govt p-6 text-center">
          <div className="text-3xl font-bold text-primary mb-1">{batches.length}</div>
          <div className="text-sm text-muted-foreground">
            {language === 'en' ? 'Total Batches' : 'மொத்த தொகுதிகள்'}
          </div>
        </div>
        <div className="card-govt p-6 text-center">
          <div className="text-3xl font-bold text-secondary mb-1">
            {batches.filter(b => b.status === 'verified').length}
          </div>
          <div className="text-sm text-muted-foreground">
            {language === 'en' ? 'Verified' : 'சரிபார்க்கப்பட்டது'}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <IconButton
          icon={Plus}
          labelEn="Create Batch"
          labelTa="தொகுதி உருவாக்கு"
          onClick={() => setView('create')}
          variant="primary"
          size="lg"
        />
        <IconButton
          icon={Package}
          labelEn="View Batches"
          labelTa="தொகுதிகளைக் காண்"
          onClick={() => setView('list')}
          variant="secondary"
          size="lg"
        />
      </div>

      {/* Recent Batches */}
      {batches.length > 0 && (
        <div className="card-govt">
          <div className="card-govt-header flex items-center justify-between">
            <h2 className="font-semibold text-foreground">
              {language === 'en' ? 'Recent Batches' : 'சமீபத்திய தொகுதிகள்'}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setView('list')}>
              {language === 'en' ? 'View All' : 'அனைத்தையும் காண்'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="divide-y divide-border">
            {batches.slice(0, 3).map((batch) => (
              <div 
                key={batch.id}
                className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedBatch(batch);
                  setView('qr');
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Wheat className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {language === 'en' ? batch.cropName : batch.cropNameTamil}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {batch.batchCode}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">
                    {batch.quantity} {batch.unit}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(batch.createdAt), 'dd MMM')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderCreate = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setView('home')}>
          <ChevronRight className="h-5 w-5 rotate-180" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {t('createBatch', language)}
        </h1>
      </div>

      <div className="card-govt">
        <div className="card-govt-header">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Wheat className="h-4 w-4 text-primary" />
            {language === 'en' ? 'Batch Details' : 'தொகுதி விவரங்கள்'}
          </h2>
        </div>
        <div className="p-6 space-y-6">
          {/* Crop Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('cropName', language)} *
            </label>
            <Select value={cropName} onValueChange={setCropName}>
              <SelectTrigger className="h-14 text-lg">
                <SelectValue placeholder={t('selectCrop', language)} />
              </SelectTrigger>
              <SelectContent>
                {crops.map((crop) => (
                  <SelectItem key={crop.key} value={crop.key}>
                    <span className="flex items-center gap-2">
                      <span>{language === 'en' ? crop.en : crop.ta}</span>
                      <span className="text-muted-foreground text-sm">
                        ({language === 'en' ? crop.ta : crop.en})
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('quantity', language)} *
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={t('enterQuantity', language)}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-14 text-lg flex-1"
              />
              <Select value={unit} onValueChange={(v) => setUnit(v as 'kg' | 'tonnes')}>
                <SelectTrigger className="h-14 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg / கிலோ</SelectItem>
                  <SelectItem value="tonnes">Tonnes / டன்</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('village', language)} *
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('enterLocation', language)}
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="h-14 text-lg pl-12"
              />
            </div>
          </div>

          {/* Selling Price */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {language === 'en' ? 'Selling Price (Optional)' : 'விற்பனை விலை (விருப்பமானது)'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder={language === 'en' ? 'Per kg' : 'கிலோவுக்கு'}
                  value={sellingPricePerKg}
                  onChange={(e) => handlePricePerKgChange(e.target.value)}
                  className="h-14 text-lg pl-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">/kg</span>
              </div>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder={language === 'en' ? 'Total' : 'மொத்தம்'}
                  value={totalSellingPrice}
                  onChange={(e) => handleTotalPriceChange(e.target.value)}
                  className="h-14 text-lg pl-10"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'en'
                ? 'Enter either value — the other will be calculated automatically'
                : 'எந்த மதிப்பையும் உள்ளிடவும் — மற்றது தானாக கணக்கிடப்படும்'}
            </p>
          </div>

          {/* Submit Button */}
          <Button
            variant="default"
            size="xl"
            className="w-full"
            onClick={handleCreateBatch}
            disabled={isCreating || !cropName || !quantity || !village}
          >
            {isCreating ? (
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                {language === 'en' ? 'Creating Batch...' : 'பிளாக்செயினில் உருவாக்கி பதிவு செய்கிறது...'}
              </div>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                {t('createBatch', language)}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderList = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setView('home')}>
          <ChevronRight className="h-5 w-5 rotate-180" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {t('viewBatches', language)}
        </h1>
      </div>

      {batches.length === 0 ? (
        <div className="card-govt p-12 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {language === 'en' ? 'No batches yet. Create your first batch!' : 'இன்னும் தொகுதிகள் இல்லை. உங்கள் முதல் தொகுதியை உருவாக்குங்கள்!'}
          </p>
          <Button className="mt-4" onClick={() => setView('create')}>
            <Plus className="h-4 w-4" />
            {t('createBatch', language)}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <div key={batch.id} className="card-govt">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Wheat className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-lg">
                      {language === 'en' ? batch.cropName : batch.cropNameTamil}
                    </p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {batch.batchCode}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{batch.quantity} {batch.unit}</span>
                      <span>•</span>
                      <span>{batch.village}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSelectedBatch(batch);
                      setView('qr');
                    }}
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderQR = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setView('list')}>
          <ChevronRight className="h-5 w-5 rotate-180" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {language === 'en' ? 'Batch QR Code' : 'தொகுதி QR குறியீடு'}
        </h1>
      </div>

      {selectedBatch && (
        <div className="card-govt">
          <div className="card-govt-header text-center">
            <h2 className="font-semibold text-foreground">
              {language === 'en' ? selectedBatch.cropName : selectedBatch.cropNameTamil}
            </h2>
            <p className="text-sm text-muted-foreground">
              {selectedBatch.quantity} {selectedBatch.unit} • {selectedBatch.village}
            </p>
          </div>
          <div className="p-8">
            <QRCodeDisplay
              batchCode={selectedBatch.batchCode}
              size="lg"
              showActions={true}
              batchDetails={{
                crop: selectedBatch.cropName,
                quantity: selectedBatch.quantity,
                location: selectedBatch.village,
                harvestDate: selectedBatch.harvestDate
                  ? new Date(selectedBatch.harvestDate).toISOString()
                  : undefined,
              }}
            />
          </div>

          {selectedBatch.blockchainTxHash && (
            <div className="px-6 pb-6">
              <div className="p-4 rounded-xl bg-verified/10 text-center">
                <p className="text-sm font-medium text-verified mb-1">
                  {language === 'en' ? '✓ Registered on Blockchain' : '✓ பிளாக்செயினில் பதிவு செய்யப்பட்டது'}
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  TX: {selectedBatch.blockchainTxHash}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Layout hideFooter>
      <div className="container mx-auto px-4 py-6 max-w-lg">
        {view === 'home' && renderHome()}
        {view === 'create' && renderCreate()}
        {view === 'list' && renderList()}
        {view === 'qr' && renderQR()}
      </div>
    </Layout>
  );
};

export default FarmerDashboard;