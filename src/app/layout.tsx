import type {Metadata} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import { FEATURES } from '@/lib/feature-flags';
import { AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Monica AI Hub | Intelligent Seller Outreach',
  description: 'AI-powered lead prioritization and outreach management platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        {/* reCAPTCHA Enterprise Script for App Check and custom actions */}
        <script src="https://www.google.com/recaptcha/enterprise.js?render=6LeIinQsAAAAAIyZ-LJ5fhXSwdGYyasb9EcqR4q_" async defer></script>
      </head>
      <body className="font-body antialiased selection:bg-accent/20 selection:text-accent">
        <FirebaseClientProvider>
          {/* Global AI Feature Warning */}
          {!FEATURES.ai && (
            <div className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest py-2 px-4 text-center sticky top-0 z-[100] flex items-center justify-center gap-2 shadow-md">
              <AlertTriangle className="h-3 w-3" />
              AI features disabled — add your Grok API key in Settings
            </div>
          )}
          
          <NotificationListener />
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}

import { useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

/**
 * Invisible listener for inbound messages to trigger browser notifications.
 */
function NotificationListener() {
  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    if (!user || !firestore || typeof window === 'undefined') return;

    // Listen for new inbound messages across all contacts
    const q = query(
      collectionGroup(firestore, 'sms_thread'),
      where('direction', '==', 'inbound'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const msg = change.doc.data();
          // Avoid notifying for historic data on first load
          const isRecent = (new Date().getTime() - new Date(msg.timestamp).getTime()) < 10000;
          
          if (isRecent && Notification.permission === 'granted') {
            new Notification(`New Text from ${msg.from}`, {
              body: msg.body,
              icon: '/favicon.ico'
            });
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user, firestore]);

  return null;
}