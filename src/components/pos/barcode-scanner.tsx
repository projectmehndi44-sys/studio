'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { CameraOff, CheckCircle, Zap, Loader2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { scanPriceTag } from '@/ai/flows/scan-price-tag-flow';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onOcrSuccess: (name: string, price: number) => void;
  isOpen: boolean;
}

export function BarcodeScanner({ onScanSuccess, onOcrSuccess, isOpen }: BarcodeScannerProps) {
  const { toast } = useToast();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const startScanner = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        
        const newScanner = new Html5QrcodeScanner(
          "barcode-reader", 
          { 
            fps: 20, 
            qrbox: { width: 300, height: 200 },
            aspectRatio: 1.0,
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E
            ]
          }, 
          false
        );

        newScanner.render(
          (decodedText) => {
            setLastScanned(decodedText);
            onScanSuccess(decodedText);
            setTimeout(() => setLastScanned(null), 1000);
          },
          () => { /* Noise reduction */ }
        );

        setScanner(newScanner);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Enable permissions for Continuous Scanning.',
        });
      }
    };

    startScanner();

    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.error("Scanner clear cleanup error", err));
      }
    };
  }, [isOpen]);

  const handleSmartScan = async () => {
    const video = document.querySelector('#barcode-reader video') as HTMLVideoElement;
    if (!video) return;

    setIsAiProcessing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);
      
      const dataUri = canvas.toDataURL('image/jpeg', 0.8);
      const result = await scanPriceTag({ photoDataUri: dataUri });
      
      onOcrSuccess(result.name, result.price);
      setLastScanned(`${result.name} - ₹${result.price}`);
      setTimeout(() => setLastScanned(null), 1500);
      
      toast({ title: "Smart Scan OK", description: `Added ${result.name} (₹${result.price})` });
    } catch (e) {
      toast({ variant: 'destructive', title: "Smart Scan Failed", description: "Could not read price tag." });
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <div className="space-y-4 relative">
      <div 
        id="barcode-reader" 
        className="w-full aspect-square rounded-[32px] overflow-hidden border-4 border-slate-100 bg-slate-900 relative shadow-2xl"
      >
        {lastScanned && (
          <div className="absolute inset-0 z-20 bg-emerald-500/80 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200">
             <CheckCircle className="h-20 w-20 text-white mb-4" />
             <p className="text-white font-black text-xl uppercase tracking-widest text-center px-4">{lastScanned}</p>
          </div>
        )}
        {isAiProcessing && (
          <div className="absolute inset-0 z-30 bg-primary/60 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
             <Loader2 className="h-16 w-16 text-white animate-spin mb-4" />
             <p className="text-white font-black text-lg uppercase tracking-widest">AI Extraction Active...</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button 
          onClick={handleSmartScan} 
          disabled={isAiProcessing}
          className="h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-xl gap-3 text-xs"
        >
          {isAiProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5 fill-white" />}
          Snap Price Tag (Smart Scan)
        </Button>
      </div>
      
      {hasCameraPermission === false && (
        <Alert variant="destructive" className="rounded-2xl border-none shadow-lg">
          <CameraOff className="h-5 w-5" />
          <AlertTitle className="font-black uppercase tracking-tight text-xs">Lens Unavailable</AlertTitle>
          <AlertDescription className="text-[10px] font-bold opacity-80">
            Check security settings to use the Super Scanner.
          </AlertDescription>
        </Alert>
      )}

      <div className="text-center py-2 flex items-center justify-center gap-2">
         <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
         <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
            Ready for Barcodes & Price Tags
         </p>
      </div>
    </div>
  );
}
