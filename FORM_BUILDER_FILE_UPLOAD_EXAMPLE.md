# Form Builder File Upload Integration Example

## Quick Start

### 1. Import the Helper Functions

```tsx
import {
  uploadFormFiles,
  deleteFile,
  validateFile,
  formatFileSize,
  getFileIcon
} from '../utils/fileUploadHelper';
```

### 2. Basic Form with File Upload

```tsx
import React, { useState } from 'react';
import { uploadFormFiles, validateFile, formatFileSize } from '../utils/fileUploadHelper';

const ApplicationForm = ({ schemeId }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    documents: [] // Will store uploaded file URLs
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    // Validate files
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
    }

    setUploading(true);
    
    try {
      // Upload files to DigitalOcean Spaces
      const uploadedFiles = await uploadFormFiles(
        files,
        schemeId,
        'supporting_documents',
        (progress) => setUploadProgress(progress)
      );

      // Save file URLs to form data
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, ...uploadedFiles.map(f => ({
          url: f.url,
          key: f.key,
          name: f.originalName,
          size: f.size
        }))]
      }));

      alert('Files uploaded successfully!');
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Submit form with file URLs
    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      alert('Application submitted successfully!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Name:</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <label>Email:</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div>
        <label>Supporting Documents:</label>
        <input
          type="file"
          multiple
          onChange={handleFileUpload}
          disabled={uploading}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
        {uploading && <div>Uploading... {uploadProgress}%</div>}
      </div>

      {formData.documents.length > 0 && (
        <div>
          <h4>Uploaded Files:</h4>
          <ul>
            {formData.documents.map((doc, index) => (
              <li key={index}>
                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                  {doc.name}
                </a>
                <span> ({formatFileSize(doc.size)})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button type="submit" disabled={uploading}>
        Submit Application
      </button>
    </form>
  );
};

export default ApplicationForm;
```

## Advanced Example: Dynamic Form Builder

```tsx
import React, { useState } from 'react';
import { uploadFormFiles, deleteFile, validateFile } from '../utils/fileUploadHelper';

const DynamicFormBuilder = ({ formConfig, schemeId }) => {
  const [formData, setFormData] = useState({});
  const [uploadingFields, setUploadingFields] = useState({});

  const handleFileFieldChange = async (fieldName, files) => {
    setUploadingFields(prev => ({ ...prev, [fieldName]: true }));

    try {
      const uploadedFiles = await uploadFormFiles(
        Array.from(files),
        schemeId,
        fieldName
      );

      setFormData(prev => ({
        ...prev,
        [fieldName]: uploadedFiles.map(f => ({
          url: f.url,
          key: f.key,
          name: f.originalName,
          size: f.size,
          type: f.mimetype
        }))
      }));
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploadingFields(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleDeleteFile = async (fieldName, fileKey, index) => {
    if (!confirm('Delete this file?')) return;

    try {
      await deleteFile(fileKey);
      
      setFormData(prev => ({
        ...prev,
        [fieldName]: prev[fieldName].filter((_, i) => i !== index)
      }));
    } catch (error) {
      alert(`Delete failed: ${error.message}`);
    }
  };

  const renderField = (field) => {
    switch (field.type) {
      case 'file':
        return (
          <div key={field.name}>
            <label>{field.label}</label>
            <input
              type="file"
              multiple={field.multiple}
              accept={field.accept}
              onChange={(e) => handleFileFieldChange(field.name, e.target.files)}
              disabled={uploadingFields[field.name]}
            />
            
            {uploadingFields[field.name] && <div>Uploading...</div>}
            
            {formData[field.name] && formData[field.name].length > 0 && (
              <div className="uploaded-files">
                {formData[field.name].map((file, index) => (
                  <div key={index} className="file-item">
                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                      {file.name}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(field.name, file.key, index)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'text':
        return (
          <div key={field.name}>
            <label>{field.label}</label>
            <input
              type="text"
              value={formData[field.name] || ''}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
              required={field.required}
            />
          </div>
        );

      // Add more field types as needed
      default:
        return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Submit form data with file URLs
    console.log('Form Data:', formData);
    
    // Your submission logic here
  };

  return (
    <form onSubmit={handleSubmit}>
      {formConfig.fields.map(field => renderField(field))}
      <button type="submit">Submit</button>
    </form>
  );
};

export default DynamicFormBuilder;
```

## Example: Using the FileUpload Component

```tsx
import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';

const MyForm = ({ schemeId }) => {
  const [documents, setDocuments] = useState([]);

  return (
    <div>
      <h2>Application Form</h2>
      
      <FileUpload
        formId={schemeId}
        fieldName="identity_proof"
        multiple={false}
        onUploadSuccess={(files) => {
          console.log('Identity proof uploaded:', files);
          setDocuments(prev => [...prev, ...files]);
        }}
        onUploadError={(error) => {
          console.error('Upload error:', error);
        }}
      />

      <FileUpload
        formId={schemeId}
        fieldName="supporting_documents"
        multiple={true}
        maxFiles={5}
        onUploadSuccess={(files) => {
          console.log('Supporting documents uploaded:', files);
          setDocuments(prev => [...prev, ...files]);
        }}
      />

      {documents.length > 0 && (
        <div>
          <h3>Uploaded Documents:</h3>
          <ul>
            {documents.map((doc, index) => (
              <li key={index}>
                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                  {doc.originalName}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MyForm;
```

## Example: Drag and Drop Upload

```tsx
import React, { useState, useRef } from 'react';
import { uploadFormFiles, validateFile } from '../utils/fileUploadHelper';

const DragDropUpload = ({ formId, fieldName }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    await uploadFiles(droppedFiles);
  };

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    await uploadFiles(selectedFiles);
  };

  const uploadFiles = async (filesToUpload) => {
    // Validate files
    for (const file of filesToUpload) {
      const validation = validateFile(file);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
    }

    setUploading(true);

    try {
      const uploadedFiles = await uploadFormFiles(
        filesToUpload,
        formId,
        fieldName
      );

      setFiles(prev => [...prev, ...uploadedFiles]);
      alert('Files uploaded successfully!');
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? '#4CAF50' : '#ccc'}`,
          padding: '40px',
          textAlign: 'center',
          borderRadius: '8px',
          backgroundColor: isDragging ? '#f0f8f0' : '#fafafa',
          cursor: 'pointer'
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        {uploading ? (
          <p>Uploading...</p>
        ) : (
          <>
            <p>📁 Drag and drop files here</p>
            <p>or click to select files</p>
          </>
        )}
      </div>

      {files.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h4>Uploaded Files:</h4>
          <ul>
            {files.map((file, index) => (
              <li key={index}>
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  {file.originalName}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DragDropUpload;
```

## Storing File URLs in Database

When submitting your form, include the file URLs in your application data:

```javascript
const applicationData = {
  beneficiaryId: '123',
  schemeId: 'scheme-456',
  formData: {
    name: 'John Doe',
    email: 'john@example.com',
    // Store file information
    identityProof: {
      url: 'https://baithuzakath.blr1.digitaloceanspaces.com/forms/scheme-456/identity_proof/file.pdf',
      key: 'forms/scheme-456/identity_proof/file.pdf',
      name: 'identity.pdf',
      size: 102400
    },
    supportingDocuments: [
      {
        url: 'https://baithuzakath.blr1.digitaloceanspaces.com/forms/scheme-456/supporting_documents/doc1.pdf',
        key: 'forms/scheme-456/supporting_documents/doc1.pdf',
        name: 'document1.pdf',
        size: 204800
      }
    ]
  }
};
```

## Best Practices

1. **Validate files before upload** - Check file size and type
2. **Show upload progress** - Use the onProgress callback
3. **Handle errors gracefully** - Show user-friendly error messages
4. **Store file metadata** - Save URL, key, name, size, and type
5. **Organize files by form/field** - Use formId and fieldName for better organization
6. **Clean up on delete** - Remove files from both UI and storage
7. **Use presigned URLs** - For temporary access to private files
8. **Implement retry logic** - For failed uploads
9. **Show file previews** - For images and PDFs
10. **Limit file sizes** - Prevent large uploads that could fail

## Troubleshooting

### Files not uploading
- Check JWT token is valid
- Verify DigitalOcean Spaces credentials
- Check file size and type restrictions
- Look at browser console for errors

### Files uploaded but not accessible
- Verify ACL is set to 'public-read'
- Check CORS settings in DigitalOcean Spaces
- Ensure bucket name and region are correct

### Upload is slow
- Check file sizes
- Consider compressing images before upload
- Use multiple smaller files instead of one large file
