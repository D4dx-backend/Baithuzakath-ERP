import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { type Project, projects as projectsApi } from "@/lib/api";
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
    description: "",
    category: "",
    priority: "medium",
    scope: "",
    budget: "",
    coordinator: "",
  });
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when project changes
  useEffect(() => {
    if (project && mode === "edit") {
      setFormData({
        name: project.name || "",
        description: project.description || "",
        category: project.category || "",
        priority: project.priority || "medium",
        scope: project.scope || "",
        budget: project.budget?.total?.toString() || "",
        coordinator: project.coordinator?.name || "",
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
        description: "",
        category: "",
        priority: "medium",
        scope: "",
        budget: "",
        coordinator: "",
      });
      setStartDate(undefined);
      setEndDate(undefined);
    }
  }, [project, mode, open]);

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
      if (!formData.name || !formData.description || !formData.category || !formData.scope) {
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
        },
      };

      if (mode === "create") {
        const response = await projectsApi.create(projectData);
        if (response.success) {
          toast({
            title: "Success",
            description: "Project created successfully",
          });
          onOpenChange(false);
        } else {
          throw new Error(response.error || "Failed to create project");
        }
      } else if (mode === "edit" && project) {
        const response = await projectsApi.update(project.id, projectData);
        if (response.success) {
          toast({
            title: "Success",
            description: "Project updated successfully",
          });
          onOpenChange(false);
        } else {
          throw new Error(response.error || "Failed to update project");
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${mode === "create" ? "create" : "update"} project`,
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
          <div className="space-y-2">
            <Label>Project Title</Label>
            <Input 
              placeholder="Enter project title" 
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
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
              <Input 
                placeholder="Coordinator name" 
                value={formData.coordinator}
                onChange={(e) => handleInputChange("coordinator", e.target.value)}
                disabled={mode === "edit"}
              />
              {mode === "edit" && (
                <div className="text-sm text-muted-foreground">
                  Role: {project?.coordinator.role.replace('_', ' ')} | 
                  Email: {project?.coordinator.email}
                </div>
              )}
            </div>
          </div>

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
