# Baithuzzakath Kerala - Mobile API Documentation

## Overview

This document provides comprehensive API specifications for mobile applications (Beneficiary App and Admin App) with optimized endpoints, offline capabilities, and mobile-specific features.

## Mobile App Architecture

### App Types
1. **Beneficiary Mobile App**: For application submission and tracking
2. **Admin Mobile App**: For regional application management and field verification

### Technical Stack
- **Framework**: React Native or Flutter
- **State Management**: Redux Toolkit / Provider
- **Offline Storage**: SQLite / Realm
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Location Services**: React Native Geolocation / Flutter Geolocator
- **Camera Integration**: React Native Camera / Flutter Camera

## Authentication & Security

### Mobile Authentication Flow
```
1. User enters phone number
2. App calls /api/mobile/auth/send-otp
3. User enters OTP
4. App calls /api/mobile/auth/verify-otp
5. Server returns JWT token + refresh token
6. App stores tokens securely (Keychain/Keystore)
7. App registers device for push notifications
```

### Security Implementation
```javascript
// Token Storage (React Native)
import * as Keychain from 'react-native-keychain';

const storeTokens = async (accessToken, refreshToken) => {
  await Keychain.setInternetCredentials(
    'baithuzzakath_tokens',
    'user',
    JSON.stringify({ accessToken, refreshToken })
  );
};

const getTokens = async () => {
  const credentials = await Keychain.getInternetCredentials('baithuzzakath_tokens');
  return credentials ? JSON.parse(credentials.password) : null;
};
```

## Mobile-Optimized API Endpoints

### 1. Authentication APIs

#### Send OTP (Mobile Optimized)
```
POST /api/mobile/auth/send-otp
Content-Type: application/json

Request:
{
  "phone": "9876543210",
  "deviceInfo": {
    "platform": "android", // or "ios"
    "deviceId": "unique-device-id",
    "appVersion": "1.0.0",
    "osVersion": "Android 12"
  }
}

Response:
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "phone": "9876543210",
    "expiresIn": 600,
    "retryAfter": 60
  }
}
```

#### Verify OTP & Login
```
POST /api/mobile/auth/verify-otp
Content-Type: application/json

Request:
{
  "phone": "9876543210",
  "otp": "123456",
  "deviceInfo": {
    "platform": "android",
    "deviceId": "unique-device-id",
    "fcmToken": "fcm-registration-token"
  }
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "user": {
      "id": "user-id",
      "phone": "9876543210",
      "role": "beneficiary",
      "profile": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "permissions": ["apply", "track"],
      "adminScope": null // For beneficiaries
    },
    "expiresIn": 604800
  }
}
```

#### Refresh Token
```
POST /api/mobile/auth/refresh
Authorization: Bearer <refresh-token>

Response:
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-access-token",
    "expiresIn": 604800
  }
}
```

### 2. Dashboard APIs

#### Mobile Dashboard (Role-based)
```
GET /api/mobile/dashboard
Authorization: Bearer <access-token>

Response (Beneficiary):
{
  "success": true,
  "data": {
    "user": {
      "name": "John Doe",
      "profileComplete": true
    },
    "applications": {
      "total": 3,
      "pending": 1,
      "approved": 1,
      "rejected": 1
    },
    "recentApplications": [
      {
        "id": "APP-2025-001",
        "scheme": "Education Support",
        "status": "pending",
        "appliedDate": "2025-01-15",
        "currentLevel": "unit_admin"
      }
    ],
    "notifications": {
      "unread": 2,
      "recent": [
        {
          "id": "notif-1",
          "title": "Application Update",
          "message": "Your application APP-2025-001 is under review",
          "timestamp": "2025-01-16T10:30:00Z",
          "read": false
        }
      ]
    },
    "availableSchemes": [
      {
        "id": "scheme-1",
        "title": "Education Support",
        "description": "Financial assistance for students",
        "deadline": "2025-12-31",
        "isActive": true
      }
    ]
  }
}

Response (Admin):
{
  "success": true,
  "data": {
    "user": {
      "name": "Admin User",
      "role": "district_admin",
      "region": "Thiruvananthapuram"
    },
    "workload": {
      "pendingApprovals": 15,
      "overdueApplications": 3,
      "todayInterviews": 2,
      "completedToday": 8
    },
    "applications": {
      "pending": 15,
      "approved": 45,
      "rejected": 8,
      "total": 68
    },
    "recentActivity": [
      {
        "id": "APP-2025-002",
        "applicant": "Jane Doe",
        "scheme": "Healthcare Support",
        "action": "submitted",
        "timestamp": "2025-01-16T09:15:00Z"
      }
    ],
    "slaStatus": {
      "onTime": 85,
      "delayed": 10,
      "overdue": 5
    }
  }
}
```

### 3. Application Management APIs

#### Get Applications (Mobile Optimized)
```
GET /api/mobile/applications
Authorization: Bearer <access-token>
Query Parameters:
- page: 1 (default)
- limit: 20 (default, max 50)
- status: pending|approved|rejected
- search: search term
- lastSync: ISO timestamp for delta sync

Response:
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "APP-2025-001",
        "applicationId": "APP-2025-001",
        "applicant": {
          "name": "John Doe",
          "phone": "9876543210"
        },
        "scheme": {
          "id": "scheme-1",
          "title": "Education Support",
          "project": "Education Initiative 2025"
        },
        "status": "pending",
        "currentLevel": "unit_admin",
        "priority": "medium",
        "appliedDate": "2025-01-15T10:00:00Z",
        "lastUpdated": "2025-01-16T14:30:00Z",
        "location": {
          "district": "Thiruvananthapuram",
          "area": "Kazhakootam",
          "unit": "Unit-1"
        },
        "documentsCount": 3,
        "commentsCount": 2,
        "hasUnreadComments": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "lastSync": "2025-01-16T15:00:00Z"
  }
}
```

#### Get Application Details (Mobile)
```
GET /api/mobile/applications/:id
Authorization: Bearer <access-token>

Response:
{
  "success": true,
  "data": {
    "application": {
      "id": "APP-2025-001",
      "applicationId": "APP-2025-001",
      "applicant": {
        "name": "John Doe",
        "phone": "9876543210",
        "email": "john@example.com",
        "address": {
          "street": "123 Main St",
          "area": "Kazhakootam",
          "district": "Thiruvananthapuram",
          "pincode": "695581"
        }
      },
      "scheme": {
        "id": "scheme-1",
        "title": "Education Support",
        "description": "Financial assistance for students",
        "amountRange": {
          "min": 10000,
          "max": 50000
        }
      },
      "formData": {
        "purpose": "Higher education fees",
        "requestedAmount": 25000,
        "familyIncome": 180000
      },
      "status": "pending",
      "currentLevel": "unit_admin",
      "priority": "medium",
      "appliedDate": "2025-01-15T10:00:00Z",
      "lastUpdated": "2025-01-16T14:30:00Z",
      "documents": [
        {
          "id": "doc-1",
          "name": "Income Certificate",
          "type": "pdf",
          "url": "/api/files/doc-1.pdf",
          "uploadedAt": "2025-01-15T10:05:00Z",
          "verificationStatus": "pending"
        }
      ],
      "approvalHistory": [
        {
          "level": "unit_admin",
          "status": "pending",
          "assignedTo": {
            "name": "Unit Admin",
            "phone": "9876543211"
          },
          "timestamp": "2025-01-15T10:00:00Z"
        }
      ],
      "comments": [
        {
          "id": "comment-1",
          "comment": "Documents look good, forwarding to area admin",
          "commentBy": {
            "name": "Unit Admin",
            "role": "unit_admin"
          },
          "isInternal": false,
          "timestamp": "2025-01-16T14:30:00Z"
        }
      ],
      "interview": {
        "scheduled": false,
        "date": null,
        "interviewer": null
      },
      "slaStatus": {
        "status": "on_time",
        "deadline": "2025-01-25T10:00:00Z",
        "daysRemaining": 9
      }
    }
  }
}
```

#### Quick Actions (Admin Mobile)
```
POST /api/mobile/applications/:id/quick-action
Authorization: Bearer <access-token>
Content-Type: application/json

Request:
{
  "action": "approve", // or "reject", "forward", "return"
  "remarks": "All documents verified, forwarding to next level",
  "location": {
    "latitude": 8.5241,
    "longitude": 76.9366
  }
}

Response:
{
  "success": true,
  "message": "Application approved successfully",
  "data": {
    "applicationId": "APP-2025-001",
    "newStatus": "area_review",
    "nextLevel": "area_admin"
  }
}
```

### 4. Offline Sync APIs

#### Sync Data for Offline Use
```
GET /api/mobile/offline-sync
Authorization: Bearer <access-token>
Query Parameters:
- lastSync: ISO timestamp
- dataTypes: applications,schemes,locations,notifications

Response:
{
  "success": true,
  "data": {
    "applications": [
      // Compressed application data
    ],
    "schemes": [
      // Available schemes
    ],
    "locations": [
      // Location hierarchy
    ],
    "formTemplates": [
      // Form templates for offline filling
    ],
    "notifications": [
      // Recent notifications
    ],
    "syncTimestamp": "2025-01-16T15:00:00Z",
    "nextSyncRecommended": "2025-01-16T16:00:00Z"
  }
}
```

#### Upload Offline Data
```
POST /api/mobile/offline-upload
Authorization: Bearer <access-token>
Content-Type: multipart/form-data

Request:
{
  "data": JSON.stringify({
    "applications": [
      // Offline created applications
    ],
    "comments": [
      // Offline comments
    ],
    "enquiryReports": [
      // Offline enquiry reports
    ]
  }),
  "files": [File objects] // Photos/documents captured offline
}

Response:
{
  "success": true,
  "data": {
    "processed": {
      "applications": 2,
      "comments": 5,
      "enquiryReports": 1,
      "files": 8
    },
    "errors": [],
    "syncTimestamp": "2025-01-16T15:30:00Z"
  }
}
```

### 5. Push Notification APIs

#### Register Device for Push Notifications
```
POST /api/mobile/notifications/register-device
Authorization: Bearer <access-token>
Content-Type: application/json

Request:
{
  "fcmToken": "fcm-registration-token",
  "platform": "android", // or "ios"
  "deviceId": "unique-device-id",
  "preferences": {
    "applicationUpdates": true,
    "comments": true,
    "interviews": true,
    "payments": true,
    "systemAlerts": true
  }
}

Response:
{
  "success": true,
  "message": "Device registered successfully",
  "data": {
    "deviceId": "unique-device-id",
    "registeredAt": "2025-01-16T15:00:00Z"
  }
}
```

#### Get Mobile Notifications
```
GET /api/mobile/notifications
Authorization: Bearer <access-token>
Query Parameters:
- page: 1
- limit: 50
- unreadOnly: true/false

Response:
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif-1",
        "title": "Application Update",
        "message": "Your application APP-2025-001 has been approved",
        "type": "application_approved",
        "priority": "high",
        "read": false,
        "timestamp": "2025-01-16T14:30:00Z",
        "metadata": {
          "applicationId": "APP-2025-001",
          "deepLink": "app://application/APP-2025-001"
        }
      }
    ],
    "unreadCount": 3,
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 25,
      "hasNext": false
    }
  }
}
```

### 6. Location & Field Verification APIs

#### Update Location (For Field Admins)
```
POST /api/mobile/location-update
Authorization: Bearer <access-token>
Content-Type: application/json

Request:
{
  "latitude": 8.5241,
  "longitude": 76.9366,
  "accuracy": 5.0,
  "timestamp": "2025-01-16T15:00:00Z",
  "activity": "field_verification", // or "office", "travel"
  "applicationId": "APP-2025-001" // Optional, if related to specific application
}

Response:
{
  "success": true,
  "message": "Location updated successfully"
}
```

#### Get Nearby Applications (Field Admins)
```
GET /api/mobile/nearby-applications
Authorization: Bearer <access-token>
Query Parameters:
- latitude: 8.5241
- longitude: 76.9366
- radius: 10 (km)
- limit: 20

Response:
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "APP-2025-001",
        "applicant": {
          "name": "John Doe",
          "address": "123 Main St, Kazhakootam"
        },
        "scheme": "Education Support",
        "status": "pending_verification",
        "distance": 2.5, // km from current location
        "priority": "high",
        "coordinates": {
          "latitude": 8.5200,
          "longitude": 76.9300
        }
      }
    ]
  }
}
```

### 7. File Upload APIs (Mobile Optimized)

#### Upload Documents/Photos
```
POST /api/mobile/files/upload
Authorization: Bearer <access-token>
Content-Type: multipart/form-data

Request:
{
  "file": File object,
  "type": "document", // or "photo", "video", "audio"
  "applicationId": "APP-2025-001",
  "category": "income_certificate", // or "verification_photo", etc.
  "metadata": {
    "capturedAt": "2025-01-16T15:00:00Z",
    "location": {
      "latitude": 8.5241,
      "longitude": 76.9366
    },
    "deviceInfo": {
      "camera": "rear",
      "resolution": "1920x1080"
    }
  }
}

Response:
{
  "success": true,
  "data": {
    "fileId": "file-123",
    "url": "/api/files/file-123.jpg",
    "thumbnailUrl": "/api/files/file-123-thumb.jpg",
    "uploadedAt": "2025-01-16T15:00:00Z",
    "size": 2048576,
    "mimeType": "image/jpeg"
  }
}
```

## Mobile App Specific Features

### 1. Offline Functionality

#### Data Storage Strategy
```javascript
// SQLite Schema for Offline Storage
const offlineSchema = {
  applications: {
    id: 'TEXT PRIMARY KEY',
    data: 'TEXT', // JSON string
    lastModified: 'INTEGER',
    syncStatus: 'TEXT' // 'synced', 'pending', 'conflict'
  },
  comments: {
    id: 'TEXT PRIMARY KEY',
    applicationId: 'TEXT',
    comment: 'TEXT',
    timestamp: 'INTEGER',
    syncStatus: 'TEXT'
  },
  files: {
    id: 'TEXT PRIMARY KEY',
    localPath: 'TEXT',
    remoteUrl: 'TEXT',
    uploadStatus: 'TEXT' // 'pending', 'uploading', 'uploaded', 'failed'
  }
};
```

#### Sync Strategy
```javascript
// Sync Manager
class SyncManager {
  async syncToServer() {
    // 1. Upload pending files
    await this.uploadPendingFiles();
    
    // 2. Upload pending data
    await this.uploadPendingData();
    
    // 3. Download latest data
    await this.downloadLatestData();
    
    // 4. Resolve conflicts
    await this.resolveConflicts();
  }

  async uploadPendingFiles() {
    const pendingFiles = await this.getPendingFiles();
    for (const file of pendingFiles) {
      try {
        await this.uploadFile(file);
        await this.markFileAsSynced(file.id);
      } catch (error) {
        console.error('File upload failed:', error);
      }
    }
  }
}
```

### 2. Push Notification Handling

#### FCM Integration (React Native)
```javascript
import messaging from '@react-native-firebase/messaging';

class NotificationManager {
  async initialize() {
    // Request permission
    const authStatus = await messaging().requestPermission();
    
    if (authStatus === messaging.AuthorizationStatus.AUTHORIZED) {
      // Get FCM token
      const fcmToken = await messaging().getToken();
      
      // Register with backend
      await this.registerDevice(fcmToken);
      
      // Handle foreground messages
      messaging().onMessage(this.handleForegroundMessage);
      
      // Handle background messages
      messaging().setBackgroundMessageHandler(this.handleBackgroundMessage);
    }
  }

  handleForegroundMessage = (remoteMessage) => {
    // Show in-app notification
    this.showInAppNotification(remoteMessage);
  };

  handleBackgroundMessage = async (remoteMessage) => {
    // Handle background notification
    console.log('Background message:', remoteMessage);
  };
}
```

### 3. Camera Integration

#### Document Scanning
```javascript
import { RNCamera } from 'react-native-camera';

const DocumentScanner = () => {
  const takePicture = async () => {
    if (camera) {
      const options = {
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      };
      
      const data = await camera.takePictureAsync(options);
      
      // Process image (crop, enhance, compress)
      const processedImage = await this.processImage(data.uri);
      
      // Upload to server
      await this.uploadDocument(processedImage);
    }
  };

  const processImage = async (imageUri) => {
    // Auto-crop document
    // Enhance contrast
    // Compress for upload
    return processedImageUri;
  };
};
```

### 4. GPS Tracking

#### Location Services
```javascript
import Geolocation from '@react-native-community/geolocation';

class LocationService {
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000
        }
      );
    });
  }

  async trackFieldVisit(applicationId) {
    const location = await this.getCurrentLocation();
    
    // Send location to server
    await api.post('/mobile/location-update', {
      ...location,
      activity: 'field_verification',
      applicationId
    });
  }
}
```

## Error Handling & Status Codes

### Mobile-Specific Error Responses
```javascript
// Network Error
{
  "success": false,
  "error": {
    "code": "NETWORK_ERROR",
    "message": "Network connection failed",
    "retryable": true,
    "retryAfter": 30
  }
}

// Offline Mode
{
  "success": false,
  "error": {
    "code": "OFFLINE_MODE",
    "message": "Feature not available offline",
    "offlineAction": "queue_for_sync"
  }
}

// Token Expired
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Authentication token expired",
    "action": "refresh_token"
  }
}
```

## Performance Optimization

### API Response Optimization
- Compressed JSON responses
- Image optimization and thumbnails
- Pagination with smaller page sizes
- Delta sync for updates
- Cached static data

### Mobile App Optimization
- Lazy loading of screens
- Image caching and compression
- Background sync
- Efficient state management
- Memory management for large lists

This mobile API documentation provides a comprehensive guide for developing robust mobile applications with offline capabilities, real-time notifications, and optimized performance for the Baithuzzakath Kerala system.