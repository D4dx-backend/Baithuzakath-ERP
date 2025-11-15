import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, User, MapPin, IndianRupee, Download, Eye, CheckCircle, XCircle, Loader2, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { applications as applicationsApi, interviews } from '../../lib/api';
import { useToast } from '@/hooks/use-toast';

// Separate component for stage item to avoid hooks in map
const StageItem: React.FC<{
  stage: any;
  applicationId: string;
  showAction: boolean;
  onUpdate: () => void;
}> = ({ stage, applicationId, showAction, onUpdate }) => {
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [stageNotes, setStageNotes] = useState('');
  
  const isFieldVerification = stage.name?.toLowerCase().includes('field verification') || 
                             stage.name?.toLowerCase().includes('verification');
  const isPending = stage.status === 'pending' || stage.status === 'in_progress';
  const showWarning = isFieldVerification && isPending && stage.isRequired;
  
  const handleUpdateStage = async (newStatus: string) => {
    setUpdating(true);
    try {
      await applicationsApi.updateStage(applicationId, stage._id, {
        status: newStatus,
        notes: stageNotes
      });
      toast({
        title: "Success",
        description: `Stage "${stage.name}" updated to ${newStatus}`,
      });
      setShowUpdateForm(false);
      setStageNotes('');
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update stage",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };
  
  return (
    <div className={showWarning ? 'bg-orange-50/50' : ''}>
      <div className="flex items-start gap-2">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          stage.status === 'completed' ? 'bg-green-100 text-green-700' :
          stage.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
          stage.status === 'skipped' ? 'bg-gray-100 text-gray-500' :
          showWarning ? 'bg-orange-100 text-orange-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {stage.status === 'completed' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : showWarning ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <span className="text-xs font-medium">{stage.order}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <h4 className="font-medium text-sm">{stage.name}</h4>
              {stage.isRequired && (
                <Badge variant="outline" className="text-xs py-0 h-4 bg-red-50 text-red-700 border-red-200">
                  Required
                </Badge>
              )}
            </div>
            <Badge variant="outline" className={`text-xs py-0 h-5 ${
              stage.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
              stage.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              stage.status === 'skipped' ? 'bg-gray-50 text-gray-500 border-gray-200' :
              showWarning ? 'bg-orange-50 text-orange-700 border-orange-200' :
              'bg-yellow-50 text-yellow-700 border-yellow-200'
            }`}>
              {stage.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          
          {stage.description && (
            <p className="text-xs text-muted-foreground mb-1">{stage.description}</p>
          )}
          
          {showWarning && (
            <div className="mb-1 text-xs text-orange-700 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Requires area coordinator action
            </div>
          )}
          
          {stage.completedAt && (
            <p className="text-xs text-muted-foreground">
              ✓ {new Date(stage.completedAt).toLocaleDateString()} {new Date(stage.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              {stage.completedBy && ` by ${stage.completedBy.name || 'System'}`}
            </p>
          )}
          
          {stage.notes && (
            <p className="text-xs bg-muted/50 p-1.5 rounded mt-1">{stage.notes}</p>
          )}
          
          {/* Update Stage Form - Compact */}
          {(stage.status === 'pending' || stage.status === 'in_progress') && !showAction && (
            <div className="mt-2">
              {!showUpdateForm ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowUpdateForm(true)}
                  className="text-xs h-7"
                >
                  Update Status
                </Button>
              ) : (
                <div className="space-y-1.5 p-2 bg-muted/30 rounded border">
                  <Label className="text-xs">Notes (optional)</Label>
                  <Textarea
                    placeholder="Add notes..."
                    value={stageNotes}
                    onChange={(e) => setStageNotes(e.target.value)}
                    rows={2}
                    className="text-xs"
                  />
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStage('completed')}
                      disabled={updating}
                      className="bg-green-600 hover:bg-green-700 text-xs h-7"
                    >
                      {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                      Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowUpdateForm(false);
                        setStageNotes('');
                      }}
                      disabled={updating}
                      className="text-xs h-7"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ApplicationDetailModalProps {
  isOpen: boolean;
  applicationId: string | null;
  onClose: () => void;
  onActionComplete?: () => void;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  isOpen,
  applicationId,
  onClose,
  onActionComplete
}) => {
  const { toast } = useToast();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formConfig, setFormConfig] = useState<any>(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [showAction, setShowAction] = useState<"approve" | "reject" | null>(null);
  const [remarks, setRemarks] = useState("");
  const [distributionTimeline, setDistributionTimeline] = useState([
    { id: 1, phase: "First Installment", percentage: 40, date: "" },
  ]);

  useEffect(() => {
    if (isOpen && applicationId) {
      fetchApplicationDetails();
    }
  }, [isOpen, applicationId]);

  const fetchApplicationDetails = async () => {
    if (!applicationId) return;

    setLoading(true);
    try {
      const response = await applicationsApi.getById(applicationId);
      console.log('📋 Application Detail Response:', response);
      
      // Handle different response structures
      let applicationData = null;
      
      if (response.success) {
        // Check multiple possible locations for the application data
        if (response.data?.application) {
          applicationData = response.data.application;
        } else if (response.data) {
          // Sometimes the data is directly in response.data
          applicationData = response.data;
        }
      }
      
      if (applicationData) {
        console.log('✅ Application data loaded:', applicationData.applicationNumber);
        console.log('📊 Application stages:', applicationData.applicationStages);
        console.log('📜 Stage history:', applicationData.stageHistory);
        setApplication(applicationData);
        
        // Fetch form configuration to get field labels
        if (applicationData.scheme?._id) {
          fetchFormConfiguration(applicationData.scheme._id);
        }
      } else {
        console.error('❌ No application data found in response');
        throw new Error('Application data not found in response');
      }
    } catch (error: any) {
      console.error('❌ Error fetching application:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load application details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFormConfiguration = async (schemeId: string) => {
    try {
      console.log('📋 Fetching form config for scheme:', schemeId);
      const { schemes } = await import('../../lib/api');
      const response = await schemes.getFormConfig(schemeId);
      console.log('📋 Form config response:', response);
      
      if (response.success && response.data?.formConfiguration) {
        setFormConfig(response.data.formConfiguration);
        console.log('✅ Form config loaded with', response.data.formConfiguration.pages?.length || 0, 'pages');
        
        // Log all field IDs for debugging
        if (response.data.formConfiguration.pages) {
          response.data.formConfiguration.pages.forEach((page: any, pageIdx: number) => {
            page.sections?.forEach((section: any, sectionIdx: number) => {
              section.fields?.forEach((field: any, fieldIdx: number) => {
                console.log(`  Field [${pageIdx}.${sectionIdx}.${fieldIdx}]:`, {
                  id: field.id,
                  name: field.name,
                  label: field.label
                });
              });
            });
          });
        }
      } else {
        console.log('⚠️ No form configuration in response');
      }
    } catch (error) {
      console.error('❌ Error fetching form configuration:', error);
    }
  };

  const calculateDate = (daysFromApproval: number) => {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + daysFromApproval);
    return futureDate.toISOString().split('T')[0];
  };

  const loadSchemeDefaults = () => {
    if (application?.scheme?.distributionTimeline && application.scheme.distributionTimeline.length > 0) {
      const schemeDefaults = application.scheme.distributionTimeline.map((item: any, index: number) => ({
        id: index + 1,
        phase: item.description || `Phase ${index + 1}`,
        percentage: item.percentage || 0,
        date: calculateDate(item.daysFromApproval || 0)
      }));
      setDistributionTimeline(schemeDefaults);
      toast({
        title: "Success",
        description: "Loaded default distribution timeline from scheme"
      });
    } else {
      toast({
        title: "Info",
        description: "No default distribution timeline found in scheme",
        variant: "default"
      });
    }
  };

  const addDistributionPhase = () => {
    const newId = Math.max(...distributionTimeline.map(item => item.id), 0) + 1;
    setDistributionTimeline([...distributionTimeline, { id: newId, phase: "", percentage: 0, date: "" }]);
  };

  const removeDistributionPhase = (id: number) => {
    setDistributionTimeline(distributionTimeline.filter(item => item.id !== id));
  };

  const updateDistributionPhase = (id: number, field: string, value: any) => {
    setDistributionTimeline(distributionTimeline.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleApproveApplication = async () => {
    if (!application || !remarks.trim()) {
      toast({ 
        title: "Error", 
        description: "Please provide remarks/comments", 
        variant: "destructive" 
      });
      return;
    }
    
    setProcessingAction(true);
    try {
      // Convert distribution timeline to the format expected by the backend
      const timelineData = distributionTimeline.map(phase => ({
        description: phase.phase,
        percentage: phase.percentage,
        amount: Math.round((application?.requestedAmount || 0) * (phase.percentage / 100)),
        expectedDate: phase.date
      }));

      let response;
      
      // If interview_scheduled, use interview complete API
      if (application.status === 'interview_scheduled') {
        response = await interviews.complete(application.applicationNumber, {
          result: 'passed',
          notes: remarks,
          distributionTimeline: timelineData
        });
      } else {
        // For pending/under_review without interview requirement, use direct approval API
        response = await applicationsApi.approve(application._id, {
          approvedAmount: application.requestedAmount,
          comments: remarks,
          distributionTimeline: timelineData
        });
      }

      if (response.success) {
        toast({ 
          title: "Success", 
          description: "Application approved successfully" 
        });
        setShowAction(null);
        setRemarks("");
        onClose();
        if (onActionComplete) onActionComplete();
      }
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to approve application", 
        variant: "destructive" 
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectApplication = async () => {
    if (!application || !remarks.trim()) {
      toast({ 
        title: "Error", 
        description: "Please provide reason for rejection", 
        variant: "destructive" 
      });
      return;
    }
    
    setProcessingAction(true);
    try {
      let response;
      
      // If interview_scheduled, use interview complete API
      if (application.status === 'interview_scheduled') {
        response = await interviews.complete(application.applicationNumber, {
          result: 'failed',
          notes: remarks
        });
      } else {
        // For pending/under_review without interview requirement, use direct rejection API
        response = await applicationsApi.review(application._id, {
          status: 'rejected',
          comments: remarks
        });
      }

      if (response.success) {
        toast({ 
          title: "Success", 
          description: "Application rejected successfully" 
        });
        setShowAction(null);
        setRemarks("");
        onClose();
        if (onActionComplete) onActionComplete();
      }
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to reject application", 
        variant: "destructive" 
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      submitted: 'bg-blue-500',
      interview_scheduled: 'bg-indigo-500',
      interview_completed: 'bg-purple-500',
      approved: 'bg-green-500',
      rejected: 'bg-red-500',
      completed: 'bg-gray-500',
      on_hold: 'bg-amber-500',
      cancelled: 'bg-gray-400',
      disbursed: 'bg-teal-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const formatFieldValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') {
      if (Array.isArray(value)) return value.join(', ');
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getFieldLabel = (fieldKey: string): string => {
    console.log('🔍 Looking up label for field:', fieldKey);
    console.log('- Form config available:', !!formConfig);
    console.log('- Form config pages:', formConfig?.pages?.length || 0);
    
    // Try to find the field label from form configuration
    if (formConfig?.pages) {
      for (const page of formConfig.pages) {
        // Check if page has fields directly or in sections
        const fieldsToCheck = page.fields || [];
        
        // Also check sections if they exist
        if (page.sections) {
          for (const section of page.sections) {
            if (section.fields) {
              fieldsToCheck.push(...section.fields);
            }
          }
        }
        
        // Now search through all fields
        const field = fieldsToCheck.find((f: any) => {
          // Extract number from field_X format (e.g., "field_1" -> "1")
          const fieldKeyNumber = fieldKey.match(/field_(\d+)/)?.[1];
          
          // Convert field.id to string for comparison
          const fieldIdStr = String(f.id);
          
          // Match field_X with id: X
          const matches = 
            fieldIdStr === fieldKeyNumber ||
            String(f.id) === fieldKeyNumber ||
            f.id === parseInt(fieldKeyNumber || '0', 10);
          
          if (matches) {
            console.log('✅ Found matching field:', {
              fieldId: f.id,
              fieldLabel: f.label,
              fieldType: f.type,
              matchedWith: fieldKey,
              extractedNumber: fieldKeyNumber
            });
          }
          return matches;
        });
        
        if (field) {
          const label = field.label || field.name || fieldKey;
          console.log('✅ Using label:', label);
          return label;
        }
      }
    }
    
    console.log('⚠️ No form config match, using fallback for:', fieldKey);
    
    // Improved fallback: Clean up the field key
    let cleanLabel = fieldKey;
    
    // If it's just "field_X", try to make it more readable
    if (/^field_\d+$/i.test(fieldKey)) {
      // Extract the number
      const match = fieldKey.match(/\d+/);
      if (match) {
        cleanLabel = `Custom Field ${match[0]}`;
      }
    } else {
      // Clean up other formats
      cleanLabel = cleanLabel
        .replace(/field_/gi, '')
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    
    console.log('📝 Fallback label:', cleanLabel);
    return cleanLabel || fieldKey;
  };

  const renderFormData = (formData: any) => {
    if (!formData || typeof formData !== 'object') {
      return (
        <div className="text-center py-8 bg-muted/50 rounded-lg">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No custom form data submitted</p>
          <p className="text-xs text-muted-foreground mt-1">
            This application may have been created before form configuration was set up
          </p>
        </div>
      );
    }

    const entries = Object.entries(formData).filter(([key]) => 
      // Filter out internal fields
      !['_id', '__v', 'id'].includes(key)
    );
    
    if (entries.length === 0) {
      return (
        <div className="text-center py-8 bg-muted/50 rounded-lg">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No custom form fields filled</p>
          <p className="text-xs text-muted-foreground mt-1">
            The beneficiary submitted this application without additional form data
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entries.map(([key, value]) => {
          const label = getFieldLabel(key);
          return (
            <div key={key} className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">
                {label}
              </label>
              <div className="text-sm bg-muted p-2 rounded-md break-words">
                {formatFieldValue(value)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Application Details</h2>
              {application && (
                <p className="text-sm text-muted-foreground">
                  {application.applicationNumber}
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : application ? (
            <>
              {/* Show action form OR application details */}
              {showAction ? (
                <div className="p-6 space-y-6">
                  {showAction === "approve" && (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg">Money Distribution Timeline</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadSchemeDefaults}
                        >
                          Load Scheme Defaults
                        </Button>
                      </div>
                      <div className="space-y-3 mb-4">
                        {distributionTimeline.map((phase, index) => (
                          <div key={phase.id} className="flex gap-2 items-start">
                            <div className="flex-1 grid grid-cols-3 gap-2">
                              <Input
                                placeholder="Phase name"
                                value={phase.phase}
                                onChange={(e) => updateDistributionPhase(phase.id, 'phase', e.target.value)}
                              />
                              <Input
                                type="number"
                                placeholder="Percentage"
                                value={phase.percentage || ''}
                                onChange={(e) => updateDistributionPhase(phase.id, 'percentage', parseInt(e.target.value) || 0)}
                              />
                              <Input
                                type="date"
                                value={phase.date}
                                onChange={(e) => updateDistributionPhase(phase.id, 'date', e.target.value)}
                              />
                            </div>
                            {distributionTimeline.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDistributionPhase(phase.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addDistributionPhase}
                        className="mb-4"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Phase
                      </Button>
                    </>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="remarks">{showAction === "approve" ? "Approval Comments" : "Rejection Reason"}</Label>
                    <Textarea
                      id="remarks"
                      placeholder={showAction === "approve" ? "Enter approval comments..." : "Enter reason for rejection..."}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              ) : (
              <div className="p-6 space-y-6">
              <>
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Application Number</label>
                      <p className="text-sm font-mono">{application.applicationNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(application.status)}>
                          {application.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Beneficiary</label>
                      <p className="text-sm">{application.beneficiary?.name || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">{application.beneficiary?.phone || ''}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Scheme</label>
                      <p className="text-sm">{application.scheme?.name || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">{application.scheme?.code || ''}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Project</label>
                      <p className="text-sm">{application.project?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Submitted Date</label>
                      <p className="text-sm">{new Date(application.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Beneficiary Profile Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Beneficiary Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Name</label>
                      <p className="text-sm font-medium">{application.beneficiary?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <p className="text-sm">{application.beneficiary?.phone || 'N/A'}</p>
                    </div>
                    {application.beneficiary?.profile?.gender && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Gender</label>
                        <p className="text-sm capitalize">{application.beneficiary.profile.gender}</p>
                      </div>
                    )}
                    {application.beneficiary?.profile?.dateOfBirth && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                        <p className="text-sm">{new Date(application.beneficiary.profile.dateOfBirth).toLocaleDateString()}</p>
                      </div>
                    )}
                    {application.beneficiary?.profile?.address && (
                      <>
                        {application.beneficiary.profile.address.street && (
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-muted-foreground">Address</label>
                            <p className="text-sm">{application.beneficiary.profile.address.street}</p>
                          </div>
                        )}
                        {application.beneficiary.profile.address.area && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Area</label>
                            <p className="text-sm">{application.beneficiary.profile.address.area}</p>
                          </div>
                        )}
                        {application.beneficiary.profile.address.district && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">District</label>
                            <p className="text-sm">{application.beneficiary.profile.address.district}</p>
                          </div>
                        )}
                        {application.beneficiary.profile.address.state && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">State</label>
                            <p className="text-sm">{application.beneficiary.profile.address.state}</p>
                          </div>
                        )}
                        {application.beneficiary.profile.address.pincode && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Pincode</label>
                            <p className="text-sm">{application.beneficiary.profile.address.pincode}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Location Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Application Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">State</label>
                      <p className="text-sm">{application.state?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">District</label>
                      <p className="text-sm">{application.district?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Area</label>
                      <p className="text-sm">{application.area?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Unit</label>
                      <p className="text-sm">{application.unit?.name || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5" />
                    Financial Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Requested Amount</label>
                      <p className="text-lg font-semibold">₹{application.requestedAmount?.toLocaleString() || '0'}</p>
                    </div>
                    {application.approvedAmount && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Approved Amount</label>
                        <p className="text-lg font-semibold text-green-600">₹{application.approvedAmount.toLocaleString()}</p>
                      </div>
                    )}
                    {application.disbursedAmount && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Disbursed Amount</label>
                        <p className="text-lg font-semibold text-blue-600">₹{application.disbursedAmount.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Current Stage */}
              {application.currentStage && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Current Stage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-sm font-medium text-blue-900">{application.currentStage}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Form Data - The Complete Submission */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Custom Form Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderFormData(application.formData)}
                </CardContent>
              </Card>

              {/* Field Verification & Application Stages */}
              {/* Approvals - Compact view */}
              {application.applicationStages && application.applicationStages.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4" />
                      Approvals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {application.applicationStages
                        .sort((a: any, b: any) => a.order - b.order)
                        .map((stage: any, index: number) => {
                          // Get all history entries for this stage
                          const stageHistoryEntries = application.stageHistory?.filter(
                            (h: any) => h.stageName === stage.name
                          ) || [];
                          
                          return (
                            <div key={stage._id || index} className="border rounded p-3 bg-card">
                              <StageItem
                                stage={stage}
                                applicationId={application._id}
                                showAction={!!showAction}
                                onUpdate={fetchApplicationDetails}
                              />
                              
                              {/* Update History - Compact */}
                              {stageHistoryEntries.length > 0 && (
                                <div className="mt-2 pt-2 border-t">
                                  <div className="flex items-center gap-1 mb-1.5">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs font-medium text-muted-foreground">History</span>
                                  </div>
                                  <div className="space-y-1.5">
                                    {stageHistoryEntries
                                      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                      .map((history: any, hIndex: number) => (
                                      <div key={hIndex} className="bg-muted/30 p-2 rounded text-xs">
                                        <div className="flex items-center justify-between">
                                          <Badge variant="outline" className="text-xs py-0 h-5">
                                            {history.status.replace('_', ' ').toUpperCase()}
                                          </Badge>
                                          <span className="text-muted-foreground">
                                            {new Date(history.timestamp).toLocaleDateString()} {new Date(history.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                          </span>
                                        </div>
                                        {history.notes && (
                                          <p className="text-muted-foreground mt-1 italic">"{history.notes}"</p>
                                        )}
                                        {history.updatedBy && (
                                          <p className="text-muted-foreground mt-0.5">
                                            By: <span className="font-medium">{history.updatedBy.name || 'System'}</span>
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Interview Information - Only show if scheme requires interview */}
              {application.scheme?.applicationSettings?.requiresInterview && application.interview && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Interview Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Type</label>
                        <p className="text-sm capitalize">{application.interview.type || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Result</label>
                        <Badge variant="outline" className="mt-1">
                          {application.interview.result || 'Pending'}
                        </Badge>
                      </div>
                      {application.interview.scheduledDate && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Scheduled Date</label>
                          <p className="text-sm">{new Date(application.interview.scheduledDate).toLocaleString()}</p>
                        </div>
                      )}
                      {application.interview.location && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Location</label>
                          <p className="text-sm">{application.interview.location}</p>
                        </div>
                      )}
                      {application.interview.interviewers && application.interview.interviewers.length > 0 && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-muted-foreground">Interviewers</label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {application.interview.interviewers.map((interviewer: any, idx: number) => (
                              <Badge key={idx} variant="secondary">
                                {interviewer.name || interviewer}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {application.interview.notes && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-muted-foreground">Notes</label>
                          <p className="text-sm bg-muted p-2 rounded-md mt-1">{application.interview.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Distribution Timeline */}
              {application.distributionTimeline && application.distributionTimeline.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Distribution Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {application.distributionTimeline.map((timeline: any, index: number) => (
                        <div key={index} className="border-l-2 border-primary pl-4 pb-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm">{timeline.description}</p>
                            <Badge variant="outline">{timeline.percentage}%</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Days from approval: {timeline.daysFromApproval}</p>
                            {timeline.requiresVerification && (
                              <p className="text-orange-600">⚠️ Requires verification</p>
                            )}
                            {timeline.notes && <p className="italic">{timeline.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Documents */}
              {application.documents && application.documents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {application.documents.map((doc: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{doc.name || `Document ${index + 1}`}</p>
                              <p className="text-xs text-muted-foreground">{doc.type || 'Unknown type'}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {doc.url && (
                              <>
                                <Button variant="outline" size="sm" asChild>
                                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </a>
                                </Button>
                                <Button variant="outline" size="sm" asChild>
                                  <a href={doc.url} download>
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                  </a>
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Status History */}
              {application.statusHistory && application.statusHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Status History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {application.statusHistory.map((history: any, index: number) => (
                        <div key={index} className="flex gap-3 pb-3 border-b last:border-0">
                          <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(history.status)}`}></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {history.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(history.timestamp).toLocaleString()}
                              </span>
                            </div>
                            {history.comment && (
                              <p className="text-sm text-muted-foreground mt-1">{history.comment}</p>
                            )}
                            {history.updatedBy && (
                              <p className="text-xs text-muted-foreground mt-1">
                                By: {history.updatedBy.name || 'System'}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              </>
              </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No application data available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t">
          <Button variant="outline" onClick={() => {
            if (showAction) {
              setShowAction(null);
              setRemarks("");
            } else {
              onClose();
            }
          }}>
            {showAction ? "Cancel" : "Close"}
          </Button>
          
          {application && !showAction && (
            // Show approve/reject buttons if:
            // 1. Status is interview_scheduled, OR
            // 2. Status is pending AND scheme doesn't require interview
            (application.status === 'interview_scheduled' || 
             (application.status === 'pending' && 
              !application.scheme?.applicationSettings?.requiresInterview))
          ) && (
            <div className="flex gap-3">
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowAction("approve")}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Application
              </Button>
              <Button 
                variant="destructive"
                onClick={() => setShowAction("reject")}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject Application
              </Button>
            </div>
          )}

          {showAction && (
            <Button 
              className={showAction === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
              variant={showAction === "reject" ? "destructive" : "default"}
              onClick={showAction === "approve" ? handleApproveApplication : handleRejectApplication}
              disabled={processingAction || !remarks.trim()}
            >
              {processingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {showAction === "approve" ? <CheckCircle className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
                  Confirm {showAction === "approve" ? "Approval" : "Rejection"}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
