import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { locations, type Location } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface LocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: Location;
  mode: "create" | "edit";
  locationType: "district" | "area" | "unit";
  onSave?: () => void;
}

export function LocationModal({ open, onOpenChange, location, mode, locationType, onSave }: LocationModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parentLocations, setParentLocations] = useState<Location[]>([]);
  
  // Form state - simplified to only essential fields
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    parent: ''
  });

  useEffect(() => {
    if (open) {
      loadParentLocations();
      
      if (mode === 'edit' && location) {
        setFormData({
          name: location.name || '',
          code: location.code || '',
          parent: location.parent?.id || ''
        });
      } else {
        // Reset form for create mode
        setFormData({
          name: '',
          code: '',
          parent: ''
        });
      }
    }
  }, [open, mode, location]);

  const loadParentLocations = async () => {
    if (locationType === 'district') return; // Districts don't have parents
    
    try {
      setLoading(true);
      const parentType = locationType === 'area' ? 'district' : 'area';
      const response = await locations.getByType(parentType, { active: true });
      
      if (response.success) {
        setParentLocations(response.data?.locations || []);
      }
    } catch (error) {
      console.error('Failed to load parent locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate required fields
      if (!formData.name.trim()) {
        toast({
          title: "Validation Error",
          description: `${locationType.charAt(0).toUpperCase() + locationType.slice(1)} name is required`,
          variant: "destructive",
        });
        return;
      }

      // For districts, auto-generate code from name
      let finalCode = formData.code;
      if (locationType === 'district') {
        finalCode = formData.name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z_]/g, '');
      } else {
        // For areas and units, code is required
        if (!formData.code.trim()) {
          toast({
            title: "Validation Error", 
            description: `${locationType.charAt(0).toUpperCase() + locationType.slice(1)} code is required`,
            variant: "destructive",
          });
          return;
        }
      }

      if (locationType !== 'district' && !formData.parent) {
        toast({
          title: "Validation Error",
          description: `Parent ${locationType === 'area' ? 'district' : 'area'} is required`,
          variant: "destructive",
        });
        return;
      }

      // Prepare data for API
      const locationData: Partial<Location> = {
        name: formData.name.trim(),
        code: finalCode.trim().toUpperCase(),
        type: locationType
      };

      // Add parent if not district
      if (locationType !== 'district' && formData.parent) {
        locationData.parent = { id: formData.parent } as any;
      }

      let response;
      if (mode === 'create') {
        response = await locations.create(locationData);
      } else {
        response = await locations.update(location!.id, locationData);
      }

      if (response.success) {
        toast({
          title: "Success",
          description: `${locationType.charAt(0).toUpperCase() + locationType.slice(1)} ${mode === 'create' ? 'created' : 'updated'} successfully`,
        });
        
        onSave?.();
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${mode} ${locationType}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getTitle = () => {
    const type = locationType.charAt(0).toUpperCase() + locationType.slice(1);
    return mode === "create" ? `Add New ${type}` : `Edit ${type}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* District Form - Only Name */}
          {locationType === "district" && (
            <div className="space-y-2">
              <Label>District Name *</Label>
              <Input 
                placeholder="Enter district name" 
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const code = name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z_]/g, '');
                  setFormData(prev => ({ ...prev, name, code }));
                }}
              />
              {formData.name && (
                <p className="text-xs text-muted-foreground">
                  Code will be: <span className="font-mono">{formData.name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z_]/g, '')}</span>
                </p>
              )}
            </div>
          )}

          {/* Area Form - Name, Code, District */}
          {locationType === "area" && (
            <>
              <div className="space-y-2">
                <Label>Area Name *</Label>
                <Input 
                  placeholder="Enter area name" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input 
                  placeholder="Enter area code" 
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                />
              </div>

              <div className="space-y-2">
                <Label>District *</Label>
                {loading ? (
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading districts...</span>
                  </div>
                ) : (
                  <Select 
                    value={formData.parent} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, parent: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {parentLocations.map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </>
          )}

          {/* Unit Form - Name, Code, Area */}
          {locationType === "unit" && (
            <>
              <div className="space-y-2">
                <Label>Unit Name *</Label>
                <Input 
                  placeholder="Enter unit name" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input 
                  placeholder="Enter unit code" 
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Area *</Label>
                {loading ? (
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading areas...</span>
                  </div>
                ) : (
                  <Select 
                    value={formData.parent} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, parent: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      {parentLocations.map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button 
            className="bg-gradient-primary" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "create" ? "Adding..." : "Saving..."}
              </>
            ) : (
              mode === "create" ? "Add" : "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
