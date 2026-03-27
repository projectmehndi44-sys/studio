
'use client';

import { useEffect, useState, useRef, useCallback, useId } from 'react';
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
  
  // Create a unique ID for the container, sanitized for HTML
  const scannerId = useId().replace(/:/g, '-');
  const containerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isTransitioningRef = useRef(false);
  const autoScanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Stable Refs for callbacks to avoid unnecessary re-initializations
  const onScanSuccessRef = useRef(onScanSuccess);
  const onOcrSuccessRef = useRef(onOcrSuccess);
  const isAiProcessingRef = useRef(false);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
    onOcrSuccessRef.current = onOcrSuccess;
    isAiProcessingRef.current = isAiProcessing;
  }, [onScanSuccess, onOcrSuccess, isAiProcessing]);

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
    // Prevent overlapping AI scans or duplicate detections
    if (isAiProcessingRef.current || !!lastScanned || !html5QrCodeRef.current?.isScanning) return;

    const video = containerRef.current?.querySelector('video') as HTMLVideoElement;
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
        setLastScanned(priceLabel);
        
        // Finalize detection after a short visual delay
        setTimeout(() => {
          onOcrSuccessRef.current(result.name, result.price);
        }, 1200);
      }
    } catch (e) {
      // Auto-scans fail silently
      if (!isAuto) {
        toast({ 
          variant: 'destructive', 
          title: "Scan Failed", 
          description: "Align the tag's ₹ symbol clearly in the frame." 
        });
      }
    } finally {
      setIsAiProcessing(false);
    }
  }, [playBeep, toast, lastScanned]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const startScanner = async () => {
      if (isTransitioningRef.current || !isMounted) return;
      isTransitioningRef.current = true;

      try {
        if (html5QrCodeRef.current) {
          try {
            if (html5QrCodeRef.current.isScanning) await html5QrCodeRef.current.stop();
          } catch (e) {}
          html5QrCodeRef.current = null;
        }

        const scanner = new Html5Qrcode(scannerId);
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.UPC_A
            ]
          },
          (decodedText) => {
            if (lastScanned) return;
            playBeep();
            setLastScanned(decodedText);
            onScanSuccessRef.current(decodedText);
          },
          () => {} // Quiet on frame failures
        );

        if (isMounted) {
          setHasCameraPermission(true);
          autoScanIntervalRef.current = setInterval(() => {
            performOcrScan(true);
          }, 3500);
        }
      } catch (err) {
        console.error("Scanner session start failed:", err);
        if (isMounted) setHasCameraPermission(false);
      } finally {
        isTransitioningRef.current = false;
      }
    };

    const timer = setTimeout(startScanner, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (autoScanIntervalRef.current) clearInterval(autoScanIntervalRef.current);
      
      const scanner = html5QrCodeRef.current;
      if (scanner) {
        isTransitioningRef.current = true;
        scanner.stop()
          .catch(e => console.warn("Scanner teardown warning:", e))
          .finally(() => {
            html5QrCodeRef.current = null;
            isTransitioningRef.current = false;
            // Atomic cleanup: only clear if the container is still present
            if (containerRef.current) {
              containerRef.current.innerHTML = "";
            }
          });
      }
    };
  }, [isOpen, scannerId, performOcrScan, playBeep, lastScanned]);

  return (
    <div className="space-y-4 relative">
      <div 
        id={scannerId} 
        ref={containerRef}
        className={cn(
          "w-full aspect-square rounded-[32px] overflow-hidden border-4 bg-slate-900 relative shadow-2xl transition-all duration-500",
          isAiProcessing ? "border-primary/50 scale-[1.01]" : "border-slate-100 scale-100"
        )}
      >
        {lastScanned && (
          <div className="absolute inset-0 z-20 bg-emerald-500/95 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
             <div className="h-16 w-16 md:h-20 md:w-20 bg-white rounded-[28px] flex items-center justify-center mb-6 shadow-2xl">
               <CheckCircle className="h-8 w-8 md:h-10 md:w-10 text-emerald-500" />
             </div>
             <p className="text-white font-black text-2xl md:text-4xl tracking-tighter uppercase text-center px-4 leading-none">{lastScanned}</p>
          </div>
        )}

        {isAiProcessing && !lastScanned && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="w-full h-full border-[10px] border-primary animate-pulse opacity-30 rounded-[28px]" />
            <div className="absolute bg-primary/90 backdrop-blur-md px-4 md:px-6 py-2 md:py-3 rounded-2xl flex items-center gap-3 shadow-2xl border border-white/20">
               <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-white animate-spin" />
               <span className="text-white font-black text-[7px] md:text-[9px] uppercase tracking-[0.2em]">Hunting ₹ Symbol</span>
            </div>
          </div>
        )}

        {!lastScanned && !isAiProcessing && (
          <div className="absolute inset-0 z-0 pointer-events-none flex flex-col items-center justify-center">
             <div className="w-40 h-24 md:w-56 md:h-32 border-2 border-dashed border-white/30 rounded-2xl relative">
                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-primary/40 shadow-[0_0_15px_rgba(var(--primary),0.5)] animate-bounce" />
             </div>
             <p className="mt-4 md:mt-8 text-white/30 font-black text-[7px] md:text-[8px] uppercase tracking-[0.4em]">Align ₹ Symbol</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button 
          variant="secondary"
          onClick={() => performOcrScan(false)} 
          disabled={isAiProcessing || !!lastScanned || !hasCameraPermission}
          className="h-12 md:h-14 rounded-2xl bg-slate-50 text-secondary font-black uppercase tracking-widest gap-3 text-[9px] md:text-[10px] border-2 border-transparent hover:border-primary/20 transition-all"
        >
          {isAiProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />}
          Manual Detection
        </Button>
      </div>
      
      {hasCameraPermission === false && (
        <Alert variant="destructive" className="rounded-3xl border-none shadow-xl bg-primary text-white p-4 md:p-6">
          <CameraOff className="h-4 w-4 md:h-5 md:w-5" />
          <AlertTitle className="font-black uppercase tracking-tight text-[10px] md:text-xs mb-1 text-white">Vision Restricted</AlertTitle>
          <AlertDescription className="text-[8px] md:text-[10px] font-bold opacity-90 leading-relaxed text-white/90">
            Allow camera access to enable the terminal's AI Vision.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between px-2">
         <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[7px] md:text-[9px] font-black uppercase text-slate-400 tracking-widest">Vision Engine Active</p>
         </div>
         <div className="flex items-center gap-2 text-slate-400">
            <Search className="h-3 w-3" />
            <p className="text-[7px] md:text-[9px] font-black uppercase tracking-widest">Super 9+ POS</p>
         </div>
      </div>
    </div>
  );
}
