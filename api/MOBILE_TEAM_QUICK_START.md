# 🚀 Quick Start Guide for Mobile Team

## Overview

Welcome to the Baithuzzakath Kerala Beneficiary Mobile App API! This guide will help you get started quickly.

---

## 📋 What You Need

### API Information
- **Base URL (Dev):** `http://localhost:4000`
- **Base URL (Production):** `https://api.baithuzzakath.org`
- **API Documentation:** `http://localhost:4000/api-docs`
- **Detailed Guide:** [BENEFICIARY_MOBILE_API_GUIDE.md](./BENEFICIARY_MOBILE_API_GUIDE.md)

### Features to Implement
1. ✅ **OTP-based Login** - No password required
2. ✅ **Profile Management** - Update beneficiary details
3. ✅ **Browse Schemes** - View available financial assistance schemes
4. ✅ **Apply for Schemes** - Dynamic form rendering
5. ✅ **Track Applications** - Real-time status tracking
6. ✅ **Application History** - View past applications

---

## 🎯 Implementation Priority

### Phase 1: Authentication (Day 1-2)
- [ ] Login screen with phone input
- [ ] OTP verification screen
- [ ] Token storage (Keychain/Keystore)
- [ ] Auto-login on app launch

### Phase 2: Profile Setup (Day 3-4)
- [ ] Profile form with location dropdowns
- [ ] Profile view/edit functionality
- [ ] Form validation

### Phase 3: Schemes & Applications (Day 5-8)
- [ ] Scheme listing with filters
- [ ] Scheme details screen
- [ ] Dynamic form builder for applications
- [ ] Application submission
- [ ] File upload for documents

### Phase 4: Tracking & History (Day 9-10)
- [ ] Application tracking screen
- [ ] Application history with filters
- [ ] Application details view
- [ ] Statistics dashboard

---

## 🔑 Key API Endpoints

### 1. Authentication Flow

```javascript
// Step 1: Send OTP
POST /api/beneficiary/auth/send-otp
{
  "phone": "9876543210"
}

// Step 2: Verify OTP
POST /api/beneficiary/auth/verify-otp
{
  "phone": "9876543210",
  "otp": "123456"
}
// Returns: { token, user }

// Step 3: Store token and use in all subsequent requests
Headers: { "Authorization": "Bearer <token>" }
```

### 2. Get Available Schemes

```javascript
GET /api/beneficiary/schemes
Authorization: Bearer <token>

// Returns list of schemes with:
// - Eligibility criteria
// - Benefits
// - Application deadline
// - Whether user can apply
```

### 3. Get Scheme Details & Form

```javascript
GET /api/beneficiary/schemes/:id
Authorization: Bearer <token>

// Returns:
// - Scheme details
// - Dynamic form configuration
// - Form fields, validation rules
// - Required documents
```

### 4. Submit Application

```javascript
POST /api/beneficiary/applications
Authorization: Bearer <token>
{
  "schemeId": "507f...",
  "formData": {
    "field_1": "value1",
    "field_2": "value2"
  },
  "documents": [...]
}

// Returns: Application with applicationId
```

### 5. Track Application

```javascript
GET /api/beneficiary/track/:applicationId
Authorization: Bearer <token>

// Returns current status and timeline
```

---

## 💡 Quick Tips

### 1. Dynamic Form Rendering

The form configuration comes from the API. You need to build a form renderer that can handle:

```json
{
  "pages": [
    {
      "title": "Personal Information",
      "fields": [
        {
          "id": "field_1",
          "label": "Full Name",
          "type": "text",
          "required": true,
          "validation": { "minLength": 2, "maxLength": 100 }
        },
        {
          "id": "field_2",
          "label": "Date of Birth",
          "type": "date",
          "required": true
        },
        {
          "id": "field_3",
          "label": "Gender",
          "type": "select",
          "required": true,
          "options": [
            { "value": "male", "label": "Male" },
            { "value": "female", "label": "Female" }
          ]
        },
        {
          "id": "field_4",
          "label": "Aadhaar Card",
          "type": "file",
          "required": true,
          "accept": ["pdf", "jpg", "png"]
        }
      ]
    }
  ]
}
```

**Supported Field Types:**
- `text` - Single line text input
- `textarea` - Multi-line text input
- `number` - Numeric input
- `date` - Date picker
- `select` - Dropdown
- `radio` - Radio buttons
- `checkbox` - Checkboxes
- `file` - File upload

### 2. Location Hierarchy

For profile setup, use cascading dropdowns:

```javascript
// 1. Get all districts
GET /api/beneficiary/auth/locations?type=district

// 2. When user selects district, get areas
GET /api/beneficiary/auth/locations?type=area&parent=<districtId>

// 3. When user selects area, get units
GET /api/beneficiary/auth/locations?type=unit&parent=<areaId>
```

### 3. File Upload

```javascript
// First upload file
POST /api/upload/file
Content-Type: multipart/form-data
FormData: { file: <file> }

// Returns: { url: "https://..." }

// Then include URL in application
{
  "documents": [
    {
      "type": "aadhaar",
      "url": "https://...",
      "fileName": "aadhaar.pdf"
    }
  ]
}
```

### 4. Token Management

```javascript
// Store token securely
// iOS: Keychain
// Android: EncryptedSharedPreferences

// Include in all API calls
headers: {
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json"
}

// Token expires in 7 days
// Check expiry and refresh before it expires
```

---

## 🎨 UI/UX Guidelines

### Authentication Screen
- Phone input with country code (+91)
- OTP input with 6 boxes
- Resend OTP button (60s cooldown)
- Auto-submit when OTP complete

### Schemes List
- Card-based layout
- Show: Name, Category, Amount, Deadline
- Filter by category
- Search functionality
- Badge for "Applied" schemes

### Scheme Details
- Header: Name, Category, Amount
- Sections: Description, Eligibility, Benefits
- "Apply Now" button (disabled if already applied)
- Show days remaining

### Application Form
- Multi-page wizard if form has multiple pages
- Progress indicator
- Field validation with error messages
- File upload with preview
- Confirmation screen before submit

### Application Tracking
- Timeline view showing status progression
- Current status highlighted
- Show submission, review, approval dates
- Display approved amount when approved

### Application History
- List view with status badges
- Filter by status
- Sort by date
- Pull to refresh

---

## 🧪 Testing

### Development Mode
- Use any 10-digit phone number (starts with 6-9)
- OTP is always: `123456`
- Check API response for OTP in dev mode

### Test Accounts
```
Phone: 9876543210
OTP: 123456 (in development)
```

### Swagger UI
Visit `http://localhost:4000/api-docs` to:
- View all endpoints
- Test API calls directly
- See request/response formats
- Download OpenAPI spec

### Postman
1. Visit http://localhost:4000/api-docs
2. Download OpenAPI JSON
3. Import into Postman
4. Test all endpoints

---

## 📱 Sample App Flow

```
1. Splash Screen
   ↓
2. Login Screen (Phone Input)
   ↓
3. OTP Verification
   ↓
4. [First Time] Profile Setup
   ↓
5. Home Screen
   - Browse Schemes
   - My Applications
   - Profile
   ↓
6. Scheme Details → Apply
   ↓
7. Dynamic Form → Submit
   ↓
8. Success → Track Application
   ↓
9. Application History
```

---

## 🔧 Environment Setup

### Development
```javascript
const API_CONFIG = {
  BASE_URL: 'http://localhost:4000',
  // For Android emulator use: 'http://10.0.2.2:4000'
  // For iOS simulator use: 'http://localhost:4000'
  // For physical device use: 'http://<your-ip>:4000'
  TIMEOUT: 30000
};
```

### Production
```javascript
const API_CONFIG = {
  BASE_URL: 'https://api.baithuzzakath.org',
  TIMEOUT: 30000
};
```

---

## 📊 Application Status Flow

```
pending
  ↓
under_review (Admin reviewing)
  ↓
approved (Approved by admin)
  ↓
completed (Benefit disbursed)

Alternative paths:
  → rejected (Application denied)
  → cancelled (User cancelled)
```

---

## 🐛 Common Issues & Solutions

### 1. "Token expired" error
**Solution:** Implement token refresh or ask user to login again

### 2. "Already applied for this scheme"
**Solution:** Check `hasApplied` flag before showing apply button

### 3. Network timeout on file upload
**Solution:** 
- Compress images before upload
- Show upload progress
- Implement retry mechanism

### 4. Form validation errors
**Solution:**
- Validate on client side using form configuration
- Show clear error messages
- Highlight invalid fields

---

## 📚 Resources

1. **API Documentation:** http://localhost:4000/api-docs
2. **Detailed Guide:** [BENEFICIARY_MOBILE_API_GUIDE.md](./BENEFICIARY_MOBILE_API_GUIDE.md)
3. **Postman Collection:** Import from Swagger
4. **Support:** support@baithuzzakath.org

---

## ✅ Checklist Before Starting

- [ ] Read this Quick Start Guide
- [ ] Review detailed API documentation
- [ ] Set up development environment
- [ ] Test API endpoints in Swagger/Postman
- [ ] Understand authentication flow
- [ ] Plan dynamic form rendering approach
- [ ] Set up secure token storage
- [ ] Plan offline capabilities (if needed)

---

## 🚀 Next Steps

1. **Week 1:** Authentication & Profile
2. **Week 2:** Schemes Browsing & Dynamic Forms
3. **Week 3:** Application Submission & Tracking
4. **Week 4:** Polish, Testing & Deployment

---

## 📞 Need Help?

- **Technical Issues:** Open GitHub issue
- **API Questions:** Email dev@baithuzzakath.org
- **Feature Requests:** Contact project manager
- **Bug Reports:** Use issue tracker

**Happy Coding! 🎉**
