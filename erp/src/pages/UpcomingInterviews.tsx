import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Users, FileText, CheckCircle, XCircle, CalendarCheck, Loader2, AlertCircle, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ReportsModal } from "@/components/modals/ReportsModal";
import { ApplicationViewModal } from "@/components/modals/ApplicationViewModal";
import { toast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/useRBAC";
import { interviews } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Interview {
  id: string;
  applicationId: string;
  applicantName: string;
  applicantPhone: string;
  projectName: string;
  schemeName: string;
  date: string;
  time: string;
  type: "offline" | "online";
  location?: string;
  meetingLink?: string;
  interviewers: string[];
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
  result?: "pending" | "passed" | "failed";
  scheduledBy?: string;
  scheduledAt?: string;
  completedAt?: string;
  state: string;
  district: string;
  area: string;
  unit: string;
}



export default function UpcomingInterviews() {
  const { hasAnyPermission } = useRBAC();
  
  // Permission check
  const canViewInterviews = hasAnyPermission(['interviews.read', 'applications.read.all', 'applications.read.regional']);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [interviewList, setInterviewList] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "approve" | "reject">("view");
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  // Load interviews data
  useEffect(() => {
    if (canViewInterviews) {
      loadInterviews();
    } else {
      setLoading(false);
    }
  }, [canViewInterviews, searchQuery, statusFilter]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== "all") params.status = statusFilter;
      
      const response = await interviews.getAll(params);
      
      if (response.success) {
        setInterviewList(response.data.interviews);
      } else {
        setError(response.message || "Failed to load interviews");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load interviews");
      toast({
        title: "Error",
        description: "Failed to load interviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Access denied check
  if (!canViewInterviews) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <CalendarCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don't have permission to view upcoming interviews.
          </p>
        </div>
      </div>
    );
  }

  const handleViewForApproval = (interview: Interview) => {
    setSelectedInterview(interview);
    setModalMode("view");
    setShowViewModal(true);
  };

  const handleApprove = async (id: string, remarks: string) => {
    try {
      const response = await interviews.complete(id, { 
        result: 'passed',
        notes: remarks 
      });
      
      if (response.success) {
        await loadInterviews(); // Reload interviews
        toast({
          title: "Interview Completed",
          description: `Interview has been marked as passed successfully.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to complete interview",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete interview",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string, remarks: string) => {
    try {
      const response = await interviews.complete(id, { 
        result: 'failed',
        notes: remarks 
      });
      
      if (response.success) {
        await loadInterviews(); // Reload interviews
        toast({
          title: "Interview Completed",
          description: `Interview has been marked as failed.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to complete interview",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete interview",
        variant: "destructive",
      });
    }
  };

  const handleAddNotes = (interview: Interview) => {
    setSelectedInterview(interview);
    setShowReportsModal(true);
  };

  // Convert interview to application format for modal
  const getApplicationFromInterview = (interview: Interview) => {
    return {
      id: interview.applicationId,
      applicantName: interview.applicantName,
      scheme: interview.schemeName,
      project: interview.projectName,
      appliedDate: interview.date,
      status: interview.status === "completed" ? 
        (interview.result === "passed" ? "approved" : "rejected") : 
        interview.status === "cancelled" ? "rejected" : "pending",
      amount: 50000, // This should come from the actual application data
    };
  };

  const filteredInterviews = interviewList.filter((interview) => {
    const matchesSearch =
      interview.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interview.applicationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interview.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || interview.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "completed":
        return "bg-success/10 text-success border-success/20";
      case "cancelled":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading interviews...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <ApplicationViewModal
        open={showViewModal}
        onOpenChange={setShowViewModal}
        application={selectedInterview ? getApplicationFromInterview(selectedInterview) : null}
        mode={modalMode}
        onApprove={handleApprove}
        onReject={handleReject}
      />
      
      <ReportsModal
        isOpen={showReportsModal}
        onClose={() => setShowReportsModal(false)}
        applicationId={selectedInterview?.applicationId || ""}
        applicantName={selectedInterview?.applicantName || ""}
      />
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Upcoming Interviews
          </h1>
          <p className="text-muted-foreground mt-1">
            Schedule and manage applicant interviews
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Search by applicant name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                size="sm"
              >
                All ({interviewList.length})
              </Button>
              <Button
                variant={statusFilter === "scheduled" ? "default" : "outline"}
                onClick={() => setStatusFilter("scheduled")}
                size="sm"
              >
                Scheduled ({interviewList.filter(i => i.status === "scheduled").length})
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                onClick={() => setStatusFilter("completed")}
                size="sm"
              >
                Completed ({interviewList.filter(i => i.status === "completed").length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interview Cards */}
      <div className="grid gap-4">
        {filteredInterviews.map((interview) => (
          <Card key={interview.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{interview.applicantName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{interview.applicationId}</p>
                  <p className="text-xs text-muted-foreground">📞 {interview.applicantPhone}</p>
                </div>
                <Badge className={getStatusColor(interview.status)}>
                  {interview.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Project:</span>
                    <span className="text-muted-foreground">{interview.projectName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Scheme:</span>
                    <span className="text-muted-foreground">{interview.schemeName}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Date:</span>
                    <span className="text-muted-foreground">
                      {new Date(interview.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Time:</span>
                    <span className="text-muted-foreground">{interview.time}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex items-start gap-2 text-sm">
                  <span className="font-medium">Type:</span>
                  <Badge variant="outline" className="text-xs">
                    {interview.type === "offline" ? "In-Person" : "Online"}
                  </Badge>
                </div>
                {interview.type === "offline" && interview.location && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="font-medium">Location:</span>
                    <span className="text-muted-foreground">{interview.location}</span>
                  </div>
                )}
                {interview.type === "online" && interview.meetingLink && (
                  <div className="flex items-start gap-2 text-sm">
                    <LinkIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="font-medium">Meeting Link:</span>
                    <a 
                      href={interview.meetingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Join Meeting
                    </a>
                  </div>
                )}
                {interview.interviewers.length > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="font-medium">Interviewers:</span>
                    <span className="text-muted-foreground">
                      {interview.interviewers.join(", ")}
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-sm">
                  <span className="font-medium">Location:</span>
                  <span className="text-muted-foreground">
                    {interview.district}, {interview.area}
                  </span>
                </div>
                {interview.notes && (
                  <div className="flex items-start gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="font-medium">Notes:</span>
                    <span className="text-muted-foreground">{interview.notes}</span>
                  </div>
                )}
                {interview.status === "completed" && interview.result && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="font-medium">Result:</span>
                    <Badge 
                      variant="outline" 
                      className={interview.result === "passed" ? "text-green-600 border-green-600" : "text-red-600 border-red-600"}
                    >
                      {interview.result.toUpperCase()}
                    </Badge>
                  </div>
                )}
              </div>

              {interview.status === "scheduled" && (
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewForApproval(interview)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    View & Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleAddNotes(interview)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Add Notes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInterviews.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No interviews found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
