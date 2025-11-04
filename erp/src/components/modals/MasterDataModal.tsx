import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { masterData, projects, schemes, locations, type MasterData } from "@/lib/api";

// Form schema
const masterDataSchema = z.object({
  type: z.enum(['scheme_stages', 'project_stages', 'application_stages', 'distribution_timeline_templates', 'status_configurations']),
  name: z.string().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  category: z.string().max(100, "Category must be less than 100 characters").optional(),
  scope: z.enum(['global', 'state', 'district', 'area', 'unit', 'project_specific', 'scheme_specific']),
  status: z.enum(['draft', 'active', 'inactive', 'archived']),
  version: z.string().default('1.0'),
  effectiveFrom: z.string(),
  effectiveTo: z.string().optional(),
  targetRegions: z.array(z.string()).optional(),
  targetProjects: z.array(z.string()).optional(),
  targetSchemes: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  configuration: z.object({
    stages: z.array(z.object({
      name: z.string().min(1, "Stage name is required"),
      description: z.string().optional(),
      order: z.number().min(1, "Order must be at least 1"),
      isRequired: z.boolean().default(true),
      allowedRoles: z.array(z.string()),
      estimatedDuration: z.number().min(0).optional(),
      autoTransition: z.boolean().default(false),
      transitionConditions: z.string().optional(),
      color: z.string().default('#3B82F6'),
      icon: z.string().optional()
    })).optional(),
    distributionSteps: z.array(z.object({
      description: z.string().min(1, "Description is required"),
      percentage: z.number().min(0).max(100, "Percentage must be between 0 and 100"),
      daysFromApproval: z.number().min(0, "Days must be non-negative"),
      isAutomatic: z.boolean().default(false),
      requiresVerification: z.boolean().default(true),
      notes: z.string().optional()
    })).optional(),
    settings: z.object({
      enableNotifications: z.boolean().default(true),
      enablePublicTracking: z.boolean().default(false),
      autoProgressCalculation: z.boolean().default(true),
      requireApprovalForUpdates: z.boolean().default(false)
    }).optional()
  })
});

type FormData = z.infer<typeof masterDataSchema>;

interface MasterDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  masterData?: MasterData | null;
  mode: "create" | "edit";
  onSuccess: () => void;
}

const typeConfigs = {
  scheme_stages: {
    label: "Scheme Stages",
    description: "Configure stages for scheme management workflow",
    icon: "🎯",
    configType: "stages"
  },
  project_stages: {
    label: "Project Stages", 
    description: "Configure stages for project tracking and management",
    icon: "🏗️",
    configType: "stages"
  },
  application_stages: {
    label: "Application Stages",
    description: "Configure stages for application processing workflow",
    icon: "📋",
    configType: "stages"
  },
  distribution_timeline_templates: {
    label: "Distribution Templates",
    description: "Configure money distribution timeline templates",
    icon: "💰",
    configType: "distributionSteps"
  },
  status_configurations: {
    label: "Status Configurations",
    description: "Configure general status and workflow settings",
    icon: "⚙️",
    configType: "settings"
  }
};

const roleOptions = [
  'super_admin',
  'state_admin', 
  'district_admin',
  'area_admin',
  'unit_admin',
  'project_coordinator',
  'scheme_coordinator'
];

export function MasterDataModal({ open, onOpenChange, masterData, mode, onSuccess }: MasterDataModalProps) {
  const [loading, setLoading] = useState(false);
  const [projectOptions, setProjectOptions] = useState<any[]>([]);
  const [schemeOptions, setSchemeOptions] = useState<any[]>([]);
  const [locationOptions, setLocationOptions] = useState<any[]>([]);
  const [tagInput, setTagInput] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(masterDataSchema),
    defaultValues: {
      type: 'scheme_stages',
      name: '',
      description: '',
      category: '',
      scope: 'global',
      status: 'draft',
      version: '1.0',
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
      targetRegions: [],
      targetProjects: [],
      targetSchemes: [],
      tags: [],
      configuration: {
        stages: [],
        distributionSteps: [],
        settings: {
          enableNotifications: true,
          enablePublicTracking: false,
          autoProgressCalculation: true,
          requireApprovalForUpdates: false
        }
      }
    }
  });

  const watchedType = form.watch('type');
  const watchedScope = form.watch('scope');
  const currentTypeConfig = typeConfigs[watchedType];

  // Load options
  useEffect(() => {
    loadOptions();
  }, []);

  // Reset form when masterData changes
  useEffect(() => {
    if (masterData && mode === 'edit') {
      form.reset({
        type: masterData.type,
        name: masterData.name,
        description: masterData.description || '',
        category: masterData.category || '',
        scope: masterData.scope,
        status: masterData.status,
        version: masterData.version,
        effectiveFrom: masterData.effectiveFrom.split('T')[0],
        effectiveTo: masterData.effectiveTo ? masterData.effectiveTo.split('T')[0] : '',
        targetRegions: masterData.targetRegions?.map(r => r.id) || [],
        targetProjects: masterData.targetProjects?.map(p => p.id) || [],
        targetSchemes: masterData.targetSchemes?.map(s => s.id) || [],
        tags: masterData.tags || [],
        configuration: masterData.configuration
      });
    } else if (mode === 'create') {
      form.reset({
        type: 'scheme_stages',
        name: '',
        description: '',
        category: '',
        scope: 'global',
        status: 'draft',
        version: '1.0',
        effectiveFrom: new Date().toISOString().split('T')[0],
        effectiveTo: '',
        targetRegions: [],
        targetProjects: [],
        targetSchemes: [],
        tags: [],
        configuration: {
          stages: [],
          distributionSteps: [],
          settings: {
            enableNotifications: true,
            enablePublicTracking: false,
            autoProgressCalculation: true,
            requireApprovalForUpdates: false
          }
        }
      });
    }
  }, [masterData, mode, form]);

  const loadOptions = async () => {
    try {
      const [projectsRes, schemesRes, locationsRes] = await Promise.all([
        projects.getAll({ limit: 100 }),
        schemes.getAll({ limit: 100 }),
        locations.getAll({ limit: 100 })
      ]);

      if (projectsRes.success) setProjectOptions(projectsRes.data.projects);
      if (schemesRes.success) setSchemeOptions(schemesRes.data.schemes);
      if (locationsRes.success) setLocationOptions(locationsRes.data.locations);
    } catch (error) {
      console.error('Error loading options:', error);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      // Validate configuration based on type
      if (currentTypeConfig.configType === 'stages' && (!data.configuration.stages || data.configuration.stages.length === 0)) {
        toast({
          title: "Validation Error",
          description: "At least one stage is required for stage configurations",
          variant: "destructive",
        });
        return;
      }

      if (currentTypeConfig.configType === 'distributionSteps' && (!data.configuration.distributionSteps || data.configuration.distributionSteps.length === 0)) {
        toast({
          title: "Validation Error", 
          description: "At least one distribution step is required",
          variant: "destructive",
        });
        return;
      }

      // Validate total percentage for distribution steps
      if (data.configuration.distributionSteps) {
        const totalPercentage = data.configuration.distributionSteps.reduce((sum, step) => sum + step.percentage, 0);
        if (totalPercentage > 100) {
          toast({
            title: "Validation Error",
            description: "Total distribution percentage cannot exceed 100%",
            variant: "destructive",
          });
          return;
        }
      }

      const response = mode === 'create' 
        ? await masterData.create(data)
        : await masterData.update(masterData!.id, data);

      if (response.success) {
        toast({
          title: "Success",
          description: `Master data configuration ${mode === 'create' ? 'created' : 'updated'} successfully`,
        });
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${mode} master data configuration`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addStage = () => {
    const currentStages = form.getValues('configuration.stages') || [];
    const newStage = {
      name: '',
      description: '',
      order: currentStages.length + 1,
      isRequired: true,
      allowedRoles: ['super_admin'],
      estimatedDuration: 0,
      autoTransition: false,
      transitionConditions: '',
      color: '#3B82F6',
      icon: ''
    };
    form.setValue('configuration.stages', [...currentStages, newStage]);
  };

  const removeStage = (index: number) => {
    const currentStages = form.getValues('configuration.stages') || [];
    const updatedStages = currentStages.filter((_, i) => i !== index);
    // Reorder remaining stages
    updatedStages.forEach((stage, i) => {
      stage.order = i + 1;
    });
    form.setValue('configuration.stages', updatedStages);
  };

  const addDistributionStep = () => {
    const currentSteps = form.getValues('configuration.distributionSteps') || [];
    const newStep = {
      description: '',
      percentage: 0,
      daysFromApproval: 0,
      isAutomatic: false,
      requiresVerification: true,
      notes: ''
    };
    form.setValue('configuration.distributionSteps', [...currentSteps, newStep]);
  };

  const removeDistributionStep = (index: number) => {
    const currentSteps = form.getValues('configuration.distributionSteps') || [];
    form.setValue('configuration.distributionSteps', currentSteps.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim()) {
      const currentTags = form.getValues('tags') || [];
      if (!currentTags.includes(tagInput.trim())) {
        form.setValue('tags', [...currentTags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create' : 'Edit'} Master Data Configuration
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="configuration">Configuration</TabsTrigger>
                <TabsTrigger value="scope">Scope & Targets</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(typeConfigs).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                {config.icon} {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {currentTypeConfig.description}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter configuration name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter configuration description"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter category" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version</FormLabel>
                        <FormControl>
                          <Input placeholder="1.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="effectiveFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Effective From</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="effectiveTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Effective To (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Tags */}
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add tag"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          />
                          <Button type="button" onClick={addTag} variant="outline">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {field.value?.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                              {tag} ×
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="configuration" className="space-y-4">
                {currentTypeConfig.configType === 'stages' && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Stages Configuration</CardTitle>
                        <Button type="button" onClick={addStage} variant="outline" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Stage
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {form.watch('configuration.stages')?.map((stage, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">Stage {index + 1}</span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeStage(index)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`configuration.stages.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Stage Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter stage name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`configuration.stages.${index}.order`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Order</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="1"
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name={`configuration.stages.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Enter stage description" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`configuration.stages.${index}.estimatedDuration`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Estimated Duration (days)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="0"
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`configuration.stages.${index}.color`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Color</FormLabel>
                                  <FormControl>
                                    <Input type="color" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="space-y-2">
                            <FormField
                              control={form.control}
                              name={`configuration.stages.${index}.isRequired`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>Required Stage</FormLabel>
                                    <FormDescription>
                                      This stage must be completed before proceeding
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`configuration.stages.${index}.autoTransition`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>Auto Transition</FormLabel>
                                    <FormDescription>
                                      Automatically move to next stage when conditions are met
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name={`configuration.stages.${index}.allowedRoles`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Allowed Roles</FormLabel>
                                <div className="grid grid-cols-2 gap-2">
                                  {roleOptions.map((role) => (
                                    <div key={role} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`${index}-${role}`}
                                        checked={field.value?.includes(role)}
                                        onCheckedChange={(checked) => {
                                          const currentRoles = field.value || [];
                                          if (checked) {
                                            field.onChange([...currentRoles, role]);
                                          } else {
                                            field.onChange(currentRoles.filter(r => r !== role));
                                          }
                                        }}
                                      />
                                      <label htmlFor={`${index}-${role}`} className="text-sm">
                                        {role.replace('_', ' ')}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {currentTypeConfig.configType === 'distributionSteps' && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Distribution Steps</CardTitle>
                        <Button type="button" onClick={addDistributionStep} variant="outline" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Step
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {form.watch('configuration.distributionSteps')?.map((step, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <span className="font-medium">Step {index + 1}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeDistributionStep(index)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name={`configuration.distributionSteps.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Initial Payment" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`configuration.distributionSteps.${index}.percentage`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Percentage (%)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="0" 
                                      max="100"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`configuration.distributionSteps.${index}.daysFromApproval`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Days from Approval</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="0"
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name={`configuration.distributionSteps.${index}.notes`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Additional notes for this step" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex gap-4">
                            <FormField
                              control={form.control}
                              name={`configuration.distributionSteps.${index}.isAutomatic`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>Automatic</FormLabel>
                                    <FormDescription>
                                      Process automatically
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`configuration.distributionSteps.${index}.requiresVerification`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>Requires Verification</FormLabel>
                                    <FormDescription>
                                      Manual verification needed
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />
                          </div>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {currentTypeConfig.configType === 'settings' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>General Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="configuration.settings.enableNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable Notifications</FormLabel>
                              <FormDescription>
                                Send notifications for status updates
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="configuration.settings.enablePublicTracking"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable Public Tracking</FormLabel>
                              <FormDescription>
                                Allow public access to status tracking
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="configuration.settings.autoProgressCalculation"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Auto Progress Calculation</FormLabel>
                              <FormDescription>
                                Automatically calculate progress based on completed stages
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="configuration.settings.requireApprovalForUpdates"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Require Approval for Updates</FormLabel>
                              <FormDescription>
                                Status updates require approval from higher authority
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="scope" className="space-y-4">
                <FormField
                  control={form.control}
                  name="scope"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scope</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select scope" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="global">Global</SelectItem>
                          <SelectItem value="state">State</SelectItem>
                          <SelectItem value="district">District</SelectItem>
                          <SelectItem value="area">Area</SelectItem>
                          <SelectItem value="unit">Unit</SelectItem>
                          <SelectItem value="project_specific">Project Specific</SelectItem>
                          <SelectItem value="scheme_specific">Scheme Specific</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Define the scope of applicability for this configuration
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(watchedScope === 'state' || watchedScope === 'district' || watchedScope === 'area' || watchedScope === 'unit') && (
                  <FormField
                    control={form.control}
                    name="targetRegions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Regions</FormLabel>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-2">
                          {locationOptions
                            .filter(location => location.type === watchedScope)
                            .map((location) => (
                            <div key={location.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={location.id}
                                checked={field.value?.includes(location.id)}
                                onCheckedChange={(checked) => {
                                  const currentRegions = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentRegions, location.id]);
                                  } else {
                                    field.onChange(currentRegions.filter(id => id !== location.id));
                                  }
                                }}
                              />
                              <label htmlFor={location.id} className="text-sm">
                                {location.name}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {watchedScope === 'project_specific' && (
                  <FormField
                    control={form.control}
                    name="targetProjects"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Projects</FormLabel>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-2">
                          {projectOptions.map((project) => (
                            <div key={project.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={project.id}
                                checked={field.value?.includes(project.id)}
                                onCheckedChange={(checked) => {
                                  const currentProjects = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentProjects, project.id]);
                                  } else {
                                    field.onChange(currentProjects.filter(id => id !== project.id));
                                  }
                                }}
                              />
                              <label htmlFor={project.id} className="text-sm">
                                {project.name}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {watchedScope === 'scheme_specific' && (
                  <FormField
                    control={form.control}
                    name="targetSchemes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Schemes</FormLabel>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-2">
                          {schemeOptions.map((scheme) => (
                            <div key={scheme.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={scheme.id}
                                checked={field.value?.includes(scheme.id)}
                                onCheckedChange={(checked) => {
                                  const currentSchemes = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentSchemes, scheme.id]);
                                  } else {
                                    field.onChange(currentSchemes.filter(id => id !== scheme.id));
                                  }
                                }}
                              />
                              <label htmlFor={scheme.id} className="text-sm">
                                {scheme.name}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
                {mode === 'create' ? 'Create' : 'Update'} Configuration
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}