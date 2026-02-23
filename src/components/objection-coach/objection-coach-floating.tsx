'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/card'; // We'll use a custom Dialog-like wrapper for the floating behavior
import { Button } from '@/components/ui/button';
import { BrainCircuit, X, MessageSquare, Sparkles } from 'lucide-react';
import { ObjectionCoachContent } from './objection-coach-content';

/**
 * Floating Coach Panel.
 * Shortcut: Shift + C
 */
export function ObjectionCoachFloating() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toUpperCase() === 'C') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full bg-primary text-white shadow-2xl hover:scale-110 active:scale-95 transition-transform z-50 group hidden md:flex"
      >
        <BrainCircuit className="h-6 w-6 group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-2 -right-2 bg-accent text-primary text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm border border-white">SHIFT+C</span>
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <header className="bg-primary text-white p-6 shrink-0 relative">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Sparkles className="h-20 w-20 text-accent" />
          </div>
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent rounded-xl text-primary shadow-lg">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black font-headline tracking-tighter">Tactical Coach</h2>
                <p className="text-[10px] font-bold text-primary-foreground/60 uppercase tracking-widest">Monica Executive Intelligence</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10 rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <ObjectionCoachContent />
        </div>

        <footer className="p-4 bg-slate-50 border-t text-center shrink-0">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Press ESC or click X to close</p>
        </footer>
      </div>
    </div>
  );
}
