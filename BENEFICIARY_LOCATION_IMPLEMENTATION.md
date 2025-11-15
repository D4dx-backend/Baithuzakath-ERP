# Beneficiary Location Selection Implementation

## Overview
Added district, area, and unit selection to the beneficiary signup/profile completion flow. Beneficiaries now select their location hierarchy during profile setup, and this data is stored in their profile.

## Changes Made

### 1. Backend Changes

#### User Model (`api/src/models/User.js`)
- Added `profile.location` object with references to Location model:
  - `district`: ObjectId reference to district Location
  - `area`: ObjectId reference to area Location  
  - `unit`: ObjectId reference to unit Location

#### Beneficiary Auth Controller (`api/src/controllers/beneficiaryAuthController.js`)
- Updated `updateProfile()` to handle location references
- Added population of location data when updating profile
- Updated `getProfile()` to populate location details
- Added new `getLocations()` endpoint to fetch locations for dropdowns

#### Beneficiary Routes (`api/src/routes/beneficiaryRoutes.js`)
- Added new public route: `GET /api/beneficiary/auth/locations`
- Supports query parameters:
  - `type`: Filter by location type (district, area, unit)
  - `parent`: Filter by parent location ID

### 2. Frontend Changes

#### Beneficiary API Service (`erp/src/services/beneficiaryApi.ts`)
- Added `getLocations()` method to fetch locations from API
- Supports filtering by type and parent

#### Profile Completion Page (`erp/src/pages/BeneficiaryProfileCompletion.tsx`)
- Removed hardcoded Kerala districts list
- Added three cascading dropdowns:
  1. **District**: Loads all districts on page load
  2. **Area**: Loads areas when district is selected
  3. **Unit**: Loads units when area is selected
- Added validation to require all three location fields
- Updated form submission to send location IDs instead of text values
- Added loading states for location dropdowns

## API Endpoints

### Get Locations (Public)
```
GET /api/beneficiary/auth/locations?type=district
GET /api/beneficiary/auth/locations?type=area&parent={districtId}
GET /api/beneficiary/auth/locations?type=unit&parent={areaId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "locations": [
      {
        "_id": "location_id",
        "name": "Location Name",
        "code": "LOCATION_CODE",
        "type": "district|area|unit",
        "parent": "parent_id"
      }
    ]
  }
}
```

### Update Profile
```
PUT /api/beneficiary/auth/profile
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "Beneficiary Name",
  "profile": {
    "gender": "male|female|other",
    "location": {
      "district": "district_id",
      "area": "area_id",
      "unit": "unit_id"
    }
  }
}
```

## User Flow

1. Beneficiary logs in with phone number and OTP
2. If first-time user (not verified), redirected to profile completion
3. Profile completion form shows:
   - Name field
   - Gender selection
   - District dropdown (populated from database)
   - Area dropdown (enabled after district selection)
   - Unit dropdown (enabled after area selection)
4. On form submission:
   - All fields validated
   - Location IDs saved to user profile
   - User marked as verified
   - Redirected to beneficiary dashboard

## Data Structure

### User Profile Location
```javascript
profile: {
  location: {
    district: ObjectId -> Location (type: 'district'),
    area: ObjectId -> Location (type: 'area'),
    unit: ObjectId -> Location (type: 'unit')
  }
}
```

### Location Model
```javascript
{
  name: String,
  type: 'state' | 'district' | 'area' | 'unit',
  code: String,
  parent: ObjectId -> Location,
  isActive: Boolean
}
```

## Benefits

1. **Data Integrity**: Uses actual location IDs instead of free text
2. **Hierarchical Structure**: Maintains proper district > area > unit hierarchy
3. **Dynamic Loading**: Areas and units load based on parent selection
4. **Centralized Management**: Locations managed in one place
5. **Reporting**: Easy to filter and report by location
6. **Scalability**: Can add/modify locations without code changes

## Testing Checklist

- [ ] Verify districts load on profile completion page
- [ ] Verify areas load when district is selected
- [ ] Verify units load when area is selected
- [ ] Verify form validation requires all three fields
- [ ] Verify profile saves with location IDs
- [ ] Verify profile retrieval populates location details
- [ ] Verify beneficiary can complete signup flow
- [ ] Verify location data appears in user profile

## Notes

- The location endpoint is public (no authentication required) to allow access during signup
- Location dropdowns are cascading - each depends on the previous selection
- All three location fields are required for profile completion
- Location data is populated when retrieving user profile for display
