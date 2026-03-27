
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
  
  const scannerId = useId().replace(/:/g, '-');
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

    const video = document.querySelector(`#${scannerId} video`) as HTMLVideoElement;
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
          description: "Align the tag clearly in the frame." 
        });
      }
    } finally {
      setIsAiProcessing(false);
    }
  }, [isAiProcessing, lastScanned, onOcrSuccess, playBeep, toast, scannerId]);

  useEffect(() => {
    let isMounted = true;
    if (!isOpen) return;

    const startScanner = async () => {
      if (isTransitioningRef.current) return;
      try {
        if (!html5QrCodeRef.current) {
          html5QrCodeRef.current = new Html5Qrcode(scannerId);
        }
        const scanner = html5QrCodeRef.current;
        if (scanner.isScanning) await scanner.stop();

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 20,
            qrbox: { width: 250, height: 180 },
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.CODE_128,
            ]
          },
          (decodedText) => {
            if (lastScanned) return;
            playBeep();
            setLastScanned(decodedText);
            onScanSuccess(decodedText);
            setTimeout(() => { if (isMounted) setLastScanned(null); }, 1500);
          },
          () => {} 
        );

        if (isMounted) {
          setHasCameraPermission(true);
          autoScanIntervalRef.current = setInterval(() => {
            performOcrScan(true);
          }, 3000);
        }
      } catch (error) {
        console.error('Scanner start error:', error);
        if (isMounted) setHasCameraPermission(false);
      }
    };

    const timer = setTimeout(startScanner, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (autoScanIntervalRef.current) clearInterval(autoScanIntervalRef.current);
      
      const scanner = html5QrCodeRef.current;
      if (scanner && scanner.isScanning && !isTransitioningRef.current) {
        isTransitioningRef.current = true;
        // Definitive fix for removeChild error: 
        // Stop the scanner AND clear the container only if container exists
        scanner.stop()
          .then(() => {
            if (document.getElementById(scannerId)) {
              scanner.clear();
            }
          })
          .catch(err => console.warn('Scanner stop error:', err))
          .finally(() => { 
            isTransitioningRef.current = false; 
          });
      }
    };
  }, [isOpen, onScanSuccess, playBeep, performOcrScan, scannerId, lastScanned]);

  return (
    <div className="space-y-4 relative">
      <div 
        id={scannerId} 
        className={cn(
          "w-full aspect-square rounded-[32px] overflow-hidden border-4 bg-slate-950 relative shadow-2xl transition-all duration-500",
          isAiProcessing ? "border-primary/50 scale-[1.01]" : "border-slate-100 scale-100"
        )}
      >
        {lastScanned && (
          <div className="absolute inset-0 z-20 bg-emerald-500/95 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
             <div className="h-20 w-20 bg-white rounded-[28px] flex items-center justify-center mb-6 shadow-2xl">
               <CheckCircle className="h-10 w-10 text-emerald-500" />
             </div>
             <p className="text-white font-black text-4xl tracking-tighter uppercase text-center px-4">{lastScanned}</p>
          </div>
        )}

        {isAiProcessing && !lastScanned && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="w-full h-full border-[12px] border-primary animate-pulse opacity-40 rounded-[28px]" />
            <div className="absolute bg-primary/90 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-4 shadow-2xl border border-white/20">
               <Loader2 className="h-5 w-5 text-white animate-spin" />
               <span className="text-white font-black text-xs uppercase tracking-widest">AI Vision...</span>
            </div>
          </div>
        )}

        {!lastScanned && !isAiProcessing && (
          <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
             <div className="w-56 h-32 border-2 border-dashed border-white/30 rounded-3xl relative">
                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-primary/40 animate-bounce" />
             </div>
             <p className="mt-8 text-white/30 font-black text-[9px] uppercase tracking-[0.4em]">Align Barcode or Tag</p>
          </div>
        )}
      </div>

      <Button 
        variant="secondary"
        onClick={() => performOcrScan(false)} 
        disabled={isAiProcessing || !!lastScanned || !hasCameraPermission}
        className="w-full h-16 rounded-2xl bg-slate-100 text-secondary font-black uppercase tracking-widest gap-3 text-xs border-2 border-transparent hover:border-primary/30 shadow-sm"
      >
        {isAiProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5 text-primary" />}
        Capture Price Now
      </Button>
      
      {hasCameraPermission === false && (
        <Alert variant="destructive" className="rounded-3xl border-none shadow-2xl bg-primary text-white p-6">
          <CameraOff className="h-6 w-6" />
          <AlertTitle className="font-black uppercase tracking-tighter text-sm mb-1 text-white">Access Blocked</AlertTitle>
          <AlertDescription className="text-[11px] font-bold opacity-90 leading-relaxed text-white">
            Please allow camera permissions in your settings.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between px-2">
         <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Live Detection</p>
         </div>
         <div className="flex items-center gap-2">
            <Search className="h-3 w-3 text-primary" />
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Vision v5.3</p>
         </div>
      </div>
    </div>
  );
}
