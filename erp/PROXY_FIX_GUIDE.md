# API Proxy Configuration Fix

## Problem
Frontend was trying to call API on `http://localhost:8080/api` but the API server runs on `http://localhost:5001`.

## Solution Applied

### 1. Added Vite Proxy Configuration
Updated `vite.config.ts` to proxy `/api` requests to the backend server:

```typescript
server: {
  host: "::",
  port: 8080,
  proxy: {
    '/api': {
      target: 'http://localhost:5001',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

### 2. Updated API Client
Modified `src/lib/api.ts` to use relative URLs in development:

```typescript
const API_BASE_URL = import.meta.env.DEV ? '/api' : 'http://localhost:5001/api';
```

## How It Works

```
Frontend Request: http://localhost:8080/api/auth/verify-otp
                           ↓
                    Vite Proxy
                           ↓
Backend Receives: http://localhost:5001/api/auth/verify-otp
```

## Steps to Apply Fix

### 1. Restart Frontend Dev Server
```bash
# Stop the current dev server (Ctrl+C)
# Then restart it
npm run dev
```

### 2. Verify API Server is Running
```bash
# Check if API is running on port 5001
curl http://localhost:5001/api/auth/status

# Or start it if not running
cd baithuzkath-api
npm start
```

### 3. Test Login Flow

#### Using Browser DevTools:
1. Open your app at `http://localhost:8080`
2. Open DevTools (F12) → Network tab
3. Try to login with phone: **9999999999**
4. Check the network requests - they should now succeed

#### Using curl:
```bash
# This should now work through the proxy
curl -X POST http://localhost:8080/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999","purpose":"login"}'
```

## Test Credentials

### Super Admin (Full Access)
- **Phone:** 9999999999
- **Role:** super_admin
- **OTP (Development):** 123456

### Other Test Users
- **Area Admin:** 9876543212
- **District Admin:** 9876543211
- **Unit Admin:** 9876543213
- **Beneficiary:** 9876543214

## Troubleshooting

### Issue: Still getting 404
**Solution:** Make sure you restarted the Vite dev server after the config change.

### Issue: Connection refused
**Solution:** Verify the API server is running:
```bash
# Check if port 5001 is in use
lsof -i :5001

# Start API server if needed
cd baithuzkath-api
npm start
```

### Issue: CORS errors
**Solution:** The proxy should handle CORS, but if you still see errors:
1. Check that `changeOrigin: true` is in the proxy config
2. Verify the API server's CORS settings in `baithuzkath-api/src/app.js`

### Issue: Proxy not working
**Solution:** Check Vite dev server logs for proxy errors:
```bash
# Look for lines like:
# [vite] http proxy error: ...
```

## Verification Checklist

- [ ] Vite config updated with proxy
- [ ] API client updated to use relative URLs
- [ ] Frontend dev server restarted
- [ ] API server is running on port 5001
- [ ] Can access frontend at http://localhost:8080
- [ ] Network tab shows requests going to `/api/*`
- [ ] Login with 9999999999 works successfully

## Production Deployment

For production, you'll need to:

1. **Set environment variable:**
```bash
VITE_API_URL=https://your-api-domain.com/api
```

2. **Update API client:**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
```

3. **Configure reverse proxy** (nginx/Apache) to route `/api` to your backend server.

## Summary

✅ Proxy configured to forward API requests from port 8080 to 5001
✅ API client updated to use relative URLs in development
✅ Login should now work with phone 9999999999 (super admin)

**Next Step:** Restart your frontend dev server and try logging in!
