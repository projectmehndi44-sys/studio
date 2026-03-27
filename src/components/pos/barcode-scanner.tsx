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

const SCANNER_ID = "barcode-reader-surface";

export function BarcodeScanner({ onScanSuccess, onOcrSuccess, isOpen }: BarcodeScannerProps) {
  const { toast } = useToast();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const autoScanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTransitioningRef = useRef(false);

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
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio beep failed", e);
    }
  }, []);

  const performOcrScan = useCallback(async (isAuto = false) => {
    if (isAiProcessing || lastScanned || !html5QrCodeRef.current?.isScanning) return;

    const video = document.querySelector(`#${SCANNER_ID} video`) as HTMLVideoElement;
    if (!video || video.readyState !== 4) return;

    setIsAiProcessing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context failed");
      
      ctx.drawImage(video, 0, 0);
      const dataUri = canvas.toDataURL('image/jpeg', 0.6);
      
      const result = await scanPriceTag({ photoDataUri: dataUri });
      
      if (result && result.price > 0) {
        playBeep();
        setLastScanned(`₹${result.price}`);
        setTimeout(() => {
          onOcrSuccess(result.name, result.price);
        }, 800);
      }
    } catch (e) {
      if (!isAuto) {
        toast({ 
          variant: 'destructive', 
          title: "Scan Failed", 
          description: "Ensure the tag is well-lit and the digits are clear." 
        });
      }
    } finally {
      setIsAiProcessing(false);
    }
  }, [isAiProcessing, lastScanned, onOcrSuccess, playBeep, toast]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const startScanner = async () => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      try {
        if (!html5QrCodeRef.current) {
          html5QrCodeRef.current = new Html5Qrcode(SCANNER_ID);
        }

        const scanner = html5QrCodeRef.current;
        if (scanner.isScanning) {
          await scanner.stop();
        }

        if (!isMounted) return;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 20,
            qrbox: { width: 250, height: 180 },
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.UPC_A
            ]
          },
          (decodedText) => {
            if (lastScanned) return;
            playBeep();
            setLastScanned(decodedText);
            onScanSuccess(decodedText);
            setTimeout(() => {
              if (isMounted) setLastScanned(null);
            }, 1500);
          },
          () => {} 
        );

        setHasCameraPermission(true);
        autoScanIntervalRef.current = setInterval(() => {
          performOcrScan(true);
        }, 3000);

      } catch (error) {
        console.error('Scanner start error:', error);
        if (isMounted) setHasCameraPermission(false);
      } finally {
        isTransitioningRef.current = false;
      }
    };

    const timer = setTimeout(startScanner, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (autoScanIntervalRef.current) {
        clearInterval(autoScanIntervalRef.current);
      }
      
      const scanner = html5QrCodeRef.current;
      if (scanner && scanner.isScanning && !isTransitioningRef.current) {
        isTransitioningRef.current = true;
        scanner.stop().then(() => {
          scanner.clear();
        }).catch((err) => {
          console.warn("Cleanup error:", err);
        }).finally(() => {
          isTransitioningRef.current = false;
        });
      }
    };
  }, [isOpen, onScanSuccess, playBeep, performOcrScan]);

  return (
    <div className="space-y-4 relative">
      <div 
        id={SCANNER_ID} 
        className={cn(
          "w-full aspect-square rounded-[32px] overflow-hidden border-4 bg-slate-900 relative shadow-2xl transition-all duration-500",
          isAiProcessing ? "border-primary/50 scale-[1.02]" : "border-slate-100 scale-100"
        )}
      >
        {lastScanned && (
          <div className="absolute inset-0 z-20 bg-emerald-500/95 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
             <div className="h-28 w-28 bg-white rounded-[40px] flex items-center justify-center mb-6 shadow-2xl">
               <CheckCircle className="h-16 w-16 text-emerald-500" />
             </div>
             <p className="text-white font-black text-5xl tracking-tighter uppercase text-center px-4">{lastScanned}</p>
          </div>
        )}

        {isAiProcessing && !lastScanned && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="w-full h-full border-[12px] border-primary animate-pulse opacity-40 rounded-[28px]" />
            <div className="absolute bg-primary/90 backdrop-blur-md px-8 py-4 rounded-3xl flex items-center gap-4 shadow-2xl border border-white/20">
               <Loader2 className="h-6 w-6 text-white animate-spin" />
               <span className="text-white font-black text-sm uppercase tracking-widest">Vision Engine Active...</span>
            </div>
          </div>
        )}

        {!lastScanned && !isAiProcessing && (
          <div className="absolute inset-0 z-0 pointer-events-none flex flex-col items-center justify-center">
             <div className="w-72 h-44 border-2 border-dashed border-white/40 rounded-3xl relative">
                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-primary/60 shadow-[0_0_20px_rgba(var(--primary),0.8)] animate-bounce" />
             </div>
             <p className="mt-10 text-white/40 font-black text-[10px] uppercase tracking-[0.4em]">Point at Tag or Barcode</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button 
          variant="secondary"
          onClick={() => performOcrScan(false)} 
          disabled={isAiProcessing || !!lastScanned}
          className="h-16 rounded-2xl bg-slate-100 text-secondary font-black uppercase tracking-widest gap-3 text-xs border-2 border-transparent hover:border-primary/30 transition-all shadow-sm"
        >
          {isAiProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5 text-primary" />}
          Manual Trigger Scan
        </Button>
      </div>
      
      {hasCameraPermission === false && (
        <Alert variant="destructive" className="rounded-3xl border-none shadow-2xl bg-primary text-white p-6">
          <CameraOff className="h-6 w-6" />
          <AlertTitle className="font-black uppercase tracking-tighter text-sm mb-1">Hardware Error</AlertTitle>
          <AlertDescription className="text-[11px] font-bold opacity-90 leading-relaxed">
            Camera access was denied or interrupted. Please ensure permissions are granted in your browser or tablet settings.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between px-4">
         <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Auto-Hunt Enabled</p>
         </div>
         <div className="flex items-center gap-2 text-slate-400">
            <Search className="h-3.5 w-3.5" />
            <p className="text-[10px] font-black uppercase tracking-widest">AI v5.4</p>
         </div>
      </div>
    </div>
  );
}
