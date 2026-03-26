'use client';

import { useEffect, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { CameraOff, CheckCircle } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  isOpen: boolean;
}

export function BarcodeScanner({ onScanSuccess, isOpen }: BarcodeScannerProps) {
  const { toast } = useToast();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => {
        setHasCameraPermission(true);
        
        const scanner = new Html5QrcodeScanner(
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

        scanner.render(
          (decodedText) => {
            // Visual feedback for Continuous Mode
            setLastScanned(decodedText);
            onScanSuccess(decodedText);
            
            // Short reset to allow next scan
            setTimeout(() => setLastScanned(null), 1000);
          },
          (errorMessage) => {
            // Noise reduction
          }
        );

        return () => {
          scanner.clear().catch(err => console.error("Scanner clear cleanup error", err));
        };
      })
      .catch((error) => {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Enable permissions for Continuous Scanning.',
        });
      });
  }, [isOpen, onScanSuccess, toast]);

  return (
    <div className="space-y-4 relative">
      <div 
        id="barcode-reader" 
        className="w-full aspect-square rounded-[32px] overflow-hidden border-4 border-slate-100 bg-slate-900 relative"
      >
        {lastScanned && (
          <div className="absolute inset-0 z-20 bg-emerald-500/80 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200">
             <CheckCircle className="h-20 w-20 text-white mb-4" />
             <p className="text-white font-black text-xl uppercase tracking-widest">Added to Bill</p>
             <p className="text-white/80 font-bold text-sm mt-1">{lastScanned}</p>
          </div>
        )}
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

      <div className="text-center py-2">
         <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] animate-pulse">
            Keep items in view for continuous scanning
         </p>
      </div>
    </div>
  );
}
