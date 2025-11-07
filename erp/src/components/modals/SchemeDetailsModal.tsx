import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, IndianRupee, Target, Users, MapPin, FileText, Clock, CheckCircle } from "lucide-react";
import { type Scheme } from "@/lib/api";

interface SchemeDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheme: Scheme | null;
}

export function SchemeDetailsModal({ open, onOpenChange, scheme }: SchemeDetailsModalProps) {
  if (!scheme) return null;

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100000).toFixed(1)}L`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Status color mapping
  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800 border-gray-200",
    active: "bg-green-100 text-green-800 border-green-200",
    suspended: "bg-yellow-100 text-yellow-800 border-yellow-200",
    closed: "bg-red-100 text-red-800 border-red-200",
    completed: "bg-purple-100 text-purple-800 border-purple-200",
  };

  // Priority color mapping
  const priorityColors: Record<string, string> = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };

  // Category icons mapping
  const categoryIcons: Record<string, string> = {
    education: "🎓",
    healthcare: "🏥",
    housing: "🏠",
    livelihood: "💼",
    emergency_relief: "🚨",
    infrastructure: "🏗️",
    social_welfare: "🤝",
    other: "📋",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{categoryIcons[scheme.category] || categoryIcons.other}</span>
            <div>
              <DialogTitle className="text-xl">{scheme.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {scheme.code}
                </Badge>
                <Badge className={statusColors[scheme.status]} variant="outline">
                  {scheme.status.replace('_', ' ')}
                </Badge>
                <Badge className={priorityColors[scheme.priority]} variant="outline">
                  {scheme.priority}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                <p className="text-sm">{scheme.description}</p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Category</h4>
                  <p className="text-sm capitalize">{scheme.category.replace('_', ' ')}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Priority</h4>
                  <p className="text-sm capitalize">{scheme.priority}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Associated Project</h4>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{scheme.project.name}</span>
                  <Badge variant="outline" className="text-xs">{scheme.project.code}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Financial Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Budget</p>
                    <p className="text-sm font-medium">{formatCurrency(scheme.budget.total)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Allocated</p>
                    <p className="text-sm font-medium">{formatCurrency(scheme.budget.allocated)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Spent</p>
                    <p className="text-sm font-medium">{formatCurrency(scheme.budget.spent)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Budget Utilization</span>
                  <span className="font-medium">{scheme.budgetUtilization}%</span>
                </div>
                <Progress value={scheme.budgetUtilization} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Remaining: {formatCurrency(scheme.remainingBudget)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium text-green-800 capitalize">{scheme.benefits.type}</h4>
                </div>
                {scheme.benefits.amount && (
                  <p className="text-sm text-green-700 mb-1">
                    Amount: ₹{scheme.benefits.amount.toLocaleString()} ({scheme.benefits.frequency.replace('_', ' ')})
                  </p>
                )}
                {scheme.benefits.description && (
                  <p className="text-sm text-green-700">{scheme.benefits.description}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Eligibility Criteria */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Eligibility Criteria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {scheme.eligibility.ageRange?.min || scheme.eligibility.ageRange?.max ? (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Age Range</h4>
                    <p className="text-sm">
                      {scheme.eligibility.ageRange.min || 0} - {scheme.eligibility.ageRange.max || 100} years
                    </p>
                  </div>
                ) : null}
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Gender</h4>
                  <p className="text-sm capitalize">{scheme.eligibility.gender || 'Any'}</p>
                </div>

                {scheme.eligibility.incomeLimit && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Income Limit</h4>
                    <p className="text-sm">≤ ₹{scheme.eligibility.incomeLimit.toLocaleString()}</p>
                  </div>
                )}

                {scheme.eligibility.educationLevel && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Education Level</h4>
                    <p className="text-sm capitalize">{scheme.eligibility.educationLevel.replace('_', ' ')}</p>
                  </div>
                )}

                {scheme.eligibility.employmentStatus && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Employment Status</h4>
                    <p className="text-sm capitalize">{scheme.eligibility.employmentStatus.replace('_', ' ')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Application Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium">Application Period</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(scheme.applicationSettings.startDate)} - {formatDate(scheme.applicationSettings.endDate)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-orange-600" />
                    <p className="text-sm font-medium">{scheme.daysRemainingForApplication} days left</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Max Applications</h4>
                  <p className="text-sm">{scheme.applicationSettings.maxApplications}</p>
                </div>
                {scheme.applicationSettings.maxBeneficiaries && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Max Beneficiaries</h4>
                    <p className="text-sm">{scheme.applicationSettings.maxBeneficiaries}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Settings</h4>
                  <div className="space-y-1">
                    {scheme.applicationSettings.autoApproval && (
                      <Badge variant="outline" className="text-xs">Auto Approval</Badge>
                    )}
                    {scheme.applicationSettings.requiresInterview && (
                      <Badge variant="outline" className="text-xs">Interview Required</Badge>
                    )}
                    {scheme.applicationSettings.allowMultipleApplications && (
                      <Badge variant="outline" className="text-xs">Multiple Applications</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Applications</p>
                    <p className="text-sm font-medium">{scheme.statistics.totalApplications}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Approved</p>
                    <p className="text-sm font-medium">{scheme.statistics.approvedApplications}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-sm font-medium">{scheme.statistics.pendingApplications}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Beneficiaries</p>
                    <p className="text-sm font-medium">{scheme.statistics.totalBeneficiaries}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="font-medium">{scheme.successRate}%</span>
                </div>
                <Progress value={scheme.successRate} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Target Regions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              {scheme.targetRegions && scheme.targetRegions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {scheme.targetRegions.map((region) => (
                    <div key={region.id} className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-800 rounded text-sm">
                      <MapPin className="h-3 w-3" />
                      <span>{region.name}</span>
                      <Badge variant="outline" className="text-xs">{region.type}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="text-green-800 font-medium">Applicable to All Regions</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Audit Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Created By</h4>
                  <p className="text-sm">{scheme.createdBy.name}</p>
                  <p className="text-xs text-muted-foreground">{scheme.createdBy.email}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Created At</h4>
                  <p className="text-sm">{formatDate(scheme.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}