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

const SCANNER_ID = "super-scanner-stable-container";

export function BarcodeScanner({ onScanSuccess, onOcrSuccess, isOpen }: BarcodeScannerProps) {
  const { toast } = useToast();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const autoScanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTransitioningRef = useRef(false);
  const lastScannedRef = useRef<string | null>(null);

  const onScanSuccessRef = useRef(onScanSuccess);
  const onOcrSuccessRef = useRef(onOcrSuccess);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
    onOcrSuccessRef.current = onOcrSuccess;
  }, [onScanSuccess, onOcrSuccess]);

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
    if (isAiProcessing || lastScannedRef.current || !html5QrCodeRef.current?.isScanning) return;

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
        const priceLabel = `₹${result.price}`;
        lastScannedRef.current = priceLabel;
        setLastScanned(priceLabel);
        
        setTimeout(() => {
          onOcrSuccessRef.current(result.name, result.price);
        }, 1200);
      }
    } catch (e) {
      if (!isAuto) {
        toast({ 
          variant: 'destructive', 
          title: "Scan Failed", 
          description: "Ensure the tag is well-lit and the Rupee symbol is visible." 
        });
      }
    } finally {
      setIsAiProcessing(false);
    }
  }, [isAiProcessing, playBeep, toast]);

  useEffect(() => {
    if (!isOpen) {
      setLastScanned(null);
      lastScannedRef.current = null;
      return;
    }

    let isMounted = true;

    const startScanner = async () => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      try {
        const container = document.getElementById(SCANNER_ID);
        if (!container || !isMounted) {
           isTransitioningRef.current = false;
           return;
        }

        if (!html5QrCodeRef.current) {
          html5QrCodeRef.current = new Html5Qrcode(SCANNER_ID);
        }

        const scanner = html5QrCodeRef.current;
        
        if (scanner.isScanning) {
          try { await scanner.stop(); } catch(e) {}
        }

        if (!isMounted) {
          isTransitioningRef.current = false;
          return;
        }

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 280, height: 200 },
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.UPC_A
            ]
          },
          (decodedText) => {
            if (lastScannedRef.current) return;
            playBeep();
            lastScannedRef.current = decodedText;
            setLastScanned(decodedText);
            onScanSuccessRef.current(decodedText);
          },
          () => {} 
        );

        if (isMounted) {
          setHasCameraPermission(true);
          if (autoScanIntervalRef.current) clearInterval(autoScanIntervalRef.current);
          autoScanIntervalRef.current = setInterval(() => {
            performOcrScan(true);
          }, 3500);
        }

      } catch (error) {
        console.warn('Scanner start error:', error);
        if (isMounted) setHasCameraPermission(false);
      } finally {
        isTransitioningRef.current = false;
      }
    };

    const timer = setTimeout(startScanner, 800);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (autoScanIntervalRef.current) {
        clearInterval(autoScanIntervalRef.current);
        autoScanIntervalRef.current = null;
      }
      
      const scanner = html5QrCodeRef.current;
      if (scanner && !isTransitioningRef.current) {
        isTransitioningRef.current = true;
        const cleanup = async () => {
          try {
            if (scanner.isScanning) {
              await scanner.stop();
              scanner.clear(); 
            }
          } catch (err) {
            console.warn("Scanner cleanup suppressed:", err);
          } finally {
            isTransitioningRef.current = false;
          }
        };
        cleanup();
      }
    };
  }, [isOpen, playBeep, performOcrScan]);

  return (
    <div className="space-y-4 relative">
      <div 
        id={SCANNER_ID} 
        className={cn(
          "w-full aspect-square rounded-[32px] overflow-hidden border-4 bg-slate-900 relative shadow-2xl transition-all duration-500",
          isAiProcessing ? "border-primary/50 scale-[1.01]" : "border-slate-100 scale-100"
        )}
      >
        {lastScanned && (
          <div className="absolute inset-0 z-20 bg-emerald-500/95 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
             <div className="h-24 w-24 bg-white rounded-[32px] flex items-center justify-center mb-6 shadow-2xl">
               <CheckCircle className="h-12 w-12 text-emerald-500" />
             </div>
             <p className="text-white font-black text-5xl tracking-tighter uppercase text-center px-4">{lastScanned}</p>
          </div>
        )}

        {isAiProcessing && !lastScanned && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="w-full h-full border-[10px] border-primary animate-pulse opacity-30 rounded-[28px]" />
            <div className="absolute bg-primary/90 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl border border-white/20">
               <Loader2 className="h-5 w-5 text-white animate-spin" />
               <span className="text-white font-black text-[10px] uppercase tracking-[0.2em]">AI Detecting...</span>
            </div>
          </div>
        )}

        {!lastScanned && !isAiProcessing && (
          <div className="absolute inset-0 z-0 pointer-events-none flex flex-col items-center justify-center">
             <div className="w-64 h-40 border-2 border-dashed border-white/30 rounded-2xl relative">
                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-primary/40 shadow-[0_0_15px_rgba(var(--primary),0.5)] animate-bounce" />
             </div>
             <p className="mt-8 text-white/30 font-black text-[9px] uppercase tracking-[0.4em]">Align Tag or Barcode</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button 
          variant="secondary"
          onClick={() => performOcrScan(false)} 
          disabled={isAiProcessing || !!lastScanned}
          className="h-14 rounded-2xl bg-slate-50 text-secondary font-black uppercase tracking-widest gap-3 text-[10px] border-2 border-transparent hover:border-primary/20 transition-all"
        >
          {isAiProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 text-primary" />}
          Force Scan Price Tag
        </Button>
      </div>
      
      {hasCameraPermission === false && (
        <Alert variant="destructive" className="rounded-3xl border-none shadow-xl bg-primary text-white p-6">
          <CameraOff className="h-5 w-5" />
          <AlertTitle className="font-black uppercase tracking-tight text-xs mb-1">Camera Access Required</AlertTitle>
          <AlertDescription className="text-[10px] font-bold opacity-90 leading-relaxed">
            Please allow camera access in your browser settings to use the scanner.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between px-2">
         <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Vision Engine Operational</p>
         </div>
         <div className="flex items-center gap-2 text-slate-400">
            <Search className="h-3 w-3" />
            <p className="text-[9px] font-black uppercase tracking-widest">Super 9+ Terminal</p>
         </div>
      </div>
    </div>
  );
}
