"use client"

import React, { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MailX, CheckCircle2, Sparkles } from "lucide-react"
import { useUser, useFirestore, updateDocumentNonBlocking } from "@/firebase"
import { doc } from "firebase/firestore"

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const firestore = useFirestore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const contactId = searchParams.get('id');

  useEffect(() => {
    if (!contactId || !user || !firestore) {
      if (!contactId) setStatus('error');
      return;
    }

    const contactRef = doc(firestore, 'users', user.uid, 'contacts', contactId);
    
    // Non-blocking update to respect UI speed
    updateDocumentNonBlocking(contactRef, {
      email_unsubscribed: true,
      email_unsubscribed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    setStatus('success');
  }, [contactId, user, firestore]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-primary text-white text-center pb-8 pt-10">
          <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
            {status === 'success' ? <CheckCircle2 className="h-8 w-8 text-accent" /> : <MailX className="h-8 w-8 text-white" />}
          </div>
          <CardTitle className="text-2xl font-black font-headline">Unsubscribe</CardTitle>
          <CardDescription className="text-primary-foreground/70">Monica Selvaggio AI Outreach</CardDescription>
        </CardHeader>
        <CardContent className="p-8 text-center space-y-6">
          {status === 'loading' && <p className="text-slate-600 italic animate-pulse">Processing your request...</p>}
          
          {status === 'success' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-primary">You've been unsubscribed.</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                We've updated our records. You will no longer receive automated marketing or outreach emails from Monica Selvaggio regarding your property.
              </p>
              <div className="pt-4">
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Sparkles className="h-3 w-3 text-accent" />
                  Selvaggio Global Real Estate
                </div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-red-600">Something went wrong.</h3>
              <p className="text-sm text-slate-500">
                We couldn't identify your record automatically. Please reply to the email you received with "Unsubscribe" and Monica will handle it manually.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="p-20 text-center italic">Loading...</div>}>
      <UnsubscribeContent />
    </Suspense>
  )
}
