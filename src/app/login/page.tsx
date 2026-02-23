'use client';

import { useState } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { initializeFirebase } from '@/firebase/init';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const { auth } = initializeFirebase();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // The FirebaseProvider will handle the cookie setting on state change
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Sign in failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-none overflow-hidden rounded-[2rem]">
        <CardHeader className="text-center pb-6 pt-10 bg-primary text-white relative">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Sparkles className="h-24 w-24" />
          </div>
          <div className="flex justify-center mb-4 relative z-10">
            <div className="p-3 bg-accent rounded-2xl shadow-lg">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black font-headline tracking-tighter relative z-10">
            Monica AI Hub
          </CardTitle>
          <CardDescription className="text-primary-foreground/70 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 relative z-10">
            Executive Real Estate Intelligence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-8 pb-10 bg-white">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-slate-900">Agent Authentication</h3>
            <p className="text-sm text-slate-500">Sign in with your Google Workspace account to access deal intelligence.</p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-4 text-center font-medium animate-in fade-in zoom-in-95">
              {error}
            </div>
          )}

          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/10 transition-all active:scale-95 group"
          >
            {loading ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <svg className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </>
            )}
          </Button>

          <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Secured by Google Cloud Platform
            </p>
            <p className="text-[9px] text-center text-slate-400 font-medium leading-relaxed max-w-[240px]">
              Monica Selvaggio · Licensed Nevada Realtor · Selvaggio Global Real Estate
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { RefreshCw } from 'lucide-react';