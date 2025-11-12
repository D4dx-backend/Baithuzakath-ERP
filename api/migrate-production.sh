#!/bin/bash

# Production Database Migration Script
# This script migrates users in the production MongoDB database

echo "🚀 Production User Location Migration"
echo "======================================"
echo ""

# Check if MongoDB URI is provided
if [ -z "$1" ]; then
    echo "❌ Error: MongoDB URI not provided"
    echo ""
    echo "Usage:"
    echo "  ./migrate-production.sh \"mongodb+srv://user:pass@cluster.mongodb.net/db\""
    echo ""
    echo "Or set environment variable:"
    echo "  export MONGODB_URI=\"mongodb+srv://user:pass@cluster.mongodb.net/db\""
    echo "  ./migrate-production.sh"
    echo ""
    exit 1
fi

MONGODB_URI="$1"

echo "⚠️  WARNING: This will modify your PRODUCTION database!"
echo ""
echo "Press ENTER to continue or Ctrl+C to cancel..."
read

echo ""
echo "🔄 Running migration..."
echo ""

# Run the migration script
MONGODB_URI="$MONGODB_URI" node scripts/migrate-production-users.js

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "Next steps:"
    echo "  1. Refresh your frontend application"
    echo "  2. Go to User Management page"
    echo "  3. Verify location hierarchy displays correctly"
    echo ""
else
    echo ""
    echo "❌ Migration failed. Please check the error messages above."
    echo ""
    exit 1
fi
