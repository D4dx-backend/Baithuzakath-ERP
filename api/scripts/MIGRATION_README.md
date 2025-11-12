# User Location Migration Script

## Purpose
This script updates existing users to have separate `district`, `area`, and `unit` references in their `adminScope` for easier hierarchy display.

## What It Does

### Before Migration:
```javascript
adminScope: {
  level: "area",
  regions: [ObjectId("69057672fa28253317ecedd")]  // Just the area ID
}
```

### After Migration:
```javascript
adminScope: {
  level: "area",
  district: ObjectId("..."),  // Parent district ID
  area: ObjectId("69057672fa28253317ecedd"),  // Area ID
  regions: [ObjectId("69057672fa28253317ecedd")]  // Kept for backward compatibility
}
```

## How to Run

### 1. Navigate to API directory
```bash
cd Baithuzakath-ERP/api
```

### 2. Run the migration script
```bash
node scripts/migrate-user-locations.js
```

### 3. Check the output
The script will show:
- ✅ Successfully migrated users
- ⏭️ Skipped users (already migrated)
- ❌ Any errors encountered
- 📊 Summary statistics

## What Gets Updated

### District Admin
- Sets `adminScope.district` to the district location ID

### Area Admin
- Sets `adminScope.district` to the parent district ID
- Sets `adminScope.area` to the area location ID

### Unit Admin
- Sets `adminScope.district` to the grandparent district ID
- Sets `adminScope.area` to the parent area ID
- Sets `adminScope.unit` to the unit location ID

## Safety Features

1. **Idempotent**: Can be run multiple times safely - skips already migrated users
2. **Non-destructive**: Keeps existing `regions` array for backward compatibility
3. **Validation**: Checks if locations exist before updating
4. **Detailed logging**: Shows exactly what's being updated for each user

## Example Output

```
🔄 Starting user location migration...

📊 Found 15 users to migrate

✅ John Doe (Area Admin) -> District: Malappuram, Area: Tirur
✅ Jane Smith (Unit Admin) -> District: Malappuram, Area: Tirur, Unit: Tirur East
⏭️  Skipping Admin User (District Admin) - Already migrated
⚠️  Warning: Area Kochi has no parent district

📈 Migration Summary:
   ✅ Successfully migrated: 12
   ⏭️  Skipped (already migrated): 2
   ❌ Errors: 1
   📊 Total processed: 15

✅ Migration completed successfully!
```

## Rollback

If you need to rollback, you can remove the new fields:

```javascript
// In MongoDB shell or script
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

## Notes

- The script only processes users with roles: `district_admin`, `area_admin`, `unit_admin`
- Other roles (beneficiary, coordinators) are not affected
- The `regions` array is preserved for backward compatibility
- Make sure your `.env` file has the correct `MONGODB_URI`
