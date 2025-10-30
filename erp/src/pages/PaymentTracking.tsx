import { useState } from "react";
import { AlertCircle, Clock, CheckCircle2, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRBAC } from "@/hooks/useRBAC";

const payments = [
  {
    id: "PAY-001",
    beneficiary: "Zainab Khatoon",
    scheme: "Medical Emergency Fund",
    amount: 30000,
    dueDate: "2025-10-15",
    status: "overdue",
    phase: "Second Installment",
  },
  {
    id: "PAY-002",
    beneficiary: "Mohammed Farhan",
    scheme: "Student Scholarship Program",
    amount: 15000,
    dueDate: "2025-10-20",
    status: "due",
    phase: "First Installment",
  },
  {
    id: "PAY-003",
    beneficiary: "Ibrahim Ali",
    scheme: "Home Renovation Assistance",
    amount: 48000,
    dueDate: "2025-11-05",
    status: "upcoming",
    phase: "First Installment",
  },
  {
    id: "PAY-004",
    beneficiary: "Fatima Begum",
    scheme: "Student Scholarship Program",
    amount: 20000,
    dueDate: "2025-11-10",
    status: "upcoming",
    phase: "Second Installment",
  },
  {
    id: "PAY-005",
    beneficiary: "Abdul Kareem",
    scheme: "Medical Emergency Fund",
    amount: 25000,
    dueDate: "2025-10-08",
    status: "overdue",
    phase: "Final Payment",
  },
];

const statusConfig = {
  overdue: { 
    color: "bg-destructive/10 text-destructive border-destructive/20", 
    icon: AlertCircle,
    label: "Overdue" 
  },
  due: { 
    color: "bg-warning/10 text-warning border-warning/20", 
    icon: Clock,
    label: "Due Soon" 
  },
  upcoming: { 
    color: "bg-info/10 text-info border-info/20", 
    icon: CheckCircle2,
    label: "Upcoming" 
  },
};

export default function PaymentTracking() {
  const { hasAnyPermission } = useRBAC();
  
  // Permission check
  const canViewPayments = hasAnyPermission(['finances.read.all', 'finances.read.regional']);
  
  const [activeTab, setActiveTab] = useState("all");

  // Access denied check
  if (!canViewPayments) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don't have permission to view payment tracking.
          </p>
        </div>
      </div>
    );
  }

  const filteredPayments = activeTab === "all" 
    ? payments 
    : payments.filter(p => p.status === activeTab);

  const overdueCount = payments.filter(p => p.status === "overdue").length;
  const dueCount = payments.filter(p => p.status === "due").length;
  const upcomingCount = payments.filter(p => p.status === "upcoming").length;

  const totalOverdue = payments.filter(p => p.status === "overdue").reduce((sum, p) => sum + p.amount, 0);
  const totalDue = payments.filter(p => p.status === "due").reduce((sum, p) => sum + p.amount, 0);
  const totalUpcoming = payments.filter(p => p.status === "upcoming").reduce((sum, p) => sum + p.amount, 0);

  const getDaysDifference = (dateString: string) => {
    const today = new Date();
    const dueDate = new Date(dateString);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Tracking</h1>
        <p className="text-muted-foreground mt-1">Monitor due, overdue, and upcoming payments</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue Payments</p>
                <p className="text-3xl font-bold mt-2 text-destructive">{overdueCount}</p>
                <p className="text-sm text-muted-foreground mt-1">₹{(totalOverdue / 1000).toFixed(0)}K total</p>
              </div>
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Due Soon</p>
                <p className="text-3xl font-bold mt-2 text-warning">{dueCount}</p>
                <p className="text-sm text-muted-foreground mt-1">₹{(totalDue / 1000).toFixed(0)}K total</p>
              </div>
              <div className="rounded-full bg-warning/10 p-3">
                <Clock className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-info/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-3xl font-bold mt-2 text-info">{upcomingCount}</p>
                <p className="text-sm text-muted-foreground mt-1">₹{(totalUpcoming / 1000).toFixed(0)}K total</p>
              </div>
              <div className="rounded-full bg-info/10 p-3">
                <CheckCircle2 className="h-6 w-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All ({payments.length})</TabsTrigger>
              <TabsTrigger value="overdue">Overdue ({overdueCount})</TabsTrigger>
              <TabsTrigger value="due">Due Soon ({dueCount})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({upcomingCount})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-3">
              {filteredPayments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No payments found</p>
              ) : (
                filteredPayments.map((payment) => {
                  const StatusIcon = statusConfig[payment.status as keyof typeof statusConfig].icon;
                  const daysDiff = getDaysDifference(payment.dueDate);
                  
                  return (
                    <div
                      key={payment.id}
                      className="border rounded-lg p-4 hover:shadow-elegant transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{payment.beneficiary}</h3>
                            <Badge variant="outline" className="text-xs">
                              {payment.id}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={statusConfig[payment.status as keyof typeof statusConfig].color}
                            >
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {statusConfig[payment.status as keyof typeof statusConfig].label}
                            </Badge>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Scheme:</span> {payment.scheme}
                            </div>
                            <div>
                              <span className="font-medium">Phase:</span> {payment.phase}
                            </div>
                            <div>
                              <span className="font-medium">Amount:</span> ₹{payment.amount.toLocaleString()}
                            </div>
                            <div>
                              <span className="font-medium">Due Date:</span> {new Date(payment.dueDate).toLocaleDateString()}
                            </div>
                          </div>

                          {payment.status === "overdue" && (
                            <p className="text-xs text-destructive font-medium">
                              Overdue by {Math.abs(daysDiff)} days
                            </p>
                          )}
                          {payment.status === "due" && daysDiff >= 0 && (
                            <p className="text-xs text-warning font-medium">
                              Due in {daysDiff} days
                            </p>
                          )}
                          {payment.status === "upcoming" && (
                            <p className="text-xs text-info font-medium">
                              Due in {daysDiff} days
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xl font-bold px-4 py-2">
                            ₹{(payment.amount / 1000).toFixed(0)}K
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
