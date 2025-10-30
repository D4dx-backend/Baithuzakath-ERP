import { useState } from "react";
import { DollarSign, Calendar, CheckCircle, Download, Eye, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useRBAC } from "@/hooks/useRBAC";

const paymentSchedules = [
  {
    id: "PS-001",
    beneficiaryId: "BEN-2025-001",
    beneficiaryName: "Zainab Khatoon",
    scheme: "Medical Emergency Fund",
    district: "Kollam",
    phase: "Second Installment",
    percentage: 40,
    amount: 30000,
    dueDate: "2025-10-15",
    status: "pending",
    approvedAmount: 75000,
  },
  {
    id: "PS-002",
    beneficiaryId: "BEN-2025-002",
    beneficiaryName: "Mohammed Farhan",
    scheme: "Student Scholarship Program",
    district: "Thiruvananthapuram",
    phase: "Second Installment",
    percentage: 30,
    amount: 15000,
    dueDate: "2025-10-20",
    status: "pending",
    approvedAmount: 50000,
  },
  {
    id: "PS-003",
    beneficiaryId: "BEN-2025-003",
    beneficiaryName: "Ibrahim Ali",
    scheme: "Home Renovation Assistance",
    district: "Ernakulam",
    phase: "First Installment",
    percentage: 40,
    amount: 48000,
    dueDate: "2025-10-10",
    status: "pending",
    approvedAmount: 120000,
  },
  {
    id: "PS-004",
    beneficiaryId: "BEN-2025-004",
    beneficiaryName: "Fatima Begum",
    scheme: "Student Scholarship Program",
    district: "Thiruvananthapuram",
    phase: "Second Installment",
    percentage: 30,
    amount: 13500,
    dueDate: "2025-10-15",
    status: "pending",
    approvedAmount: 45000,
  },
  {
    id: "PS-005",
    beneficiaryId: "BEN-2025-001",
    beneficiaryName: "Zainab Khatoon",
    scheme: "Medical Emergency Fund",
    district: "Kollam",
    phase: "First Installment",
    percentage: 40,
    amount: 30000,
    dueDate: "2025-09-30",
    status: "paid",
    approvedAmount: 75000,
    paidDate: "2025-09-30",
    transactionRef: "TXN-2025-001",
    paymentMethod: "Bank Transfer",
  },
];

const statusConfig = {
  pending: { color: "bg-warning/10 text-warning border-warning/20", label: "Pending" },
  paid: { color: "bg-success/10 text-success border-success/20", label: "Paid" },
  overdue: { color: "bg-destructive/10 text-destructive border-destructive/20", label: "Overdue" },
};

export default function BeneficiaryPayments() {
  const { hasAnyPermission, hasPermission } = useRBAC();
  
  // Permission checks
  const canViewPayments = hasAnyPermission(['finances.read.all', 'finances.read.regional']);
  const canManagePayments = hasPermission('finances.manage');
  
  const [schedules, setSchedules] = useState(paymentSchedules);
  const [searchTerm, setSearchTerm] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [schemeFilter, setSchemeFilter] = useState("all");
  const [dueDateFilter, setDueDateFilter] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Access denied check
  if (!canViewPayments) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don't have permission to view payment distribution.
          </p>
        </div>
      </div>
    );
  }

  // Payment form states
  const [paymentDate, setPaymentDate] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [remarks, setRemarks] = useState("");

  const projectOptions = [
    { value: "all", label: "All Projects" },
    { value: "PRJ-2025-001", label: "Community Welfare Initiative" },
    { value: "PRJ-2025-002", label: "Education Support Program" },
    { value: "PRJ-2025-003", label: "Healthcare Assistance" },
  ];

  const schemeOptions = [
    { value: "all", label: "All Schemes" },
    { value: "Medical Emergency Fund", label: "Medical Emergency Fund" },
    { value: "Student Scholarship Program", label: "Student Scholarship Program" },
    { value: "Home Renovation Assistance", label: "Home Renovation Assistance" },
  ];

  const districtOptions = [
    { value: "all", label: "All Districts" },
    { value: "Thiruvananthapuram", label: "Thiruvananthapuram" },
    { value: "Kollam", label: "Kollam" },
    { value: "Ernakulam", label: "Ernakulam" },
  ];

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "paid", label: "Paid" },
    { value: "overdue", label: "Overdue" },
  ];

  const handleViewSchedule = (schedule: any) => {
    setSelectedSchedule(schedule);
    setShowViewModal(true);
  };

  const handleMarkAsPaid = (schedule: any) => {
    setSelectedSchedule(schedule);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setTransactionRef("");
    setPaymentMethod("");
    setRemarks("");
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = () => {
    if (!paymentDate || !transactionRef || !paymentMethod) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setSchedules(schedules.map(s => 
      s.id === selectedSchedule.id 
        ? { ...s, status: "paid", paidDate: paymentDate, transactionRef, paymentMethod, remarks }
        : s
    ));

    toast({
      title: "Payment Recorded",
      description: `Payment of ₹${selectedSchedule.amount.toLocaleString()} has been recorded successfully.`,
    });

    setShowPaymentModal(false);
    setSelectedSchedule(null);
  };

  const filteredSchedules = schedules.filter(schedule => {
    if (searchTerm && !schedule.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !schedule.beneficiaryId.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (projectFilter !== "all") return false; // Would filter by project when data includes it
    if (schemeFilter !== "all" && schedule.scheme !== schemeFilter) return false;
    if (districtFilter !== "all" && schedule.district !== districtFilter) return false;
    if (statusFilter !== "all" && schedule.status !== statusFilter) return false;
    if (dueDateFilter && schedule.dueDate !== dueDateFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);
  const paginatedData = filteredSchedules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const pendingCount = schedules.filter(s => s.status === "pending").length;
  const paidCount = schedules.filter(s => s.status === "paid").length;
  const totalPending = schedules.filter(s => s.status === "pending").reduce((sum, s) => sum + s.amount, 0);
  const totalPaid = schedules.filter(s => s.status === "paid").reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Distribution</h1>
          <p className="text-muted-foreground mt-1">Manage beneficiary payment schedules and disbursements</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Schedule
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <p className="text-3xl font-bold mt-2">{pendingCount}</p>
                <p className="text-sm text-muted-foreground mt-1">₹{(totalPending / 1000).toFixed(0)}K</p>
              </div>
              <div className="rounded-full bg-warning/10 p-3">
                <Calendar className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Payments</p>
                <p className="text-3xl font-bold mt-2">{paidCount}</p>
                <p className="text-sm text-muted-foreground mt-1">₹{(totalPaid / 1000).toFixed(0)}K</p>
              </div>
              <div className="rounded-full bg-success/10 p-3">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Scheduled</p>
                <p className="text-3xl font-bold mt-2">{schedules.length}</p>
                <p className="text-sm text-muted-foreground mt-1">All payments</p>
              </div>
              <div className="rounded-full bg-primary/10 p-3">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-3xl font-bold mt-2">₹{((totalPending + totalPaid) / 100000).toFixed(1)}L</p>
                <p className="text-sm text-muted-foreground mt-1">Overall</p>
              </div>
              <div className="rounded-full bg-info/10 p-3">
                <DollarSign className="h-6 w-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle>Payment Schedule</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Input 
                placeholder="Search by beneficiary name or ID..." 
                className="w-64" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Combobox
                value={projectFilter}
                onValueChange={setProjectFilter}
                options={projectOptions}
                placeholder="Select project..."
                searchPlaceholder="Search projects..."
                className="w-52"
              />
              <Combobox
                value={schemeFilter}
                onValueChange={setSchemeFilter}
                options={schemeOptions}
                placeholder="Select scheme..."
                searchPlaceholder="Search schemes..."
                className="w-56"
              />
              <Combobox
                value={districtFilter}
                onValueChange={setDistrictFilter}
                options={districtOptions}
                placeholder="Select district..."
                searchPlaceholder="Search districts..."
                className="w-52"
              />
              <Combobox
                value={statusFilter}
                onValueChange={setStatusFilter}
                options={statusOptions}
                placeholder="Select status..."
                searchPlaceholder="Search status..."
                className="w-48"
              />
              <Input 
                type="date"
                placeholder="Due date..." 
                className="w-44" 
                value={dueDateFilter}
                onChange={(e) => setDueDateFilter(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paginatedData.map((schedule) => (
              <div
                key={schedule.id}
                className="border rounded-lg p-4 hover:shadow-elegant transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{schedule.beneficiaryName}</h3>
                      <Badge variant="outline" className="text-xs">
                        {schedule.beneficiaryId}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={statusConfig[schedule.status as keyof typeof statusConfig].color}
                      >
                        {statusConfig[schedule.status as keyof typeof statusConfig].label}
                      </Badge>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Scheme:</span> {schedule.scheme}
                      </div>
                      <div>
                        <span className="font-medium">District:</span> {schedule.district}
                      </div>
                      <div>
                        <span className="font-medium">Phase:</span> {schedule.phase} ({schedule.percentage}%)
                      </div>
                      <div>
                        <span className="font-medium">Due Date:</span> {new Date(schedule.dueDate).toLocaleDateString('en-IN')}
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium">Total Approved:</span> ₹{schedule.approvedAmount.toLocaleString()}
                      </div>
                      {schedule.status === "paid" && (
                        <>
                          <div>
                            <span className="font-medium">Paid Date:</span> {new Date(schedule.paidDate).toLocaleDateString('en-IN')}
                          </div>
                          <div>
                            <span className="font-medium">Transaction Ref:</span> {schedule.transactionRef}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Payment Amount</p>
                      <p className="text-2xl font-bold">₹{schedule.amount.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      {schedule.status === "pending" && (
                        <Button 
                          size="sm" 
                          className="bg-success hover:bg-success/90"
                          onClick={() => handleMarkAsPaid(schedule)}
                        >
                          <DollarSign className="mr-2 h-4 w-4" />
                          Mark as Paid
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleViewSchedule(schedule)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => setCurrentPage(i + 1)}
                        isActive={currentPage === i + 1}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Schedule Modal with Timeline */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Schedule Details</DialogTitle>
          </DialogHeader>
          {selectedSchedule && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{selectedSchedule.beneficiaryName}</h3>
                <Badge variant="outline" className="text-xs">
                  {selectedSchedule.beneficiaryId}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Scheme</p>
                  <p className="font-medium">{selectedSchedule.scheme}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">District</p>
                  <p className="font-medium">{selectedSchedule.district}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Phase</p>
                  <p className="font-medium">{selectedSchedule.phase} ({selectedSchedule.percentage}%)</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">{new Date(selectedSchedule.dueDate).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Approved</p>
                  <p className="font-medium text-lg">₹{selectedSchedule.approvedAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Payment</p>
                  <p className="font-medium text-lg">₹{selectedSchedule.amount.toLocaleString()}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold">Money Distribution Timeline</h4>
                <div className="space-y-2">
                  {[
                    { phase: "First Installment", percentage: 40, amount: selectedSchedule.approvedAmount * 0.4, dueDate: "2025-09-30", status: "paid" },
                    { phase: "Second Installment", percentage: 40, amount: selectedSchedule.approvedAmount * 0.4, dueDate: selectedSchedule.dueDate, status: selectedSchedule.status },
                    { phase: "Final Installment", percentage: 20, amount: selectedSchedule.approvedAmount * 0.2, dueDate: "2025-11-30", status: "pending" },
                  ].map((timeline, idx) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{timeline.phase}</p>
                          <p className="text-sm text-muted-foreground">
                            {timeline.percentage}% - ₹{timeline.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(timeline.dueDate).toLocaleDateString('en-IN')}
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
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Recording Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedSchedule && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">{selectedSchedule.beneficiaryName}</h3>
                <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div><span className="font-medium">Scheme:</span> {selectedSchedule.scheme}</div>
                  <div><span className="font-medium">Phase:</span> {selectedSchedule.phase}</div>
                  <div><span className="font-medium">Amount:</span> ₹{selectedSchedule.amount.toLocaleString()}</div>
                  <div><span className="font-medium">Due Date:</span> {new Date(selectedSchedule.dueDate).toLocaleDateString('en-IN')}</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Date <span className="text-destructive">*</span></Label>
                  <Input 
                    type="date" 
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Transaction Reference <span className="text-destructive">*</span></Label>
                  <Input 
                    placeholder="TXN-2025-XXX"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Method <span className="text-destructive">*</span></Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="rtgs">RTGS/NEFT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Remarks / Notes</Label>
                <Textarea 
                  placeholder="Enter any additional notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button className="bg-success hover:bg-success/90" onClick={handleConfirmPayment}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
