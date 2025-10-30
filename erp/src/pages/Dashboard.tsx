import { useState, useEffect } from "react";
import { Users, FolderKanban, FileCheck, DollarSign, TrendingUp, TrendingDown, Loader2, AlertCircle, LayoutDashboard } from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { dashboard } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/useRBAC";

const statusColors = {
  pending: "bg-warning/10 text-warning border-warning/20",
  approved: "bg-success/10 text-success border-success/20",
  review: "bg-info/10 text-info border-info/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function Dashboard() {
  const { user } = useRBAC();
  const [overview, setOverview] = useState<any>(null);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dashboard is accessible to all authenticated users
  // No specific permission check needed as AuthGuard handles authentication

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, applicationsRes] = await Promise.all([
        dashboard.getOverview(),
        dashboard.getRecentApplications(5)
      ]);

      if (overviewRes.success) setOverview(overviewRes.data.overview);
      if (applicationsRes.success) setRecentApplications(applicationsRes.data.applications);

    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100000).toFixed(1)}L`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's an overview of your NGO operations.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Projects"
          value={overview?.totalProjects?.toString() || "0"}
          icon={FolderKanban}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Total Applications"
          value={overview?.totalApplications?.toString() || "0"}
          icon={FileCheck}
          trend={{ value: overview?.recentActivity?.applications || 0, isPositive: true }}
        />
        <StatsCard
          title="Total Beneficiaries"
          value={overview?.totalBeneficiaries?.toString() || "0"}
          icon={Users}
          trend={{ value: overview?.recentActivity?.beneficiaries || 0, isPositive: true }}
        />
        <StatsCard
          title="Budget Utilization"
          value={formatCurrency(overview?.totalSpent || 0)}
          icon={DollarSign}
          trend={{ value: overview?.totalBudget > 0 ? Math.round((overview.totalSpent / overview.totalBudget) * 100) : 0, isPositive: false }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{app.applicant}</p>
                    <p className="text-sm text-muted-foreground">{app.scheme}</p>
                    <p className="text-xs text-muted-foreground">{app.id} • {app.date}</p>
                  </div>
                  <Badge variant="outline" className={statusColors[app.status as keyof typeof statusColors]}>
                    {app.status}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Applications
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Collection Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Collections</p>
                  <p className="text-2xl font-bold">₹12,45,000</p>
                </div>
                <div className="rounded-full bg-gradient-secondary p-3">
                  <TrendingUp className="h-6 w-6 text-secondary-foreground" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Online Donations</span>
                  <span className="font-medium">₹8,50,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Offline Collections</span>
                  <span className="font-medium">₹3,95,000</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground">Total Expenses</span>
                  <span className="font-medium text-destructive">₹6,20,000</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t pt-2">
                  <span>Available Balance</span>
                  <span className="text-success">₹6,25,000</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Schemes by Project</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { project: "Education Support", schemes: 8, applications: 245 },
              { project: "Healthcare Initiative", schemes: 5, applications: 189 },
              { project: "Housing Program", schemes: 6, applications: 156 },
            ].map((item) => (
              <div
                key={item.project}
                className="rounded-lg border bg-muted/50 p-4 space-y-2 hover:shadow-elegant transition-shadow"
              >
                <h4 className="font-semibold">{item.project}</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Schemes</span>
                  <span className="font-medium">{item.schemes}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Applications</span>
                  <span className="font-medium">{item.applications}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
