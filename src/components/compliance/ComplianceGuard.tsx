'use client';

import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertTriangle, XCircle, RefreshCw, Sparkles } from 'lucide-react';
import { checkCompliance, type ComplianceResult } from '@/app/actions/compliance-check';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

interface ComplianceGuardProps {
  content: string;
  type: 'email' | 'sms' | 'script';
  contactName: string;
  onApproved: (finalContent: string) => void;
  children: React.ReactNode;
}

export function ComplianceGuard({
  content,
  type,
  contactName,
  onApproved,
  children,
}: ComplianceGuardProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [open, setOpen] = useState(false);

  const handleTrigger = async () => {
    if (!user || !content) return;

    setChecking(true);
    try {
      const audit = await checkCompliance({
        content,
        type,
        contactName,
        userId: user.uid,
      });

      setResult(audit);

      if (audit.risk_level === 'high' || audit.risk_level === 'medium') {
        setOpen(true);
      } else {
        // Clear or low risk - proceed immediately
        toast({
          title: 'Compliance Verified',
          description: 'Content passed Fair Housing scan.',
          className: 'bg-green-50 border-green-200 text-green-800',
        });
        onApproved(content);
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Audit Failed',
        description: 'Could not run compliance check. Please review manually.',
      });
    } finally {
      setChecking(false);
    }
  };

  const handleUseCorrected = () => {
    if (result) {
      onApproved(result.corrected_content);
      setOpen(false);
      setResult(null);
    }
  };

  const handleProceedAnyway = () => {
    onApproved(content);
    setOpen(false);
    setResult(null);
  };

  return (
    <>
      <div onClick={(e) => {
        e.stopPropagation();
        handleTrigger();
      }} className="w-full">
        {React.cloneElement(children as React.ReactElement, {
          disabled: checking || (children as React.ReactElement).props.disabled,
          children: (
            <>
              {checking ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
              {(children as React.ReactElement).props.children}
            </>
          ),
        })}
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${result?.risk_level === 'high' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                {result?.risk_level === 'high' ? <XCircle className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
              </div>
              <div>
                <AlertDialogTitle className="text-xl font-black">
                  {result?.risk_level === 'high' ? 'Compliance Blocked' : 'Compliance Warning'}
                </AlertDialogTitle>
                <Badge variant={result?.risk_level === 'high' ? 'destructive' : 'secondary'} className="uppercase">
                  {result?.risk_level} RISK DETECTED
                </Badge>
              </div>
            </div>
            <AlertDialogDescription className="text-slate-600 mt-4">
              Monica's AI Compliance Auditor has flagged issues in your {type}.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Violations Detected</p>
              <ul className="space-y-2">
                {result?.flags.map((flag, i) => (
                  <li key={i} className="text-xs font-bold text-red-700 flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1 shrink-0" />
                    {flag}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suggested Correction</p>
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 text-sm italic leading-relaxed text-primary/80">
                "{result?.corrected_content}"
              </div>
            </div>
          </div>

          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setResult(null)}>Edit Manually</AlertDialogCancel>
            
            {result?.risk_level === 'medium' && (
              <Button variant="ghost" onClick={handleProceedAnyway} className="text-xs font-bold">
                I Understand, Send Anyway
              </Button>
            )}

            <Button onClick={handleUseCorrected} className="gap-2 bg-accent hover:bg-accent/90 text-primary font-black">
              <Sparkles className="h-4 w-4" /> Use Corrected Version
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
