import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, FileText, Calendar, IndianRupee, Bell, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { beneficiaryApi } from "@/services/beneficiaryApi";
import logo from "@/assets/logo.png";
import { toast } from "@/hooks/use-toast";

// Interfaces for API data
interface Application {
  _id: string;
  applicationId: string;
  scheme: {
    _id: string;
    name: string;
    category: string;
    maxAmount: number;
  };
  status: string;
  submittedAt: string;
  formData: any;
}

interface Stats {
  total: number;
  submitted: number;
  under_review: number;
  approved: number;
  rejected: number;
  completed: number;
  cancelled: number;
  totalApprovedAmount: number;
}

export default function BeneficiaryDashboard() {
  const navigate = useNavigate();
  const [searchId, setSearchId] = useState("");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const phoneNumber = localStorage.getItem("user_phone") || "";

  // Load dashboard data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load applications and stats in parallel
      const [applicationsResponse, statsResponse] = await Promise.all([
        beneficiaryApi.getMyApplications({ limit: 10 }),
        beneficiaryApi.getApplicationStats()
      ]);

      setApplications(applicationsResponse.applications);
      setStats(statsResponse.stats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "Failed to Load Data",
        description: "Could not load your applications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_phone");
    toast({ title: "Logged out successfully" });
    navigate("/");
  };

  const handleTrackApplication = () => {
    if (!searchId.trim()) {
      toast({ title: "Please enter an application ID", variant: "destructive" });
      return;
    }
    navigate(`/beneficiary/track/${searchId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved": return "bg-green-600";
      case "completed": return "bg-green-700";
      case "under_review": return "bg-yellow-600";
      case "submitted": return "bg-blue-600";
      case "rejected": return "bg-red-600";
      case "cancelled": return "bg-gray-600";
      case "on_hold": return "bg-orange-600";
      default: return "bg-blue-600";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-3 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-10 w-10 rounded-full" />
            <div>
              <h1 className="text-sm font-bold">Beneficiary Portal</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">+91 {phoneNumber}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Notifications - Placeholder for future implementation */}
            <Button variant="ghost" size="sm" className="relative opacity-50 cursor-not-allowed">
              <Bell className="h-5 w-5" />
            </Button>

            {/* Logout */}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden sm:flex">
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="sm:hidden">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6">
        {/* Quick Stats - Mobile Optimized */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">Applications</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-xl sm:text-2xl font-bold">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.total || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">Approved</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.approved || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">Received</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-xl sm:text-2xl font-bold">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `₹${(stats?.totalApprovedAmount || 0).toLocaleString()}`}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">Under Review</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-xl sm:text-2xl font-bold text-orange-600">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.under_review || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Track Application - Mobile Optimized */}
        <Card className="mb-4 shadow-sm">
          <CardHeader className="pb-3 px-3 pt-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4" />
              Track Application
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Enter Application ID"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="text-sm"
              />
              <Button onClick={handleTrackApplication} className="w-full sm:w-auto">Track</Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button onClick={() => navigate("/beneficiary/schemes")} className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            New Application
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate("/beneficiary/schemes")}
          >
            <FileText className="mr-2 h-4 w-4" />
            Browse All Schemes
          </Button>
        </div>

        {/* My Applications */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold px-1">My Applications</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : applications.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {applications.map((app) => (
                <Card key={app._id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-2 px-3 pt-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm truncate">{app.scheme.name}</CardTitle>
                        <CardDescription className="text-xs">ID: {app.applicationId}</CardDescription>
                      </div>
                      <Badge className={`${getStatusColor(app.status)} text-xs flex-shrink-0`}>
                        {app.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>Applied: {new Date(app.submittedAt).toLocaleDateString()}</p>
                      <p className="font-semibold text-sm text-foreground">
                        {app.scheme.maxAmount ? `₹${app.scheme.maxAmount.toLocaleString()}` : 'Amount varies'}
                      </p>
                      <p className="text-xs">{app.scheme.category}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3 text-xs h-8"
                      onClick={() => navigate(`/beneficiary/track/${app.applicationId}`)}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-8">
              <CardContent>
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't applied for any schemes yet. Start by browsing available schemes.
                </p>
                <Button onClick={() => navigate("/beneficiary/schemes")}>
                  Browse Schemes
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Payment History - Show only if there are approved applications */}
        {stats && stats.totalApprovedAmount > 0 && (
          <div className="space-y-3 mt-6">
            <h2 className="text-lg font-bold px-1">Payment Summary</h2>
            
            <Card className="shadow-sm">
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-sm">Total Approved Amount</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="flex items-center gap-1.5 text-xl font-bold text-green-600">
                  <IndianRupee className="h-5 w-5" />
                  {stats.totalApprovedAmount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {stats.approved + stats.completed} approved applications
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
