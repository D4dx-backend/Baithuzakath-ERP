# 🚀 Quick Start: File Upload to DigitalOcean Spaces

## ✅ What's Been Set Up

1. **Backend API** - Complete file upload service with DigitalOcean Spaces integration
2. **Frontend Components** - Ready-to-use React components and utilities
3. **Test Interface** - HTML test page for quick testing
4. **Documentation** - Comprehensive guides and examples

## 🎯 Quick Test (5 minutes)

### Step 1: Start Your API Server
```bash
cd Baithuzakath-ERP/api
npm run dev
```

### Step 2: Open Test Page
Open `Baithuzakath-ERP/test-file-upload.html` in your browser

### Step 3: Get Your Token
1. Login to your app
2. Copy the JWT token from localStorage or login response
3. Paste it in the "JWT Token" field

### Step 4: Upload a File
1. Click "Choose File" in the "Single File Upload" section
2. Select a file (PDF, image, or document)
3. Click "Upload Single File"
4. You'll see the file URL if successful!

## 📁 Files Created

### Backend
- `api/src/services/fileUploadService.js` - Core upload service
- `api/src/middleware/upload.js` - Multer configuration
- `api/src/controllers/fileUploadController.js` - Request handlers
- `api/src/routes/uploadRoutes.js` - API routes

### Frontend
- `erp/src/components/FileUpload.tsx` - React upload component
- `erp/src/utils/fileUploadHelper.ts` - Helper functions

### Documentation
- `FILE_UPLOAD_SETUP.md` - Complete setup guide
- `FORM_BUILDER_FILE_UPLOAD_EXAMPLE.md` - Integration examples
- `test-file-upload.html` - Test interface

## 🔌 API Endpoints

All endpoints require authentication (Bearer token):

```
POST   /api/upload/single          - Upload single file
POST   /api/upload/multiple        - Upload multiple files
POST   /api/upload/form            - Upload form files
DELETE /api/upload/:fileKey        - Delete file
POST   /api/upload/delete-multiple - Delete multiple files
GET    /api/upload/metadata/:key   - Get file metadata
GET    /api/upload/list            - List files
POST   /api/upload/presigned-url   - Generate temp URL
```

## 💻 Use in Your Form Builder

### Simple Example
```tsx
import { uploadFormFiles } from '../utils/fileUploadHelper';

const handleFileUpload = async (files, schemeId) => {
  const uploaded = await uploadFormFiles(
    Array.from(files),
    schemeId,
    'supporting_documents'
  );
  
  // Save URLs to your form data
  console.log('Uploaded files:', uploaded);
};
```

### Using Component
```tsx
import FileUpload from '../components/FileUpload';

<FileUpload
  formId={schemeId}
  fieldName="documents"
  multiple={true}
  onUploadSuccess={(files) => {
    // Handle uploaded files
    console.log(files);
  }}
/>
```

## 🔧 Configuration

Your `.env` is already configured:
```env
SPACES_ACCESS_KEY_ID=DO801RTW78GP93A2MMZ6
SPACES_SECRET_ACCESS_KEY=22S1rCajUbyevg+80VGg9nmpKZXgzsgeSvAjF2d0+hw
SPACES_BUCKET_NAME=baithuzakath
SPACES_ENDPOINT=blr1.digitaloceanspaces.com
REGION=blr1
```

## 📂 File Organization

Files are automatically organized:
```
baithuzakath/
├── uploads/              # General uploads
├── forms/
│   └── {schemeId}/
│       └── {fieldName}/  # Form-specific files
├── documents/
└── images/
```

## 🎨 Customization

### Change Upload Folder
```tsx
<FileUpload folder="my-custom-folder" />
```

### Change File Limits
Update in `.env`:
```env
MAX_FILE_SIZE=20971520  # 20MB
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx,xls,xlsx,zip
```

## 🐛 Troubleshooting

### "No file provided" error
- Check field name is 'file' for single, 'files' for multiple
- Ensure Content-Type is multipart/form-data

### "Unauthorized" error
- Verify JWT token is valid
- Check token is included in Authorization header

### Files not accessible
- Verify DigitalOcean Spaces credentials
- Check bucket permissions (should allow public read)
- Ensure CORS is configured in DigitalOcean

### Upload fails
- Check file size (default max: 10MB)
- Verify file type is allowed
- Check server logs for detailed errors

## 📚 Next Steps

1. ✅ Test with the HTML test page
2. ✅ Integrate into your form builder
3. ✅ Customize file organization
4. ✅ Add file previews (images/PDFs)
5. ✅ Implement drag-and-drop (see examples)

## 🆘 Need Help?

Check these files:
- `FILE_UPLOAD_SETUP.md` - Detailed setup guide
- `FORM_BUILDER_FILE_UPLOAD_EXAMPLE.md` - Code examples
- Server logs - For backend errors
- Browser console - For frontend errors

## 🎉 You're Ready!

Your file upload system is fully configured and ready to use. Start by testing with the HTML page, then integrate into your forms!
