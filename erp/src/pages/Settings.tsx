import { Save, Building2, Globe, Shield, Bell, Palette, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRBAC } from "@/hooks/useRBAC";

export default function Settings() {
  const { hasPermission } = useRBAC();
  
  // Permission checks
  const canViewSettings = hasPermission('settings.read');
  const canUpdateSettings = hasPermission('settings.update');
  
  if (!canViewSettings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <SettingsIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don't have permission to view settings.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage organization settings and preferences</p>
        </div>
        {canUpdateSettings && (
          <Button className="bg-gradient-primary shadow-glow">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        )}
      </div>

      <Tabs defaultValue="organization" className="space-y-4">
        <TabsList>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input defaultValue="Baithuzzakath Kerala" />
                </div>
                <div className="space-y-2">
                  <Label>Registration Number</Label>
                  <Input defaultValue="NGO-KL-2015-12345" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea defaultValue="Near Juma Masjid, Thiruvananthapuram, Kerala - 695001" rows={3} />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input type="email" defaultValue="info@baithuzzakath.org" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input type="tel" defaultValue="+91 471 1234567" />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input type="url" defaultValue="https://baithuzzakath.org" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: "app-submit", label: "New Application Submitted", desc: "Get notified when applicants submit new applications" },
                { id: "app-approve", label: "Application Approved", desc: "Receive alerts when applications are approved" },
                { id: "donor-reg", label: "New Donor Registration", desc: "Alert when new donors register" },
                { id: "budget-alert", label: "Budget Threshold Alerts", desc: "Notify when project budgets exceed thresholds" },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">Session Timeout</p>
                  <p className="text-sm text-muted-foreground">Auto logout after inactivity</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="space-y-2">
                <Label>Password Requirements</Label>
                <p className="text-sm text-muted-foreground">Minimum 8 characters, uppercase, lowercase, number, special character</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Customize the look and feel of your dashboard</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border rounded-lg p-4 cursor-pointer hover:border-primary">
                  <div className="h-24 bg-gradient-primary rounded mb-2"></div>
                  <p className="font-medium">Green Theme (Active)</p>
                </div>
                <div className="border rounded-lg p-4 cursor-pointer hover:border-primary opacity-50">
                  <div className="h-24 bg-gradient-to-br from-blue-600 to-blue-400 rounded mb-2"></div>
                  <p className="font-medium">Blue Theme</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
