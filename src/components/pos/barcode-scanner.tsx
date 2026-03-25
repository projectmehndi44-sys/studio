
'use client';

import { useEffect, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { CameraOff } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  isOpen: boolean;
}

export function BarcodeScanner({ onScanSuccess, isOpen }: BarcodeScannerProps) {
  const { toast } = useToast();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Check for camera permission first
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => {
        setHasCameraPermission(true);
        
        // Initialize the scanner
        const scanner = new Html5QrcodeScanner(
          "barcode-reader", 
          { 
            fps: 15, 
            qrbox: { width: 250, height: 180 },
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
            onScanSuccess(decodedText);
            // Optionally clear the scanner after success
            scanner.clear().catch(err => console.error("Scanner clear error", err));
          },
          (errorMessage) => {
            // Silence noise in console during frame capture
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
          description: 'Please enable camera permissions in your browser settings to use the scanner.',
        });
      });
  }, [isOpen, onScanSuccess, toast]);

  return (
    <div className="space-y-6">
      <div 
        id="barcode-reader" 
        className="w-full aspect-square rounded-[32px] overflow-hidden border-4 border-slate-100 bg-slate-50"
      />
      
      {hasCameraPermission === false && (
        <Alert variant="destructive" className="rounded-2xl border-none shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <CameraOff className="h-5 w-5" />
          <AlertTitle className="font-black uppercase tracking-tight">Lens Unavailable</AlertTitle>
          <AlertDescription className="text-xs font-bold opacity-80">
            Scanning requires camera access. Please check your browser's security settings.
          </AlertDescription>
        </Alert>
      )}

      {hasCameraPermission === null && isOpen && (
        <div className="text-center p-8 space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Initializing Optical Input...</p>
        </div>
      )}
    </div>
  );
}
