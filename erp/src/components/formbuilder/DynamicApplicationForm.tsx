import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FileUploadField } from './FileUploadField';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Field {
  id: number;
  label: string;
  type: string;
  required: boolean;
  enabled: boolean;
  placeholder?: string;
  options?: string[];
}

interface Page {
  id: number;
  title: string;
  fields: Field[];
}

interface FormConfig {
  title: string;
  description: string;
  pages: Page[];
}

interface DynamicApplicationFormProps {
  schemeId: string;
  onSubmitSuccess?: (applicationId: string) => void;
}

export function DynamicApplicationForm({ schemeId, onSubmitSuccess }: DynamicApplicationFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    loadFormConfiguration();
  }, [schemeId]);

  const loadFormConfiguration = async () => {
    setLoading(true);
    try {
      const response = await api.getFormConfiguration(schemeId);
      
      if (response.data.hasConfiguration) {
        setFormConfig(response.data.formConfiguration);
      } else {
        toast({
          title: 'Form not available',
          description: 'This scheme does not have an application form configured yet.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Failed to load form:', error);
      toast({
        title: 'Error loading form',
        description: error.message || 'Failed to load application form',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateField = (field: Field, value: any): string | null => {
    if (field.required && !value) {
      return `${field.label} is required`;
    }

    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Invalid email address';
      }
    }

    if (field.type === 'phone' && value) {
      const phoneRegex = /^[+]?[\d\s-()]+$/;
      if (!phoneRegex.test(value)) {
        return 'Invalid phone number';
      }
    }

    if (field.type === 'file' && field.required && (!value || value.length === 0)) {
      return `${field.label} is required`;
    }

    return null;
  };

  const validateCurrentPage = (): boolean => {
    if (!formConfig) return false;

    const currentPageData = formConfig.pages[currentPage];
    const newErrors: Record<string, string> = {};

    currentPageData.fields.forEach(field => {
      if (!field.enabled) return;
      
      const error = validateField(field, formData[`field_${field.id}`]);
      if (error) {
        newErrors[`field_${field.id}`] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentPage()) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    setCurrentPage(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCurrentPage()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.submitApplication({
        schemeId,
        formData
      });

      toast({
        title: 'Application submitted!',
        description: 'Your application has been submitted successfully.',
      });

      onSubmitSuccess?.(response.data.applicationId);
    } catch (error: any) {
      console.error('Submission error:', error);
      t