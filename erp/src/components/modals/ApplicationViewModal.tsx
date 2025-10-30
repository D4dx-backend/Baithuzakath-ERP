import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, User, MapPin, Calendar, DollarSign, FileText, Phone, Mail, Download, Plus, Trash2, Clock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";

// Previous applications will be passed as prop or fetched from API

interface ApplicationViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: any;
  mode?: "view" | "approve" | "reject";
  onApprove?: (id: string, remarks: string) => void;
  onReject?: (id: string, remarks: string) => void;
  previousApplications?: any[];
}

export function ApplicationViewModal({ 
  open, 
  onOpenChange, 
  application,
  mode = "view",
  onApprove,
  onReject,
  previousApplications = []
}: ApplicationViewModalProps) {
  const [remarks, setRemarks] = useState("");
  const [showAction, setShowAction] = useState<"approve" | "reject" | null>(
    mode === "approve" ? "approve" : mode === "reject" ? "reject" : null
  );
  const [distributionTimeline, setDistributionTimeline] = useState([
    { id: 1, phase: "First Installment", percentage: 40, date: "" },
  ]);

  const addDistributionPhase = () => {
    setDistributionTimeline([
      ...distributionTimeline,
      { 
        id: distributionTimeline.length + 1, 
        phase: `Installment ${distributionTimeline.length + 1}`, 
        percentage: 0, 
        date: "" 
      },
    ]);
  };

  const removeDistributionPhase = (id: number) => {
    setDistributionTimeline(distributionTimeline.filter(item => item.id !== id));
  };

  const updateDistributionPhase = (id: number, field: string, value: any) => {
    setDistributionTimeline(distributionTimeline.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleDownload = () => {
    const content = `
APPLICATION DETAILS
===================
Application ID: ${application?.applicationNumber || 'N/A'}
Applied Date: ${application?.createdAt ? new Date(application.createdAt).toLocaleDateString('en-IN') : 'N/A'}

APPLICANT INFORMATION
---------------------
Name: ${application?.beneficiary?.name || 'N/A'}
Contact: ${application?.beneficiary?.phone || 'N/A'}
Email: ${application?.beneficiary?.email || (application?.beneficiary?.name ? `${application.beneficiary.name.toLowerCase().replace(/\s+/g, '.')}@email.com` : 'N/A')}
Location: ${[application?.area?.name, application?.district?.name, application?.state?.name].filter(Boolean).join(', ') || 'N/A'}

SCHEME DETAILS
--------------
Scheme: ${application?.scheme?.name || 'N/A'}
Project: ${application?.project?.name || 'N/A'}
Requested Amount: ₹${application?.requestedAmount?.toLocaleString('en-IN') || '0'}
Status: ${application?.status || 'N/A'}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Application_${application?.applicationNumber || 'unknown'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!application) return null;

  const handleApprove = () => {
    if (onApprove) {
      onApprove(application?._id || '', remarks);
      setRemarks("");
      setShowAction(null);
      onOpenChange(false);
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(application?._id || '', remarks);
      setRemarks("");
      setShowAction(null);
      onOpenChange(false);
    }
  };

  const statusConfig = {
    pending: { color: "bg-warning/10 text-warning border-warning/20", label: "Pending Review" },
    approved: { color: "bg-success/10 text-success border-success/20", label: "Approved" },
    under_review: { color: "bg-info/10 text-info border-info/20", label: "Under Review" },
    rejected: { color: "bg-destructive/10 text-destructive border-destructive/20", label: "Rejected" },
    completed: { color: "bg-success/10 text-success border-success/20", label: "Completed" },
    review: { color: "bg-info/10 text-info border-info/20", label: "In Review" },
    rejected: { color: "bg-destructive/10 text-destructive border-destructive/20", label: "Rejected" },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {showAction === "approve" ? "Approve Application" : showAction === "reject" ? "Reject Application" : "Application Details"}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
              <Badge variant="outline" className={statusConfig[application?.status as keyof typeof statusConfig]?.color || ''}>
                {statusConfig[application?.status as keyof typeof statusConfig]?.label || application?.status}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Application ID and Date */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Application ID</p>
              <p className="text-lg font-semibold">{application?.applicationNumber || 'N/A'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Applied Date</p>
              <p className="font-medium">{application?.createdAt ? new Date(application.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
            </div>
          </div>

          <Separator />

          {/* Applicant Details */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Applicant Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{application?.beneficiary?.name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Contact Number</p>
                  <p className="font-medium">{application?.beneficiary?.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{application?.beneficiary?.email || (application?.beneficiary?.name ? `${application.beneficiary.name.toLowerCase().replace(/\s+/g, '.')}@email.com` : 'N/A')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{[application?.area?.name, application?.district?.name, application?.state?.name].filter(Boolean).join(', ') || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Administrative Details */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Administrative Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">State</p>
                  <p className="font-medium">{application?.state?.name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">District</p>
                  <p className="font-medium">{application?.district?.name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Area</p>
                  <p className="font-medium">{application?.area?.name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Unit</p>
                  <p className="font-medium">{application?.unit?.name || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Application Details */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Scheme Details</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Scheme Name</p>
                  <p className="font-medium">{application?.scheme?.name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="font-medium">{application?.project?.name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Requested Amount</p>
                  <p className="font-medium text-lg">₹{application?.requestedAmount?.toLocaleString('en-IN') || '0'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Current Status</p>
                  <p className="font-medium">{application?.status?.replace('_', ' ').toUpperCase() || 'N/A'}</p>
                </div>
              </div>
              {application?.approvedAmount && (
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Approved Amount</p>
                    <p className="font-medium text-lg text-success">₹{application.approvedAmount.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              )}
              {application?.createdBy && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created By</p>
                    <p className="font-medium">{application.createdBy.name}</p>
                  </div>
                </div>
              )}
              {application?.reviewedBy && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Reviewed By</p>
                    <p className="font-medium">{application.reviewedBy.name}</p>
                  </div>
                </div>
              )}
              {application?.approvedBy && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Approved By</p>
                    <p className="font-medium">{application.approvedBy.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Money Distribution Timeline - Show only for approve */}
          {showAction === "approve" && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Money Distribution Timeline</Label>
                  <Button variant="outline" size="sm" onClick={addDistributionPhase}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Phase
                  </Button>
                </div>
                <div className="space-y-3">
                  {distributionTimeline.map((phase, index) => (
                    <div key={phase.id} className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-5">
                        <Label className="text-xs text-muted-foreground">Phase Name</Label>
                        <Input
                          placeholder="Phase name"
                          value={phase.phase}
                          onChange={(e) => updateDistributionPhase(phase.id, "phase", e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">%</Label>
                        <Input
                          type="number"
                          placeholder="40"
                          value={phase.percentage}
                          onChange={(e) => updateDistributionPhase(phase.id, "percentage", parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-4">
                        <Label className="text-xs text-muted-foreground">Due Date</Label>
                        <Input
                          type="date"
                          value={phase.date}
                          onChange={(e) => updateDistributionPhase(phase.id, "date", e.target.value)}
                        />
                      </div>
                      <div className="col-span-1 flex items-end">
                        {distributionTimeline.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDistributionPhase(phase.id)}
                            className="text-destructive h-10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total: {distributionTimeline.reduce((sum, p) => sum + p.percentage, 0)}% of ₹{application?.requestedAmount?.toLocaleString('en-IN') || '0'}
                </p>
              </div>
            </>
          )}

          {/* Remarks Section - Show if approve or reject mode */}
          {showAction && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  {showAction === "approve" ? "Approval Remarks / Comments" : "Rejection Remarks / Comments"}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Textarea 
                  placeholder={`Enter ${showAction === "approve" ? "approval" : "rejection"} remarks...`}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Please provide detailed comments for this {showAction}.
                </p>
              </div>
            </>
          )}

          {/* Previous Applications History */}
          {previousApplications.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Previous Application History</h3>
                {previousApplications.map((prevApp, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{prevApp.applicationNumber || prevApp.id}</p>
                        <p className="text-sm text-muted-foreground">{prevApp.scheme?.name || prevApp.scheme}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={statusConfig[prevApp.status as keyof typeof statusConfig]?.color || "bg-muted"}>
                          {statusConfig[prevApp.status as keyof typeof statusConfig]?.label || prevApp.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          Applied: {prevApp.createdAt ? new Date(prevApp.createdAt).toLocaleDateString('en-IN') : new Date(prevApp.appliedDate).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Amount:</span> ₹{(prevApp.requestedAmount || prevApp.amount)?.toLocaleString('en-IN') || '0'}
                      </div>
                      <div>
                        <span className="font-medium">Project:</span> {prevApp.project?.name || prevApp.project || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">District:</span> {prevApp.district?.name || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span> {statusConfig[prevApp.status as keyof typeof statusConfig]?.label || prevApp.status}
                      </div>
                    </div>
                    
                    {prevApp.distributionTimeline && prevApp.distributionTimeline.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Money Distribution Timeline</p>
                        <div className="space-y-2">
                          {prevApp.distributionTimeline.map((timeline: any, tidx: number) => (
                            <div key={tidx} className="border rounded p-3 bg-muted/30">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <p className="font-medium text-sm">{timeline.phase}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {timeline.percentage}% - ₹{timeline.amount?.toLocaleString() || '0'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Due: {timeline.dueDate ? new Date(timeline.dueDate).toLocaleDateString('en-IN') : 'N/A'}
                                    {timeline.paidDate && ` | Paid: ${new Date(timeline.paidDate).toLocaleDateString('en-IN')}`}
                                  </p>
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className={timeline.status === "paid" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}
                                >
                                  {timeline.status === "paid" ? "Paid" : "Pending"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Action Buttons - Only show in view mode */}
          {application?.status === "pending" && !showAction && mode === "view" && (
            <>
              <Separator />
              <div className="flex gap-3">
                <Button 
                  className="flex-1 bg-success hover:bg-success/90"
                  onClick={() => setShowAction("approve")}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Application
                </Button>
                <Button 
                  className="flex-1"
                  variant="destructive"
                  onClick={() => setShowAction("reject")}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Application
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {showAction ? (
            <>
              <Button variant="outline" onClick={() => {
                setShowAction(null);
                setRemarks("");
                if (mode !== "view") onOpenChange(false);
              }}>
                Cancel
              </Button>
              <Button 
                className={showAction === "approve" ? "bg-success hover:bg-success/90" : ""}
                variant={showAction === "reject" ? "destructive" : "default"}
                onClick={showAction === "approve" ? handleApprove : handleReject}
                disabled={!remarks.trim()}
              >
                {showAction === "approve" ? <CheckCircle className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
                Confirm {showAction === "approve" ? "Approval" : "Rejection"}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
