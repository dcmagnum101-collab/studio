"use client"

import React, { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, UserPlus, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { calculateAIScore } from "@/lib/lead-types";

function QuickCaptureContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    propertyAddress: "",
    city: "",
    state: "NV",
    zip: "",
    source: "manual",
    leadType: "expired",
    notes: "",
  });

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!user || !firestore) return;
    if (!form.firstName && !form.lastName) {
      toast({ variant: "destructive", title: "Name required", description: "Enter at least a first or last name." });
      return;
    }
    setSaving(true);
    try {
      const name = `${form.firstName} ${form.lastName}`.trim();
      const leadData = {
        firstName: form.firstName,
        lastName: form.lastName,
        name,
        phone: form.phone,
        email: form.email,
        propertyAddress: form.propertyAddress,
        city: form.city,
        state: form.state,
        zip: form.zip,
        archagent_source: form.source,
        archagent_tags: [form.leadType],
        notes: form.notes,
        pipeline_stage: "new_lead",
        ownerId: user.uid,
        icpScore: calculateAIScore({
          status: form.leadType as any,
          phone: form.phone,
          email: form.email,
        } as any),
        nextFollowUpDate: new Date().toISOString(),
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      const contactsRef = collection(firestore, "users", user.uid, "contacts");
      const docRef = await addDoc(contactsRef, leadData);

      toast({ title: "Lead added!", description: `${name} is in your pipeline.` });
      router.push(`/contacts/${docRef.id}`);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save failed", description: "Try again or check your connection." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#F9FAFB]">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">Add a Lead</h1>
          </header>

          <main className="p-4 md:p-8 max-w-2xl mx-auto w-full">
            <Card className="border-none shadow-xl bg-white">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-xl p-3">
                    <UserPlus className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-primary">Quick Add Lead</CardTitle>
                    <p className="text-sm text-slate-500 mt-1">Fill in what you know — you can add more later.</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="e.g. John"
                      value={form.firstName}
                      onChange={e => set("firstName", e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="e.g. Smith"
                      value={form.lastName}
                      onChange={e => set("lastName", e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="(702) 555-1234"
                      value={form.phone}
                      onChange={e => set("phone", e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={form.email}
                      onChange={e => set("email", e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">Property Address</Label>
                  <Input
                    id="address"
                    placeholder="e.g. 1234 Desert Rose Dr"
                    value={form.propertyAddress}
                    onChange={e => set("propertyAddress", e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-1">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Las Vegas"
                      value={form.city}
                      onChange={e => set("city", e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="NV"
                      value={form.state}
                      onChange={e => set("state", e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">Zip</Label>
                    <Input
                      id="zip"
                      placeholder="89101"
                      value={form.zip}
                      onChange={e => set("zip", e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Source + Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lead Source</Label>
                    <Select value={form.source} onValueChange={v => set("source", v)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Entry</SelectItem>
                        <SelectItem value="vulcan7">Vulcan7</SelectItem>
                        <SelectItem value="archagent">ArchAgent</SelectItem>
                        <SelectItem value="redx">RedX</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="open_house">Open House</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Lead Type</Label>
                    <Select value={form.leadType} onValueChange={v => set("leadType", v)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expired">Expired Listing</SelectItem>
                        <SelectItem value="fsbo">FSBO</SelectItem>
                        <SelectItem value="pre-foreclosure">Pre-Foreclosure</SelectItem>
                        <SelectItem value="geo">Geo / Circle</SelectItem>
                        <SelectItem value="past_client">Past Client</SelectItem>
                        <SelectItem value="sphere">Sphere of Influence</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="e.g. Met at open house on Oak Ave. Very motivated — needs to sell before school starts."
                    value={form.notes}
                    onChange={e => set("notes", e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold text-base rounded-xl shadow-lg gap-2"
                >
                  {saving ? "Saving..." : <>Add to My Leads <ArrowRight className="h-5 w-5" /></>}
                </Button>
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default function QuickCapturePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading...</div>}>
      <QuickCaptureContent />
    </Suspense>
  );
}
