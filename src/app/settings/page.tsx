"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Database, Link2, Globe, FileUp, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { toast } = useToast()

  const handleTestConnection = () => {
    toast({
      title: "Connection Successful",
      description: "ArchAgent webhook is active and receiving data."
    })
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">System Settings</h1>
          </header>
          
          <main className="p-8 max-w-4xl mx-auto w-full">
            <Tabs defaultValue="lead-sources">
              <TabsList className="mb-8 w-full justify-start gap-4 h-auto p-0 bg-transparent">
                <TabsTrigger value="general" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2">General</TabsTrigger>
                <TabsTrigger value="lead-sources" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2">Lead Sources</TabsTrigger>
                <TabsTrigger value="notifications" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2">Notifications</TabsTrigger>
                <TabsTrigger value="api" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2">API & Webhooks</TabsTrigger>
              </TabsList>

              <TabsContent value="lead-sources" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Globe className="h-5 w-5 text-blue-700" />
                      </div>
                      <div>
                        <CardTitle>ArchAgent Integration</CardTitle>
                        <CardDescription>Configure lead data sync via webhook.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="webhook">Webhook URL</Label>
                      <div className="flex gap-2">
                        <Input id="webhook" value="https://monica-ai.com/api/webhooks/archagent/a88a2a" readOnly />
                        <Button variant="outline" size="sm" onClick={() => {
                          navigator.clipboard.writeText("https://monica-ai.com/api/webhooks/archagent/a88a2a")
                          toast({ title: "Copied", description: "URL copied to clipboard" })
                        }}>Copy</Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t mt-4">
                      <div className="space-y-0.5">
                        <Label>Auto-Import Leads</Label>
                        <p className="text-xs text-muted-foreground">Automatically trigger ICP scoring on new leads.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Button variant="outline" className="w-full" onClick={handleTestConnection}>Test Connection</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Database className="h-5 w-5 text-orange-700" />
                      </div>
                      <div>
                        <CardTitle>Vulcan7 Integration</CardTitle>
                        <CardDescription>Manage daily lead imports and DNC list sync.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Sync Method</Label>
                          <p className="text-xs text-muted-foreground">Zapier (Real-time) or CSV (Batch)</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Zapier</Badge>
                          <Switch defaultChecked />
                          <Badge variant="outline">CSV</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2 border-t">
                        <div className="space-y-0.5">
                          <Label className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                            DNC List Sync
                          </Label>
                          <p className="text-xs text-muted-foreground">Remove leads on the National Do Not Call registry.</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <FileUp className="h-5 w-5 text-slate-700" />
                      </div>
                      <div>
                        <CardTitle>Bulk Import</CardTitle>
                        <CardDescription>Upload contact lists manually.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center bg-slate-50">
                      <p className="text-sm text-muted-foreground mb-4">Drag and drop your .csv or .xlsx file here</p>
                      <Button size="sm">Choose File</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
