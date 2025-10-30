import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { users as usersApi, locations, projects, schemes, type User, type Location } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
  mode: "create" | "edit";
  onSave?: () => void;
}

// Role hierarchy for permission checking
const roleHierarchy: Record<string, string[]> = {
  super_admin: ['super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin', 'project_coordinator', 'scheme_coordinator', 'beneficiary'],
  state_admin: ['district_admin', 'area_admin', 'unit_admin', 'project_coordinator', 'scheme_coordinator', 'beneficiary'],
  district_admin: ['area_admin', 'unit_admin', 'beneficiary'],
  area_admin: ['unit_admin', 'beneficiary'],
  unit_admin: ['beneficiary'],
  project_coordinator: [],
  scheme_coordinator: [],
  beneficiary: []
};

// Role display names
const roleNames: Record<string, string> = {
  super_admin: "Super Admin",
  state_admin: "State Admin",
  district_admin: "District Admin",
  area_admin: "Area Admin",
  unit_admin: "Unit Admin",
  project_coordinator: "Project Coordinator",
  scheme_coordinator: "Scheme Coordinator",
  beneficiary: "Beneficiary",
};

export function UserModal({ open, onOpenChange, user, mode, onSave }: UserModalProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [availableSchemes, setAvailableSchemes] = useState<any[]>([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [schemeSearch, setSchemeSearch] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'beneficiary',
    isActive: true,
    selectedRegion: '', // Single region selection
    selectedProjects: [] as string[], // For project coordinators
    selectedSchemes: [] as string[], // For scheme coordinators
  });

  useEffect(() => {
    if (open) {
      loadAvailableLocations();
      loadAvailableProjects();
      loadAvailableSchemes();

      if (mode === 'edit' && user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          role: user.role || 'beneficiary',
          isActive: user.isActive ?? true,
          selectedRegion: user.adminScope?.regions?.[0] || '', // Take first region for single select
          selectedProjects: user.adminScope?.projects || [],
          selectedSchemes: user.adminScope?.schemes || [],
        });
      } else {
        // Reset form for create mode
        setFormData({
          name: '',
          email: '',
          phone: '',
          role: 'beneficiary',
          isActive: true,
          selectedRegion: '',
          selectedProjects: [],
          selectedSchemes: [],
        });
      }
    }
  }, [open, mode, user]);

  const loadAvailableLocations = async () => {
    try {
      setLoading(true);
      const response = await locations.getAll({ limit: 100 });

      if (response.success) {
        setAvailableLocations(response.data?.locations || []);
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableProjects = async () => {
    try {
      const response = await projects.getAll({ limit: 100, status: 'active' });
      if (response.success) {
        setAvailableProjects(response.data?.projects || []);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadAvailableSchemes = async () => {
    try {
      const response = await schemes.getAll({ limit: 100, status: 'active' });
      if (response.success) {
        setAvailableSchemes(response.data?.schemes || []);
      }
    } catch (error) {
      console.error('Failed to load schemes:', error);
    }
  };

  const getAllowedRoles = () => {
    if (!currentUser) return [];
    return roleHierarchy[currentUser.role] || [];
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate required fields
      if (!formData.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Name is required",
          variant: "destructive",
        });
        return;
      }

      if (!formData.phone.trim()) {
        toast({
          title: "Validation Error",
          description: "Phone number is required",
          variant: "destructive",
        });
        return;
      }

      // Validate phone number format
      if (!/^[6-9]\d{9}$/.test(formData.phone)) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid 10-digit Indian mobile number",
          variant: "destructive",
        });
        return;
      }

      // Validate admin scope requirements
      if (formData.role !== 'beneficiary' && formData.role !== 'project_coordinator' && formData.role !== 'scheme_coordinator') {
        if (!formData.selectedRegion) {
          toast({
            title: "Validation Error",
            description: "Please select a regional access for this admin role",
            variant: "destructive",
          });
          return;
        }
      }

      // Validate project coordinator requirements
      if (formData.role === 'project_coordinator' && formData.selectedProjects.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please select at least one project for project coordinator",
          variant: "destructive",
        });
        return;
      }

      // Validate scheme coordinator requirements
      if (formData.role === 'scheme_coordinator' && formData.selectedSchemes.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please select at least one scheme for scheme coordinator",
          variant: "destructive",
        });
        return;
      }

      // Prepare user data
      const userData: any = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim(),
        role: formData.role,
        isActive: formData.isActive,
      };

      // Add admin scope for non-beneficiary roles
      if (formData.role !== 'beneficiary') {
        userData.adminScope = {
          level: formData.role.includes('admin') ? formData.role.replace('_admin', '') : formData.role,
          regions: formData.selectedRegion ? [formData.selectedRegion] : [],
          projects: formData.selectedProjects,
          schemes: formData.selectedSchemes
        };
      }

      let response;
      if (mode === 'create') {
        response = await usersApi.create(userData);
      } else {
        response = await usersApi.update(user!.id, userData);
      }

      if (response.success) {
        toast({
          title: "Success",
          description: `User ${mode === 'create' ? 'created' : 'updated'} successfully`,
        });

        onSave?.();
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${mode} user`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleProjectToggle = (projectId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedProjects: prev.selectedProjects.includes(projectId)
        ? prev.selectedProjects.filter(id => id !== projectId)
        : [...prev.selectedProjects, projectId]
    }));
  };

  const handleSchemeToggle = (schemeId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSchemes: prev.selectedSchemes.includes(schemeId)
        ? prev.selectedSchemes.filter(id => id !== schemeId)
        : [...prev.selectedSchemes, schemeId]
    }));
  };

  const getFilteredLocations = () => {
    return availableLocations.filter(location => {
      const matchesSearch = location.name.toLowerCase().includes(locationSearch.toLowerCase());
      // Filter locations based on role
      if (formData.role === 'state_admin') return location.type === 'state' && matchesSearch;
      if (formData.role === 'district_admin') return location.type === 'district' && matchesSearch;
      if (formData.role === 'area_admin') return location.type === 'area' && matchesSearch;
      if (formData.role === 'unit_admin') return location.type === 'unit' && matchesSearch;
      return matchesSearch;
    });
  };

  const getFilteredProjects = () => {
    return availableProjects.filter(project =>
      project.name.toLowerCase().includes(projectSearch.toLowerCase())
    );
  };

  const getFilteredSchemes = () => {
    return availableSchemes.filter(scheme =>
      scheme.name.toLowerCase().includes(schemeSearch.toLowerCase())
    );
  };

  const getTitle = () => {
    return mode === "create" ? "Add New User" : `Edit User - ${user?.name}`;
  };

  const allowedRoles = getAllowedRoles();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Basic Information</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Email (Optional)</Label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">User will login using OTP sent to this number</p>
              </div>
            </div>
          </div>

          {/* Role and Permissions */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Role & Permissions</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    role: value,
                    selectedRegion: '',
                    selectedProjects: [],
                    selectedSchemes: []
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleNames[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label className="text-sm">
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </Label>
                </div>
              </div>
            </div>

            {/* Regional Access for Admin Roles - Single Select with Search */}
            {formData.role !== 'beneficiary' && formData.role !== 'project_coordinator' && formData.role !== 'scheme_coordinator' && (
              <div className="space-y-2">
                <Label>Regional Access *</Label>
                {loading ? (
                  <div className="flex items-center gap-2 p-4 border rounded">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading locations...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search locations..."
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="border rounded-lg max-h-60 overflow-y-auto">
                      {getFilteredLocations().length === 0 ? (
                        <p className="text-sm text-muted-foreground p-4">
                          {availableLocations.length === 0 ? 'No locations available' : 'No locations found'}
                        </p>
                      ) : (
                        <div className="space-y-1 p-2">
                          {getFilteredLocations().map((location) => (
                            <button
                              key={location.id}
                              type="button"
                              className={`w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md transition-colors ${
                                formData.selectedRegion === location.id ? 'bg-blue-50 border border-blue-200' : ''
                              }`}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, selectedRegion: location.id }));
                              }}
                            >
                              <div className="font-medium">{location.name}</div>
                              <div className="text-sm text-gray-500 capitalize">{location.type}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {formData.selectedRegion && (
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="font-medium">Selected:</span>
                        <span>{availableLocations.find(l => l.id === formData.selectedRegion)?.name}</span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, selectedRegion: '' }))}
                          className="text-red-600 hover:text-red-700 text-xs underline"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Project Selection for Project Coordinators */}
            {formData.role === 'project_coordinator' && (
              <div className="space-y-2">
                <Label>Projects *</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search projects..."
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    {getFilteredProjects().length === 0 ? (
                      <p className="text-sm text-muted-foreground p-4">
                        {availableProjects.length === 0 ? 'No projects available' : 'No projects found'}
                      </p>
                    ) : (
                      <div className="space-y-1 p-2">
                        {getFilteredProjects().map((project) => (
                          <div key={project.id} className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 rounded">
                            <input
                              type="checkbox"
                              id={`project-${project.id}`}
                              checked={formData.selectedProjects.includes(project.id)}
                              onChange={() => handleProjectToggle(project.id)}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor={`project-${project.id}`} className="text-sm cursor-pointer flex-1">
                              <div className="font-medium">{project.name}</div>
                              <div className="text-xs text-gray-500">{project.code}</div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {formData.selectedProjects.length > 0 && (
                    <div className="text-sm text-gray-600">
                      Selected: {formData.selectedProjects.length} project(s)
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Scheme Selection for Scheme Coordinators */}
            {formData.role === 'scheme_coordinator' && (
              <div className="space-y-2">
                <Label>Schemes *</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search schemes..."
                      value={schemeSearch}
                      onChange={(e) => setSchemeSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    {getFilteredSchemes().length === 0 ? (
                      <p className="text-sm text-muted-foreground p-4">
                        {availableSchemes.length === 0 ? 'No schemes available' : 'No schemes found'}
                      </p>
                    ) : (
                      <div className="space-y-1 p-2">
                        {getFilteredSchemes().map((scheme) => (
                          <div key={scheme.id} className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 rounded">
                            <input
                              type="checkbox"
                              id={`scheme-${scheme.id}`}
                              checked={formData.selectedSchemes.includes(scheme.id)}
                              onChange={() => handleSchemeToggle(scheme.id)}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor={`scheme-${scheme.id}`} className="text-sm cursor-pointer flex-1">
                              <div className="font-medium">{scheme.name}</div>
                              <div className="text-xs text-gray-500">{scheme.code}</div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {formData.selectedSchemes.length > 0 && (
                    <div className="text-sm text-gray-600">
                      Selected: {formData.selectedSchemes.length} scheme(s)
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>


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
                {mode === "create" ? "Creating..." : "Saving..."}
              </>
            ) : (
              mode === "create" ? "Create User" : "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}