"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, RefreshCw, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // If user is already authenticated via Google, redirect to dashboard
    if (user && !user.isAnonymous) {
      document.cookie = "monica-session=active; path=/; max-age=86400; samesite=lax";
      router.push("/");
    }
  }, [user, router]);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        // Set a session cookie for the Next.js middleware
        document.cookie = "monica-session=active; path=/; max-age=86400; samesite=lax";
        router.push("/");
      }
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full border-none shadow-2xl overflow-hidden rounded-[2.5rem]">
        <CardHeader className="bg-primary text-white text-center pb-12 pt-16 relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles className="h-32 w-32" />
          </div>
          <div className="h-20 w-20 bg-accent rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl relative z-10 rotate-3 group hover:rotate-0 transition-transform duration-500">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-4xl font-black font-headline tracking-tighter relative z-10">Monica AI Hub</CardTitle>
          <CardDescription className="text-primary-foreground/60 mt-3 font-medium uppercase tracking-[0.2em] text-[10px] relative z-10">
            Executive Real Estate Intelligence
          </CardDescription>
        </CardHeader>
        <CardContent className="p-10 space-y-8 bg-white">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black text-slate-900">Agent Login</h3>
            <p className="text-sm text-slate-500 font-medium">Sign in with your business account to access your portfolio.</p>
          </div>
          
          <Button 
            onClick={handleGoogleSignIn}
            disabled={isLoggingIn}
            className="w-full h-16 rounded-2xl bg-white border-2 border-slate-100 hover:bg-slate-50 hover:border-primary/20 text-slate-700 font-black transition-all flex items-center justify-center gap-4 shadow-sm group"
          >
            {isLoggingIn ? (
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <svg className="h-6 w-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span className="text-lg">Sign in with Google</span>
          </Button>

          <div className="pt-4 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <div className="h-px w-8 bg-slate-100" />
              Secure Gateway
              <div className="h-px w-8 bg-slate-100" />
            </div>
            <div className="flex items-center gap-2 text-primary font-bold text-[10px] bg-primary/5 px-3 py-1.5 rounded-full">
              <ShieldCheck className="h-3.5 w-3.5" />
              Protected by Firebase Auth
            </div>
            <p className="text-[9px] text-center text-slate-400 font-medium leading-relaxed max-w-[240px]">
              By signing in, you agree to the NAR ethical standards and data privacy compliance protocols.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
