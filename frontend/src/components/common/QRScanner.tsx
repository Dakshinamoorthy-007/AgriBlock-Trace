// src/components/common/QRScanner.tsx
// Reusable QR scanner with camera + drag/drop/upload
// Used by both Trace.tsx and MiddlemanDashboard.tsx

import React, { useEffect, useRef, useState } from 'react';
import { Camera, Upload, ImageIcon, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Html5Qrcode } from 'html5-qrcode';
import { cn } from '@/lib/utils';

interface QRScannerProps {
  // Called with the extracted batch code when a QR is successfully scanned
  onScan: (batchCode: string) => void;
  // Optional: show/hide the drag-drop zone (default true)
  showDropZone?: boolean;
  // Optional: show/hide the camera button (default true)
  showCamera?: boolean;
}

// Extract batch code from any QR format: plain code, URL, or JSON
export const extractBatchCode = (decodedText: string): string => {
  let code = decodedText.trim();
  try {
    const parsed = JSON.parse(decodedText);
    code = parsed.batchCode || decodedText;
  } catch {
    const match = decodedText.match(/\/trace\/([A-Z0-9-]+)/);
    if (match) code = match[1];
  }
  return code.toUpperCase();
};

const QRScanner: React.FC<QRScannerProps> = ({
  onScan,
  showDropZone = true,
  showCamera = true,
}) => {
  const { language } = useLanguage();
  const [showScanner, setShowScanner] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState('');
  const [isReadingImage, setIsReadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'qr-scanner-container';

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

  // Start camera when modal opens
  useEffect(() => {
    if (!showScanner) return;

    const startCamera = async () => {
      try {
        const scanner = new Html5Qrcode(scannerDivId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            const code = extractBatchCode(decodedText);
            stopScanner();
            onScan(code);
          },
          () => {}
        );
      } catch (err) {
        setCameraError(
          language === 'en'
            ? 'Could not access camera. Please allow camera permissions.'
            : 'கேமரா அணுக முடியவில்லை. அனுமதி வழங்கவும்.'
        );
        setShowScanner(false);
      }
    };

    const timeout = setTimeout(startCamera, 100);
    return () => {
      clearTimeout(timeout);
      stopScanner();
    };
  }, [showScanner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  // Scan QR from an image file
  const scanImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageError(
        language === 'en'
          ? 'Please upload an image file.'
          : 'படக் கோப்பை பதிவேற்றவும்.'
      );
      return;
    }

    setImageError('');
    setIsReadingImage(true);

    try {
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
      onScan(code);
    } catch {
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
    e.target.value = '';
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Camera modal */}
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

      {/* Camera error */}
      {cameraError && (
        <div className="p-3 rounded-xl bg-destructive/10 text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">{cameraError}</p>
        </div>
      )}

      {/* Camera button */}
      {showCamera && (
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => { setCameraError(''); setShowScanner(true); }}
        >
          <Camera className="h-4 w-4" />
          {language === 'en' ? 'Scan with Camera' : 'கேமராவுடன் ஸ்கேன் செய்'}
        </Button>
      )}

      {/* Drag & Drop zone */}
      {showDropZone && (
        <>
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
        </>
      )}
    </>
  );
};

export default QRScanner;