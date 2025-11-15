# Quick Start: Nazim Data Import

## 🚀 Three Simple Steps

### 1️⃣ Validate Data (Optional)
```bash
cd Baithuzakath-ERP/api
npm run validate:nazim
```
**What it does**: Checks data quality, shows statistics, identifies issues

### 2️⃣ Import Data
```bash
npm run import:nazim
```
**What it does**: 
- Creates 15 districts
- Creates 161 areas
- Creates 1,456 units (halqas)
- Creates 1,453 unit admins (nazims)

**Time**: ~5-10 minutes

### 3️⃣ Verify Import (Optional)
```bash
npm run verify:nazim
```
**What it does**: Checks database integrity, shows sample data, verifies hierarchy

## ✅ What You Get

After import, you'll have:
- **Complete hierarchy**: Kerala → Districts → Areas → Units
- **1,453 unit admins** ready to login with phone + OTP
- **No email required** - phone-only authentication
- **Proper permissions** set for each unit admin

## 📊 Expected Results

```
Districts: 15
Areas: 161
Units: 1,456
Unit Admins: 1,453
```

## ⚠️ Known Issues (Auto-handled)

- 7 invalid phone numbers → Will be skipped
- 4 duplicate phone numbers → Will update same user
- No emails set → Intentional, phone-only auth

## 🔧 Prerequisites

1. MongoDB running
2. `.env` file configured with `MONGODB_URI`
3. Node.js installed

## 📝 After Import

Unit admins can login at:
```
POST /api/auth/login
{
  "phone": "9895169875",
  "otp": "123456"
}
```

## 🆘 Need Help?

See `IMPORT_INSTRUCTIONS.md` for detailed documentation.

## ✨ Ready to Go!

Just run: `npm run import:nazim`
