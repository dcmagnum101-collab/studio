"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, Mail, Users, Calendar, Target } from "lucide-react";
import { useUser, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { DEFAULT_GOALS, type Goals } from "@/lib/goals-constants";
import { collection, query, where, collectionGroup } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { startOfWeek, format } from "date-fns";

export function GoalScorecard() {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const today = new Date().toISOString().split('T')[0];
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const goalsRef = useMemoFirebase(() => user ? `users/${user.uid}/settings/goals` : null, [user]);
  const { data: goalsData, isLoading: goalsLoading } = useDoc(goalsRef);
  const goals = (goalsData as Goals) || DEFAULT_GOALS;

  const callsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collectionGroup(firestore, "activityLogs"),
      where("ownerId", "==", user.uid),
      where("type", "==", "call"),
      where("date", ">=", today)
    );
  }, [user, firestore, today]);

  const emailsRef = useMemoFirebase(() => user ? `users/${user.uid}/email_quota/${today}` : null, [user, today]);
  const contactsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, "users", user.uid, "contacts"),
      where("created_at", ">=", weekStart)
    );
  }, [user, firestore, weekStart]);

  const apptsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, "users", user.uid, "appointments"),
      where("date", ">=", weekStart)
    );
  }, [user, firestore, weekStart]);

  const { data: calls, isLoading: callsLoading } = useCollection(callsQuery);
  const { data: emailsQuota, isLoading: emailsLoading } = useDoc(emailsRef);
  const { data: weekContacts, isLoading: contactsLoading } = useCollection(contactsQuery);
  const { data: weekAppts, isLoading: apptsLoading } = useCollection(apptsQuery);

  const isLoading = goalsLoading || callsLoading || emailsLoading || contactsLoading || apptsLoading;

  const stats = useMemo(() => [
    { label: "Calls Today", value: (calls ?? []).length, target: goals.callsPerDay, icon: Phone, color: "bg-blue-500" },
    { label: "Emails Today", value: (emailsQuota as any)?.count ?? 0, target: goals.emailsPerDay, icon: Mail, color: "bg-green-500" },
    { label: "Contacts Week", value: (weekContacts ?? []).length, target: goals.contactsPerWeek, icon: Users, color: "bg-purple-500" },
    { label: "Appts Week", value: (weekAppts ?? []).length, target: goals.appointmentsPerWeek, icon: Calendar, color: "bg-orange-500" },
  ], [calls, emailsQuota, weekContacts, weekAppts, goals]);

  if (!user) return null;

  return (
    <Card className="border-none shadow-md bg-white overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
          <Target className="h-4 w-4 text-accent" />
          Execution Scorecard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : (
          stats.map((s, i) => {
            const percent = Math.min(100, s.target > 0 ? (s.value / s.target) * 100 : 0);
            return (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <s.icon className="h-3 w-3 text-slate-400" />
                    <span className="font-bold text-slate-700">{s.label}</span>
                  </div>
                  <span className="font-black text-primary">{s.value} / {s.target}</span>
                </div>
                <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${s.color}`} style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
