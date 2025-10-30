import { useState, useEffect } from "react";
import { Eye, Code, Save, Copy, Download, Settings2, ArrowLeft, Loader2, MoreVertical, FileText } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FieldTypeSelector } from "@/components/formbuilder/FieldTypeSelector";
import { FormCanvas } from "@/components/formbuilder/FormCanvas";
import { FormPreview } from "@/components/formbuilder/FormPreview";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useRBAC } from "@/hooks/useRBAC";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Field {
  id: number;
  label: string;
  type: string;
  required: boolean;
  enabled: boolean;
  placeholder?: string;
  options?: string[];
  validation?: string;
  columns?: number;
  conditionalLogic?: {
    field: number;
    operator: string;
    value: string;
  };
}

interface Page {
  id: number;
  title: string;
  fields: Field[];
}

export default function FormBuilder() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasAnyPermission } = useRBAC();
  
  // Permission check - form builder requires scheme management permissions
  const canManageForms = hasAnyPermission(['schemes.create', 'schemes.update.all', 'schemes.update.assigned']);
  
  // Get scheme context from URL parameters
  const schemeId = searchParams.get('schemeId');
  const schemeName = searchParams.get('schemeName');
  
  const [formTitle, setFormTitle] = useState("Student Scholarship Application");
  const [formDescription, setFormDescription] = useState("Application form for students seeking financial assistance for higher education.");
  const [formEnabled, setFormEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [selectedScheme, setSelectedScheme] = useState("scholarship");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [formVersion, setFormVersion] = useState(1);
  const [isDefaultTemplate, setIsDefaultTemplate] = useState(false);

  const schemes = [
    { id: 1, value: "scholarship", label: "Student Scholarship Program" },
    { id: 2, value: "medical", label: "Medical Assistance" },
    { id: 3, value: "housing", label: "Housing Support" },
    { id: 4, value: "education", label: "Educational Aid" },
  ];

  // Load form configuration when component mounts or scheme changes
  useEffect(() => {
    const loadFormConfiguration = async () => {
      if (!schemeId) {
        setInitialLoad(false);
        return;
      }

      setLoading(true);
      try {
        const response = await api.getFormConfiguration(schemeId);
        const hasConfiguration = response.data.hasConfiguration;
        
        if (hasConfiguration) {
          const config = response.data.formConfiguration;
          setFormTitle(config.title);
          setFormDescription(config.description);
          setFormEnabled(config.enabled);
          setEmailNotifications(config.emailNotifications);
          setSelectedScheme(schemeId);
          setPages(config.pages);
          
          if (config.lastModified) {
            setLastSaved(new Date(config.lastModified));
          }
          setHasUnsavedChanges(false);
          setIsPublished(config.isPublished || false);
          setFormVersion(config.version || 1);
          setIsDefaultTemplate(false);

          toast({
            title: "Form configuration loaded",
            description: `Successfully loaded existing form configuration${config.lastModified ? ` (last updated: ${new Date(config.lastModified).toLocaleDateString()})` : ''}.`
          });
        } else {
          // No form configuration exists - set up for new form creation
          if (schemeName) {
            setFormTitle(`${decodeURIComponent(schemeName)} Application Form`);
            setFormDescription(`Application form for ${decodeURIComponent(schemeName)} scheme.`);
          }
          setSelectedScheme(schemeId);
          setPages([]);
          setHasUnsavedChanges(false);
          setIsDefaultTemplate(true);
          setIsPublished(false);
          setFormVersion(1);

          toast({
            title: "Create new form",
            description: "No form exists for this scheme. Create your custom form by adding pages and fields.",
            variant: "default"
          });
        }
      } catch (error: any) {
        console.error('Failed to load form configuration:', error);
        
        // If loading fails, set default values for the scheme
        if (schemeName) {
          setFormTitle(`${decodeURIComponent(schemeName)} Application Form`);
          setFormDescription(`Application form for ${decodeURIComponent(schemeName)} scheme.`);
          setSelectedScheme(schemeId);
        }

        // Handle different error types
        if (error.message?.includes('401') || error.message?.includes('Authentication')) {
          toast({
            title: "Authentication required",
            description: "Please log in to access form configuration.",
            variant: "destructive"
          });
        } else if (error.message?.includes('404')) {
          toast({
            title: "Scheme not found",
            description: "The specified scheme could not be found.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Using default configuration",
            description: "Could not load existing form configuration. Using default template.",
            variant: "destructive"
          });
        }
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    if (initialLoad) {
      loadFormConfiguration();
    }
  }, [schemeId, schemeName, initialLoad, toast]);
  
  const [pages, setPages] = useState<Page[]>([
    {
      id: 1,
      title: "Personal Information",
      fields: [
        { id: 1, label: "Full Name", type: "text", required: true, enabled: true, placeholder: "Enter your full name" },
        { id: 2, label: "Email Address", type: "email", required: true, enabled: true, placeholder: "your@email.com" },
        { id: 3, label: "Phone Number", type: "phone", required: true, enabled: true, placeholder: "+91 XXXXXXXXXX" },
        { id: 4, label: "Date of Birth", type: "date", required: true, enabled: true },
      ]
    },
    {
      id: 2,
      title: "Financial Details",
      fields: [
        { id: 5, label: "Annual Income", type: "number", required: true, enabled: true, placeholder: "Enter amount" },
        { id: 6, label: "Purpose of Application", type: "textarea", required: true, enabled: true, placeholder: "Describe your purpose" },
        { id: 7, label: "Supporting Documents", type: "file", required: false, enabled: true },
      ]
    }
  ]);
  const [showPreview, setShowPreview] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const addField = (pageId: number, field: Field) => {
    const newPages = pages.map(page => {
      if (page.id === pageId) {
        return {
          ...page,
          fields: [...page.fields, field]
        };
      }
      return page;
    });
    setPages(newPages);
    setHasUnsavedChanges(true);
  };

  const addFirstPage = () => {
    const newPage: Page = {
      id: 1,
      title: "Personal Information",
      fields: [
        { id: 1, label: "Full Name", type: "text", required: true, enabled: true, placeholder: "Enter your full name" },
        { id: 2, label: "Email Address", type: "email", required: true, enabled: true, placeholder: "your@email.com" },
        { id: 3, label: "Phone Number", type: "phone", required: true, enabled: true, placeholder: "+91 XXXXXXXXXX" }
      ]
    };
    setPages([newPage]);
    setHasUnsavedChanges(true);
    setIsDefaultTemplate(false);
  };

  const addFieldToCurrentPage = (type: string) => {
    if (pages.length === 0) {
      addFirstPage();
      return;
    }
    
    const currentPage = pages[0]; // Add to first page by default
    const newField: Field = {
      id: Math.max(...pages.flatMap(p => p.fields.map(f => f.id)), 0) + 1,
      label: `New ${type} Field`,
      type,
      required: false,
      enabled: true,
    };
    addField(currentPage.id, newField);
    setHasUnsavedChanges(true);
  };

  const getTotalFields = () => pages.reduce((sum, page) => sum + page.fields.length, 0);
  const getRequiredFields = () => pages.reduce((sum, page) => 
    sum + page.fields.filter(f => f.required).length, 0);
  const getOptionalFields = () => getTotalFields() - getRequiredFields();

  const copyEmbedCode = () => {
    navigator.clipboard.writeText('<iframe src="https://baithuzzakath.org/apply/scholarship" width="100%" height="600"></iframe>');
    toast({ title: "Embed code copied to clipboard!" });
  };

  const saveFormConfiguration = async () => {
    if (!schemeId) {
      toast({
        title: "Cannot save",
        description: "No scheme selected. Please navigate from scheme management.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const formData = {
        title: formTitle,
        description: formDescription,
        enabled: formEnabled,
        emailNotifications,
        pages
      };

      await api.updateFormConfiguration(schemeId, formData);
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setIsDefaultTemplate(false); // No longer using default template after saving
      
      toast({
        title: "Form saved successfully!",
        description: "Form configuration has been saved for this scheme."
      });
    } catch (error: any) {
      console.error('Failed to save form configuration:', error);
      
      let errorMessage = "Failed to save form configuration. Please try again.";
      
      if (error.message?.includes('401') || error.message?.includes('Authentication')) {
        errorMessage = "Authentication required. Please log in to save changes.";
      } else if (error.message?.includes('403')) {
        errorMessage = "You don't have permission to modify this scheme's form configuration.";
      } else if (error.message?.includes('404')) {
        errorMessage = "Scheme not found. Please check if the scheme still exists.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Save failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const publishForm = async () => {
    if (!schemeId) return;

    setSaving(true);
    try {
      await api.request(`/schemes/${schemeId}/form-config/publish`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublished: true }),
      });
      setIsPublished(true);
      
      toast({
        title: "Form published successfully!",
        description: "Your form is now live and accepting applications."
      });
    } catch (error: any) {
      console.error('Failed to publish form:', error);
      toast({
        title: "Publish failed",
        description: error.response?.data?.message || "Failed to publish form. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const exportFormJSON = () => {
    const formData = {
      title: formTitle,
      description: formDescription,
      scheme: selectedScheme,
      enabled: formEnabled,
      emailNotifications,
      pages
    };
    const blob = new Blob([JSON.stringify(formData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'form-config.json';
    a.click();
    toast({ title: "Form configuration exported!" });
  };
  // Access denied check
  if (!canManageForms) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don't have permission to manage form configurations.
          </p>
        </div>
      </div>
    );
  }

  if (loading && initialLoad) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading form configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          {schemeId && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/schemes')} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Schemes</span>
            </Button>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Form Builder</h1>
            {schemeId && schemeName && (
              <p className="text-muted-foreground text-sm mt-1">
                {decodeURIComponent(schemeName)}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-xs text-muted-foreground hidden lg:block">
              Last saved: {lastSaved.toLocaleTimeString()}
              {hasUnsavedChanges && <span className="text-amber-600 ml-1">• Unsaved</span>}
            </span>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowPreview(true)}
            disabled={pages.length === 0}
            className="hidden sm:flex"
          >
            <Eye className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
          
          <Button 
            size="sm"
            className="bg-gradient-primary shadow-glow" 
            onClick={saveFormConfiguration}
            disabled={saving || !schemeId || pages.length === 0}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">
              {saving ? "Saving..." : hasUnsavedChanges ? "Save Changes" : "Save"}
            </span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowSettings(true)}>
                <Settings2 className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowPreview(true)}
                disabled={pages.length === 0}
                className="sm:hidden"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowEmbedCode(true)}>
                <Code className="mr-2 h-4 w-4" />
                Embed Code
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportFormJSON}>
                <Download className="mr-2 h-4 w-4" />
                Export JSON
              </DropdownMenuItem>
              {schemeId && !isPublished && (
                <DropdownMenuItem 
                  onClick={publishForm}
                  disabled={saving || hasUnsavedChanges}
                  className="text-green-600"
                >
                  <span className="mr-2">🚀</span>
                  Publish Form
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {!schemeId && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-amber-600 text-xs font-medium">⚠</span>
            </div>
            <div>
              <h4 className="text-amber-800 font-medium mb-1">No Scheme Selected</h4>
              <p className="text-amber-700 text-sm">
                You are editing a form without a specific scheme context. Changes cannot be saved.
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => navigate('/schemes')}
                  className="text-amber-800 underline p-0 ml-1 h-auto"
                >
                  Go to Schemes
                </Button>
              </p>
            </div>
          </div>
        </div>
      )}

      {isDefaultTemplate && schemeId && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-green-600 text-xs font-medium">+</span>
            </div>
            <div>
              <h4 className="text-green-800 font-medium mb-1">Create New Form</h4>
              <p className="text-green-700 text-sm">
                This scheme doesn't have a form yet. Start by adding pages and fields to create your custom application form.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full">
        {pages.length === 0 ? (
          <Card className="p-8 text-center max-w-2xl mx-auto">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">No Pages Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start building your form by adding the first page. Each page can contain multiple fields.
              </p>
              <Button 
                onClick={addFirstPage}
                className="bg-gradient-primary shadow-glow"
              >
                Add First Page
              </Button>
            </div>
          </Card>
        ) : (
          <FormCanvas 
            pages={pages} 
            onUpdatePages={setPages}
            onAddField={addField}
          />
        )}
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Form Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Form Title</Label>
                <Input 
                  value={formTitle} 
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="e.g., Student Scholarship Application"
                />
              </div>
              <div className="space-y-2">
                <Label>Associated Scheme</Label>
                <Select value={selectedScheme} onValueChange={setSelectedScheme} disabled={!!schemeId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {schemeId ? (
                      <SelectItem value={schemeId}>
                        {decodeURIComponent(schemeName || 'Current Scheme')}
                      </SelectItem>
                    ) : (
                      schemes.map((scheme) => (
                        <SelectItem key={scheme.id} value={scheme.value}>
                          {scheme.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {schemeId && (
                  <p className="text-xs text-muted-foreground">
                    Scheme is locked when editing from scheme management.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Form Description</Label>
              <Textarea 
                value={formDescription}
                onChange={(e) => {
                  setFormDescription(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                placeholder="Describe the purpose and requirements of this form..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="form-enabled">Form Enabled</Label>
                <Switch 
                  id="form-enabled" 
                  checked={formEnabled}
                  onCheckedChange={setFormEnabled}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="email-notification">Email Notifications</Label>
                <Switch 
                  id="email-notification" 
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Form Preview</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="desktop" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="desktop">Desktop View</TabsTrigger>
              <TabsTrigger value="mobile">Mobile View</TabsTrigger>
            </TabsList>
            <TabsContent value="desktop" className="mt-4">
              <FormPreview 
                formTitle={formTitle}
                formDescription={formDescription}
                pages={pages}
              />
            </TabsContent>
            <TabsContent value="mobile" className="mt-4">
              <div className="mx-auto max-w-sm">
                <FormPreview 
                  formTitle={formTitle}
                  formDescription={formDescription}
                  pages={pages}
                />
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Embed Code Dialog */}
      <Dialog open={showEmbedCode} onOpenChange={setShowEmbedCode}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Embed Form Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Embed Code (iFrame)</Label>
                <Button size="sm" variant="outline" onClick={copyEmbedCode}>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              <Textarea 
                value={`<iframe src="https://baithuzzakath.org/apply/${selectedScheme}" width="100%" height="800" frameborder="0"></iframe>`}
                readOnly
                rows={3}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Direct Link</Label>
                <Button size="sm" variant="outline" onClick={() => {
                  navigator.clipboard.writeText(`https://baithuzzakath.org/apply/${selectedScheme}`);
                  toast({ title: "Link copied!" });
                }}>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              <Input 
                value={`https://baithuzzakath.org/apply/${selectedScheme}`}
                readOnly 
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>React Component</Label>
              <Textarea 
                value={`import { FormEmbed } from '@/components/FormEmbed';\n\n<FormEmbed formId="${selectedScheme}" />`}
                readOnly
                rows={3}
                className="font-mono text-xs"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Embed Code Dialog */}
      <Dialog open={showEmbedCode} onOpenChange={setShowEmbedCode}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Embed Form Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Embed Code (iFrame)</Label>
                <Button size="sm" variant="outline" onClick={copyEmbedCode}>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              <Textarea 
                value='<iframe src="https://baithuzzakath.org/apply/scholarship" width="100%" height="600"></iframe>'
                readOnly
                rows={3}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Public Form URL</Label>
                <Button size="sm" variant="outline" onClick={() => {
                  navigator.clipboard.writeText('https://baithuzzakath.org/apply/scholarship');
                  toast({ title: "URL copied!" });
                }}>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              <Input 
                value="https://baithuzzakath.org/apply/scholarship" 
                readOnly 
                className="text-xs font-mono"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
