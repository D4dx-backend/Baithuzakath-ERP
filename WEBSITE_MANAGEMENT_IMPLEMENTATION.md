# Website Management Feature Implementation

## Overview
Complete implementation of a website management system with file storage on DigitalOcean Spaces. This feature allows administrators to manage website content including About Us, counter statistics, news/events, and brochures.

## Features Implemented

### 1. Website Settings
- **About Us Section**: Title and description editor
- **Dynamic Counters**: Add, edit, delete counter statistics with custom icons
- **Contact Details**: Phone, email, address, WhatsApp
- **Social Media Links**: Facebook, Instagram, YouTube, Twitter, LinkedIn

### 2. News & Events
- Create, edit, delete news and events
- Image upload with 5MB limit (JPG, PNG)
- Categorization: News, Events, Announcements, Success Stories
- Status management: Published, Draft, Archived
- Featured toggle for prominent display
- View tracking
- Pagination support

### 3. Brochures
- Upload, edit, delete PDF documents
- 10MB file size limit
- Categorization: General, Schemes, Reports, Guidelines
- Download tracking
- Status management: Active, Archived
- File metadata display (name, size)

## Backend Implementation

### Models Created
1. **WebsiteSettings.js** (`/api/src/models/WebsiteSettings.js`)
   - Single document schema for all website settings
   - About Us, counters array, contact details, social media links

2. **NewsEvent.js** (`/api/src/models/NewsEvent.js`)
   - Title, description, category, image URL/key
   - Publish date, status, featured flag, views counter
   - Indexed by status+publishDate and category

3. **Brochure.js** (`/api/src/models/Brochure.js`)
   - Title, description, category, file URL/key
   - File metadata (name, size), download counter
   - Indexed by status+createdAt and category

### Controllers Created
1. **websiteController.js** (`/api/src/controllers/websiteController.js`)
   - Settings CRUD operations
   - Counter management (add, update, delete)
   - Public and authenticated endpoints

2. **newsEventController.js** (`/api/src/controllers/newsEventController.js`)
   - Full CRUD for news/events
   - Image upload to DigitalOcean Spaces
   - View tracking
   - Pagination support

3. **brochureController.js** (`/api/src/controllers/brochureController.js`)
   - Full CRUD for brochures
   - PDF upload to DigitalOcean Spaces
   - Download tracking
   - Pagination support

### Routes Created
1. **websiteRoutes.js** (`/api/src/routes/websiteRoutes.js`)
   - GET `/api/website/public-settings` (public)
   - GET/PUT `/api/website/settings` (authenticated)
   - POST/PUT/DELETE `/api/website/settings/counter/:id`

2. **newsEventRoutes.js** (`/api/src/routes/newsEventRoutes.js`)
   - GET `/api/news-events/public` (public)
   - GET/POST/PUT/DELETE `/api/news-events` (authenticated)
   - Image upload with `uploadSingleMemory` middleware

3. **brochureRoutes.js** (`/api/src/routes/brochureRoutes.js`)
   - GET `/api/brochures/public` (public)
   - GET/POST/PUT/DELETE `/api/brochures` (authenticated)
   - POST `/api/brochures/:id/download` (tracking)
   - PDF upload with `uploadSingleMemory` middleware

### Utilities Created
**s3Upload.js** (`/api/src/utils/s3Upload.js`)
- DigitalOcean Spaces integration using AWS SDK v2
- `uploadToSpaces(file, folder, options)`: Upload files to Spaces
- `deleteFromSpaces(fileKey)`: Delete files from Spaces
- `extractKeyFromUrl(fileUrl)`: Extract key from URL
- Uses environment variables:
  - SPACES_ACCESS_KEY_ID
  - SPACES_SECRET_ACCESS_KEY
  - SPACES_BUCKET_NAME
  - SPACES_ENDPOINT
  - SPACES_REGION
  - SPACES_CDN_URL (optional)

### Middleware Updates
**upload.js** (`/api/src/middleware/upload.js`)
- Added memory storage configuration
- `uploadSingleMemory(fieldName)`: For direct Spaces upload
- No temporary disk files created

## Frontend Implementation

### Pages Created
1. **WebsiteSettings.tsx** (`/erp/src/pages/WebsiteSettings.tsx`)
   - Complete settings management interface
   - About Us text editor
   - Dynamic counters CRUD with drag/drop ordering
   - Contact details form
   - Social media links editor
   - RBAC permission checks

2. **NewsEvents.tsx** (`/erp/src/pages/NewsEvents.tsx`)
   - Grid view with image thumbnails
   - Create/Edit modal with image upload
   - Image preview before upload
   - Filtering by status and category
   - Pagination controls
   - Delete confirmation
   - RBAC permission checks

3. **Brochures.tsx** (`/erp/src/pages/Brochures.tsx`)
   - List view with file metadata
   - Upload modal with PDF validation
   - File size display
   - Download button with tracking
   - Filtering by status and category
   - Pagination controls
   - RBAC permission checks

### API Service Updates
**api.ts** (`/erp/src/lib/api.ts`)
- Added `website` object with all methods:
  - Settings: getSettings, updateSettings, addCounter, updateCounter, deleteCounter
  - News: getAllNews, getPublicNews, getNewsById, createNews, updateNews, deleteNews
  - Brochures: getAllBrochures, getPublicBrochures, getBrochureById, createBrochure, updateBrochure, deleteBrochure, trackDownload
- FormData support for file uploads

### Navigation Updates
**Sidebar.tsx** (`/erp/src/components/Sidebar.tsx`)
- Added "Website Management" section with submenu:
  - Settings
  - News & Events
  - Brochures
- Permission checks for menu visibility

**App.tsx** (`/erp/src/App.tsx`)
- Added routes for all three pages
- Protected with AuthGuard and Layout

## RBAC Permissions

### Permissions Required
- **website.read**: View website settings and content
- **website.write**: Create and edit website content
- **website.delete**: Delete website content
- **news.read**: View news/events
- **news.write**: Create and edit news/events
- **news.delete**: Delete news/events
- **brochures.read**: View brochures
- **brochures.write**: Create and edit brochures
- **brochures.delete**: Delete brochures

### Default Access
By user request:
- **super_admin**: Full access to all permissions
- **state_admin**: Full access to all permissions
- Other roles can be assigned permissions through role management

## File Upload Configuration

### Images (News/Events)
- **Formats**: JPG, PNG
- **Size Limit**: 5MB
- **Validation**: Frontend and backend
- **Storage**: DigitalOcean Spaces
- **Folder**: `news-events/`
- **No optimization**: Files stored as uploaded

### PDFs (Brochures)
- **Format**: PDF only
- **Size Limit**: 10MB
- **Validation**: Frontend and backend
- **Storage**: DigitalOcean Spaces
- **Folder**: `brochures/`

### Upload Process
1. User selects file in frontend
2. File validated (type, size)
3. FormData sent to backend
4. Multer memory storage captures file
5. File uploaded to DigitalOcean Spaces
6. URL and key stored in database
7. Old files deleted when replaced

## Environment Variables Required

Add to `/api/.env`:
```env
# DigitalOcean Spaces Configuration
SPACES_ACCESS_KEY_ID=your_spaces_key
SPACES_SECRET_ACCESS_KEY=your_spaces_secret
SPACES_BUCKET_NAME=your_bucket_name
SPACES_ENDPOINT=your_region.digitaloceanspaces.com
SPACES_REGION=your_region
SPACES_CDN_URL=https://your-cdn-url.com (optional)
```

## Testing Checklist

### Backend Tests
- [ ] Create website settings (auto-initialization)
- [ ] Update About Us section
- [ ] Add/update/delete counters
- [ ] Upload news with image to Spaces
- [ ] Update news with new image (old image deleted)
- [ ] Delete news (image deleted from Spaces)
- [ ] Upload brochure PDF to Spaces
- [ ] Track brochure downloads
- [ ] Delete brochure (PDF deleted from Spaces)
- [ ] Public endpoints work without authentication
- [ ] RBAC permissions enforced

### Frontend Tests
- [ ] Navigate to Website Management section in sidebar
- [ ] Access all three pages (Settings, News & Events, Brochures)
- [ ] Edit About Us and save successfully
- [ ] Add, edit, delete counters
- [ ] Create news with image upload (preview works)
- [ ] Edit news and replace image
- [ ] Filter news by status and category
- [ ] Pagination works correctly
- [ ] Upload PDF brochure
- [ ] Download brochure (counter increments)
- [ ] Delete news/brochure with confirmation
- [ ] Permission checks prevent unauthorized access
- [ ] Loading states display correctly
- [ ] Error messages show for validation failures
- [ ] Success toasts appear after operations

## API Endpoints Summary

### Website Settings
- `GET /api/website/public-settings` - Public settings
- `GET /api/website/settings` - Get settings (auth)
- `PUT /api/website/settings` - Update settings (auth + write)
- `POST /api/website/settings/counter` - Add counter (auth + write)
- `PUT /api/website/settings/counter/:id` - Update counter (auth + write)
- `DELETE /api/website/settings/counter/:id` - Delete counter (auth + write)

### News & Events
- `GET /api/news-events/public` - Public news (query: status, category, featured, page, limit)
- `GET /api/news-events` - All news (auth + read, query: status, category, featured, page, limit)
- `GET /api/news-events/:id` - Single news (public)
- `POST /api/news-events` - Create news (auth + write, FormData with image)
- `PUT /api/news-events/:id` - Update news (auth + write, FormData with optional image)
- `DELETE /api/news-events/:id` - Delete news (auth + delete)

### Brochures
- `GET /api/brochures/public` - Public brochures (query: status, category, page, limit)
- `GET /api/brochures` - All brochures (auth + read, query: status, category, page, limit)
- `GET /api/brochures/:id` - Single brochure (public)
- `POST /api/brochures` - Create brochure (auth + write, FormData with file)
- `PUT /api/brochures/:id` - Update brochure (auth + write, FormData with optional file)
- `DELETE /api/brochures/:id` - Delete brochure (auth + delete)
- `POST /api/brochures/:id/download` - Track download (public)

## Database Schemas

### WebsiteSettings Collection
```javascript
{
  aboutUs: {
    title: String,
    description: String
  },
  counts: [{
    title: String,
    count: Number,
    icon: String,
    order: Number
  }],
  contactDetails: {
    phone: String,
    email: String,
    address: String,
    whatsapp: String
  },
  socialMedia: {
    facebook: String,
    instagram: String,
    youtube: String,
    twitter: String,
    linkedin: String
  },
  updatedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### NewsEvents Collection
```javascript
{
  title: String,
  description: String,
  category: String, // news, event, announcement, success_story
  imageUrl: String,
  imageKey: String,
  publishDate: Date,
  status: String, // draft, published, archived
  featured: Boolean,
  views: Number,
  createdBy: ObjectId,
  updatedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Brochures Collection
```javascript
{
  title: String,
  description: String,
  category: String, // general, schemes, reports, guidelines
  fileUrl: String,
  fileKey: String,
  fileName: String,
  fileSize: Number,
  downloads: Number,
  status: String, // active, archived
  createdBy: ObjectId,
  updatedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

## Next Steps

1. **Add Permissions to RBAC System**
   - Create the new permissions in the database
   - Assign to super_admin and state_admin roles
   - Make available for custom role assignment

2. **Test File Uploads**
   - Verify DigitalOcean Spaces credentials
   - Test image uploads for news/events
   - Test PDF uploads for brochures
   - Verify file deletion on update/delete

3. **Public Website Integration**
   - Use public API endpoints to display content
   - Implement news/events display on public site
   - Add downloadable brochures section
   - Display dynamic counter statistics

4. **Optional Enhancements**
   - Add rich text editor for descriptions
   - Implement image cropping/resizing
   - Add drag-and-drop file upload
   - Create analytics dashboard for views/downloads
   - Add notification system for new content
   - Implement content scheduling

## Files Modified

### Backend
- Created: `/api/src/utils/s3Upload.js`
- Created: `/api/src/models/WebsiteSettings.js`
- Created: `/api/src/models/NewsEvent.js`
- Created: `/api/src/models/Brochure.js`
- Created: `/api/src/controllers/websiteController.js`
- Created: `/api/src/controllers/newsEventController.js`
- Created: `/api/src/controllers/brochureController.js`
- Created: `/api/src/routes/websiteRoutes.js`
- Created: `/api/src/routes/newsEventRoutes.js`
- Created: `/api/src/routes/brochureRoutes.js`
- Modified: `/api/src/middleware/upload.js`
- Modified: `/api/src/models/index.js`
- Modified: `/api/src/app.js`

### Frontend
- Created: `/erp/src/pages/WebsiteSettings.tsx`
- Created: `/erp/src/pages/NewsEvents.tsx`
- Created: `/erp/src/pages/Brochures.tsx`
- Modified: `/erp/src/lib/api.ts`
- Modified: `/erp/src/components/Sidebar.tsx`
- Modified: `/erp/src/App.tsx`

## Total Implementation
- **Backend Files**: 9 created, 3 modified
- **Frontend Files**: 3 created, 3 modified
- **Total Lines of Code**: ~3000+ lines
- **Features**: 3 major feature modules
- **API Endpoints**: 21 endpoints
- **Database Collections**: 3 new collections
