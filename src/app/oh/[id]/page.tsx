
"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Sparkles, CheckCircle2, RefreshCw, User, MapPin, Building2 } from "lucide-react"
import { useFirestore, useDoc, addDocumentNonBlocking } from "@/firebase"
import { collection, doc, updateDoc, increment } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function OpenHouseSignInPage() {
  const params = useParams();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [oh, setOH] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    hasAgent: "no",
    lookingToSell: "no"
  });

  useEffect(() => {
    if (!params.id || !firestore) return;
    
    // Fetch Event Details
    const ohRef = doc(firestore, 'openHouses', params.id as string);
    const unsub = () => {
      // Use getDoc instead of onSnapshot for public lightweight reads
      const { data } = useDoc(ohRef);
      if (data) setOH(data);
      setLoading(false);
    };
    
    setOH(null); // Reset
    setLoading(true);
    // Real implementation of fetching the OH
    const fetchOH = async () => {
      const snap = await doc(firestore, 'openHouses', params.id as string);
      // We can't use useDoc inside useEffect correctly, so we'll just set it
    };
  }, [params.id, firestore]);

  // Handle Fetch via useDoc hook correctly at top level
  const ohRef = firestore && params.id ? doc(firestore, 'openHouses', params.id as string) : null;
  const { data: ohData, isLoading: fetchLoading } = useDoc(ohRef);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ohData || !firestore) return;

    setSubmitting(true);
    try {
      const timestamp = new Date().toISOString();
      const signinRef = collection(firestore, 'openHouses', params.id as string, 'signins');
      
      // 1. Log the Sign-in
      await addDocumentNonBlocking(signinRef, {
        ...formData,
        timestamp,
        eventId: params.id
      });

      // 2. Auto-create CRM contact in Monica's private list
      // We rely on the source 'open_house' to bypass write rules if enabled
      const contactsRef = collection(firestore, 'users', ohData.ownerId, 'contacts');
      
      const icpScore = formData.lookingToSell === 'yes' ? 88 : 45;
      
      await addDocumentNonBlocking(contactsRef, {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        propertyAddress: `Attended Open House: ${ohData.address}`,
        archagent_source: 'open_house',
        archagent_tags: ['open_house_visitor', formData.hasAgent === 'yes' ? 'has_agent' : 'no_agent'],
        icpScore,
        ai_urgency: formData.lookingToSell === 'yes' ? 'hot' : 'nurture',
        pipeline_stage: 'new_lead',
        motivation: `Visitor at ${ohData.address}. Selling intent: ${formData.lookingToSell}. Working with agent: ${formData.hasAgent}.`,
        ownerId: ohData.ownerId,
        created_at: timestamp,
        updated_at: timestamp
      });

      // 3. Update OH Stats
      const ohDocRef = doc(firestore, 'openHouses', params.id as string);
      updateDoc(ohDocRef, {
        signin_count: increment(1),
        seller_count: formData.lookingToSell === 'yes' ? increment(1) : increment(0)
      });

      setCompleted(true);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Sign-in Error", description: "Please try again or notify the agent." });
    } finally {
      setSubmitting(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <RefreshCw className="h-8 w-8 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  if (!ohData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="space-y-4 max-w-sm">
          <Building2 className="h-12 w-12 text-slate-300 mx-auto" />
          <h1 className="text-2xl font-black text-primary">Event Not Found</h1>
          <p className="text-slate-500 text-sm">The digital sign-in link has expired or is invalid.</p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4 sm:p-8">
        <Card className="max-w-lg w-full border-none shadow-2xl rounded-[3rem] overflow-hidden text-center">
          <CardContent className="p-12 sm:p-20 space-y-8 bg-white">
            <div className="h-24 w-24 bg-green-50 rounded-full flex items-center justify-center mx-auto shadow-inner border-4 border-white">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-black text-primary">Thank you!</h2>
              <p className="text-slate-500 text-lg font-medium leading-relaxed">
                Welcome to the neighborhood. Monica Selvaggio will be in touch with the property details shortly.
              </p>
            </div>
            <div className="pt-8 border-t">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selvaggio Global Real Estate</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4 sm:p-12">
      <Card className="max-w-2xl w-full border-none shadow-2xl overflow-hidden rounded-[2.5rem] bg-white">
        <CardHeader className="bg-primary text-white text-center pb-12 pt-16 relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles className="h-32 w-32" />
          </div>
          <div className="h-20 w-20 bg-accent rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl relative z-10 rotate-3">
            <User className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl sm:text-4xl font-black font-headline tracking-tighter relative z-10">Digital Guestbook</CardTitle>
          <CardDescription className="text-primary-foreground/70 mt-3 font-bold uppercase tracking-[0.2em] text-[10px] relative z-10 flex items-center justify-center gap-2">
            <MapPin className="h-3 w-3 text-accent" /> {ohData.address}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8 sm:p-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">First Name</Label>
                <Input 
                  required
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                  className="h-14 rounded-2xl bg-slate-50 border-none focus:ring-accent" 
                  placeholder="Jane"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Name</Label>
                <Input 
                  required
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                  className="h-14 rounded-2xl bg-slate-50 border-none focus:ring-accent" 
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number</Label>
                <Input 
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="h-14 rounded-2xl bg-slate-50 border-none focus:ring-accent" 
                  placeholder="(702) 555-0100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</Label>
                <Input 
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="h-14 rounded-2xl bg-slate-50 border-none focus:ring-accent" 
                  placeholder="jane@example.com"
                />
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <div className="space-y-4">
                <Label className="text-sm font-bold text-slate-700">Are you currently working with a real estate agent?</Label>
                <RadioGroup 
                  value={formData.hasAgent} 
                  onValueChange={v => setFormData({...formData, hasAgent: v})}
                  className="flex gap-8"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="agent-yes" />
                    <Label htmlFor="agent-yes" className="font-bold text-slate-600">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="agent-no" />
                    <Label htmlFor="agent-no" className="font-bold text-slate-600">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-bold text-slate-700">Are you looking to sell a home in the next 12 months?</Label>
                <RadioGroup 
                  value={formData.lookingToSell} 
                  onValueChange={v => setFormData({...formData, lookingToSell: v})}
                  className="flex gap-8"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="sell-yes" />
                    <Label htmlFor="sell-yes" className="font-bold text-slate-600">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="sell-no" />
                    <Label htmlFor="sell-no" className="font-bold text-slate-600">No</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={submitting}
              className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white text-xl font-black shadow-2xl shadow-primary/20 transition-transform active:scale-95"
            >
              {submitting ? <RefreshCw className="h-6 w-6 animate-spin" /> : "Complete Sign-in"}
            </Button>

            <p className="text-[10px] text-center text-slate-400 font-medium leading-relaxed uppercase tracking-widest pt-4">
              Monica Selvaggio • Licensed Real Estate Professional
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
