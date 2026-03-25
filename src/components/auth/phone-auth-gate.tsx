
'use client';

import { useState, useEffect } from 'react';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult 
} from 'firebase/auth';
import { ShieldCheck, Smartphone, KeyRound, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export function PhoneAuthGate() {
  const { toast } = useToast();
  const auth = getAuth();
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
  }, [auth]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10) {
      toast({ variant: 'destructive', title: 'Invalid Phone', description: 'Please enter a valid mobile number.' });
      return;
    }

    setIsLoading(true);
    try {
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
      setStep('otp');
      toast({ title: 'OTP Sent', description: `A verification code has been sent to ${phoneNumber}` });
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to send OTP. Please try again.' });
      if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({ variant: 'destructive', title: 'Invalid OTP', description: 'Please enter the 6-digit code.' });
      return;
    }

    setIsLoading(true);
    try {
      if (confirmationResult) {
        await confirmationResult.confirm(otp);
        toast({ title: 'Session Started', description: 'Welcome to Krishna\'s SUPER 9+' });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Verification Failed', description: 'Invalid OTP code. Please check and try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-50 p-6">
      <div id="recaptcha-container"></div>
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-10 md:p-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
        <div className="mx-auto w-20 h-20 bg-secondary/5 rounded-[32px] flex items-center justify-center">
          <ShieldCheck className="h-10 w-10 text-secondary" />
        </div>
        
        <div className="space-y-2">
          <p className="text-primary font-bold text-[10px] uppercase tracking-[0.3em]">Authorized Entry Only</p>
          <h1 className="text-4xl font-black tracking-tighter text-secondary leading-none uppercase">KRISHNA'S</h1>
          <h2 className="text-2xl font-black tracking-tighter text-primary leading-none uppercase">SUPER 9+</h2>
          <p className="text-slate-400 font-medium text-xs mt-4">Security Terminal v3.0</p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleSendOTP} className="space-y-6 text-left">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Staff Mobile Number</Label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                <Input 
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 00000 00000"
                  className="h-14 pl-12 bg-slate-50 border-none rounded-2xl font-bold text-lg focus-visible:ring-primary/20"
                  required
                />
              </div>
            </div>
            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full h-16 text-xs font-black rounded-2xl shadow-xl transition-all active:scale-95 bg-secondary hover:bg-secondary/95 text-white uppercase tracking-widest gap-2"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>SEND OTP <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6 text-left">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Verification Code</Label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                <Input 
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="0 0 0 0 0 0"
                  className="h-16 pl-12 bg-slate-50 border-none rounded-2xl font-black text-2xl tracking-[0.5em] text-center focus-visible:ring-primary/20"
                  required
                />
              </div>
              <p className="text-[10px] text-center font-bold text-slate-400">Sent to {phoneNumber}</p>
            </div>
            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full h-16 text-xs font-black rounded-2xl shadow-xl transition-all active:scale-95 bg-primary hover:bg-primary/95 text-white uppercase tracking-widest gap-2"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>START SESSION <ShieldCheck className="h-4 w-4" /></>}
            </Button>
            <button 
              type="button" 
              onClick={() => setStep('phone')}
              className="w-full text-[10px] font-bold uppercase text-slate-400 hover:text-secondary transition-colors"
            >
              Change Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}
