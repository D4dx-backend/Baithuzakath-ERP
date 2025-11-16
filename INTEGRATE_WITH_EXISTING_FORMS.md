# Integrating File Upload with Existing Form Configuration

## Overview
This guide shows how to add file upload fields to your existing form configuration system.

## Step 1: Update Form Configuration Model

Your `FormConfiguration` model should support file upload fields. Add this field type to your form builder:

```javascript
{
  type: 'file',
  name: 'supporting_documents',
  label: 'Supporting Documents',
  required: true,
  multiple: true,
  maxFiles: 5,
  accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  helpText: 'Upload supporting documents (PDF, DOC, or images)'
}
```

## Step 2: Render File Upload Fields

In your form renderer component, add a case for file fields:

```tsx
const renderField = (field: any, schemeId: string) => {
  switch (field.type) {
    case 'file':
      return (
        <FileUpload
          key={field.name}
          formId={schemeId}
          fieldName={field.name}
          multiple={field.multiple || false}
          maxFiles={field.maxFiles || 10}
          onUploadSuccess={(files) => {
            // Update form data with uploaded file URLs
            setFormData(prev => ({
              ...prev,
              [field.name]: files.map(f => ({
                url: f.url,
                key: f.key,
                name: f.originalName,
                size: f.size,
                type: f.mimetype
              }))
            }));
          }}
          onUploadError={(error) => {
            console.error(`Upload error for ${field.name}:`, error);
          }}
        />
      );
    
    case 'text':
      return (
        <input
          key={field.name}
          type="text"
          name={field.name}
          placeholder={field.placeholder}
          required={field.required}
        />
      );
    
    // ... other field types
  }
};
```

## Step 3: Update Application Model

Ensure your Application model can store file URLs:

```javascript
// In your Application schema
const applicationSchema = new mongoose.Schema({
  beneficiaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Beneficiary',
    required: true
  },
  schemeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scheme',
    required: true
  },
  formData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
    // This will store all form fields including file URLs
    // Example:
    // {
    //   name: "John Doe",
    //   email: "john@example.com",
    //   supporting_documents: [
    //     {
    //       url: "https://...",
    //       key: "forms/...",
    //       name: "document.pdf",
    //       size: 102400,
    //       type: "application/pdf"
    //     }
    //   ]
    // }
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'],
    default: 'draft'
  },
  submittedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});
```

## Step 4: Form Submission Handler

Update your form submission to include file URLs:

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        beneficiaryId: currentUser.id,
        schemeId: schemeId,
        formData: formData, // Includes file URLs
        status: 'submitted',
        submittedAt: new Date()
      })
    });

    if (response.ok) {
      alert('Application submitted successfully!');
      // Redirect or show success message
    }
  } catch (error) {
    console.error('Submission error:', error);
    alert('Failed to submit application');
  }
};
```

## Step 5: Display Uploaded Files

When viewing an application, display the uploaded files:

```tsx
const ApplicationView = ({ application }) => {
  const renderFileField = (fieldName: string, files: any[]) => {
    if (!files || files.length === 0) return null;

    return (
      <div className="file-field">
        <h4>{fieldName.replace(/_/g, ' ').toUpperCase()}</h4>
        <ul>
          {files.map((file, index) => (
            <li key={index}>
              <a 
                href={file.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="file-link"
              >
                {getFileIcon(file.name)} {file.name}
              </a>
              <span className="file-size">
                ({formatFileSize(file.size)})
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="application-view">
      <h2>Application Details</h2>
      
      {/* Display text fields */}
      <div>
        <strong>Name:</strong> {application.formData.name}
      </div>
      <div>
        <strong>Email:</strong> {application.formData.email}
      </div>

      {/* Display file fields */}
      {renderFileField('Identity Proof', application.formData.identity_proof)}
      {renderFileField('Supporting Documents', application.formData.supporting_documents)}
    </div>
  );
};
```

## Step 6: Add File Upload to Form Builder UI

In your form builder interface, add file field configuration:

```tsx
const FileFieldConfig = ({ field, onChange }) => {
  return (
    <div className="field-config">
      <input
        type="text"
        placeholder="Field Name"
        value={field.name}
        onChange={(e) => onChange({ ...field, name: e.target.value })}
      />
      
      <input
        type="text"
        placeholder="Label"
        value={field.label}
        onChange={(e) => onChange({ ...field, label: e.target.value })}
      />
      
      <label>
        <input
          type="checkbox"
          checked={field.multiple}
          onChange={(e) => onChange({ ...field, multiple: e.target.checked })}
        />
        Allow Multiple Files
      </label>
      
      {field.multiple && (
        <input
          type="number"
          placeholder="Max Files"
          value={field.maxFiles || 10}
          onChange={(e) => onChange({ ...field, maxFiles: parseInt(e.target.value) })}
        />
      )}
      
      <input
        type="text"
        placeholder="Accepted File Types (e.g., .pdf,.doc,.jpg)"
        value={field.accept}
        onChange={(e) => onChange({ ...field, accept: e.target.value })}
      />
      
      <label>
        <input
          type="checkbox"
          checked={field.required}
          onChange={(e) => onChange({ ...field, required: e.target.checked })}
        />
        Required
      </label>
    </div>
  );
};
```

## Step 7: Validation

Add validation for file fields:

```tsx
const validateForm = (formData: any, formConfig: any) => {
  const errors: any = {};

  formConfig.pages.forEach((page: any) => {
    page.fields.forEach((field: any) => {
      if (field.required && field.type === 'file') {
        if (!formData[field.name] || formData[field.name].length === 0) {
          errors[field.name] = `${field.label} is required`;
        }
      }
      
      if (field.type === 'file' && field.multiple && field.maxFiles) {
        if (formData[field.name] && formData[field.name].length > field.maxFiles) {
          errors[field.name] = `Maximum ${field.maxFiles} files allowed`;
        }
      }
    });
  });

  return errors;
};
```

## Step 8: Clean Up Files on Application Deletion

When deleting an application, also delete associated files:

```javascript
// In your application controller
const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Extract all file keys from form data
    const fileKeys = [];
    Object.values(application.formData).forEach(value => {
      if (Array.isArray(value)) {
        value.forEach(item => {
          if (item.key) fileKeys.push(item.key);
        });
      } else if (value && value.key) {
        fileKeys.push(value.key);
      }
    });

    // Delete files from DigitalOcean Spaces
    if (fileKeys.length > 0) {
      await fileUploadService.deleteMultipleFiles(fileKeys);
    }

    // Delete application
    await application.remove();

    res.json({ message: 'Application and files deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Failed to delete application' });
  }
};
```

## Complete Example: Dynamic Form with File Upload

```tsx
import React, { useState, useEffect } from 'react';
import FileUpload from '../components/FileUpload';
import { uploadFormFiles, formatFileSize, getFileIcon } from '../utils/fileUploadHelper';

const DynamicApplicationForm = ({ schemeId }) => {
  const [formConfig, setFormConfig] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load form configuration
    fetch(`/api/schemes/${schemeId}/form-config`)
      .then(res => res.json())
      .then(data => {
        setFormConfig(data.formConfiguration);
        setLoading(false);
      });
  }, [schemeId]);

  const renderField = (field) => {
    switch (field.type) {
      case 'file':
        return (
          <div key={field.name} className="form-field">
            <label>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            
            <FileUpload
              formId={schemeId}
              fieldName={field.name}
              multiple={field.multiple}
              maxFiles={field.maxFiles}
              onUploadSuccess={(files) => {
                setFormData(prev => ({
                  ...prev,
                  [field.name]: files.map(f => ({
                    url: f.url,
                    key: f.key,
                    name: f.originalName,
                    size: f.size,
                    type: f.mimetype
                  }))
                }));
                setErrors(prev => ({ ...prev, [field.name]: null }));
              }}
              onUploadError={(error) => {
                setErrors(prev => ({ ...prev, [field.name]: error }));
              }}
            />
            
            {field.helpText && (
              <small className="help-text">{field.helpText}</small>
            )}
            
            {errors[field.name] && (
              <span className="error">{errors[field.name]}</span>
            )}
          </div>
        );

      case 'text':
        return (
          <div key={field.name} className="form-field">
            <label>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <input
              type="text"
              value={formData[field.name] || ''}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
              placeholder={field.placeholder}
              required={field.required}
            />
            {field.helpText && (
              <small className="help-text">{field.helpText}</small>
            )}
          </div>
        );

      // Add more field types...
      default:
        return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const validationErrors = {};
    formConfig.pages.forEach(page => {
      page.fields.forEach(field => {
        if (field.required && !formData[field.name]) {
          validationErrors[field.name] = `${field.label} is required`;
        }
      });
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Submit
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          schemeId,
          formData,
          status: 'submitted'
        })
      });

      if (response.ok) {
        alert('Application submitted successfully!');
      }
    } catch (error) {
      alert('Submission failed: ' + error.message);
    }
  };

  if (loading) return <div>Loading form...</div>;
  if (!formConfig) return <div>Form not found</div>;

  return (
    <form onSubmit={handleSubmit} className="dynamic-form">
      <h2>{formConfig.title}</h2>
      <p>{formConfig.description}</p>

      {formConfig.pages.map((page, pageIndex) => (
        <div key={pageIndex} className="form-page">
          <h3>{page.title}</h3>
          {page.description && <p>{page.description}</p>}
          
          {page.fields.map(field => renderField(field))}
        </div>
      ))}

      <button type="submit">Submit Application</button>
    </form>
  );
};

export default DynamicApplicationForm;
```

## Summary

You now have:
1. ✅ File upload service integrated with DigitalOcean Spaces
2. ✅ Reusable components for file uploads
3. ✅ Form configuration support for file fields
4. ✅ Complete examples for integration
5. ✅ File management (upload, delete, list)
6. ✅ Validation and error handling

Start by adding a file field to your form configuration and test it!
