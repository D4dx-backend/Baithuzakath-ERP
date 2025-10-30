import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Calendar, FileText, User, Loader2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { reports as reportsApi } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Report {
  id: string;
  reportNumber: string;
  reportDate: string;
  reportType: "interview" | "enquiry" | "field_verification" | "document_review" | "follow_up" | "other";
  title: string;
  details: string;
  status: "draft" | "submitted" | "reviewed" | "approved";
  priority: "low" | "medium" | "high" | "urgent";
  followUpRequired: boolean;
  followUpDate?: string;
  followUpNotes?: string;
  tags: string[];
  isPublic: boolean;
  createdBy: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewComments?: string;
}

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  applicantName: string;
}

export function ReportsModal({ isOpen, onClose, applicationId, applicantName }: ReportsModalProps) {
  // Dynamic reports system - no more dummy data!
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    reportDate: "",
    reportType: "interview" as "interview" | "enquiry" | "field_verification" | "document_review" | "follow_up" | "other",
    title: "",
    details: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    followUpRequired: false,
    followUpDate: "",
    followUpNotes: "",
    isPublic: false
  });

  // Load reports when modal opens
  useEffect(() => {
    if (isOpen && applicationId) {
      loadReports();
    }
  }, [isOpen, applicationId]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await reportsApi.getByApplication(applicationId);
      
      if (response.success) {
        setReports(response.data.reports);
      } else {
        setError(response.message || "Failed to load reports");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load reports");
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddReport = async () => {
    if (!formData.title.trim() || !formData.details.trim() || !formData.reportDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const reportData = {
        reportDate: formData.reportDate,
        reportType: formData.reportType,
        title: formData.title,
        details: formData.details,
        priority: formData.priority,
        followUpRequired: formData.followUpRequired,
        followUpDate: formData.followUpDate || undefined,
        followUpNotes: formData.followUpNotes || undefined,
        isPublic: formData.isPublic
      };

      const response = await reportsApi.create(applicationId, reportData);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Report created successfully",
        });
        
        // Reload reports
        await loadReports();
        
        // Reset form
        setShowAddForm(false);
        setFormData({
          reportDate: "",
          reportType: "interview",
          title: "",
          details: "",
          priority: "medium",
          followUpRequired: false,
          followUpDate: "",
          followUpNotes: "",
          isPublic: false
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create report",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create report",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reports - {applicantName}</DialogTitle>
          <p className="text-sm text-muted-foreground">{applicationId}</p>
        </DialogHeader>

        <div className="space-y-4">
          {!showAddForm ? (
            <Button onClick={() => setShowAddForm(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add New Report
            </Button>
          ) : (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">New Report</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddForm(false);
                      setFormData({
                        reportDate: "",
                        reportType: "interview",
                        title: "",
                        details: "",
                        priority: "medium",
                        followUpRequired: false,
                        followUpDate: "",
                        followUpNotes: "",
                        isPublic: false
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Report Date *</Label>
                    <Input
                      type="date"
                      value={formData.reportDate}
                      onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Report Type *</Label>
                    <Select
                      value={formData.reportType}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, reportType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="enquiry">Enquiry</SelectItem>
                        <SelectItem value="field_verification">Field Verification</SelectItem>
                        <SelectItem value="document_review">Document Review</SelectItem>
                        <SelectItem value="follow_up">Follow Up</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    placeholder="Enter report title..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Details *</Label>
                  <Textarea
                    placeholder="Enter report details..."
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Follow-up Required</Label>
                    <Select
                      value={formData.followUpRequired.toString()}
                      onValueChange={(value) =>
                        setFormData({ ...formData, followUpRequired: value === "true" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">No</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.followUpRequired && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Follow-up Date</Label>
                      <Input
                        type="date"
                        value={formData.followUpDate}
                        onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Follow-up Notes</Label>
                      <Textarea
                        placeholder="Enter follow-up notes..."
                        value={formData.followUpNotes}
                        onChange={(e) => setFormData({ ...formData, followUpNotes: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>
                )}
                
                <Button onClick={handleAddReport} className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Report
                </Button>
              </CardContent>
            </Card>
          )}

          <Separator />

          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">
              Previous Reports ({reports.length})
            </h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading reports...</span>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : reports.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No reports yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <Card key={report.id}>
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              className={
                                report.reportType === "interview"
                                  ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                  : report.reportType === "enquiry"
                                  ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                                  : report.reportType === "field_verification"
                                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                                  : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                              }
                            >
                              {report.reportType.replace('_', ' ')}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={
                                report.priority === "urgent"
                                  ? "border-red-500 text-red-500"
                                  : report.priority === "high"
                                  ? "border-orange-500 text-orange-500"
                                  : "border-gray-300 text-gray-600"
                              }
                            >
                              {report.priority}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{report.reportNumber}</span>
                          </div>
                          <h4 className="font-medium text-sm">{report.title}</h4>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(report.reportDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {report.createdBy}
                            </div>
                            {report.status && (
                              <Badge variant="outline" className="text-xs">
                                {report.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm whitespace-pre-wrap">{report.details}</p>
                      
                      {report.followUpRequired && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                          <p className="text-xs font-medium text-yellow-800">Follow-up Required</p>
                          {report.followUpDate && (
                            <p className="text-xs text-yellow-700">
                              Due: {new Date(report.followUpDate).toLocaleDateString()}
                            </p>
                          )}
                          {report.followUpNotes && (
                            <p className="text-xs text-yellow-700 mt-1">{report.followUpNotes}</p>
                          )}
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        Added on {new Date(report.createdAt).toLocaleString()}
                        {report.updatedAt !== report.createdAt && (
                          <span> • Updated {new Date(report.updatedAt).toLocaleString()}</span>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
