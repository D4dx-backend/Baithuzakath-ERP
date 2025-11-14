# Beneficiary Authentication & Profile Completion Flow

## Overview
This document describes the complete authentication and profile completion flow for beneficiary users in the Baithuzakath ERP system.

## User Roles
The system supports the following user roles:
- `super_admin` - Full system access
- `state_admin` - State-level administration
- `district_admin` - District-level administration
- `area_admin` - Area-level administration
- `unit_admin` - Unit-level administration
- `project_coordinator` - Project management
- `scheme_coordinator` - Scheme management
- **`beneficiary`** - End users who apply for schemes

## Authentication Flow

### First-Time User Flow
```
1. User enters phone number on login page
   ↓
2. System checks if user exists
   - If NO: Creates new beneficiary account with:
     * role: 'beneficiary'
     * name: 'Beneficiary [last 4 digits]' (temporary)
     * isVerified: false
     * isActive: true
   ↓
3. OTP sent to phone (Static OTP: 123456 in development)
   ↓
4. User enters OTP
   ↓
5. OTP verified → JWT token generated
   ↓
6. System checks isVerified flag
   - If FALSE: Redirect to Profile Completion page
   ↓
7. User completes profile with:
   - Full name
   - Date of birth (must be 18+)
   - Gender
   - Address (district required)
   - Emergency contact (optional)
   ↓
8. Profile saved → isVerified set to TRUE
   ↓
9. Redirect to Dashboard
```

### Returning User Flow
```
1. User enters phone number on login page
   ↓
2. OTP sent to phone
   ↓
3. User enters OTP
   ↓
4. OTP verified → JWT token generated
   ↓
5. System checks isVerified flag
   - If TRUE: Redirect directly to Dashboard
```

## Key Components

### Frontend Components

#### 1. BeneficiaryLogin.tsx
- Location: `erp/src/pages/BeneficiaryLogin.tsx`
- Handles phone number entry and OTP verification
- Checks `isVerified` flag after login
- Redirects to profile completion or dashboard accordingly

#### 2. BeneficiaryProfileCompletion.tsx
- Location: `erp/src/pages/BeneficiaryProfileCompletion.tsx`
- Collects user profile information
- Validates required fields (name, DOB, gender, district)
- Updates profile and sets `isVerified: true`

#### 3. BeneficiaryAuthGuard.tsx
- Location: `erp/src/components/BeneficiaryAuthGuard.tsx`
- Protects beneficiary routes
- Checks authentication token
- Enforces profile completion before dashboard access
- Props:
  - `requireVerification`: If true, requires profile to be completed

#### 4. BeneficiaryDashboard.tsx
- Location: `erp/src/pages/BeneficiaryDashboard.tsx`
- Main dashboard for beneficiaries
- Shows application stats, schemes, and tracking

### Backend Components

#### 1. beneficiaryAuthController.js
- Location: `api/src/controllers/beneficiaryAuthController.js`
- Methods:
  - `sendOTP()`: Creates user if not exists, sends OTP
  - `verifyOTP()`: Verifies OTP and generates JWT token
  - `updateProfile()`: Updates profile and sets `isVerified: true`
  - `getProfile()`: Returns user profile
  - `resendOTP()`: Resends OTP with rate limiting

#### 2. beneficiaryRoutes.js
- Location: `api/src/routes/beneficiaryRoutes.js`
- Routes:
  - `POST /api/beneficiary/auth/send-otp` (public)
  - `POST /api/beneficiary/auth/verify-otp` (public)
  - `POST /api/beneficiary/auth/resend-otp` (public)
  - `GET /api/beneficiary/auth/profile` (protected)
  - `PUT /api/beneficiary/auth/profile` (protected)

### API Service

#### beneficiaryApi.ts
- Location: `erp/src/services/beneficiaryApi.ts`
- Methods:
  - `sendOTP(phone)`: Request OTP
  - `verifyOTP(phone, otp)`: Verify OTP and login
  - `resendOTP(phone)`: Resend OTP
  - `updateProfile(profileData)`: Update user profile
  - `getProfile()`: Get user profile
  - `logout()`: Clear all stored tokens and user data

## Routes

### Public Routes
- `/beneficiary-login` - Login page

### Protected Routes (Require Authentication)
- `/beneficiary/profile-completion` - Profile completion (no verification required)
- `/beneficiary/dashboard` - Dashboard (requires verification)
- `/beneficiary/schemes` - Browse schemes (requires verification)
- `/beneficiary/apply/:schemeId` - Apply for scheme (requires verification)
- `/beneficiary/track/:id` - Track application (requires verification)

## Local Storage Keys

The system uses the following localStorage keys:
- `beneficiary_token` - JWT authentication token
- `beneficiary_user` - User object (JSON string)
- `user_role` - User role ('beneficiary')
- `user_phone` - User phone number

## Profile Completion Requirements

### Required Fields
- Full name
- Mobile number (auto-filled from login, read-only)
- Gender (male/female/other)
- District (dropdown selection from 14 Kerala districts)

## Security Features

1. **OTP-based Authentication**: No passwords, only OTP verification
2. **Static OTP in Development**: Uses 123456 for all logins (configurable)
3. **JWT Tokens**: Secure token-based authentication
4. **Rate Limiting**: 1-minute cooldown between OTP requests
5. **Role-based Access**: Beneficiaries can only access beneficiary routes
6. **Profile Verification**: Dashboard access requires completed profile

## Testing

### Test First-Time User Flow
1. Navigate to `/beneficiary-login`
2. Enter a new phone number (e.g., 9876543210)
3. Click "Send OTP"
4. Enter OTP: 123456
5. Should redirect to `/beneficiary/profile-completion`
6. Fill in profile details
7. Click "Complete Profile & Continue"
8. Should redirect to `/beneficiary/dashboard`

### Test Returning User Flow
1. Navigate to `/beneficiary-login`
2. Enter the same phone number used before
3. Click "Send OTP"
4. Enter OTP: 123456
5. Should redirect directly to `/beneficiary/dashboard`

### Test Profile Guard
1. Login as a new user
2. Try to navigate directly to `/beneficiary/dashboard`
3. Should redirect to `/beneficiary/profile-completion`
4. Complete profile
5. Try to navigate to `/beneficiary/profile-completion` again
6. Should redirect to `/beneficiary/dashboard`

## Development Notes

- Static OTP is enabled by default (123456)
- OTP expires in 10 minutes (configurable)
- All beneficiary routes are prefixed with `/beneficiary`
- Backend API routes are prefixed with `/api/beneficiary`
- State is set to "Kerala" by default for all addresses

## Future Enhancements

1. SMS integration for production OTP delivery
2. Email verification
3. Document upload during profile completion
4. Profile photo upload
5. Multi-language support
6. Push notifications for application updates
