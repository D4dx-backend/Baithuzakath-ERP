# 🚨 URGENT: Fix Netlify Production Build

## The Problem
Your deployed frontend is hardcoded to use `localhost:8000` because the environment variable wasn't set during build.

## Quick Fix (Choose ONE option)

### Option 1: Set Environment Variable in Netlify (RECOMMENDED)

1. **Go to Netlify Dashboard**
   - https://app.netlify.com
   - Select your site: `baithuzakath`

2. **Add Environment Variable**
   - Go to: Site settings → Environment variables
   - Click "Add a variable"
   - Key: `VITE_API_URL`
   - Value: `https://YOUR-BACKEND-URL.onrender.com/api`
   - Click "Save"

3. **Trigger Rebuild**
   - Go to: Deploys
   - Click "Trigger deploy" → "Deploy site"

### Option 2: Hardcode the API URL (TEMPORARY FIX)

If you don't have a backend deployed yet, temporarily hardcode a placeholder:

Edit `erp/src/lib/api.ts` line 1:
```typescript
// TEMPORARY: Replace with actual backend URL
const API_BASE_URL = 'https://your-backend-api.onrender.com/api';
```

Then rebuild and deploy:
```bash
cd erp
npm run build
```

Upload the `erp/dist` folder to Netlify.

## CRITICAL: You Still Need a Backend!

Your backend API (`api` folder) is NOT deployed. You must:

1. **Deploy backend to Render/Railway/Heroku**
2. **Get the backend URL** (e.g., `https://baithuzakath-api.onrender.com`)
3. **Update the API_BASE_URL** to point to that URL
4. **Rebuild frontend** with the correct URL

## Test After Fix

Open browser console on https://baithuzakath.netlify.app and check:
- Should NOT see `localhost:8000` in network requests
- Should see your actual backend URL
- Should NOT see `ERR_NAME_NOT_RESOLVED`

## Current Status
❌ Frontend: Deployed on Netlify
❌ Backend: NOT DEPLOYED (this is the main issue!)
❌ Environment Variable: Not set in Netlify

## Next Steps
1. Deploy backend first (see DEPLOY_BACKEND_FIRST.md)
2. Set VITE_API_URL in Netlify
3. Trigger rebuild
