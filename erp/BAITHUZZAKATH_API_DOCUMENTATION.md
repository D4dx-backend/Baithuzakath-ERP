# Baithuzzakath Kerala - Backend API Documentation

## Project Overview

Baithuzzakath Kerala is a comprehensive NGO management system designed for transparent Zakat distribution and community welfare programs. This document outlines the complete backend implementation using Node.js, Express.js, and MongoDB.

## Current Frontend Analysis

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + Radix UI (shadcn/ui)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM
- **Form Handling**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React

### Core Features Identified

#### 1. **Authentication & Authorization**
- **Multi-role Login System**:
  - Admin Login (OTP-based)
  - Beneficiary Login (OTP-based)
  - Role-based access control
- **Authentication Flow**:
  - Phone number verification
  - OTP generation and validation
  - Session management

#### 2. **Project Management**
- **Projects**: Large initiatives (Education Support, Healthcare, Housing)
- **Schemes**: Specific programs under projects
- **Budget Tracking**: Budget allocation and utilization
- **Timeline Management**: Start/end dates, milestones

#### 3. **Application Management**
- **Dynamic Form Builder**: Create custom application forms
- **Application Processing**: Multi-level approval workflow
- **Status Tracking**: Pending → Review → Approved/Rejected
- **Document Management**: File uploads and verification
- **Interview Scheduling**: Beneficiary interviews

#### 4. **Beneficiary Management**
- **Profile Management**: Personal and contact information
- **Application History**: Track all applications
- **Payment Tracking**: Installment-based payments
- **Tag System**: Categorization and priority management
- **Communication**: SMS/Email notifications

#### 5. **Donor Management**
- **Donor Profiles**: Contact and donation history
- **Campaign Management**: Fundraising campaigns
- **Payment Methods**: UPI, Bank Transfer, Cards, Cash
- **Donation Analytics**: Tracking and reporting

#### 6. **Financial Management**
- **Budget Planning**: Project-wise budget allocation
- **Payment Distribution**: Multi-phase payment system
- **Expense Tracking**: Real-time financial monitoring
- **Financial Reports**: Comprehensive reporting

#### 7. **Administrative Features**
- **User Management**: Admin user roles and permissions
- **Location Management**: District and area management
- **Communication Tools**: Bulk messaging system
- **Settings**: System configuration
- **Reports**: Various analytical reports

#### 8. **Public Interface**
- **Public Schemes Page**: Browse available schemes
- **Application Portal**: Public application submission
- **Application Tracking**: Status checking for beneficiaries

## Backend Architecture Design

### 1. **Technology Stack**
```
- Runtime: Node.js (v18+)
- Framework: Express.js
- Database: MongoDB with Mongoose ODM
- Authentication: JWT + OTP (via SMS service)
- File Storage: Multer + GridFS (MongoDB) or AWS S3
- SMS Service: DXing API integration
- Email Service: Nodemailer + SMTP
- Validation: Joi or Zod
- Documentation: Swagger/OpenAPI
- Testing: Jest + Supertest
- Process Management: PM2
```

### 2. **Project Structure**
```
baithuzkath-api/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── environment.js
│   │   └── constants.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Scheme.js
│   │   ├── Application.js
│   │   ├── Beneficiary.js
│   │   ├── Donor.js
│   │   ├── Payment.js
│   │   ├── FormTemplate.js
│   │   ├── Location.js
│   │   └── Notification.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   ├── schemeController.js
│   │   ├── applicationController.js
│   │   ├── beneficiaryController.js
│   │   ├── donorController.js
│   │   ├── paymentController.js
│   │   ├── formController.js
│   │   ├── locationController.js
│   │   ├── dashboardController.js
│   │   └── reportController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── schemes.js
│   │   ├── applications.js
│   │   ├── beneficiaries.js
│   │   ├── donors.js
│   │   ├── payments.js
│   │   ├── forms.js
│   │   ├── locations.js
│   │   ├── dashboard.js
│   │   ├── reports.js
│   │   └── public.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── upload.js
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── services/
│   │   ├── smsService.js
│   │   ├── emailService.js
│   │   ├── fileService.js
│   │   ├── notificationService.js
│   │   └── reportService.js
│   ├── utils/
│   │   ├── helpers.js
│   │   ├── validators.js
│   │   └── constants.js
│   └── app.js
├── tests/
├── docs/
├── package.json
├── .env.example
└── README.md
```

## Database Schema Design

### 1. **User Model**
```javascript
{
  _id: ObjectId,
  phone: String, // Primary identifier
  role: String, // 'state_admin', 'project_coordinator', 'scheme_coordinator', 'district_admin', 'area_admin', 'unit_admin', 'beneficiary'
  profile: {
    name: String,
    email: String,
    address: {
      street: String,
      area: String,
      district: String,
      state: String,
      pincode: String
    },
    dateOfBirth: Date,
    gender: String,
    occupation: String,
    annualIncome: Number
  },
  adminScope: {
    // Defines the geographical/organizational scope for admin users
    level: String, // 'state', 'district', 'area', 'unit'
    regions: [ObjectId], // References to Location documents
    projects: [ObjectId], // For project/scheme coordinators
    schemes: [ObjectId] // For scheme coordinators
  },
  permissions: [String], // Specific permissions within role
  isActive: Boolean,
  lastLogin: Date,
  deviceInfo: {
    platform: String, // 'web', 'mobile'
    deviceId: String,
    fcmToken: String // For push notifications
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 2. **Project Model**
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  startDate: Date,
  endDate: Date,
  budget: {
    allocated: Number,
    spent: Number,
    remaining: Number
  },
  status: String, // 'active', 'completed', 'paused'
  coordinator: ObjectId, // Reference to User
  schemes: [ObjectId], // References to Scheme
  image: String,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### 3. **Scheme Model**
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  project: ObjectId, // Reference to Project
  formTemplate: ObjectId, // Reference to FormTemplate
  eligibilityCriteria: [String],
  amountRange: {
    min: Number,
    max: Number
  },
  deadline: Date,
  status: String, // 'active', 'closed', 'draft'
  coordinator: ObjectId,
  applicationCount: Number,
  approvedCount: Number,
  settings: {
    autoApproval: Boolean,
    requiresInterview: Boolean,
    maxApplications: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 4. **Application Model**
```javascript
{
  _id: ObjectId,
  applicationId: String, // APP-2025-001
  applicant: ObjectId, // Reference to User
  scheme: ObjectId, // Reference to Scheme
  formData: Object, // Dynamic form responses
  documents: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: Date,
    verifiedBy: ObjectId,
    verificationStatus: String // 'pending', 'verified', 'rejected'
  }],
  status: String, // 'pending', 'unit_review', 'area_review', 'district_review', 'state_review', 'approved', 'rejected'
  currentLevel: String, // 'unit_admin', 'area_admin', 'district_admin', 'state_admin'
  location: {
    unit: ObjectId,
    area: ObjectId, 
    district: ObjectId,
    state: ObjectId
  },
  approvalHierarchy: [{
    level: String, // 'unit_admin', 'area_admin', 'district_admin', 'state_admin'
    assignedTo: ObjectId, // Admin user at this level
    status: String, // 'pending', 'approved', 'rejected', 'forwarded'
    action: String, // 'approved', 'rejected', 'forwarded', 'returned'
    remarks: String,
    comments: [{ // Multiple comments per level
      comment: String,
      commentBy: ObjectId,
      timestamp: Date,
      isInternal: Boolean // Internal admin comments vs public comments
    }],
    timestamp: Date,
    deadline: Date // SLA for this level
  }],
  enquiryReports: [{
    reportedBy: ObjectId, // Admin who created enquiry
    enquiryType: String, // 'field_verification', 'document_check', 'background_check'
    findings: String,
    recommendations: String,
    attachments: [String],
    createdAt: Date,
    verifiedBy: ObjectId,
    verificationDate: Date
  }],
  interviewSchedule: {
    date: Date,
    interviewer: ObjectId,
    interviewerLevel: String,
    notes: String,
    status: String, // 'scheduled', 'completed', 'cancelled', 'rescheduled'
    score: Number,
    recommendation: String
  },
  notifications: [{
    recipient: ObjectId,
    type: String, // 'status_update', 'comment_added', 'document_required', 'interview_scheduled'
    message: String,
    sentAt: Date,
    readAt: Date,
    channel: String // 'sms', 'email', 'push', 'in_app'
  }],
  priority: String, // 'low', 'medium', 'high', 'urgent'
  tags: [String],
  appliedDate: Date,
  lastUpdated: Date,
  slaStatus: String, // 'on_time', 'delayed', 'overdue'
  estimatedCompletionDate: Date
}
```

### 5. **Beneficiary Model**
```javascript
{
  _id: ObjectId,
  user: ObjectId, // Reference to User
  beneficiaryId: String, // BEN-2025-001
  applications: [ObjectId], // References to Applications
  approvedSchemes: [{
    scheme: ObjectId,
    application: ObjectId,
    approvedAmount: Number,
    approvedDate: Date,
    paymentSchedule: [{
      phase: String,
      amount: Number,
      dueDate: Date,
      status: String, // 'pending', 'paid'
      paidDate: Date,
      transactionId: String
    }]
  }],
  totalReceived: Number,
  tags: [String],
  notes: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### 6. **Donor Model**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  address: Object,
  donationType: String, // 'individual', 'corporate'
  donations: [{
    amount: Number,
    date: Date,
    method: String, // 'upi', 'bank', 'card', 'cash'
    campaign: ObjectId,
    transactionId: String,
    receipt: String
  }],
  totalDonated: Number,
  lastDonation: Date,
  status: String, // 'active', 'inactive'
  preferences: {
    newsletter: Boolean,
    smsUpdates: Boolean,
    preferredProjects: [ObjectId]
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 7. **FormTemplate Model**
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  scheme: ObjectId,
  pages: [{
    title: String,
    fields: [{
      id: String,
      label: String,
      type: String, // 'text', 'email', 'number', 'date', 'file', etc.
      required: Boolean,
      validation: Object,
      options: [String], // For select/radio fields
      conditionalLogic: Object
    }]
  }],
  settings: {
    enabled: Boolean,
    emailNotifications: Boolean,
    autoSave: Boolean
  },
  version: Number,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### 8. **Payment Model**
```javascript
{
  _id: ObjectId,
  beneficiary: ObjectId,
  application: ObjectId,
  scheme: ObjectId,
  amount: Number,
  phase: String,
  status: String, // 'pending', 'processing', 'completed', 'failed'
  paymentMethod: String,
  transactionId: String,
  scheduledDate: Date,
  processedDate: Date,
  processedBy: ObjectId,
  notes: String,
  receipt: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 9. **Location Model**
```javascript
{
  _id: ObjectId,
  name: String,
  type: String, // 'state', 'district', 'area'
  parent: ObjectId, // Reference to parent location
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 10. **Notification Model**
```javascript
{
  _id: ObjectId,
  recipient: ObjectId,
  application: ObjectId, // Reference to related application
  type: String, // 'sms', 'email', 'push', 'in_app'
  category: String, // 'status_update', 'comment', 'approval', 'rejection', 'document_request', 'interview'
  title: String,
  message: String,
  status: String, // 'pending', 'sent', 'delivered', 'read', 'failed'
  priority: String, // 'low', 'medium', 'high', 'urgent'
  platform: String, // 'web', 'mobile'
  sentAt: Date,
  readAt: Date,
  metadata: {
    applicationId: String,
    actionRequired: Boolean,
    deepLink: String, // For mobile app navigation
    expiresAt: Date
  },
  createdAt: Date
}

### 11. **Comment Model**
```javascript
{
  _id: ObjectId,
  application: ObjectId, // Reference to Application
  commentBy: ObjectId, // Reference to User
  comment: String,
  isInternal: Boolean, // Internal admin comment vs public comment
  level: String, // Admin level who made comment
  attachments: [String], // File URLs
  mentions: [ObjectId], // Tagged users
  parentComment: ObjectId, // For threaded comments
  isEdited: Boolean,
  editHistory: [{
    editedAt: Date,
    previousComment: String
  }],
  createdAt: Date,
  updatedAt: Date
}

### 12. **EnquiryReport Model**
```javascript
{
  _id: ObjectId,
  application: ObjectId, // Reference to Application
  reportId: String, // ENQ-2025-001
  reportedBy: ObjectId, // Admin who created enquiry
  enquiryType: String, // 'field_verification', 'document_verification', 'background_check', 'income_verification'
  description: String,
  findings: String,
  recommendations: String,
  status: String, // 'pending', 'in_progress', 'completed', 'cancelled'
  priority: String, // 'low', 'medium', 'high', 'urgent'
  assignedTo: ObjectId, // Field officer or verifier
  location: {
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    address: String
  },
  attachments: [{
    name: String,
    url: String,
    type: String, // 'photo', 'document', 'video', 'audio'
    uploadedAt: Date
  }],
  timeline: [{
    action: String,
    performedBy: ObjectId,
    timestamp: Date,
    notes: String
  }],
  verifiedBy: ObjectId,
  verificationDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints Design

### 1. **Authentication Routes**
```
POST /api/auth/send-otp
POST /api/auth/verify-otp
POST /api/auth/refresh-token
POST /api/auth/logout
GET  /api/auth/profile
PUT  /api/auth/profile
GET  /api/auth/permissions
PUT  /api/auth/device-info
```

### 2. **Project Routes**
```
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
GET    /api/projects/:id/schemes
GET    /api/projects/:id/budget
PUT    /api/projects/:id/budget
```

### 3. **Scheme Routes**
```
GET    /api/schemes
POST   /api/schemes
GET    /api/schemes/:id
PUT    /api/schemes/:id
DELETE /api/schemes/:id
GET    /api/schemes/:id/applications
GET    /api/schemes/:id/statistics
POST   /api/schemes/:id/duplicate
```

### 4. **Application Routes**
```
GET    /api/applications                    # Get applications based on user role and region
POST   /api/applications                    # Submit new application
GET    /api/applications/:id                # Get application details
PUT    /api/applications/:id                # Update application
DELETE /api/applications/:id                # Delete application
POST   /api/applications/:id/approve        # Approve at current level
POST   /api/applications/:id/reject         # Reject application
POST   /api/applications/:id/forward        # Forward to next level
POST   /api/applications/:id/return         # Return to previous level
GET    /api/applications/:id/history        # Get approval history
POST   /api/applications/:id/comments       # Add comment
GET    /api/applications/:id/comments       # Get comments
PUT    /api/applications/:id/comments/:commentId  # Edit comment
DELETE /api/applications/:id/comments/:commentId # Delete comment
POST   /api/applications/:id/schedule-interview   # Schedule interview
PUT    /api/applications/:id/interview             # Update interview details
POST   /api/applications/:id/documents            # Upload documents
PUT    /api/applications/:id/documents/:docId     # Update document status
POST   /api/applications/:id/enquiry-report       # Create enquiry report
GET    /api/applications/:id/enquiry-reports      # Get enquiry reports
PUT    /api/applications/:id/enquiry-reports/:reportId # Update enquiry report
GET    /api/applications/my-region          # Get applications in user's region
GET    /api/applications/pending-approval   # Get applications pending at user's level
GET    /api/applications/recent-approvals   # Get recently approved applications
GET    /api/applications/overdue            # Get overdue applications
GET    /api/applications/search             # Search applications
GET    /api/applications/export             # Export applications
GET    /api/applications/statistics         # Get application statistics by region/level
```

### 5. **Beneficiary Routes**
```
GET    /api/beneficiaries
POST   /api/beneficiaries
GET    /api/beneficiaries/:id
PUT    /api/beneficiaries/:id
DELETE /api/beneficiaries/:id
GET    /api/beneficiaries/:id/applications
GET    /api/beneficiaries/:id/payments
POST   /api/beneficiaries/:id/tags
GET    /api/beneficiaries/search
GET    /api/beneficiaries/export
```

### 6. **Donor Routes**
```
GET    /api/donors
POST   /api/donors
GET    /api/donors/:id
PUT    /api/donors/:id
DELETE /api/donors/:id
GET    /api/donors/:id/donations
POST   /api/donors/:id/donations
GET    /api/donors/campaigns
POST   /api/donors/campaigns
GET    /api/donors/statistics
```

### 7. **Payment Routes**
```
GET    /api/payments
POST   /api/payments
GET    /api/payments/:id
PUT    /api/payments/:id
POST   /api/payments/:id/process
GET    /api/payments/pending
GET    /api/payments/schedule
POST   /api/payments/bulk-process
GET    /api/payments/reports
```

### 8. **Form Builder Routes**
```
GET    /api/forms
POST   /api/forms
GET    /api/forms/:id
PUT    /api/forms/:id
DELETE /api/forms/:id
POST   /api/forms/:id/duplicate
GET    /api/forms/:id/submissions
POST   /api/forms/:id/submit
GET    /api/forms/templates
```

### 9. **Dashboard Routes**
```
GET    /api/dashboard/stats                 # Role-based dashboard statistics
GET    /api/dashboard/recent-applications   # Recent applications in user's scope
GET    /api/dashboard/recent-approvals      # Recently approved applications
GET    /api/dashboard/pending-actions       # Applications requiring user action
GET    /api/dashboard/financial-summary     # Financial summary for user's region
GET    /api/dashboard/project-progress      # Project progress in user's scope
GET    /api/dashboard/notifications         # User notifications
POST   /api/dashboard/notifications/mark-read # Mark notifications as read
GET    /api/dashboard/workload              # Current workload statistics
GET    /api/dashboard/sla-status            # SLA compliance status
GET    /api/dashboard/regional-summary      # Summary for user's administrative region
```

### 10. **Mobile App Specific Routes**
```
GET    /api/mobile/dashboard               # Mobile optimized dashboard
GET    /api/mobile/applications           # Mobile application list
GET    /api/mobile/applications/:id       # Mobile application details
POST   /api/mobile/applications/:id/quick-action # Quick approve/reject
GET    /api/mobile/notifications          # Mobile notifications
POST   /api/mobile/notifications/register-device # Register FCM token
GET    /api/mobile/offline-sync           # Data for offline sync
POST   /api/mobile/location-update        # Update user location for field work
GET    /api/mobile/nearby-applications    # Applications near user location
POST   /api/mobile/quick-enquiry          # Quick enquiry report from field
```

### 11. **Notification Routes**
```
GET    /api/notifications                 # Get user notifications
POST   /api/notifications                 # Send notification
PUT    /api/notifications/:id/read        # Mark as read
DELETE /api/notifications/:id             # Delete notification
POST   /api/notifications/bulk-send       # Send bulk notifications
GET    /api/notifications/templates       # Get notification templates
POST   /api/notifications/templates       # Create notification template
```

### 12. **Comment Routes**
```
GET    /api/comments/application/:id      # Get application comments
POST   /api/comments/application/:id      # Add comment to application
PUT    /api/comments/:id                  # Edit comment
DELETE /api/comments/:id                  # Delete comment
POST   /api/comments/:id/reply            # Reply to comment
```

### 13. **Enquiry Report Routes**
```
GET    /api/enquiry-reports               # Get enquiry reports for user's region
POST   /api/enquiry-reports               # Create new enquiry report
GET    /api/enquiry-reports/:id           # Get enquiry report details
PUT    /api/enquiry-reports/:id           # Update enquiry report
DELETE /api/enquiry-reports/:id           # Delete enquiry report
POST   /api/enquiry-reports/:id/assign    # Assign to field officer
PUT    /api/enquiry-reports/:id/status    # Update status
POST   /api/enquiry-reports/:id/attachments # Upload attachments
```

### 10. **Public Routes**
```
GET    /api/public/schemes
GET    /api/public/schemes/:id
POST   /api/public/applications
GET    /api/public/applications/:id/status
GET    /api/public/locations
```

### 11. **Report Routes**
```
GET    /api/reports/applications
GET    /api/reports/beneficiaries
GET    /api/reports/financial
GET    /api/reports/projects
GET    /api/reports/donors
POST   /api/reports/custom
GET    /api/reports/export/:type
```

## Hierarchical Admin Structure & Regional Access Control

### Admin Role Hierarchy
```
State Admin
├── Project Coordinator (Cross-regional, project-specific access)
├── Scheme Coordinator (Cross-regional, scheme-specific access)
├── District Admin (District-level access)
│   ├── Area Admin (Area-level access)
│   │   └── Unit Admin (Unit-level access)
│   └── Area Admin (Another area)
│       └── Unit Admin
└── District Admin (Another district)
    └── [Similar structure]
```

### Regional Access Control Logic

#### 1. **State Admin**
- **Access**: All applications across Kerala
- **Permissions**: Full system access, final approval authority
- **Dashboard**: State-wide statistics and reports

#### 2. **Project Coordinator**
- **Access**: All applications under assigned projects (cross-regional)
- **Permissions**: Project management, scheme oversight
- **Dashboard**: Project-specific metrics across all regions

#### 3. **Scheme Coordinator**
- **Access**: All applications under assigned schemes (cross-regional)
- **Permissions**: Scheme management, form builder access
- **Dashboard**: Scheme-specific analytics across all regions

#### 4. **District Admin**
- **Access**: Applications within assigned district(s) only
- **Permissions**: District-level approvals, area admin management
- **Dashboard**: District-specific statistics and pending approvals

#### 5. **Area Admin**
- **Access**: Applications within assigned area(s) only
- **Permissions**: Area-level approvals, unit admin management
- **Dashboard**: Area-specific metrics and workload

#### 6. **Unit Admin**
- **Access**: Applications within assigned unit(s) only
- **Permissions**: Initial verification, document validation
- **Dashboard**: Unit-specific applications and tasks

### Application Approval Workflow

```
Application Submission (Beneficiary)
         ↓
Unit Admin Review & Initial Verification
         ↓ (Forward)
Area Admin Review & Field Verification
         ↓ (Forward)
District Admin Review & Final Verification
         ↓ (Forward)
State Admin Final Approval
         ↓
Payment Processing
```

### Regional Filtering Implementation

#### Database Query Examples:
```javascript
// For District Admin - only show applications in their district
const applications = await Application.find({
  'location.district': { $in: user.adminScope.regions }
});

// For Area Admin - only show applications in their area
const applications = await Application.find({
  'location.area': { $in: user.adminScope.regions }
});

// For Unit Admin - only show applications in their unit
const applications = await Application.find({
  'location.unit': { $in: user.adminScope.regions }
});

// For Project Coordinator - show applications in their projects
const applications = await Application.find({
  'scheme': { 
    $in: await Scheme.find({ 
      project: { $in: user.adminScope.projects } 
    }).distinct('_id') 
  }
});
```

## Mobile App Architecture & Features

### Mobile App User Types

#### 1. **Beneficiary Mobile App**
- **Primary Users**: Application beneficiaries
- **Platform**: React Native or Flutter
- **Key Features**:
  - Application submission with camera integration
  - Document upload with image compression
  - Application status tracking with push notifications
  - Interview scheduling and reminders
  - Payment status and history
  - Offline form filling capability
  - Multi-language support (Malayalam, English)

#### 2. **Admin Mobile App** 
- **Primary Users**: Unit Admin, Area Admin, District Admin
- **Platform**: React Native or Flutter
- **Key Features**:
  - Regional application management
  - Quick approval/rejection actions
  - Field verification with GPS tracking
  - Photo/video evidence collection
  - Offline enquiry report creation
  - Push notifications for urgent applications
  - Voice-to-text for comments
  - Barcode/QR code scanning for documents

### Mobile App Features by User Type

#### **Beneficiary Mobile Features**
```
Authentication:
- OTP-based login
- Biometric authentication (fingerprint/face)
- Device registration

Application Management:
- Browse available schemes
- Fill application forms offline
- Upload documents with camera
- Track application status
- Receive push notifications
- Schedule/reschedule interviews
- View payment history
- Download certificates/receipts

Communication:
- In-app messaging with admins
- Push notifications for status updates
- SMS integration for critical updates
- Multi-language support
```

#### **Admin Mobile Features**
```
Dashboard:
- Regional application statistics
- Pending approvals count
- Recent activity feed
- SLA status indicators
- Workload distribution

Application Processing:
- View applications in region
- Quick approve/reject with comments
- Bulk actions for multiple applications
- Document verification with zoom/annotation
- Field verification with GPS coordinates
- Photo/video evidence collection
- Voice comments and notes

Enquiry & Reporting:
- Create field enquiry reports
- Upload verification photos/videos
- GPS-tagged location verification
- Offline report creation
- Sync when online

Notifications:
- Push notifications for new applications
- Urgent application alerts
- SLA deadline reminders
- Comment mentions
- System announcements
```

### Mobile App Technical Requirements

#### **Offline Capability**
```javascript
// Offline data structure
{
  applications: [], // Cached applications for offline viewing
  forms: [], // Form templates for offline filling
  comments: [], // Pending comments to sync
  attachments: [], // Photos/documents to upload
  enquiryReports: [], // Offline enquiry reports
  lastSyncTime: Date
}
```

#### **Push Notification Categories**
```javascript
{
  application_status: "Application status updated",
  new_comment: "New comment on your application", 
  interview_scheduled: "Interview scheduled",
  document_required: "Additional documents required",
  payment_processed: "Payment has been processed",
  urgent_approval: "Urgent approval required",
  sla_deadline: "SLA deadline approaching",
  system_announcement: "System maintenance notice"
}
```

#### **Mobile API Optimizations**
- Compressed response payloads
- Image optimization and resizing
- Pagination with smaller page sizes
- Cached static data (schemes, locations)
- Delta sync for updates
- Background sync capabilities

### Mobile App Data Synchronization

#### **Sync Strategy**
```javascript
// Sync priorities
1. Critical: Authentication, urgent notifications
2. High: Application status updates, comments
3. Medium: New applications, document uploads
4. Low: Statistics, historical data

// Sync triggers
- App launch
- Network connectivity restored
- User action (pull-to-refresh)
- Background sync (every 15 minutes)
- Push notification received
```

## Implementation Priority

### Phase 1: Core Foundation (Week 1-2)
1. **Project Setup & Configuration**
   - Initialize Node.js project
   - Setup MongoDB connection
   - Configure environment variables
   - Setup basic Express server
   - Implement error handling middleware

2. **Authentication System**
   - User model and authentication
   - OTP service integration
   - JWT token management
   - Role-based middleware

3. **Basic CRUD Operations**
   - User management
   - Location management
   - Basic project operations

### Phase 2: Core Features (Week 3-4)
1. **Project & Scheme Management**
   - Complete project CRUD
   - Scheme management
   - Form builder basic functionality

2. **Application System**
   - Application submission
   - Basic approval workflow
   - File upload handling

### Phase 3: Advanced Features (Week 5-6)
1. **Beneficiary Management**
   - Complete beneficiary system
   - Payment tracking
   - Tag management

2. **Donor Management**
   - Donor CRUD operations
   - Donation tracking
   - Campaign management

### Phase 4: Integration & Polish (Week 7-8)
1. **Dashboard & Reports**
   - Analytics implementation
   - Report generation
   - Export functionality

2. **Notifications & Communication**
   - SMS/Email services
   - Bulk messaging
   - Automated notifications

## Environment Configuration

### Required Environment Variables
```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
MONGODB_URI=mongodb://localhost:27017/baithuzzakath
MONGODB_TEST_URI=mongodb://localhost:27017/baithuzzakath_test

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# DXing SMS Service
DXING_API_KEY=your-dxing-api-key
DXING_SENDER_ID=BZKRLA
DXING_OTP_TEMPLATE_ID=your-otp-template-id
DXING_NOTIFICATION_TEMPLATE_ID=your-notification-template-id

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Storage
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=baithuzzakath-files

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

## Security Considerations

### 1. **Authentication & Authorization**
- JWT token-based authentication
- Role-based access control (RBAC)
- OTP verification for sensitive operations
- Session management and token refresh

### 2. **Data Protection**
- Input validation and sanitization
- SQL injection prevention (NoSQL injection)
- XSS protection
- CSRF protection
- Rate limiting

### 3. **File Security**
- File type validation
- File size limits
- Virus scanning (optional)
- Secure file storage

### 4. **API Security**
- CORS configuration
- Helmet.js for security headers
- Request logging and monitoring
- API versioning

## Testing Strategy

### 1. **Unit Tests**
- Model validation tests
- Service function tests
- Utility function tests
- Controller logic tests

### 2. **Integration Tests**
- API endpoint tests
- Database integration tests
- External service integration tests

### 3. **End-to-End Tests**
- Complete user workflows
- Authentication flows
- Application submission process
- Payment processing

## Deployment Architecture

### 1. **Development Environment**
```
- Local MongoDB instance
- Node.js development server
- Local file storage
- Mock SMS/Email services
```

### 2. **Production Environment**
```
- MongoDB Atlas or dedicated MongoDB server
- PM2 process manager
- Nginx reverse proxy
- SSL/TLS certificates
- AWS S3 for file storage
- Real SMS/Email services
- Monitoring and logging
```

### 3. **CI/CD Pipeline**
```
- GitHub Actions or GitLab CI
- Automated testing
- Code quality checks
- Automated deployment
- Environment-specific configurations
```

## Performance Optimization

### 1. **Database Optimization**
- Proper indexing strategy
- Query optimization
- Connection pooling
- Aggregation pipelines for reports

### 2. **API Optimization**
- Response caching
- Pagination for large datasets
- Compression middleware
- API response optimization

### 3. **File Handling**
- Streaming for large files
- Image optimization
- CDN integration
- Lazy loading

## Monitoring & Logging

### 1. **Application Monitoring**
- Error tracking (Sentry)
- Performance monitoring
- API response times
- Database query performance

### 2. **Logging Strategy**
- Structured logging
- Log levels (error, warn, info, debug)
- Log rotation
- Centralized logging

### 3. **Health Checks**
- Database connectivity
- External service availability
- System resource monitoring
- Automated alerts

## Migration Strategy

### 1. **Data Migration**
- Export existing data from current system
- Data transformation scripts
- Validation and verification
- Rollback procedures

### 2. **System Migration**
- Parallel running period
- Gradual feature migration
- User training and documentation
- Support and maintenance

This comprehensive documentation provides a complete roadmap for implementing the Baithuzzakath Kerala backend API system. The design ensures scalability, security, and maintainability while supporting all the features identified in the frontend application.