# 🚀 Quick Migration Guide - Run This Now!

## For macOS/Linux:

```bash
cd Baithuzakath-ERP/api

# Replace with your actual MongoDB URI
./migrate-production.sh "mongodb+srv://username:password@cluster.mongodb.net/database"
```

## For Windows:

```cmd
cd Baithuzakath-ERP\api

REM Replace with your actual MongoDB URI
migrate-production.bat "mongodb+srv://username:password@cluster.mongodb.net/database"
```

## Or use Node directly:

```bash
cd Baithuzakath-ERP/api

# macOS/Linux
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/database" node scripts/migrate-production-users.js

# Windows (Command Prompt)
set MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
node scripts/migrate-production-users.js

# Windows (PowerShell)
$env:MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/database"
node scripts/migrate-production-users.js
```

---

## Where to Get Your MongoDB URI?

### Option 1: From Render Dashboard
1. Go to https://dashboard.render.com
2. Click on your `baithuzakath-api` service
3. Go to "Environment" tab
4. Find `MONGODB_URI` variable
5. Click "Show" to reveal the value
6. Copy it

### Option 2: From MongoDB Atlas
1. Go to https://cloud.mongodb.com
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password

---

## What Happens?

The script will:
1. ✅ Connect to your production database
2. ✅ Find all admin users (district, area, unit admins)
3. ✅ Extract their location hierarchy
4. ✅ Add separate `district`, `area`, `unit` references
5. ✅ Skip already migrated users
6. ✅ Show detailed progress

**Time**: Usually takes 5-10 seconds for ~50 users

---

## After Migration

1. Open your app: https://baithuzakath.netlify.app
2. Go to User Management page
3. Check the "Location" column - you should now see:
   - **District Admin**: "District Name" with "District" label
   - **Area Admin**: "Area Name" with "District Name (District)" below
   - **Unit Admin**: "Unit Name" with "District > Area" below

---

## Need Help?

See detailed guide: `RUN_PRODUCTION_MIGRATION.md`

---

**⚠️ IMPORTANT**: 
- This is SAFE to run - it only adds new fields
- You can run it multiple times - already migrated users are skipped
- Your existing data is NOT deleted
