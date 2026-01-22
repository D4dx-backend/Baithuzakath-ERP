import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
  throw new Error('VITE_API_URL environment variable is required');
}

export interface UploadedFile {
  success: boolean;
  url: string;
  key: string;
  bucket: string;
  fileName: string;
  originalName: string;
  size: number;
  mimetype: string;
}

export interface UploadOptions {
  folder?: string;
  formId?: string;
  fieldName?: string;
  onProgress?: (progress: number) => void;
}

/**
 * Upload a single file to DigitalOcean Spaces
 */
export const uploadSingleFile = async (
  file: File,
  options: UploadOptions = {}
): Promise<UploadedFile> => {
  const formData = new FormData();
  formData.append('file', file);

  if (options.folder) {
    formData.append('folder', options.folder);
  }

  const token = localStorage.getItem('token');
  
  const response = await axios.post(
    `${API_URL}/api/upload/single`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      },
      onUploadProgress: (progressEvent) => {
        if (options.onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          options.onProgress(progress);
        }
      }
    }
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'Upload failed');
  }

  return response.data.file;
};

/**
 * Upload multiple files to DigitalOcean Spaces
 */
export const uploadMultipleFiles = async (
  files: File[],
  options: UploadOptions = {}
): Promise<UploadedFile[]> => {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('files', file);
  });

  if (options.folder) {
    formData.append('folder', options.folder);
  }

  const token = localStorage.getItem('token');
  
  const response = await axios.post(
    `${API_URL}/api/upload/multiple`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      },
      onUploadProgress: (progressEvent) => {
        if (options.onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          options.onProgress(progress);
        }
      }
    }
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'Upload failed');
  }

  return response.data.files;
};

/**
 * Upload files for form builder
 */
export const uploadFormFiles = async (
  files: File[],
  formId: string,
  fieldName?: string,
  onProgress?: (progress: number) => void
): Promise<UploadedFile[]> => {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('files', file);
  });

  formData.append('formId', formId);
  if (fieldName) {
    formData.append('fieldName', fieldName);
  }

  const token = localStorage.getItem('token');
  
  const response = await axios.post(
    `${API_URL}/api/upload/form`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      }
    }
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'Upload failed');
  }

  return response.data.files;
};

/**
 * Delete a file from DigitalOcean Spaces
 */
export const deleteFile = async (fileKey: string): Promise<void> => {
  const token = localStorage.getItem('token');
  
  const response = await axios.delete(
    `${API_URL}/api/upload/${encodeURIComponent(fileKey)}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'Delete failed');
  }
};

/**
 * Delete multiple files from DigitalOcean Spaces
 */
export const deleteMultipleFiles = async (fileKeys: string[]): Promise<void> => {
  const token = localStorage.getItem('token');
  
  const response = await axios.post(
    `${API_URL}/api/upload/delete-multiple`,
    { fileKeys },
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'Delete failed');
  }
};

/**
 * Get file metadata
 */
export const getFileMetadata = async (fileKey: string): Promise<any> => {
  const token = localStorage.getItem('token');
  
  const response = await axios.get(
    `${API_URL}/api/upload/metadata/${encodeURIComponent(fileKey)}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to get metadata');
  }

  return response.data.metadata;
};

/**
 * List files in a folder
 */
export const listFiles = async (folder: string = '', maxKeys: number = 1000): Promise<any[]> => {
  const token = localStorage.getItem('token');
  
  const response = await axios.get(
    `${API_URL}/api/upload/list?folder=${folder}&maxKeys=${maxKeys}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to list files');
  }

  return response.data.files;
};

/**
 * Generate presigned URL for temporary access
 */
export const getPresignedUrl = async (
  fileKey: string,
  expiresIn: number = 3600
): Promise<string> => {
  const token = localStorage.getItem('token');
  
  const response = await axios.post(
    `${API_URL}/api/upload/presigned-url`,
    { fileKey, expiresIn },
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to generate URL');
  }

  return response.data.url;
};

/**
 * Validate file before upload
 */
export const validateFile = (
  file: File,
  maxSize: number = 10 * 1024 * 1024, // 10MB default
  allowedTypes: string[] = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx']
): { valid: boolean; error?: string } => {
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`
    };
  }

  // Check file type
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !allowedTypes.includes(extension)) {
    return {
      valid: false,
      error: `File type .${extension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  return { valid: true };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get file icon based on extension
 */
export const getFileIcon = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  const iconMap: { [key: string]: string } = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    zip: '📦',
    rar: '📦',
  };

  return iconMap[extension || ''] || '📎';
};
