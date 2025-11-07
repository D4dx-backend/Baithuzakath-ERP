import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Clock, Settings, Users, MapPin, Calendar, Tag } from "lucide-react";
import { type MasterData } from "@/lib/api";

interface MasterDataDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  masterData: MasterData | null;
}

const typeConfigs = {
  scheme_stages: {
    label: "Scheme Stages",
    description: "Configure stages for scheme management workflow",
    icon: "🎯",
    color: "bg-blue-100 text-blue-800 border-blue-200"
  },
  project_stages: {
    label: "Project Stages", 
    description: "Configure stages for project tracking and management",
    icon: "🏗️",
    color: "bg-green-100 text-green-800 border-green-200"
  },
  application_stages: {
    label: "Application Stages",
    description: "Configure stages for application processing workflow",
    icon: "📋",
    color: "bg-purple-100 text-purple-800 border-purple-200"
  },
  distribution_timeline_templates: {
    label: "Distribution Templates",
    description: "Configure money distribution timeline templates",
    icon: "💰",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200"
  },
  status_configurations: {
    label: "Status Configurations",
    description: "Configure general status and workflow settings",
    icon: "⚙️",
    color: "bg-gray-100 text-gray-800 border-gray-200"
  }
};

const statusColors = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  active: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-red-100 text-red-800 border-red-200",
  archived: "bg-orange-100 text-orange-800 border-orange-200"
};

const scopeColors = {
  global: "bg-blue-100 text-blue-800",
  state: "bg-purple-100 text-purple-800",
  district: "bg-green-100 text-green-800",
  area: "bg-yellow-100 text-yellow-800",
  unit: "bg-pink-100 text-pink-800",
  project_specific: "bg-indigo-100 text-indigo-800",
  scheme_specific: "bg-cyan-100 text-cyan-800"
};

export function MasterDataDetailsModal({ open, onOpenChange, masterData }: MasterDataDetailsModalProps) {
  if (!masterData) return null;

  const typeConfig = typeConfigs[masterData.type as keyof typeof typeConfigs];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{typeConfig.icon}</span>
            <div>
              <DialogTitle className="text-xl">{masterData.name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{masterData.description}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={typeConfig.color} variant="outline">
              {typeConfig.label}
            </Badge>
            <Badge className={statusColors[masterData.status]} variant="outline">
              {masterData.status}
            </Badge>
            <Badge className={scopeColors[masterData.scope]} variant="outline">
              {masterData.scope.replace('_', ' ')}
            </Badge>
            {masterData.category && (
              <Badge variant="outline">
                {masterData.category}
              </Badge>
            )}
            <Badge variant="outline">
              v{masterData.version}
            </Badge>
            {masterData.isEffective && (
              <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">
                <CheckCircle className="mr-1 h-3 w-3" />
                Currently Effective
              </Badge>
            )}
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
              <TabsTrigger value="scope">Scope & Targets</TabsTrigger>
              <TabsTrigger value="audit">Audit Trail</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{masterData.usageCount}</div>
                    <div className="text-sm text-muted-foreground">Usage Count</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {masterData.isEffective ? 'Yes' : 'No'}
                    </div>
                    <div className="text-sm text-muted-foreground">Currently Active</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatDate(masterData.effectiveFrom)}
                    </div>
                    <div className="text-sm text-muted-foreground">Effective From</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {masterData.effectiveTo ? formatDate(masterData.effectiveTo) : 'No End Date'}
                    </div>
                    <div className="text-sm text-muted-foreground">Effective To</div>
                  </CardContent>
                </Card>
              </div>

              {/* Tags */}
              {masterData.tags && masterData.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {masterData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Usage Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Usage Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Usage:</span>
                    <span className="font-medium">{masterData.usageCount} times</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Used:</span>
                    <span className="font-medium">
                      {masterData.lastUsed ? formatDateTime(masterData.lastUsed) : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={statusColors[masterData.status]} variant="outline">
                      {masterData.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="configuration" className="space-y-4">
              {/* Stages Configuration */}
              {masterData.configuration.stages && masterData.configuration.stages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Stages Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {masterData.configuration.stages.map((stage, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: stage.color || '#3B82F6' }}
                            />
                            <div>
                              <h4 className="font-semibold">{stage.name}</h4>
                              <p className="text-sm text-muted-foreground">{stage.description}</p>
                            </div>
                          </div>
                          <Badge variant="outline">Order: {stage.order}</Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Required:</span>
                            <span className="ml-2">
                              {stage.isRequired ? (
                                <CheckCircle className="inline h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="inline h-4 w-4 text-red-600" />
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Auto Transition:</span>
                            <span className="ml-2">
                              {stage.autoTransition ? (
                                <CheckCircle className="inline h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="inline h-4 w-4 text-red-600" />
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="ml-2 font-medium">
                              {stage.estimatedDuration ? `${stage.estimatedDuration} days` : 'Not set'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Icon:</span>
                            <span className="ml-2 font-medium">{stage.icon || 'None'}</span>
                          </div>
                        </div>

                        {stage.allowedRoles && stage.allowedRoles.length > 0 && (
                          <div className="mt-3">
                            <span className="text-sm text-muted-foreground">Allowed Roles:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {stage.allowedRoles.map((role, roleIndex) => (
                                <Badge key={roleIndex} variant="secondary" className="text-xs">
                                  {role.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {stage.transitionConditions && (
                          <div className="mt-3">
                            <span className="text-sm text-muted-foreground">Transition Conditions:</span>
                            <p className="text-sm mt-1 p-2 bg-muted rounded">{stage.transitionConditions}</p>
                          </div>
                        )}
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Distribution Steps Configuration */}
              {masterData.configuration.distributionSteps && masterData.configuration.distributionSteps.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Distribution Steps</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {masterData.configuration.distributionSteps.map((step, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{step.description}</h4>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span>Percentage: <strong>{step.percentage}%</strong></span>
                              <span>Days from Approval: <strong>{step.daysFromApproval}</strong></span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {step.isAutomatic && (
                              <Badge variant="secondary" className="text-xs">
                                <Settings className="mr-1 h-3 w-3" />
                                Automatic
                              </Badge>
                            )}
                            {step.requiresVerification && (
                              <Badge variant="outline" className="text-xs">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Verification Required
                              </Badge>
                            )}
                          </div>
                        </div>

                        {step.notes && (
                          <div className="mt-3">
                            <span className="text-sm text-muted-foreground">Notes:</span>
                            <p className="text-sm mt-1 p-2 bg-muted rounded">{step.notes}</p>
                          </div>
                        )}
                      </Card>
                    ))}

                    {/* Total Percentage */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Percentage:</span>
                        <span className="text-lg font-bold text-blue-600">
                          {masterData.configuration.distributionSteps.reduce((sum, step) => sum + step.percentage, 0)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Settings Configuration */}
              {masterData.configuration.settings && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      General Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Enable Notifications</span>
                      {masterData.configuration.settings.enableNotifications ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Enable Public Tracking</span>
                      {masterData.configuration.settings.enablePublicTracking ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Auto Progress Calculation</span>
                      {masterData.configuration.settings.autoProgressCalculation ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Require Approval for Updates</span>
                      {masterData.configuration.settings.requireApprovalForUpdates ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="scope" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Scope Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Scope Level:</span>
                    <Badge className={scopeColors[masterData.scope]} variant="outline">
                      {masterData.scope.replace('_', ' ')}
                    </Badge>
                  </div>

                  {masterData.targetRegions && masterData.targetRegions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Target Regions</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {masterData.targetRegions.map((region) => (
                          <div key={region.id} className="p-2 border rounded">
                            <div className="font-medium">{region.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {region.type} • {region.code}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {masterData.targetProjects && masterData.targetProjects.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Target Projects</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {masterData.targetProjects.map((project) => (
                          <div key={project.id} className="p-2 border rounded">
                            <div className="font-medium">{project.name}</div>
                            <div className="text-sm text-muted-foreground">{project.code}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {masterData.targetSchemes && masterData.targetSchemes.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Target Schemes</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {masterData.targetSchemes.map((scheme) => (
                          <div key={scheme.id} className="p-2 border rounded">
                            <div className="font-medium">{scheme.name}</div>
                            <div className="text-sm text-muted-foreground">{scheme.code}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!masterData.targetRegions || masterData.targetRegions.length === 0) &&
                   (!masterData.targetProjects || masterData.targetProjects.length === 0) &&
                   (!masterData.targetSchemes || masterData.targetSchemes.length === 0) && (
                    <div className="text-center py-4 text-muted-foreground">
                      No specific targets defined. This configuration applies globally within its scope.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Audit Trail
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Created</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDateTime(masterData.createdAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{masterData.createdBy.name}</div>
                        <div className="text-sm text-muted-foreground">{masterData.createdBy.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Last Updated</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDateTime(masterData.updatedAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        {masterData.updatedBy ? (
                          <>
                            <div className="font-medium">{masterData.updatedBy.name}</div>
                            <div className="text-sm text-muted-foreground">{masterData.updatedBy.email}</div>
                          </>
                        ) : (
                          <div className="text-muted-foreground">No updates</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Version</div>
                        <div className="text-sm text-muted-foreground">Current version</div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">v{masterData.version}</Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Effective Period</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(masterData.effectiveFrom)} - {masterData.effectiveTo ? formatDate(masterData.effectiveTo) : 'Ongoing'}
                        </div>
                      </div>
                      <div className="text-right">
                        {masterData.isEffective ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 border-gray-200" variant="outline">
                            <XCircle className="mr-1 h-3 w-3" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}