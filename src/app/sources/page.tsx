"use client";

import React, { useState, useCallback } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  UploadCloud,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
} from "lucide-react";
import { useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { importVulcan7CSV, importArchAgentCSV, importRedXCSV } from "@/app/actions/import-leads";
import Link from "next/link";
import Papa from "papaparse";

type Dialer = "vulcan7" | "archagent" | "redx";
type ImportStatus = "idle" | "reading" | "deduping" | "scoring" | "writing" | "done" | "error";

interface DialerCard {
  id: Dialer;
  name: string;
  color: string;
  instructions: { title: string; steps: string[] };
}

const DIALERS: DialerCard[] = [
  {
    id: "vulcan7",
    name: "Vulcan7",
    color: "bg-blue-600",
    instructions: {
      title: "Export from Vulcan7",
      steps: [
        "Log in to Vulcan7",
        "Go to Settings → Export",
        "Click 'Call List'",
        "Choose CSV format",
        "Click Download",
      ],
    },
  },
  {
    id: "archagent",
    name: "ArchAgent",
    color: "bg-orange-600",
    instructions: {
      title: "Export from ArchAgent",
      steps: [
        "Log in to ArchAgent",
        "Go to Reports → Export Leads",
        "Select your date range",
        "Click 'Export CSV'",
        "Save the file",
      ],
    },
  },
  {
    id: "redx",
    name: "RedX",
    color: "bg-red-600",
    instructions: {
      title: "Export from RedX",
      steps: [
        "Log in to RedX",
        "Go to Dashboard → My Leads",
        "Click Export",
        "Choose CSV format",
        "Download the file",
      ],
    },
  },
];

const STATUS_MESSAGES: Record<ImportStatus, string> = {
  idle: "",
  reading: "Reading your file...",
  deduping: "Checking for duplicates...",
  scoring: "Scoring leads...",
  writing: "Saving to your pipeline...",
  done: "Done!",
  error: "Something went wrong.",
};

function DialerImportCard({ dialer, userId, onSuccess }: {
  dialer: DialerCard;
  userId: string;
  onSuccess: (source: string, result: { imported: number; skipped: number; duplicates: number }) => void;
}) {
  const { toast } = useToast();
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ imported: number; skipped: number; duplicates: number } | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [pendingFile, setPendingFile] = useState<{ text: string; name: string } | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setStatus("reading");
    setProgress(20);
    setResult(null);
    setPreview(null);

    try {
      const text = await file.text();
      const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
      if (parsed.data.length < 2) {
        toast({ variant: "destructive", title: "File looks empty", description: "Make sure you exported data from your dialer." });
        setStatus("idle");
        return;
      }

      const headers = parsed.data[0] as string[];
      const rows = (parsed.data as string[][]).slice(1, 6);

      setPreview({ headers, rows });
      setPendingFile({ text, name: file.name });
      setStatus("idle");
      setProgress(0);
    } catch {
      toast({ variant: "destructive", title: "Couldn't read file", description: "Make sure it's a CSV file from your dialer." });
      setStatus("idle");
    }
  }, [toast]);

  const handleImport = async () => {
    if (!pendingFile) return;
    setStatus("deduping");
    setProgress(30);

    try {
      setProgress(60);
      setStatus("scoring");

      let res;
      if (dialer.id === "vulcan7") res = await importVulcan7CSV(userId, pendingFile.text);
      else if (dialer.id === "archagent") res = await importArchAgentCSV(userId, pendingFile.text);
      else res = await importRedXCSV(userId, pendingFile.text);

      setProgress(100);
      setStatus("done");
      setResult(res);
      setPendingFile(null);
      setPreview(null);
      onSuccess(dialer.id, res);
    } catch {
      setStatus("error");
      toast({ variant: "destructive", title: "Import failed", description: "Check your file and try again." });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <Card className="border-none shadow-lg bg-white overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`${dialer.color} h-10 w-10 rounded-xl flex items-center justify-center text-white font-black text-xs`}>
              {dialer.name[0]}
            </div>
            <CardTitle className="text-lg">{dialer.name}</CardTitle>
          </div>
          {result && (
            <Badge className="bg-green-500 text-white gap-1">
              <CheckCircle2 className="h-3 w-3" /> Imported
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        {!preview && status !== "done" && (
          <div
            className="relative border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
          >
            {status === "reading" ? (
              <div className="space-y-3">
                <Loader2 className="h-10 w-10 text-primary mx-auto animate-spin" />
                <p className="text-sm text-slate-500">Reading file...</p>
              </div>
            ) : (
              <>
                <UploadCloud className="h-10 w-10 text-slate-300 group-hover:text-primary mx-auto mb-3 transition-colors" />
                <p className="font-bold text-slate-700">Drag your {dialer.name} CSV here</p>
                <p className="text-sm text-slate-400 mt-1">or click to browse files</p>
                <input
                  type="file"
                  accept=".csv"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                    e.target.value = "";
                  }}
                />
              </>
            )}
          </div>
        )}

        {/* Preview table */}
        {preview && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Eye className="h-4 w-4 text-primary" />
              Preview — first 5 rows
            </div>
            <div className="overflow-x-auto border rounded-xl">
              <table className="text-xs w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {preview.headers.slice(0, 6).map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left font-bold text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      {row.slice(0, 6).map((cell, j) => (
                        <td key={j} className="px-3 py-2 text-slate-700 whitespace-nowrap max-w-[120px] truncate">{cell as string}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-11"
                onClick={() => { setPreview(null); setPendingFile(null); }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white font-bold gap-2"
                onClick={handleImport}
              >
                Looks good, Import All <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Progress */}
        {(status === "deduping" || status === "scoring" || status === "writing") && (
          <div className="space-y-3">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-center text-slate-500">{STATUS_MESSAGES[status]}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <p className="font-bold text-green-800 text-base">
              🎉 {result.imported} new leads added to your pipeline!
            </p>
            <p className="text-sm text-green-700 mt-1">
              {result.duplicates} duplicates skipped · {result.skipped} DNC removed
            </p>
            <Link href="/contacts">
              <Button variant="link" className="text-primary font-bold p-0 h-auto mt-2 gap-1">
                See My Leads <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="p-4 bg-red-50 rounded-xl border border-red-200 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-800">Import failed</p>
              <p className="text-sm text-red-700">Make sure the file is a CSV exported from {dialer.name}.</p>
            </div>
          </div>
        )}

        {/* Export instructions */}
        <button
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary transition-colors w-full pt-1"
          onClick={() => setShowInstructions(!showInstructions)}
        >
          {showInstructions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          How do I export from {dialer.name}?
        </button>
        {showInstructions && (
          <div className="text-xs text-slate-600 bg-slate-50 rounded-xl p-4 border space-y-2">
            <p className="font-bold text-slate-800">{dialer.instructions.title}:</p>
            <ol className="list-decimal ml-4 space-y-1">
              {dialer.instructions.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SourcesPage() {
  const { user } = useUser();
  const [totalImported, setTotalImported] = useState(0);

  const handleSuccess = (_source: string, result: { imported: number; skipped: number; duplicates: number }) => {
    setTotalImported(prev => prev + result.imported);
  };

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#F9FAFB]">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <div>
              <h1 className="text-xl font-bold font-headline text-primary">Import Leads</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Drop in your CSV from Vulcan7, ArchAgent, or RedX</p>
            </div>
            {totalImported > 0 && (
              <div className="ml-auto">
                <Link href="/contacts">
                  <Button className="bg-primary text-white font-bold gap-2 h-9">
                    See {totalImported} New Leads <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </header>

          <main className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
              <p className="text-sm text-primary font-medium">
                <span className="font-bold">How it works:</span> Export a CSV from your dialer, drag it into the right box below.
                We'll check for duplicates, skip DNC numbers, score each lead, and add them to your pipeline automatically.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {DIALERS.map(dialer => (
                <DialerImportCard
                  key={dialer.id}
                  dialer={dialer}
                  userId={user.uid}
                  onSuccess={handleSuccess}
                />
              ))}
            </div>

            {totalImported === 0 && (
              <div className="text-center py-8 text-slate-400">
                <UploadCloud className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">
                  Your imported leads will appear in{" "}
                  <Link href="/contacts" className="text-primary underline">My Leads</Link>{" "}
                  after import.
                </p>
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
