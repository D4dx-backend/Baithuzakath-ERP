# Beneficiary User Flow Diagram

## Visual Flow Chart

```
┌─────────────────────────────────────────────────────────────────┐
│                    BENEFICIARY LOGIN FLOW                        │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │  User visits     │
                    │ /beneficiary-    │
                    │     login        │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Enter Phone      │
                    │   Number         │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Click Send OTP  │
                    └────────┬─────────┘
                             │
                             ▼
        ┌────────────────────┴────────────────────┐
        │                                          │
        ▼                                          ▼
┌──────────────┐                          ┌──────────────┐
│ User Exists? │                          │ User Exists? │
│     YES      │                          │      NO      │
└──────┬───────┘                          └──────┬───────┘
       │                                          │
       │                                          ▼
       │                                  ┌──────────────┐
       │                                  │ Create New   │
       │                                  │ Beneficiary  │
       │                                  │   Account    │
       │                                  └──────┬───────┘
       │                                          │
       └──────────────────┬───────────────────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │  Generate & Send │
                 │   OTP (123456)   │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │  User Enters OTP │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │   Verify OTP     │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ Generate JWT     │
                 │     Token        │
                 └────────┬─────────┘
                          │
                          ▼
        ┌─────────────────┴─────────────────┐
        │                                    │
        ▼                                    ▼
┌──────────────┐                    ┌──────────────┐
│ isVerified?  │                    │ isVerified?  │
│     TRUE     │                    │    FALSE     │
└──────┬───────┘                    └──────┬───────┘
       │                                    │
       │                                    ▼
       │                           ┌──────────────────┐
       │                           │   Redirect to    │
       │                           │    /beneficiary/ │
       │                           │profile-completion│
       │                           └────────┬─────────┘
       │                                    │
       │                                    ▼
       │                           ┌──────────────────┐
       │                           │  Fill Profile:   │
       │                           │  - Name          │
       │                           │  - DOB (18+)     │
       │                           │  - Gender        │
       │                           │  - Address       │
       │                           │  - Emergency     │
       │                           └────────┬─────────┘
       │                                    │
       │                                    ▼
       │                           ┌──────────────────┐
       │                           │ Submit Profile   │
       │                           │ isVerified=TRUE  │
       │                           └────────┬─────────┘
       │                                    │
       └────────────────┬───────────────────┘
                        │
                        ▼
               ┌──────────────────┐
               │   Redirect to    │
               │   /beneficiary/  │
               │    dashboard     │
               └────────┬─────────┘
                        │
                        ▼
               ┌──────────────────┐
               │  DASHBOARD       │
               │  - View Stats    │
               │  - Browse Schemes│
               │  - Track Apps    │
               │  - Apply         │
               └──────────────────┘
```

## Route Protection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              BENEFICIARY AUTH GUARD LOGIC                        │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │ User navigates   │
                    │ to protected     │
                    │     route        │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ BeneficiaryAuth  │
                    │  Guard checks    │
                    └────────┬─────────┘
                             │
                             ▼
        ┌────────────────────┴────────────────────┐
        │                                          │
        ▼                                          ▼
┌──────────────┐                          ┌──────────────┐
│ Has Token?   │                          │ Has Token?   │
│     YES      │                          │      NO      │
└──────┬───────┘                          └──────┬───────┘
       │                                          │
       │                                          ▼
       │                                  ┌──────────────┐
       │                                  │  Redirect to │
       │                                  │ /beneficiary-│
       │                                  │    login     │
       │                                  └──────────────┘
       │
       ▼
┌──────────────┐
│ Role =       │
│ beneficiary? │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Require      │
│ Verification?│
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│                                       │
▼                                       ▼
┌──────────────┐              ┌──────────────┐
│ isVerified?  │              │ Skip Check   │
│     TRUE     │              │ (Profile     │
└──────┬───────┘              │ Completion   │
       │                      │   Page)      │
       │                      └──────┬───────┘
       │                             │
       ▼                             ▼
┌──────────────┐              ┌──────────────┐
│ Allow Access │              │ Allow Access │
└──────────────┘              └──────────────┘

       │
       ▼
┌──────────────┐
│ isVerified?  │
│    FALSE     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Redirect to │
│ /beneficiary/│
│profile-      │
│ completion   │
└──────────────┘
```

## Data Storage Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  LOCAL STORAGE MANAGEMENT                        │
└─────────────────────────────────────────────────────────────────┘

After OTP Verification:
┌──────────────────────────────────────────────────────────────┐
│ localStorage.setItem('beneficiary_token', token)             │
│ localStorage.setItem('beneficiary_user', JSON.stringify(user))│
│ localStorage.setItem('user_role', 'beneficiary')             │
│ localStorage.setItem('user_phone', phone)                    │
└──────────────────────────────────────────────────────────────┘

After Profile Completion:
┌──────────────────────────────────────────────────────────────┐
│ Update 'beneficiary_user' with:                              │
│   - name: "Full Name"                                        │
│   - isVerified: true                                         │
│   - profile: { dateOfBirth, gender, address, emergency }    │
└──────────────────────────────────────────────────────────────┘

On Logout:
┌──────────────────────────────────────────────────────────────┐
│ localStorage.removeItem('beneficiary_token')                 │
│ localStorage.removeItem('beneficiary_user')                  │
│ localStorage.removeItem('user_role')                         │
│ localStorage.removeItem('user_phone')                        │
└──────────────────────────────────────────────────────────────┘
```

## API Endpoints Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    API ENDPOINTS USED                            │
└─────────────────────────────────────────────────────────────────┘

1. Send OTP
   POST /api/beneficiary/auth/send-otp
   Body: { phone: "9876543210" }
   Response: { staticOTP: "123456", expiresIn: 10 }

2. Verify OTP
   POST /api/beneficiary/auth/verify-otp
   Body: { phone: "9876543210", otp: "123456" }
   Response: { user: {...}, token: "jwt_token" }

3. Update Profile
   PUT /api/beneficiary/auth/profile
   Headers: { Authorization: "Bearer jwt_token" }
   Body: { name: "...", profile: {...} }
   Response: { user: {...} }

4. Get Profile
   GET /api/beneficiary/auth/profile
   Headers: { Authorization: "Bearer jwt_token" }
   Response: { user: {...} }

5. Get Dashboard Data
   GET /api/beneficiary/applications
   GET /api/beneficiary/stats
   Headers: { Authorization: "Bearer jwt_token" }
```

## State Transitions

```
User State Machine:
┌──────────┐    OTP Verify    ┌──────────────┐
│   NEW    │ ───────────────> │ AUTHENTICATED│
│  USER    │                  │  UNVERIFIED  │
└──────────┘                  └──────┬───────┘
                                     │
                                     │ Complete Profile
                                     │
                                     ▼
                              ┌──────────────┐
                              │ AUTHENTICATED│
                              │   VERIFIED   │
                              └──────┬───────┘
                                     │
                                     │ Logout
                                     │
                                     ▼
                              ┌──────────────┐
                              │ LOGGED OUT   │
                              └──────────────┘

Returning User:
┌──────────┐    OTP Verify    ┌──────────────┐
│RETURNING │ ───────────────> │ AUTHENTICATED│
│  USER    │                  │   VERIFIED   │
└──────────┘                  └──────────────┘
```
