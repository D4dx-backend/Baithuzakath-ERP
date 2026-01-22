import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { type Project, projects as projectsApi, apiClient, locations as locationsApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface ProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  mode: "create" | "edit";
}

export function ProjectModal({ open, onOpenChange, project, mode }: ProjectModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    category: "",
    priority: "medium",
    scope: "",
    budget: "",
    coordinator: "",
    targetRegions: [] as string[],
  });
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coordinators, setCoordinators] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [locations, setLocations] = useState<Array<{ _id: string; name: string; type: string; code: string }>>([]);
  const [loadingCoordinators, setLoadingCoordinators] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Fetch coordinators and locations when modal opens
  useEffect(() => {
    if (open) {
      fetchCoordinators();
      fetchLocations();
    }
  }, [open]);

  // Initialize form data when project changes
  useEffect(() => {
    if (project && mode === "edit") {
      setFormData({
        name: project.name || "",
        code: project.code || "",
        description: project.description || "",
        category: project.category || "",
        priority: project.priority || "medium",
        scope: project.scope || "",
        budget: project.budget?.total?.toString() || "",
        coordinator: project.coordinator?.id || "",
        targetRegions: project.targetRegions?.map(r => r.id) || [],
      });
      
      if (project.startDate) {
        setStartDate(new Date(project.startDate));
      }
      if (project.endDate) {
        setEndDate(new Date(project.endDate));
      }
    } else {
      // Reset form for create mode
      setFormData({
        name: "",
        code: "",
        description: "",
        category: "",
        priority: "medium",
        scope: "",
        budget: "",
        coordinator: "",
        targetRegions: [],
      });
      setStartDate(undefined);
      setEndDate(undefined);
    }
  }, [project, mode, open]);

  const fetchCoordinators = async () => {
    try {
      setLoadingCoordinators(true);
      // Try using getByRole first, fallback to getUsers with role filter
      let response;
      try {
        response = await apiClient.getUsersByRole("project_coordinator");
      } catch (error) {
        // Fallback to getUsers with role filter
        console.log('⚠️ getUsersByRole failed, trying getUsers with role filter');
        response = await apiClient.getUsers({ role: "project_coordinator", limit: 100 });
      }
      
      console.log('📋 Coordinators API response:', response);
      if (response.success && response.data) {
        const users = response.data.users || [];
        const coordinatorsList = users
          .filter(u => u.isActive !== false) // Only include active users
          .map(u => ({ 
            id: u.id, 
            name: u.name, 
            email: u.email || '' 
          }));
        console.log('✅ Loaded coordinators:', coordinatorsList.length, coordinatorsList);
        setCoordinators(coordinatorsList);
        
        if (coordinatorsList.length === 0) {
          console.warn('⚠️ No active project coordinators found in the system');
        }
      } else {
        console.warn('⚠️ No coordinators found or API error:', response);
        setCoordinators([]);
      }
    } catch (error) {
      console.error("❌ Failed to fetch coordinators:", error);
      toast({
        title: "Warning",
        description: "Failed to load coordinators. You can still create the project without a coordinator.",
        variant: "default",
      });
      setCoordinators([]);
    } finally {
      setLoadingCoordinators(false);
    }
  };

  const fetchLocations = async () => {
    try {
      setLoadingLocations(true);
      // Fetch districts, areas, and units based on scope
      const response = await locationsApi.getAll({ limit: 200, isActive: true });
      if (response.success && response.data) {
        setLocations(response.data.locations.map(l => ({ 
          _id: (l as any)._id || l.id, 
          name: l.name, 
          type: l.type, 
          code: l.code 
        })));
      }
    } catch (error) {
      console.error("Failed to fetch locations:", error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Validate required fields
      if (!formData.name || !formData.code || !formData.description || !formData.category || !formData.scope) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }


      if (!startDate || !endDate) {
        toast({
          title: "Validation Error",
          description: "Please select start and end dates",
          variant: "destructive",
        });
        return;
      }

      const projectData = {
        name: formData.name,
        code: formData.code.toUpperCase().replace(/\s+/g, "_"),
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        scope: formData.scope,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        budget: {
          total: parseFloat(formData.budget) || 0,
          allocated: parseFloat(formData.budget) || 0,
          spent: project?.budget?.spent || 0,
          currency: "INR",
        },
      };

      // Only include coordinator if provided
      if (formData.coordinator) {
        (projectData as any).coordinator = formData.coordinator;
      }

      // Only include targetRegions if provided
      if (formData.targetRegions && formData.targetRegions.length > 0) {
        (projectData as any).targetRegions = formData.targetRegions;
      }

      if (mode === "create") {
        const response = await projectsApi.create(projectData as any);
        if (response.success) {
          toast({
            title: "Success",
            description: "Project created successfully",
          });
          onOpenChange(false);
        } else {
          throw new Error(response.message || "Failed to create project");
        }
      } else if (mode === "edit" && project) {
        const response = await projectsApi.update(project.id, projectData as any);
        if (response.success) {
          toast({
            title: "Success",
            description: "Project updated successfully",
          });
          onOpenChange(false);
        } else {
          throw new Error(response.message || "Failed to update project");
        }
      }
    } catch (error: any) {
      console.error('Project save error:', error);
      let errorMessage = error.message || `Failed to ${mode === "create" ? "create" : "update"} project`;
      
      // Show detailed validation errors if available
      if (error.validationErrors && Array.isArray(error.validationErrors)) {
        const validationMessages = error.validationErrors.map((err: any) => 
          `${err.field}: ${err.message}`
        ).join('\n');
        errorMessage = `Validation failed:\n${validationMessages}`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create New Project" : "Edit Project"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Project Title *</Label>
              <Input 
                placeholder="Enter project title" 
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Project Code *</Label>
              <Input 
                placeholder="e.g., PROJ-2025-001" 
                value={formData.code}
                onChange={(e) => handleInputChange("code", e.target.value)}
                className="uppercase"
              />
              <p className="text-xs text-muted-foreground">
                Uppercase letters, numbers, hyphens, and underscores only
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              placeholder="Project description" 
              rows={3} 
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="housing">Housing</SelectItem>
                  <SelectItem value="livelihood">Livelihood</SelectItem>
                  <SelectItem value="emergency_relief">Emergency Relief</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="social_welfare">Social Welfare</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Scope</Label>
              <Select value={formData.scope} onValueChange={(value) => handleInputChange("scope", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="state">State</SelectItem>
                  <SelectItem value="district">District</SelectItem>
                  <SelectItem value="area">Area</SelectItem>
                  <SelectItem value="unit">Unit</SelectItem>
                  <SelectItem value="multi_region">Multi Region</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Budget (₹)</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={formData.budget}
                onChange={(e) => handleInputChange("budget", e.target.value)}
              />
              {project && (
                <div className="text-sm text-muted-foreground">
                  Current: ₹{(project.budget.total / 100000).toFixed(1)}L | 
                  Spent: ₹{(project.budget.spent / 100000).toFixed(1)}L | 
                  Remaining: ₹{(project.remainingBudget / 100000).toFixed(1)}L
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Coordinator</Label>
              {mode === "create" ? (
                <Select 
                  value={formData.coordinator || undefined} 
                  onValueChange={(value) => handleInputChange("coordinator", value)}
                  disabled={loadingCoordinators || coordinators.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      loadingCoordinators 
                        ? "Loading coordinators..." 
                        : coordinators.length === 0 
                        ? "No coordinators available (optional)" 
                        : "Select coordinator (optional)"
                    } />
                  </SelectTrigger>
                  {coordinators.length > 0 && (
                    <SelectContent>
                      {coordinators.map((coord) => (
                        <SelectItem key={coord.id} value={coord.id}>
                          {coord.name} {coord.email ? `(${coord.email})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  )}
                </Select>
              ) : (
                <>
                  <Input 
                    value={project?.coordinator?.name || ""}
                    disabled
                  />
                  <div className="text-sm text-muted-foreground">
                    Role: {project?.coordinator?.role?.replace('_', ' ')} | 
                    Email: {project?.coordinator?.email}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Target Regions section hidden - made optional */}

          {project && mode === "edit" && (
            <div className="space-y-2">
              <Label>Current Status & Progress</Label>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-3 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{project.status.replace('_', ' ')}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="font-medium">{project.progress.percentage}%</p>
                </div>
              </div>
            </div>
          )}

          {project && mode === "edit" && (
            <div className="space-y-2">
              <Label>Target Regions</Label>
              <div className="flex flex-wrap gap-2">
                {project.targetRegions.map((region) => (
                  <span key={region.id} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {region.name} ({region.type})
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Project Image</Label>
            <Input type="file" accept="image/*" />
          </div>
          <div className="space-y-2">
            <Label>Documents (Optional)</Label>
            <Input type="file" accept=".pdf,.doc,.docx" multiple />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            className="bg-gradient-primary" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create Project" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
