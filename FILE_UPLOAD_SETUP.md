# File Upload to DigitalOcean Spaces - Setup Complete

## Overview
File upload functionality has been successfully integrated with DigitalOcean Spaces for your form builder and general file management.

## Backend Setup

### 1. Dependencies Installed
- `aws-sdk` - For DigitalOcean Spaces (S3-compatible) integration

### 2. Files Created

#### Services
- `api/src/services/fileUploadService.js` - Core file upload service with methods for:
  - Single file upload
  - Multiple files upload
  - File deletion
  - File metadata retrieval
  - List files in folders
  - Generate presigned URLs

#### Middleware
- `api/src/middleware/upload.js` - Multer configuration for handling file uploads with:
  - File type validation
  - File size limits
  - Single and multiple file upload support

#### Controllers
- `api/src/controllers/fileUploadController.js` - Request handlers for all upload operations

#### Routes
- `api/src/routes/uploadRoutes.js` - API endpoints for file operations

### 3. Environment Configuration
Your `.env` file has been updated with correct DigitalOcean Spaces configuration:
```env
REGION=blr1
SPACES_ACCESS_KEY_ID=DO801RTW78GP93A2MMZ6
SPACES_SECRET_ACCESS_KEY=22S1rCajUbyevg+80VGg9nmpKZXgzsgeSvAjF2d0+hw
SPACES_BUCKET_NAME=baithuzakath
SPACES_ENDPOINT=blr1.digitaloceanspaces.com
```

## API Endpoints

### Upload Endpoints

#### 1. Upload Single File
```
POST /api/upload/single
Headers: Authorization: Bearer <token>
Body: multipart/form-data
  - file: <file>
  - folder: <optional folder path>
```

#### 2. Upload Multiple Files
```
POST /api/upload/multiple
Headers: Authorization: Bearer <token>
Body: multipart/form-data
  - files: <multiple files>
  - folder: <optional folder path>
```

#### 3. Upload Form Files (For Form Builder)
```
POST /api/upload/form
Headers: Authorization: Bearer <token>
Body: multipart/form-data
  - files: <multiple files>
  - formId: <required form ID>
  - fieldName: <optional field name>
```

### Management Endpoints

#### 4. Delete File
```
DELETE /api/upload/:fileKey
Headers: Authorization: Bearer <token>
```

#### 5. Delete Multiple Files
```
POST /api/upload/delete-multiple
Headers: Authorization: Bearer <token>
Body: { fileKeys: ["key1", "key2"] }
```

#### 6. Get File Metadata
```
GET /api/upload/metadata/:fileKey
Headers: Authorization: Bearer <token>
```

#### 7. List Files
```
GET /api/upload/list?folder=forms&maxKeys=100
Headers: Authorization: Bearer <token>
```

#### 8. Generate Presigned URL
```
POST /api/upload/presigned-url
Headers: Authorization: Bearer <token>
Body: { fileKey: "path/to/file", expiresIn: 3600 }
```

## Frontend Component

A React component `FileUpload.tsx` has been created at:
`erp/src/components/FileUpload.tsx`

### Usage Example

```tsx
import FileUpload from './components/FileUpload';

// Single file upload
<FileUpload
  folder="documents"
  onUploadSuccess={(files) => console.log('Uploaded:', files)}
  onUploadError={(error) => console.error('Error:', error)}
/>

// Multiple files upload
<FileUpload
  multiple={true}
  maxFiles={5}
  folder="attachments"
  onUploadSuccess={(files) => console.log('Uploaded:', files)}
/>

// Form builder file upload
<FileUpload
  formId="scheme-123"
  fieldName="supporting_documents"
  multiple={true}
  maxFiles={10}
  onUploadSuccess={(files) => {
    // Save file URLs to form data
    setFormData(prev => ({
      ...prev,
      supporting_documents: files.map(f => f.url)
    }));
  }}
/>
```

## File Organization

Files are organized in your DigitalOcean Space as follows:
```
baithuzakath/
├── uploads/              # General uploads
├── forms/                # Form-related files
│   ├── {formId}/        # Files for specific form
│   │   ├── {fieldName}/ # Files for specific field
│   │   └── attachments/ # Default attachments
├── documents/           # Document uploads
└── images/              # Image uploads
```

## Configuration

### File Upload Limits
Set in `.env`:
```env
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx,xls,xlsx
```

### Allowed File Types
Default: jpg, jpeg, png, pdf, doc, docx, xls, xlsx

To add more types, update `ALLOWED_FILE_TYPES` in `.env`

## Testing

### Using cURL

1. Upload single file:
```bash
curl -X POST http://localhost:4000/api/upload/single \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/file.pdf" \
  -F "folder=documents"
```

2. Upload form files:
```bash
curl -X POST http://localhost:4000/api/upload/form \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@/path/to/file1.pdf" \
  -F "files=@/path/to/file2.jpg" \
  -F "formId=scheme-123" \
  -F "fieldName=supporting_docs"
```

### Using Postman

1. Set method to POST
2. URL: `http://localhost:4000/api/upload/single`
3. Headers: `Authorization: Bearer YOUR_TOKEN`
4. Body: form-data
   - Key: `file` (type: File)
   - Key: `folder` (type: Text, value: "documents")

## Security Features

1. **Authentication Required**: All endpoints require valid JWT token
2. **File Type Validation**: Only allowed file types can be uploaded
3. **File Size Limits**: Configurable maximum file size
4. **Public Read Access**: Uploaded files are publicly accessible via URL
5. **Secure Deletion**: Only authenticated users can delete files

## Next Steps

1. **Restart your API server** to load the new routes:
   ```bash
   cd Baithuzakath-ERP/api
   npm run dev
   ```

2. **Test the upload functionality** using the provided examples

3. **Integrate with your form builder** by using the FileUpload component

4. **Customize file organization** by modifying the folder structure in your upload calls

## Troubleshooting

### Common Issues

1. **"No file provided" error**
   - Ensure the field name matches (file/files)
   - Check Content-Type is multipart/form-data

2. **"File type not allowed" error**
   - Update ALLOWED_FILE_TYPES in .env
   - Restart the server

3. **Upload fails silently**
   - Check DigitalOcean Spaces credentials
   - Verify bucket name and region
   - Check bucket permissions

4. **Files not accessible**
   - Ensure ACL is set to 'public-read'
   - Check CORS settings in DigitalOcean Spaces

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify DigitalOcean Spaces credentials and permissions
3. Test with smaller files first
4. Check network connectivity to DigitalOcean
