import { useState, useRef } from 'react';
import { Upload, X, File, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { uploadFormFiles, deleteFile, validateFile, formatFileSize, getFileIcon } from '@/utils/fileUploadHelper';

interface UploadedFile {
  url: string;
  key: string;
  name: string;
  size: number;
  type: string;
}

interface FileUploadFieldProps {
  label: string;
  required?: boolean;
  placeholder?: string;
  formId: string;
  fieldName: string;
  multiple?: boolean;
  maxFiles?: number;
  value?: UploadedFile[];
  onChange?: (files: UploadedFile[]) => void;
  disabled?: boolean;
  accept?: string;
}

export function FileUploadField({
  label,
  required = false,
  placeholder = 'Click to upload or drag and drop',
  formId,
  fieldName,
  multiple = false,
  maxFiles = 10,
  value = [],
  onChange,
  disabled = false,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx'
}: FileUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Validate file count
    if (multiple && value.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    if (!multiple && fileArray.length > 1) {
      setError('Only one file allowed');
      return;
    }

    // Validate each file
    for (const file of fileArray) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }
    }

    setError('');
    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedFiles = await uploadFormFiles(
        fileArray,
        formId,
        fieldName,
        (progress) => setUploadProgress(progress)
      );

      const newFiles = uploadedFiles.map(f => ({
        url: f.url,
        key: f.key,
        name: f.originalName,
        size: f.size,
        type: f.mimetype
      }));

      onChange?.(multiple ? [...value, ...newFiles] : newFiles);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (fileKey: string) => {
    try {
      await deleteFile(fileKey);
      onChange?.(value.filter(f => f.key !== fileKey));
    } catch (err: any) {
      setError(err.message || 'Delete failed');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled || uploading}
        />

        {uploading ? (
          <div className="space-y-2">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Uploading... {uploadProgress}%
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{placeholder}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {accept.split(',').join(', ')} (max 10MB each)
              </p>
              {multiple && (
                <p className="text-xs text-muted-foreground">
                  Up to {maxFiles} files
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Uploaded Files List */}
      {value.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Uploaded Files ({value.length})
          </Label>
          <div className="space-y-2">
            {value.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <File className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:underline truncate block"
                    >
                      {file.name}
                    </a>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(file.key)}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
