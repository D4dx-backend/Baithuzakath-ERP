# 🚀 Run Production Database Migration Locally

## Prerequisites

1. ✅ You have your production MongoDB URI
2. ✅ You're in the `Baithuzakath-ERP/api` directory
3. ✅ Node.js and npm are installed

## Step-by-Step Instructions

### Step 1: Get Your Production MongoDB URI

Your production MongoDB URI should look like:
```
mongodb+srv://username:password@cluster.mongodb.net/database_name
```

You can find this in:
- Render Dashboard → Your Service → Environment Variables → `MONGODB_URI`
- Or your MongoDB Atlas dashboard

### Step 2: Navigate to API Directory

```bash
cd Baithuzakath-ERP/api
```

### Step 3: Run the Migration

**Option A: Using environment variable (Recommended)**
```bash
MONGODB_URI="your-production-mongodb-uri-here" node scripts/migrate-production-users.js
```

**Option B: Pass as argument**
```bash
node scripts/migrate-production-users.js "your-production-mongodb-uri-here"
```

### Example:

```bash
MONGODB_URI="mongodb+srv://admin:mypassword@cluster0.mongodb.net/baithuzakath" node scripts/migrate-production-users.js
```

## What You'll See

```
🔗 Connecting to: mongodb+srv://admin:****@cluster0.mongodb.net/baithuzakath
✅ Connected to MongoDB

🔄 Starting PRODUCTION user location migration...

⚠️  This will update the production database!

📊 Found 15 users to migrate

✅ John Doe (Area Admin) -> District: Malappuram, Area: Tirur
✅ Jane Smith (Unit Admin) -> District: Malappuram, Area: Tirur, Unit: Tirur East
✅ Ahmed Khan (District Admin) -> District: Kozhikode
⏭️  Skipping Admin User (District Admin) - Already migrated

📈 Migration Summary:
   ✅ Successfully migrated: 12
   ⏭️  Skipped (already migrated): 2
   ❌ Errors: 1
   📊 Total processed: 15

✅ Production database updated successfully!

✅ Migration completed!

🔌 Database connection closed
```

## Verify the Migration

After running, you can verify by:

1. **Check in your app**: Go to `/users` page and see if location hierarchy displays correctly
2. **Run verification script**:
   ```bash
   MONGODB_URI="your-production-uri" node scripts/verify-user-locations.js
   ```

## Troubleshooting

### Error: "MONGODB_URI not provided"
- Make sure you're passing the URI correctly
- Check for quotes around the URI
- Ensure no extra spaces

### Error: "Connection failed"
- Verify your MongoDB URI is correct
- Check your IP is whitelisted in MongoDB Atlas (if using Atlas)
- Ensure your password doesn't have special characters that need escaping

### Error: "Location not found"
- Some users might have invalid location references
- The script will skip these and report them
- You can manually fix these users later

## Safety Notes

✅ **Safe to run multiple times** - Already migrated users are skipped  
✅ **Non-destructive** - Only adds new fields, doesn't remove existing data  
✅ **Detailed logging** - You see exactly what's being updated  
✅ **Connection closes automatically** - No hanging connections  

## After Migration

1. ✅ Refresh your frontend application
2. ✅ Go to User Management page
3. ✅ Check that location hierarchy displays correctly:
   - District Admin: Shows district name
   - Area Admin: Shows "Area Name" with "District Name (District)" below
   - Unit Admin: Shows "Unit Name" with "District > Area" below

## Need to Rollback?

If something goes wrong, you can remove the new fields:

```bash
# Connect to MongoDB and run:
db.users.updateMany(
  {},
  {
    $unset: {
      "adminScope.district": "",
      "adminScope.area": "",
      "adminScope.unit": ""
    }
  }
);
```

## Quick Command Reference

```bash
# Navigate to API folder
cd Baithuzakath-ERP/api

# Run migration
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/db" node scripts/migrate-production-users.js

# Verify migration
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/db" node scripts/verify-user-locations.js
```

---

**⚠️ Important**: Make sure to replace `your-production-mongodb-uri-here` with your actual MongoDB connection string!
