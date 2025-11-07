# 🔄 Restart API Server

## The code has been fixed, but you MUST restart the server!

The route fix has been applied to the file, but **Node.js servers don't automatically reload code changes**. You need to restart it.

## Option 1: If Running in a Terminal Window

1. Find the terminal window where you started the API server
2. Press `Ctrl+C` to stop it
3. Run the start command again:
   ```bash
   cd api
   npm run dev
   ```
   OR
   ```bash
   cd api
   node src/server.js
   ```

## Option 2: If You Don't Know Where It's Running

### Windows (PowerShell):
```powershell
# Find the API server process (usually on port 8000)
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object OwningProcess

# Kill the process (replace XXXX with the process ID from above)
Stop-Process -Id XXXX -Force

# Then start the server again
cd api
npm run dev
```

### Quick Kill All Node Processes (Nuclear Option):
```powershell
# WARNING: This kills ALL Node.js processes
Stop-Process -Name node -Force

# Then start the API server
cd api
npm run dev
```

## Option 3: Using Task Manager (Windows)

1. Press `Ctrl+Shift+Esc` to open Task Manager
2. Go to the "Details" tab
3. Find all `node.exe` processes
4. Right-click on each and select "End Task"
5. Open a new terminal and run:
   ```bash
   cd api
   npm run dev
   ```

## How to Verify the Server Restarted

After restarting, you should see in the console:
```
✅ Connected to MongoDB
🚀 Server running on port 8000
```

## Then Test the Fix

1. Refresh your browser page (F5)
2. The 403 error should be gone!
3. You should see the beneficiaries list

## Still Getting 403?

If you still get 403 after restarting:

1. **Check the server console** - you should see these debug logs:
   ```
   🔍 AUTHENTICATION DEBUG:
   - Path: /beneficiaries
   - Auth header exists: true
   - Token (first 20 chars): ...
   - Decoded userId: ...
   - Decoded role: state_admin
   
   🔍 AUTHORIZATION DEBUG:
   - Required roles: [ 'super_admin', 'state_admin', ... ]
   - User exists: true
   - User role: state_admin
   - Role check result: true
   ✅ Authorization successful
   ```

2. **If you see "Role check result: false"**, your token might be wrong. Log out and log in again:
   - Phone: 9876543210
   - OTP: 123456

3. **If you don't see any debug logs**, the server might not have restarted properly. Try the nuclear option above.

## Quick Test Command

Run this in PowerShell to test if the API is responding:
```powershell
# Get your token from browser console first:
# localStorage.getItem('token')

$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
Invoke-RestMethod -Uri "http://localhost:8000/api/beneficiaries?page=1&limit=10" -Headers $headers -Method Get
```

If this works, the server is fixed and the issue is in the browser cache. Try a hard refresh: `Ctrl+Shift+R`
