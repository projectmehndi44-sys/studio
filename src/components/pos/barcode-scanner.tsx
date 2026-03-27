'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { CameraOff, CheckCircle, Zap, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { scanPriceTag } from '@/ai/flows/scan-price-tag-flow';
import { cn } from '@/lib/utils';

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
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const autoScanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Play a "beep" sound using Web Audio API to avoid external assets
  const playBeep = useCallback(() => {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio beep failed", e);
    }
  }, []);

  const performOcrScan = useCallback(async (isAuto = false) => {
    if (isAiProcessing) return;

    const video = document.querySelector('#barcode-reader video') as HTMLVideoElement;
    if (!video || video.readyState !== 4) return;

    setIsAiProcessing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context failed");
      
      ctx.drawImage(video, 0, 0);
      const dataUri = canvas.toDataURL('image/jpeg', 0.7); // Compressed for speed
      
      const result = await scanPriceTag({ photoDataUri: dataUri });
      
      if (result && result.price > 0) {
        playBeep();
        setLastScanned(`₹${result.price}`);
        
        // Wait a tiny bit for the user to see the "success" green flash before closing
        setTimeout(() => {
          onOcrSuccess(result.name, result.price);
        }, 500);
      }
    } catch (e) {
      // For auto-scan, we silently ignore errors (like no price found in frame)
      if (!isAuto) {
        toast({ 
          variant: 'destructive', 
          title: "Scan Failed", 
          description: "Ensure the price tag is clear and visible." 
        });
      }
    } finally {
      setIsAiProcessing(false);
    }
  }, [isAiProcessing, onOcrSuccess, playBeep, toast]);

  useEffect(() => {
    if (!isOpen) {
      if (autoScanIntervalRef.current) clearInterval(autoScanIntervalRef.current);
      return;
    }

    const startScanner = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        stream.getTracks().forEach(track => track.stop());

        const scannerId = "barcode-reader";
        const scanner = new Html5Qrcode(scannerId);
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 20,
            qrbox: { width: 250, height: 150 },
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.UPC_A
            ]
          },
          (decodedText) => {
            playBeep();
            setLastScanned(decodedText);
            onScanSuccess(decodedText);
            setTimeout(() => setLastScanned(null), 1000);
          },
          () => { /* Noise reduction */ }
        );

        // Start the Auto-OCR loop (check every 3 seconds)
        autoScanIntervalRef.current = setInterval(() => {
          performOcrScan(true);
        }, 3500);

      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please allow camera access to use the scanner.',
        });
      }
    };

    startScanner();

    return () => {
      if (autoScanIntervalRef.current) clearInterval(autoScanIntervalRef.current);
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error("Scanner stop error", err));
      }
    };
  }, [isOpen, onScanSuccess, playBeep, performOcrScan, toast]);

  return (
    <div className="space-y-4 relative">
      <div 
        id="barcode-reader" 
        className={cn(
          "w-full aspect-square rounded-[32px] overflow-hidden border-4 bg-slate-900 relative shadow-2xl transition-colors duration-300",
          isAiProcessing ? "border-primary/40" : "border-slate-100"
        )}
      >
        {/* SUCCESS OVERLAY */}
        {lastScanned && (
          <div className="absolute inset-0 z-20 bg-emerald-500/90 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200">
             <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-2xl">
               <CheckCircle className="h-14 w-14 text-emerald-500" />
             </div>
             <p className="text-white font-black text-4xl tracking-tighter uppercase text-center px-4">{lastScanned}</p>
          </div>
        )}

        {/* AI CAPTURING PULSE */}
        {isAiProcessing && !lastScanned && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="w-full h-full border-8 border-primary animate-pulse opacity-30" />
            <div className="absolute bg-primary/80 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl">
               <Loader2 className="h-5 w-5 text-white animate-spin" />
               <span className="text-white font-black text-xs uppercase tracking-widest">Reading Price Tag...</span>
            </div>
          </div>
        )}

        {/* SCANNING GUIDES */}
        {!lastScanned && !isAiProcessing && (
          <div className="absolute inset-0 z-0 pointer-events-none flex flex-col items-center justify-center">
             <div className="w-64 h-40 border-2 border-dashed border-white/30 rounded-2xl relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary/40 shadow-[0_0_15px_rgba(var(--primary),0.5)] animate-bounce" />
             </div>
             <p className="mt-8 text-white/50 font-bold text-[10px] uppercase tracking-[0.3em]">Align Tag or Barcode</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button 
          variant="secondary"
          onClick={() => performOcrScan(false)} 
          disabled={isAiProcessing}
          className="h-16 rounded-2xl bg-slate-100 text-secondary font-black uppercase tracking-widest gap-3 text-xs border-2 border-transparent hover:border-primary/20 transition-all"
        >
          {isAiProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5 text-primary" />}
          Force Smart Scan
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

      <div className="flex items-center justify-between px-2">
         <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Auto-Capture Active</p>
         </div>
         <div className="flex items-center gap-2">
            <Search className="h-3 w-3 text-primary" />
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">AI Vision v4.0</p>
         </div>
      </div>
    </div>
  );
}
