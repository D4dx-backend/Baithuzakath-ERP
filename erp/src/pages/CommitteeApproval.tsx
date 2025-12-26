import { useState, useEffect } from "react";
import { Scale, User, IndianRupee, Calendar, FileText, CheckCircle, XCircle, Loader2, AlertCircle, MapPin, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/useRBAC";
import { GenericFilters } from "@/components/filters/GenericFilters";
import { useApplicationFilters } from "@/hooks/useApplicationFilters";
import { applications } from "@/lib/api";

interface Application {
  _id: string;
  applicationNumber: string;
  beneficiary: {
    name: string;
    phone: string;
    email?: string;
    location?: any;
  };
  scheme: {
    name: string;
    category: string;
  };
  project?: {
    name: string;
  };
  requestedAmount: number;
  interviewReport?: string;
  distributionTimeline?: Array<{
    description: string;
    percentage: number;
    amount: number;
    expectedDate: string;
  }>;
  interview?: {
    result: string;
    notes?: string;
    completedAt?: string;
  };
  createdAt: string;
}

export default function CommitteeApproval() {
  const { hasAnyPermission } = useRBAC();
  const canApprove = hasAnyPermission(['applications.approve', 'committee.approve']);

  const filterHook = useApplicationFilters('pending_committee_approval');

  const [applicationList, setApplicationList] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [showFilters, setShowFilters] = useState(false);
  
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState(0);
  
  // Distribution timeline state
  const [distributionTimeline, setDistributionTimeline] = useState([
    { id: 1, phase: "First Installment", percentage: 40, date: "" },
  ]);

  useEffect(() => {
    if (canApprove) {
      loadApplications();
    }
  }, [
    canApprove,
    filterHook.filters.currentPage,
    filterHook.filters.searchTerm,
    filterHook.filters.projectFilter,
    filterHook.filters.districtFilter,
    filterHook.filters.areaFilter,
    filterHook.filters.unitFilter,
    filterHook.filters.schemeFilter,
    filterHook.filters.fromDate,
    filterHook.filters.toDate,
    filterHook.filters.quickDateFilter,
    pagination.limit
  ]);

  if (!canApprove) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don't have permission to access committee approval.
          </p>
        </div>
      </div>
    );
  }

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = filterHook.getApiParams(filterHook.filters.currentPage, pagination.limit);
      const response = await applications.getPendingCommitteeApprovals(params);
      
      if (response.success) {
        setApplicationList((response.data as any)?.applications || []);
        setPagination((response.data as any)?.pagination || { page: 1, pages: 1, total: 0, limit: 10 });
      } else {
        setError(response.message || "Failed to load applications");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load applications");
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDecision = (application: Application, decisionType: 'approved' | 'rejected') => {
    setSelectedApplication(application);
    setDecision(decisionType);
    setComments("");
    setApprovedAmount(application.requestedAmount); // Initialize with requested amount
    
    // Set distribution timeline for approval
    if (decisionType === 'approved') {
      // Load the distribution timeline from interview (should always exist when forwarded)
      if (application.distributionTimeline && application.distributionTimeline.length > 0) {
        // Convert backend format to UI format
        const existingTimeline = application.distributionTimeline.map((timeline, index) => ({
          id: index + 1,
          phase: timeline.description,
          percentage: timeline.percentage,
          date: timeline.expectedDate ? new Date(timeline.expectedDate).toISOString().split('T')[0] : ""
        }));
        
        console.log('📋 Loading distribution timeline from interview:', existingTimeline);
        setDistributionTimeline(existingTimeline);
      } else {
        // This shouldn't happen if application was properly forwarded from interview
        console.warn('⚠️ No distribution timeline found from interview - application may not have been properly forwarded');
        // Set empty timeline with single phase
        setDistributionTimeline([
          { id: 1, phase: "First Installment", percentage: 100, date: "" }
        ]);
      }
    }
    
    setShowDecisionModal(true);
  };

  const handleSubmitDecision = async () => {
    if (!selectedApplication || !decision) return;

    try {
      setSubmitting(true);

      const timelineData = decision === 'approved' ? distributionTimeline.map(phase => ({
        description: phase.phase,
        percentage: phase.percentage,
        amount: Math.round(approvedAmount * (phase.percentage / 100)),
        expectedDate: phase.date
      })) : undefined;

      const response = await applications.committeeDecision(selectedApplication._id, {
        decision,
        comments,
        distributionTimeline: timelineData
      });

      if (response.success) {
        toast({
          title: "Success",
          description: `Application ${decision} successfully`,
        });
        setShowDecisionModal(false);
        loadApplications(); // Reload the list
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to process decision",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process decision",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const addDistributionPhase = () => {
    const calculateDate = (daysFromApproval: number) => {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + daysFromApproval);
      return futureDate.toISOString().split('T')[0];
    };

    setDistributionTimeline([
      ...distributionTimeline,
      { 
        id: distributionTimeline.length + 1, 
        phase: `Installment ${distributionTimeline.length + 1}`, 
        percentage: 0, 
        date: calculateDate(30)
      },
    ]);
  };

  const removeDistributionPhase = (id: number) => {
    if (distributionTimeline.length > 1) {
      setDistributionTimeline(distributionTimeline.filter(item => item.id !== id));
    }
  };

  const updateDistributionPhase = (id: number, field: string, value: any) => {
    setDistributionTimeline(distributionTimeline.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Scale className="h-8 w-8" />
            Committee Approval
          </h1>
          <p className="text-muted-foreground mt-1">Review and approve applications forwarded from interviews</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xl font-bold">{pagination.total}</p>
              <p className="text-sm text-muted-foreground">Pending Applications</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading applications...</span>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : applicationList.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pending Applications</h3>
              <p className="text-muted-foreground">
                There are no applications pending committee approval at the moment.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Applications Pending Committee Review</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application #</TableHead>
                    <TableHead>Beneficiary</TableHead>
                    <TableHead>Scheme</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Interview Result</TableHead>
                    <TableHead>Applied Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applicationList.map((application) => (
                    <TableRow key={application._id}>
                      <TableCell className="font-medium">{application.applicationNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{application.beneficiary.name}</p>
                          <p className="text-sm text-muted-foreground">{application.beneficiary.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{application.scheme.name}</p>
                          <p className="text-xs text-muted-foreground">{application.scheme.category}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />
                          {application.requestedAmount.toLocaleString('en-IN')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-success/10 text-success border-success/20">
                          Passed
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(application.createdAt).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDecision(application, 'approved')}
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() => handleOpenDecision(application, 'rejected')}
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {pagination.pages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setPagination({...pagination, page: Math.max(1, pagination.page - 1)})}
                    className={pagination.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setPagination({...pagination, page})}
                      isActive={pagination.page === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPagination({...pagination, page: Math.min(pagination.pages, pagination.page + 1)})}
                    className={pagination.page === pagination.pages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      {/* Decision Modal */}
      <Dialog open={showDecisionModal} onOpenChange={setShowDecisionModal}>
        <DialogContent className="w-[50vw] max-w-[50vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {decision === 'approved' ? 'Approve Application' : 'Reject Application'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-4">
              {/* Application Details */}
              <div className="rounded-lg border p-4 bg-muted/30">
                <h3 className="font-semibold mb-3">Application Details</h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Application #:</span>
                    <p className="font-medium">{selectedApplication.applicationNumber}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Beneficiary:</span>
                    <p className="font-medium">{selectedApplication.beneficiary.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Scheme:</span>
                    <p className="font-medium">{selectedApplication.scheme.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Requested Amount:</span>
                    <p className="font-medium">₹{selectedApplication.requestedAmount.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>

              {/* Approved Amount - Only for Approval */}
              {decision === 'approved' && (
                <div className="space-y-2">
                  <Label className="font-semibold">Approved Amount <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Enter approved amount"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(Number(e.target.value))}
                      className="pl-10"
                      min={0}
                      max={selectedApplication.requestedAmount}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter the amount approved by committee (max: ₹{selectedApplication.requestedAmount.toLocaleString('en-IN')})
                  </p>
                </div>
              )}

              {/* Interview Report/Notes - Show whichever is available */}
              {(selectedApplication.interviewReport || selectedApplication.interview?.notes) && (
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-2">Interview Report</h3>
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedApplication.interviewReport || selectedApplication.interview?.notes}
                  </p>
                </div>
              )}
              {/* Approved Amount - Only for Approval */}
              {decision === 'approved' && (
                <div className="space-y-2">
                  <Label className="font-semibold">Approved Amount <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Enter approved amount"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(Number(e.target.value))}
                      className="pl-10"
                      min={0}
                      max={selectedApplication.requestedAmount}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter the amount approved by committee (max: ₹{selectedApplication.requestedAmount.toLocaleString('en-IN')})
                  </p>
                </div>
              )}
              {/* Approved Amount - Only for Approval */}
              {decision === 'approved' && (
                <div className="space-y-2">
                  <Label className="font-semibold">Approved Amount <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Enter approved amount"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(Number(e.target.value))}
                      className="pl-10"
                      min={0}
                      max={selectedApplication.requestedAmount}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter the amount approved by committee (max: ₹{selectedApplication.requestedAmount.toLocaleString('en-IN')})
                  </p>
                </div>
              )}

              {/* Distribution Timeline - Only for Approval */}
              {decision === 'approved' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Money Distribution Timeline</Label>
                    <Button size="sm" variant="outline" onClick={addDistributionPhase}>
                      Add Phase
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {distributionTimeline.map((phase, index) => (
                      <div key={phase.id} className="grid grid-cols-12 gap-2 items-center">
                        <Input
                          className="col-span-4"
                          value={phase.phase}
                          onChange={(e) => updateDistributionPhase(phase.id, 'phase', e.target.value)}
                          placeholder="Phase name"
                        />
                        <Input
                          className="col-span-2"
                          type="number"
                          value={phase.percentage}
                          onChange={(e) => updateDistributionPhase(phase.id, 'percentage', Number(e.target.value))}
                          placeholder="%"
                          min="0"
                          max="100"
                        />
                        <div className="col-span-2 flex items-center px-3 py-2 border rounded-md bg-muted text-sm font-medium">
                          ₹{Math.round(approvedAmount * ((phase.percentage || 0) / 100)).toLocaleString('en-IN')}
                        </div>
                        <Input
                          className="col-span-3"
                          type="date"
                          value={phase.date}
                          onChange={(e) => updateDistributionPhase(phase.id, 'date', e.target.value)}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="col-span-1"
                          onClick={() => removeDistributionPhase(phase.id)}
                          disabled={distributionTimeline.length === 1}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Distribution Total Validation */}
                  {(() => {
                    const total = distributionTimeline.reduce((sum, phase) => sum + (phase.percentage || 0), 0);
                    const isValid = total === 100;
                    return (
                      <div className={`text-sm font-medium p-3 rounded-lg border ${isValid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        Total Distribution: {total}% {isValid ? '✓' : '(Must be 100%)'} = ₹{Math.round(approvedAmount * (total / 100)).toLocaleString('en-IN')}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Committee Comments */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Committee Comments <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  placeholder={`Enter committee ${decision} comments...`}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDecisionModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitDecision}
              disabled={
                submitting || 
                !comments.trim() || 
                (decision === 'approved' && 
                  distributionTimeline.reduce((sum, phase) => sum + (phase.percentage || 0), 0) !== 100)
              }
              className={decision === 'approved' ? "bg-success hover:bg-success/90" : ""}
              variant={decision === 'rejected' ? "destructive" : "default"}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {decision === 'approved' ? <CheckCircle className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
              Confirm {decision === 'approved' ? 'Approval' : 'Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
