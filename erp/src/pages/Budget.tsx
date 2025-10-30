import { useState, useEffect } from "react";
import { Plus, Download, TrendingUp, TrendingDown, DollarSign, FileText, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TransactionModal } from "@/components/modals/TransactionModal";
import { budget } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/useRBAC";

export default function Budget() {
  const { hasAnyPermission, hasPermission } = useRBAC();
  
  // Permission checks
  const canViewBudget = hasAnyPermission(['finances.read.all', 'finances.read.regional']);
  const canManageBudget = hasPermission('finances.manage');
  
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("current_year");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [overview, setOverview] = useState<any>(null);
  const [projectBudgets, setProjectBudgets] = useState<any[]>([]);
  const [schemeBudgets, setSchemeBudgets] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  // Access denied check
  if (!canViewBudget) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don't have permission to view budget information.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadBudgetData();
  }, []);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        overviewRes,
        projectsRes,
        schemesRes,
        transactionsRes,
        summaryRes,
        categoryRes
      ] = await Promise.all([
        budget.getOverview(),
        budget.getProjects(),
        budget.getSchemes(),
        budget.getTransactions(10),
        budget.getMonthlySummary(),
        budget.getByCategory()
      ]);

      if (overviewRes.success) setOverview(overviewRes.data.overview);
      if (projectsRes.success) setProjectBudgets(projectsRes.data.projects);
      if (schemesRes.success) setSchemeBudgets(schemesRes.data.schemes);
      if (transactionsRes.success) setRecentTransactions(transactionsRes.data.transactions);
      if (summaryRes.success) setMonthlySummary(summaryRes.data.summary);
      if (categoryRes.success) setCategoryData(categoryRes.data.categories);

    } catch (err: any) {
      setError(err.message || 'Failed to load budget data');
      toast({
        title: "Error",
        description: "Failed to load budget data",
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
          <p className="text-muted-foreground">Loading budget data...</p>
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

  const totalIncome = overview?.totalBudget || 0;
  const totalSpent = overview?.totalSpent || 0;
  const totalBalance = overview?.availableBalance || 0;
  const totalAllocated = overview?.totalAllocated || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Budget Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage financial resources across projects and schemes
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">This Month</SelectItem>
              <SelectItem value="current_quarter">This Quarter</SelectItem>
              <SelectItem value="current_year">This Year</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button onClick={() => setShowTransactionModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Budget"
          value={formatCurrency(totalIncome)}
          icon={TrendingUp}
          trend={{ value: overview?.utilizationRate || 0, isPositive: (overview?.utilizationRate || 0) < 80 }}
        />
        <StatsCard
          title="Total Spent"
          value={formatCurrency(totalSpent)}
          icon={TrendingDown}
        />
        <StatsCard
          title="Available Balance"
          value={formatCurrency(totalBalance)}
          icon={DollarSign}
          trend={{ value: totalBalance > 0 ? 100 : 0, isPositive: totalBalance > 0 }}
        />
        <StatsCard
          title="Budget Allocated"
          value={formatCurrency(totalAllocated)}
          icon={FileText}
        />
      </div>

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Project Budget</TabsTrigger>
          <TabsTrigger value="schemes">Scheme Budget</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Budget Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectBudgets.map((project) => (
                  <div key={project.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">{project.code} • {project.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(project.spent)} / {formatCurrency(project.allocated)}</p>
                        <p className="text-sm text-muted-foreground">{project.utilizationRate.toFixed(1)}% utilized</p>
                      </div>
                    </div>
                    <Progress value={project.utilizationRate} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schemes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheme Budget Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schemeBudgets.map((scheme) => (
                  <div key={scheme.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{scheme.name}</h4>
                        <p className="text-sm text-muted-foreground">{scheme.code} • {scheme.project?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(scheme.spent)} / {formatCurrency(scheme.allocated)}</p>
                        <p className="text-sm text-muted-foreground">{scheme.utilizationRate.toFixed(1)}% utilized</p>
                      </div>
                    </div>
                    <Progress value={scheme.utilizationRate} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()} • {transaction.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                      <p className="text-sm text-muted-foreground">{transaction.projectName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryData.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium capitalize">{category.category.replace('_', ' ')}</h4>
                        <p className="text-sm text-muted-foreground">{category.projectCount} projects</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(category.totalSpent)} / {formatCurrency(category.totalBudget)}</p>
                        <p className="text-sm text-muted-foreground">{category.utilizationRate.toFixed(1)}% utilized</p>
                      </div>
                    </div>
                    <Progress value={category.utilizationRate} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TransactionModal
        open={showTransactionModal}
        onOpenChange={setShowTransactionModal}
        mode="create"
      />
    </div>
  );
}