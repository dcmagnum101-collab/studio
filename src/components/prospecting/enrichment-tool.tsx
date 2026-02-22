'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Link as LinkIcon, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  ArrowRight
} from 'lucide-react';
import { runProspectingJob } from '@/services/prospecting-service';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export function EnrichmentTool() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const jobsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'prospecting_jobs'),
      orderBy('created_at', 'desc'),
      limit(5)
    );
  }, [user, firestore]);

  const { data: recentJobs } = useCollection(jobsQuery);

  const handleEnrich = async () => {
    if (!user || !url) return;
    setSubmitting(true);
    try {
      await runProspectingJob(user.uid, url);
      toast({ title: 'Job Started', description: 'Monica is extracting intelligence from the URL.' });
      setUrl('');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Enrichment Failed', description: 'Could not start prospecting job.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-none shadow-md bg-white">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary text-white rounded-lg">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>URL Enrichment</CardTitle>
            <CardDescription>Paste a social profile or property URL to extract lead data.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="https://facebook.com/posts/..." 
              className="pl-10"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={submitting}
            />
          </div>
          <Button onClick={handleEnrich} disabled={submitting || !url} className="gap-2">
            {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Enrich
          </Button>
        </div>

        {recentJobs && recentJobs.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recent Enrichment Jobs</p>
            <div className="divide-y divide-slate-100">
              {recentJobs.map((job) => (
                <div key={job.id} className="py-3 flex items-center justify-between group">
                  <div className="flex items-center gap-3 min-w-0">
                    {job.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : job.status === 'processing' ? (
                      <RefreshCw className="h-4 w-4 text-primary animate-spin" />
                    ) : job.status === 'failed' ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-slate-200" />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium truncate text-slate-600">{job.url}</span>
                      <span className="text-[10px] text-muted-foreground capitalize">{job.status}</span>
                    </div>
                  </div>
                  {job.result_contact_id && (
                    <Link href={`/contacts/${job.result_contact_id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="h-4 w-4 text-primary" />
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}