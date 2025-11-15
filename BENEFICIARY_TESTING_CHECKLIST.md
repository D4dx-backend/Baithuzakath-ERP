# Beneficiary Authentication Testing Checklist

## Pre-Testing Setup
- [ ] Backend server is running on port 4000
- [ ] Frontend server is running on port 5173
- [ ] MongoDB is connected
- [ ] Static OTP is enabled (123456)

## Test 1: First-Time User Registration & Login

### Steps:
1. [ ] Navigate to `http://localhost:5173/beneficiary-login`
2. [ ] Enter a NEW phone number (e.g., 9876543210)
3. [ ] Click "Send OTP"
4. [ ] Verify OTP display shows "123456"
5. [ ] Enter OTP: 123456
6. [ ] Click "Verify & Login"

### Expected Results:
- [ ] Success toast: "Login Successful"
- [ ] Redirected to `/beneficiary/profile-completion`
- [ ] Profile completion form is displayed
- [ ] Phone number is stored in localStorage

### Profile Completion:
7. [ ] Fill in the form:
   - Name: "Test Beneficiary"
   - Mobile: (auto-filled, disabled)
   - Gender: Select "Male"
   - District: Select "Malappuram" from dropdown
8. [ ] Click "Complete Profile & Continue"

### Expected Results:
- [ ] Success toast: "Profile Completed"
- [ ] Redirected to `/beneficiary/dashboard`
- [ ] Dashboard shows user name "Test Beneficiary"
- [ ] Stats cards are displayed (all zeros for new user)
- [ ] "No Applications Yet" message is shown

## Test 2: Returning User Login

### Steps:
1. [ ] Logout from dashboard
2. [ ] Navigate to `/beneficiary-login`
3. [ ] Enter the SAME phone number (9876543210)
4. [ ] Click "Send OTP"
5. [ ] Enter OTP: 123456
6. [ ] Click "Verify & Login"

### Expected Results:
- [ ] Success toast: "Login Successful"
- [ ] Redirected DIRECTLY to `/beneficiary/dashboard` (skip profile completion)
- [ ] Dashboard shows user name "Test Beneficiary"
- [ ] User data is loaded correctly

## Test 3: Profile Completion Guard

### Steps:
1. [ ] Login as a NEW user (different phone number)
2. [ ] After OTP verification, you're on profile completion page
3. [ ] Manually navigate to `/beneficiary/dashboard` in browser URL
4. [ ] Press Enter

### Expected Results:
- [ ] Redirected back to `/beneficiary/profile-completion`
- [ ] Toast: "Complete Your Profile"
- [ ] Cannot access dashboard without completing profile

## Test 4: Verified User Cannot Access Profile Completion

### Steps:
1. [ ] Login as a VERIFIED user (completed profile)
2. [ ] Manually navigate to `/beneficiary/profile-completion` in browser URL
3. [ ] Press Enter

### Expected Results:
- [ ] Redirected to `/beneficiary/dashboard`
- [ ] Cannot access profile completion page after verification

## Test 5: Authentication Guard

### Steps:
1. [ ] Logout completely
2. [ ] Clear localStorage (optional)
3. [ ] Manually navigate to `/beneficiary/dashboard`
4. [ ] Press Enter

### Expected Results:
- [ ] Redirected to `/beneficiary-login`
- [ ] Toast: "Authentication Required"
- [ ] Cannot access protected routes without login

## Test 6: Profile Validation

### Steps:
1. [ ] Login as a NEW user
2. [ ] On profile completion page, try to submit with:
   - Empty name
   - No gender selected
   - No district selected

### Expected Results:
- [ ] Error toast for each missing required field
- [ ] Form does not submit
- [ ] User stays on profile completion page

## Test 7: District Dropdown

### Steps:
1. [ ] Login as a NEW user
2. [ ] On profile completion page:
3. [ ] Click on District dropdown
4. [ ] Verify all 14 Kerala districts are listed
5. [ ] Select "Malappuram"
6. [ ] Fill other required fields
7. [ ] Click submit

### Expected Results:
- [ ] Dropdown shows all Kerala districts alphabetically
- [ ] Selected district is displayed correctly
- [ ] Form submits successfully

## Test 8: OTP Resend

### Steps:
1. [ ] Navigate to `/beneficiary-login`
2. [ ] Enter phone number
3. [ ] Click "Send OTP"
4. [ ] On OTP screen, click "Resend OTP"
5. [ ] Wait 1 minute
6. [ ] Click "Resend OTP" again

### Expected Results:
- [ ] First resend: Error toast about waiting
- [ ] After 1 minute: Success toast "OTP Resent"
- [ ] New OTP is displayed (still 123456 in static mode)

## Test 9: Invalid OTP

### Steps:
1. [ ] Navigate to `/beneficiary-login`
2. [ ] Enter phone number
3. [ ] Click "Send OTP"
4. [ ] Enter wrong OTP: 111111
5. [ ] Click "Verify & Login"

### Expected Results:
- [ ] Error toast: "Invalid OTP"
- [ ] User stays on OTP screen
- [ ] Can try again

## Test 10: Logout Functionality

### Steps:
1. [ ] Login as any user
2. [ ] Navigate to dashboard
3. [ ] Click logout button in header
4. [ ] Check localStorage

### Expected Results:
- [ ] Success toast: "Logged out successfully"
- [ ] Redirected to home page `/`
- [ ] All localStorage items cleared:
  - beneficiary_token
  - beneficiary_user
  - user_role
  - user_phone

## Test 11: Token Persistence

### Steps:
1. [ ] Login as any user
2. [ ] Navigate to dashboard
3. [ ] Refresh the page (F5)
4. [ ] Close browser tab
5. [ ] Open new tab and navigate to `/beneficiary/dashboard`

### Expected Results:
- [ ] User remains logged in after refresh
- [ ] Dashboard loads correctly
- [ ] User data is preserved
- [ ] No need to login again

## Test 12: Multiple Users

### Steps:
1. [ ] Login with phone: 9876543210
2. [ ] Complete profile
3. [ ] Logout
4. [ ] Login with phone: 9876543211
5. [ ] Complete profile
6. [ ] Logout
7. [ ] Login with phone: 9876543210 again

### Expected Results:
- [ ] Each user has separate profile
- [ ] Correct user data is loaded for each login
- [ ] No data mixing between users

## Backend Verification

### Database Checks:
1. [ ] Open MongoDB
2. [ ] Check `users` collection
3. [ ] Verify new beneficiary users are created with:
   - role: "beneficiary"
   - isActive: true
   - isVerified: false (before profile completion)
   - isVerified: true (after profile completion)
   - Correct phone number
   - Correct profile data

### API Response Checks:
1. [ ] Check browser Network tab
2. [ ] Verify API responses:
   - `/api/beneficiary/auth/send-otp` returns 200
   - `/api/beneficiary/auth/verify-otp` returns user and token
   - `/api/beneficiary/auth/profile` (PUT) returns updated user
   - Token is included in Authorization header for protected routes

## Edge Cases

### Test 13: Expired OTP
- [ ] Wait 10+ minutes after OTP is sent
- [ ] Try to verify OTP
- [ ] Expected: Error toast "OTP has expired"

### Test 14: Phone Number Format
- [ ] Try phone numbers:
  - 123456789 (9 digits) - Should fail
  - 12345678901 (11 digits) - Should fail
  - 5876543210 (starts with 5) - Should fail
  - 9876543210 (valid) - Should pass

### Test 15: Special Characters in Name
- [ ] Enter name with special characters: "Test@#$%"
- [ ] Submit profile
- [ ] Expected: Should accept (no restriction on special chars)

### Test 16: Very Long Name
- [ ] Enter name with 150 characters
- [ ] Submit profile
- [ ] Expected: Should be truncated or validated (check max length)

## Performance Tests

### Test 17: Quick Navigation
- [ ] Login
- [ ] Quickly navigate between:
  - Dashboard
  - Schemes
  - Back to Dashboard
- [ ] Expected: No errors, smooth transitions

### Test 18: Concurrent Logins
- [ ] Open two browser windows
- [ ] Login with same user in both
- [ ] Expected: Both should work, token is shared

## Summary Checklist

- [ ] All 18 tests passed
- [ ] No console errors
- [ ] No network errors
- [ ] Database records are correct
- [ ] User experience is smooth
- [ ] All validations work correctly
- [ ] Authentication flow is secure

## Notes
- Static OTP (123456) is used for all tests
- All tests should be performed in development environment
- For production, replace static OTP with actual SMS service
