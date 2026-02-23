'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  MessageSquare, 
  BrainCircuit, 
  ChevronRight,
  Zap,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { OBJECTION_LIBRARY, type ObjectionResponse } from '@/config/objection-library';
import { getLiveCoaching } from '@/app/actions/objection-coach';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

export function ObjectionCoachContent() {
  const { user } = useUser();
  const { toast } = useToast();
  const [objection, setObjection] = useState('');
  const [leadType, setLeadType] = useState('general');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ObjectionResponse | null>(null);

  const handleCoachMe = async () => {
    if (!objection || !user) return;
    
    // Check library first
    const libraryMatch = [...(OBJECTION_LIBRARY[leadType] || []), ...OBJECTION_LIBRARY.general]
      .find(o => objection.toLowerCase().includes(o.objection.toLowerCase()) || o.objection.toLowerCase().includes(objection.toLowerCase()));

    if (libraryMatch) {
      setResult(libraryMatch);
      return;
    }

    setLoading(true);
    try {
      const aiRes = await getLiveCoaching({
        objection,
        leadType,
        userId: user.uid
      });
      setResult({ objection, ...aiRes });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Coaching Unavailable', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Lead Category</Label>
            <Select value={leadType} onValueChange={setLeadType}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Seller</SelectItem>
                <SelectItem value="expired">Expired Listing</SelectItem>
                <SelectItem value="fsbo">For Sale By Owner</SelectItem>
                <SelectItem value="pre-foreclosure">Pre-Foreclosure</SelectItem>
                <SelectItem value="probate">Probate/Estate</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Quick Library</Label>
            <Select onValueChange={(v) => {
              const item = JSON.parse(v);
              setResult(item);
              setObjection(item.objection);
            }}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200">
                <SelectValue placeholder="Common Objections" />
              </SelectTrigger>
              <SelectContent>
                {[...(OBJECTION_LIBRARY[leadType] || []), ...OBJECTION_LIBRARY.general].map((o, i) => (
                  <SelectItem key={i} value={JSON.stringify(o)}>{o.objection}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">What did they say?</Label>
          <div className="flex gap-2">
            <Input 
              value={objection} 
              onChange={e => setObjection(e.target.value)}
              placeholder="e.g., 'Your commission is too high'" 
              className="h-12 rounded-xl shadow-inner bg-slate-50"
              onKeyDown={e => e.key === 'Enter' && handleCoachMe()}
            />
            <Button 
              onClick={handleCoachMe} 
              disabled={loading || !objection}
              className="h-12 px-6 rounded-xl bg-primary font-black gap-2 shadow-lg"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
              Coach
            </Button>
          </div>
        </div>
      </div>

      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="p-5 bg-primary/5 rounded-[1.5rem] border border-primary/10 space-y-6">
            <div className="space-y-2">
              <Badge variant="outline" className="text-[8px] font-black border-primary/20 text-primary uppercase">1. Empathy Opener</Badge>
              <p className="text-sm font-medium text-slate-700 italic">"{result.empathy}"</p>
            </div>

            <div className="space-y-2">
              <Badge className="text-[8px] font-black bg-primary uppercase">2. Monica's Response</Badge>
              <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-sm leading-relaxed text-slate-900 font-bold">{result.response}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Badge variant="secondary" className="text-[8px] font-black bg-accent text-primary uppercase">3. The Pivot (Redirect)</Badge>
              <p className="text-sm font-black text-primary">"{result.redirect}"</p>
            </div>

            <div className="pt-4 border-t border-primary/10">
              <div className="flex items-center gap-2 text-red-600">
                <ShieldAlert className="h-4 w-4" />
                <span className="text-[9px] font-black uppercase tracking-widest">What to Avoid</span>
              </div>
              <p className="text-xs text-red-700/70 mt-1 font-medium">{result.avoid}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
