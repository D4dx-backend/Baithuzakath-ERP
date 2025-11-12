import { useState, useEffect, useCallback } from "react";
import { ShortlistModal } from "@/components/modals/ShortlistModal";
import { ReportsModal } from "@/components/modals/ReportsModal";
import { Download, Eye, FileText, Loader2, CalendarIcon } from "lucide-react";
import { useRBAC } from "@/hooks/useRBAC";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApplicationViewModal } from "@/components/modals/ApplicationViewModal";
import { ApplicationFilters } from "@/components/filters/ApplicationFilters";
import { useApplicationFilters } from "@/hooks/useApplicationFilters";
import { useApplicationExport } from "@/hooks/useApplicationExport";
import { toast } from "@/hooks/use-toast";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { applications } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface Application {
  _id: string;
  applicationNumber: string;
  beneficiary: { _id: string; name: string; phone: string; };
  scheme: { _id: string; name: string; code: string; };
  project?: { _id: string; name: string; code: string; };
  status: string;
  requestedAmount: number;
  district: { _id: string; name: string; code: string; };
  area: { _id: string; name: string; code: string; };
  unit: { _id: string; name: string; code: string; };
  createdAt: string;
  interview?: { scheduledDate?: string; scheduledTime?: string; type?: string; location?: string; };
}

export default function InterviewScheduledApplications() {
  const { user } = useAuth();
  const { hasAnyPermission } = useRBAC();
  
  const filterHook = useApplicationFilters('interview_scheduled');
  const { exportApplications, exporting } = useApplicationExport();
  
  const [applicationList, setApplicationList] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showShortlistModal, setShowShortlistModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0, limit: 10 });

  const canViewApplications = hasAnyPermission(['applications.read.all', 'applications.read.regional', 'applications.read.own']);
  const hasAdminAccess = user && ['super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin'].includes(user.role);

  useEffect(() => {
    if (!hasAdminAccess) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const params = filterHook.getApiParams(filterHook.filters.currentPage, pagination.limit);
        const response = await applications.getAll(params);
        if (response.success) {
          setApplicationList(response.data.applications);
          setPagination(response.data.pagination);
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to load applications", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    hasAdminAccess,
    filterHook.filters.currentPage,
    filterHook.filters.searchTerm,
    filterHook.filters.statusFilter,
    filterHook.filters.projectFilter,
    filterHook.filters.districtFilter,
    filterHook.filters.areaFilter,
    filterHook.filters.schemeFilter,
    filterHook.filters.fromDate,
    filterHook.filters.toDate,
    filterHook.filters.quickDateFilter,
    pagination.limit,
  ]);

  if (!canViewApplications) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to view applications.</p>
        </div>
      </div>
    );
  }

  const handleViewApplication = (app: Application) => {
    setSelectedApp(app);
    setShowViewModal(true);
  };

  const handleExport = () => {
    exportApplications(filterHook.getExportParams(), 'interview_scheduled_applications');
  };

  return (
    <div className="space-y-6">
      <ApplicationViewModal open={showViewModal} onOpenChange={setShowViewModal} application={selectedApp} mode="view" />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Interview Scheduled Applications</h1>
          <p className="text-muted-foreground mt-1">Applications with scheduled interviews</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={exporting}>
          <Download className="mr-2 h-4 w-4" />{exporting ? "Exporting..." : "Export Report"}
        </Button>
      </div>

      <ApplicationFilters
        searchTerm={filterHook.filters.searchTerm}
        onSearchChange={filterHook.setSearchTerm}
        projectFilter={filterHook.filters.projectFilter}
        onProjectChange={filterHook.setProjectFilter}
        projectOptions={filterHook.dropdownOptions.projectOptions}
        districtFilter={filterHook.filters.districtFilter}
        onDistrictChange={filterHook.setDistrictFilter}
        districtOptions={filterHook.dropdownOptions.districtOptions}
        areaFilter={filterHook.filters.areaFilter}
        onAreaChange={filterHook.setAreaFilter}
        areaOptions={filterHook.dropdownOptions.areaOptions}
        schemeFilter={filterHook.filters.schemeFilter}
        onSchemeChange={filterHook.setSchemeFilter}
        schemeOptions={filterHook.dropdownOptions.schemeOptions}
        fromDate={filterHook.filters.fromDate}
        onFromDateChange={filterHook.setFromDate}
        toDate={filterHook.filters.toDate}
        onToDateChange={filterHook.setToDate}
        quickDateFilter={filterHook.filters.quickDateFilter}
        onQuickDateFilterChange={filterHook.setQuickDateFilter}
        onClearFilters={filterHook.clearAllFilters}
      />

      <Card>
        <CardHeader><CardTitle>Interview Scheduled Applications ({pagination.total})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /><span className="ml-2">Loading...</span></div>
          ) : applicationList.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No applications with scheduled interviews</p>
          ) : (
            <div className="space-y-4">
              {applicationList.map((app) => (
                <div key={app._id} className="border rounded-lg p-4 hover:shadow-elegant transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{app.beneficiary.name}</h3>
                        <Badge variant="outline" className="text-xs">{app.applicationNumber}</Badge>
                        <div className="text-sm text-muted-foreground"><span className="font-medium">Amount:</span> ₹{app.requestedAmount.toLocaleString()}</div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div><span className="font-medium">Scheme:</span> {app.scheme.name}</div>
                        <div><span className="font-medium">Project:</span> {app.project?.name || 'N/A'}</div>
                        <div><span className="font-medium">District:</span> {app.district.name}</div>
                        <div><span className="font-medium">Area:</span> {app.area.name}</div>
                        {app.interview?.scheduledDate && (
                          <div><span className="font-medium">Interview Date:</span> {new Date(app.interview.scheduledDate).toLocaleDateString()}</div>
                        )}
                        <div><span className="font-medium">Phone:</span> {app.beneficiary.phone}</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20"><CalendarIcon className="mr-1 h-3 w-3" />INTERVIEW SCHEDULED</Badge>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewApplication(app)}><Eye className="mr-2 h-4 w-4" />View</Button>
                        <Button variant="secondary" size="sm" onClick={() => { setSelectedApp(app); setShowShortlistModal(true); }}><CalendarIcon className="mr-2 h-4 w-4" />Reschedule</Button>
                        <Button variant="secondary" size="sm" onClick={() => { setSelectedApp(app); setShowReportsModal(true); }}><FileText className="mr-2 h-4 w-4" />Reports</Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem><PaginationPrevious onClick={() => filterHook.setCurrentPage(Math.max(1, filterHook.filters.currentPage - 1))} className={filterHook.filters.currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
                  {[...Array(pagination.pages)].map((_, i) => (<PaginationItem key={i}><PaginationLink onClick={() => filterHook.setCurrentPage(i + 1)} isActive={filterHook.filters.currentPage === i + 1} className="cursor-pointer">{i + 1}</PaginationLink></PaginationItem>))}
                  <PaginationItem><PaginationNext onClick={() => filterHook.setCurrentPage(Math.min(pagination.pages, filterHook.filters.currentPage + 1))} className={filterHook.filters.currentPage === pagination.pages ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedApp && (
        <>
          <ShortlistModal isOpen={showShortlistModal} onClose={() => { setShowShortlistModal(false); setSelectedApp(null); }} applicationId={selectedApp.applicationNumber} applicantName={selectedApp.beneficiary.name} mode="reschedule" existingInterview={selectedApp.interview} onSuccess={() => { loadApplications(); }} />
          <ReportsModal isOpen={showReportsModal} onClose={() => { setShowReportsModal(false); setSelectedApp(null); }} applicationId={selectedApp.applicationNumber} applicantName={selectedApp.beneficiary.name} />
        </>
      )}
    </div>
  );
}
