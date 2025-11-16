import React, { useState } from 'react';
import axios from 'axios';

interface FileUploadProps {
  folder?: string;
  formId?: string;
  fieldName?: string;
  multiple?: boolean;
  maxFiles?: number;
  onUploadSuccess?: (files: any[]) => void;
  onUploadError?: (error: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  folder = 'uploads',
  formId,
  fieldName,
  multiple = false,
  maxFiles = 10,
  onUploadSuccess,
  onUploadError
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validate file count
    if (multiple && files.length > maxFiles) {
      const errorMsg = `Maximum ${maxFiles} files allowed`;
      setError(errorMsg);
      onUploadError?.(errorMsg);
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      
      if (multiple) {
        Array.from(files).forEach(file => {
          formData.append('files', file);
        });
      } else {
        formData.append('file', files[0]);
      }

      // Add metadata
      if (formId) {
        formData.append('formId', formId);
      }
      if (fieldName) {
        formData.append('fieldName', fieldName);
      }
      if (!formId) {
        formData.append('folder', folder);
      }

      // Determine endpoint
      let endpoint = '/api/upload/single';
      if (formId) {
        endpoint = '/api/upload/form';
      } else if (multiple) {
        endpoint = '/api/upload/multiple';
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${endpoint}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        const files = response.data.files || [response.data.file];
        setUploadedFiles(prev => [...prev, ...files]);
        onUploadSuccess?.(files);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to upload file(s)';
      setError(errorMsg);
      onUploadError?.(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileKey: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/upload/${encodeURIComponent(fileKey)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setUploadedFiles(prev => prev.filter(f => f.key !== fileKey));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete file');
    }
  };

  return (
    <div className="file-upload-component">
      <div className="upload-area">
        <input
          type="file"
          onChange={handleFileChange}
          multiple={multiple}
          disabled={uploading}
          className="file-input"
          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
        />
        {uploading && <div className="upload-spinner">Uploading...</div>}
      </div>

      {error && (
        <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
          {error}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files" style={{ marginTop: '20px' }}>
          <h4>Uploaded Files:</h4>
          <ul>
            {uploadedFiles.map((file, index) => (
              <li key={index} style={{ marginBottom: '10px' }}>
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  {file.originalName || file.fileName}
                </a>
                <span style={{ marginLeft: '10px', color: '#666' }}>
                  ({(file.size / 1024).toFixed(2)} KB)
                </span>
                <button
                  onClick={() => handleDelete(file.key)}
                  style={{ marginLeft: '10px', color: 'red', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
