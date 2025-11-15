# Nazim Data Import Instructions

## ✅ Data Validation Complete

The data has been validated and is ready for import with the following statistics:

### 📊 Data Summary
- **Total Rows**: 1,635
- **Valid Rows**: 1,457 (89%)
- **Districts**: 15
- **Areas**: 161
- **Units (Halqas)**: 1,456
- **Unit Admins (Nazims)**: 1,453 unique phone numbers

### ⚠️ Known Issues (Will be skipped during import)
1. **7 Invalid Phone Numbers** - These will be skipped with warnings
2. **4 Duplicate Phone Numbers** - First occurrence will be used, duplicates will update the same user

## 🚀 How to Run the Import

### Step 1: Validate the Data (Optional but Recommended)
```bash
cd Baithuzakath-ERP/api
npm run validate:nazim
```

This will show you:
- Total valid/invalid rows
- District breakdown
- Any phone number issues
- Duplicate phone numbers

### Step 2: Run the Import
```bash
npm run import:nazim
```

## 📋 What Will Be Created

### 1. Kerala State
- Root location for the hierarchy

### 2. Districts (15)
- KASARAGODE (35 units)
- KANNUR (92 units)
- KOZHIKODE (219 units)
- KOZHIKODE CITY (36 units)
- WAYANAD (26 units)
- MALAPPURAM (506 units) - Largest district
- PALAKKAD (114 units)
- TRISSUR (139 units)
- ERNAKULAM (included in KOCHI CITY)
- KOCHI CITY (51 units)
- KOTTAYAM (32 units)
- IDUKKI (units data incomplete)
- ALAPUZHA (53 units)
- PATHANAMTHITTA (units data incomplete)
- KOLLAM (66 units)
- TRIVANDRUM (66 units)

### 3. Areas (161)
- Organized under respective districts
- Examples: KASARAGODE, KUMBALA, KANHANGAD, etc.

### 4. Units/Halqas (1,456)
- Organized under respective areas
- Examples: Chemnad, Melparamba, Kasaragod, etc.

### 5. Unit Admins (1,453)
- One admin per unit (some duplicates will share)
- Role: `unit_admin`
- Permissions:
  - ✅ Can approve applications
  - ✅ Can view reports
  - ❌ Cannot create users
  - ❌ Cannot manage projects/schemes
  - ❌ Cannot manage finances

## 🔍 Import Process

The script will:

1. **Connect to MongoDB** using your `.env` configuration
2. **Create/Find Kerala State** as the root location
3. **Process each district**:
   - Check if exists, create if not
   - Link to Kerala state
4. **Process each area**:
   - Check if exists under district
   - Create if not, link to district
5. **Process each unit**:
   - Check if exists under area
   - Create if not, link to area
6. **Process each unit admin**:
   - Check if user exists by phone number
   - Create new user if not found
   - Update existing user if role/scope changed
   - **No email required** - Phone-only authentication

## 📊 Expected Output

```
🚀 Starting Nazim data import...
✅ Connected to MongoDB

📊 Found 15 districts to process

📍 Processing District: KASARAGODE
  ✅ Created district: KASARAGODE
  
  📍 Processing Area: KASARAGODE
    ✅ Created area: KASARAGODE
    
      ✅ Created unit: Chemnad
      ✅ Created unit admin: Eng. CA Abdul Hameed (9895169875)
      
      ✅ Created unit: Melparamba
      ✅ Created unit admin: Hamza KM (9495655337)
      
... (continues for all units)

============================================================
📊 IMPORT SUMMARY
============================================================

🏛️  DISTRICTS:
   Created: 15
   Existing: 0
   Failed: 0
   Total: 15

🗺️  AREAS:
   Created: 161
   Existing: 0
   Failed: 0
   Total: 161

🏘️  UNITS:
   Created: 1456
   Existing: 0
   Failed: 7
   Total: 1456

👥 UNIT ADMINS:
   Created: 1453
   Existing: 0
   Failed: 7
   Total: 1453

============================================================
✅ Import completed successfully!
============================================================
```

## ⚠️ Important Notes

### Email Field
- **Email is NOT required** for unit admins
- The script does NOT set email to avoid duplicate key errors
- Users will authenticate using phone number + OTP only

### Duplicate Phone Numbers
- 4 phone numbers appear multiple times in the data
- The script will:
  - Create user on first occurrence
  - Update the same user on subsequent occurrences
  - The user will be assigned to the LAST unit in the data

### Invalid Phone Numbers
- 7 phone numbers are invalid and will be skipped:
  - `974403081` (9 digits)
  - `95460151668` (11 digits)
  - `4942680362` (doesn't start with 6-9)
  - `994602942` (9 digits)
  - `9846 52817` (has space)
  - `9496353110, 9747200000` (two numbers)
  - `952859049` (9 digits)

### Re-running the Script
- The script is **idempotent** - safe to run multiple times
- Existing records will be detected and skipped
- Only new records will be created
- Existing users will be updated if their role/scope changed

## 🔧 Troubleshooting

### Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Make sure MongoDB is running and `.env` has correct `MONGODB_URI`

### Duplicate Key Error
```
E11000 duplicate key error
```
**Solution**: The script handles this automatically. If it persists, check for data inconsistencies.

### Permission Error
```
MongoServerError: not authorized
```
**Solution**: Check MongoDB user permissions in your connection string

## 📝 After Import

### Verify the Data

1. **Check Districts**:
```bash
curl http://localhost:5000/api/locations?type=district
```

2. **Check Areas for a District**:
```bash
curl http://localhost:5000/api/locations?type=area&parent=<district_id>
```

3. **Check Units for an Area**:
```bash
curl http://localhost:5000/api/locations?type=unit&parent=<area_id>
```

4. **Check Unit Admins**:
```bash
curl http://localhost:5000/api/users?role=unit_admin
```

### Test Login

Unit admins can now login using:
- Phone number (10 digits)
- OTP (will be sent via SMS/shown in console for testing)

## 🆘 Support

If you encounter any issues:
1. Check the console output for specific error messages
2. Run the validation script first: `npm run validate:nazim`
3. Verify MongoDB connection and permissions
4. Check the data file format and location

## ✅ Ready to Import!

Everything is configured and validated. Run:
```bash
npm run import:nazim
```

The import will take a few minutes to complete. Watch the console for progress updates.
