#!/usr/bin/env node

/**
 * RBAC System Verification Script
 * 
 * This script verifies that the RBAC system is properly configured
 * and checks for common conflicts and issues.
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Verification results
const results = {
  passed: 0,
  warnings: 0,
  errors: 0,
  issues: []
};

/**
 * Check if file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Read file content
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

/**
 * Check backend RBAC files
 */
function checkBackendFiles() {
  logSection('1. Checking Backend RBAC Files');

  const requiredFiles = [
    'baithuzkath-api/src/services/rbacService.js',
    'baithuzkath-api/src/middleware/rbacMiddleware.js',
    'baithuzkath-api/src/middleware/auth.js',
    'baithuzkath-api/src/routes/rbacRoutes.js',
    'baithuzkath-api/src/controllers/rbacController.js'
  ];

  requiredFiles.forEach(file => {
    if (fileExists(file)) {
      logSuccess(`Found: ${file}`);
      results.passed++;
    } else {
      logError(`Missing: ${file}`);
      results.errors++;
      results.issues.push(`Missing required file: ${file}`);
    }
  });
}

/**
 * Check frontend RBAC files
 */
function checkFrontendFiles() {
  logSection('2. Checking Frontend RBAC Files');

  const requiredFiles = [
    'src/hooks/useRBAC.tsx',
    'src/components/rbac/PermissionGate.tsx',
    'src/lib/api.ts',
    'src/contexts/AuthContext.tsx'
  ];

  requiredFiles.forEach(file => {
    if (fileExists(file)) {
      logSuccess(`Found: ${file}`);
      results.passed++;
    } else {
      logError(`Missing: ${file}`);
      results.errors++;
      results.issues.push(`Missing required file: ${file}`);
    }
  });
}

/**
 * Check RBAC routes registration
 */
function checkRoutesRegistration() {
  logSection('3. Checking RBAC Routes Registration');

  const appFile = 'baithuzkath-api/src/app.js';
  if (!fileExists(appFile)) {
    logError(`App file not found: ${appFile}`);
    results.errors++;
    return;
  }

  const content = readFile(appFile);
  if (!content) {
    logError('Could not read app.js');
    results.errors++;
    return;
  }

  // Check if RBAC routes are imported
  if (content.includes("require('./routes/rbacRoutes')")) {
    logSuccess('RBAC routes are imported');
    results.passed++;
  } else {
    logError('RBAC routes are not imported in app.js');
    results.errors++;
    results.issues.push('RBAC routes not imported in app.js');
  }

  // Check if RBAC routes are mounted
  if (content.includes("app.use('/api/rbac'")) {
    logSuccess('RBAC routes are mounted at /api/rbac');
    results.passed++;
  } else {
    logError('RBAC routes are not mounted');
    results.errors++;
    results.issues.push('RBAC routes not mounted in app.js');
  }
}

/**
 * Check middleware consistency
 */
function checkMiddlewareConsistency() {
  logSection('4. Checking Middleware Consistency');

  const authFile = 'baithuzkath-api/src/middleware/auth.js';
  const rbacFile = 'baithuzkath-api/src/middleware/rbacMiddleware.js';

  if (!fileExists(authFile) || !fileExists(rbacFile)) {
    logError('Middleware files not found');
    results.errors++;
    return;
  }

  const authContent = readFile(authFile);
  const rbacContent = readFile(rbacFile);

  // Check if auth.js exports RBAC middleware
  if (authContent.includes('...RBACMiddleware')) {
    logSuccess('Auth middleware exports RBAC middleware');
    results.passed++;
  } else {
    logWarning('Auth middleware does not export RBAC middleware');
    results.warnings++;
    results.issues.push('Consider exporting RBAC middleware from auth.js for consistency');
  }

  // Check if hasPermission exists in both
  const authHasPermission = authContent.includes('const hasPermission');
  const rbacHasPermission = rbacContent.includes('static hasPermission');

  if (authHasPermission && rbacHasPermission) {
    logSuccess('hasPermission method exists in both middleware files');
    results.passed++;
  } else {
    logWarning('hasPermission method may not be consistent across middleware');
    results.warnings++;
  }
}

/**
 * Check route protection patterns
 */
function checkRouteProtection() {
  logSection('5. Checking Route Protection Patterns');

  const routesDir = 'baithuzkath-api/src/routes';
  if (!fileExists(routesDir)) {
    logError('Routes directory not found');
    results.errors++;
    return;
  }

  const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
  let protectedRoutes = 0;
  let unprotectedRoutes = 0;
  const unprotectedFiles = [];

  routeFiles.forEach(file => {
    const content = readFile(path.join(routesDir, file));
    if (!content) return;

    // Skip auth routes (they don't need authentication)
    if (file === 'authRoutes.js') return;

    // Check if file uses authentication
    const hasAuthenticate = content.includes('authenticate');
    const hasAuthorize = content.includes('authorize');
    const hasPermission = content.includes('hasPermission') || content.includes('checkPermission');
    const hasRBACMiddleware = content.includes('RBACMiddleware');

    if (hasAuthenticate && (hasAuthorize || hasPermission || hasRBACMiddleware)) {
      protectedRoutes++;
    } else if (hasAuthenticate) {
      logWarning(`${file}: Has authentication but missing authorization`);
      results.warnings++;
      unprotectedFiles.push(file);
    } else {
      logError(`${file}: Missing authentication`);
      results.errors++;
      unprotectedRoutes++;
      unprotectedFiles.push(file);
    }
  });

  logInfo(`Protected routes: ${protectedRoutes}`);
  logInfo(`Routes needing review: ${unprotectedFiles.length}`);

  if (unprotectedFiles.length > 0) {
    logWarning('Files needing authorization review:');
    unprotectedFiles.forEach(f => logWarning(`  - ${f}`));
    results.issues.push(`${unprotectedFiles.length} route files need authorization review`);
  } else {
    logSuccess('All route files have proper protection');
    results.passed++;
  }
}

/**
 * Check permission naming conventions
 */
function checkPermissionNaming() {
  logSection('6. Checking Permission Naming Conventions');

  const rbacService = 'baithuzkath-api/src/services/rbacService.js';
  if (!fileExists(rbacService)) {
    logError('RBAC service file not found');
    results.errors++;
    return;
  }

  const content = readFile(rbacService);
  if (!content) {
    logError('Could not read RBAC service file');
    results.errors++;
    return;
  }

  // Extract permission names
  const permissionPattern = /name:\s*['"]([^'"]+)['"]/g;
  const permissions = [];
  let match;

  while ((match = permissionPattern.exec(content)) !== null) {
    permissions.push(match[1]);
  }

  logInfo(`Found ${permissions.length} permissions`);

  // Check naming convention: module.action.scope or module.action
  const validPattern = /^[a-z]+\.(create|read|update|delete|manage|approve|assign|export)(\.(all|regional|own|assigned))?$/;
  let validPermissions = 0;
  let invalidPermissions = 0;

  permissions.forEach(perm => {
    if (validPattern.test(perm)) {
      validPermissions++;
    } else {
      logWarning(`Invalid permission name: ${perm}`);
      invalidPermissions++;
    }
  });

  if (invalidPermissions === 0) {
    logSuccess(`All ${validPermissions} permissions follow naming convention`);
    results.passed++;
  } else {
    logWarning(`${invalidPermissions} permissions don't follow naming convention`);
    results.warnings++;
    results.issues.push(`${invalidPermissions} permissions need naming review`);
  }
}

/**
 * Check frontend-backend permission consistency
 */
function checkPermissionConsistency() {
  logSection('7. Checking Frontend-Backend Permission Consistency');

  // This is a simplified check - in production, you'd want to parse and compare actual permission usage
  const frontendFiles = [
    'src/pages',
    'src/components'
  ];

  let frontendPermissions = new Set();
  
  // Scan frontend files for permission usage
  function scanDirectory(dir) {
    if (!fileExists(dir)) return;
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    files.forEach(file => {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        scanDirectory(fullPath);
      } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
        const content = readFile(fullPath);
        if (!content) return;
        
        // Extract permission strings
        const permPattern = /permission=["']([^"']+)["']/g;
        const permPattern2 = /hasPermission\(["']([^"']+)["']\)/g;
        
        let match;
        while ((match = permPattern.exec(content)) !== null) {
          frontendPermissions.add(match[1]);
        }
        while ((match = permPattern2.exec(content)) !== null) {
          frontendPermissions.add(match[1]);
        }
      }
    });
  }

  frontendFiles.forEach(dir => scanDirectory(dir));

  logInfo(`Found ${frontendPermissions.size} unique permissions used in frontend`);

  if (frontendPermissions.size > 0) {
    logSuccess('Frontend uses permission-based access control');
    results.passed++;
  } else {
    logWarning('No permissions found in frontend code');
    results.warnings++;
    results.issues.push('Frontend may not be using permission checks');
  }
}

/**
 * Check API client configuration
 */
function checkAPIClient() {
  logSection('8. Checking API Client Configuration');

  const apiFile = 'src/lib/api.ts';
  if (!fileExists(apiFile)) {
    logError('API client file not found');
    results.errors++;
    return;
  }

  const content = readFile(apiFile);
  if (!content) {
    logError('Could not read API client file');
    results.errors++;
    return;
  }

  // Check for token management
  if (content.includes('Authorization') && content.includes('Bearer')) {
    logSuccess('API client includes token management');
    results.passed++;
  } else {
    logError('API client missing token management');
    results.errors++;
    results.issues.push('API client needs proper token management');
  }

  // Check for error handling
  if (content.includes('try') && content.includes('catch')) {
    logSuccess('API client includes error handling');
    results.passed++;
  } else {
    logWarning('API client may need better error handling');
    results.warnings++;
  }

  // Check for RBAC endpoints
  if (content.includes('/rbac/')) {
    logSuccess('API client includes RBAC endpoints');
    results.passed++;
  } else {
    logWarning('API client may be missing RBAC endpoints');
    results.warnings++;
    results.issues.push('Consider adding RBAC endpoints to API client');
  }
}

/**
 * Generate summary report
 */
function generateSummary() {
  logSection('Verification Summary');

  console.log('\nResults:');
  logSuccess(`Passed: ${results.passed}`);
  logWarning(`Warnings: ${results.warnings}`);
  logError(`Errors: ${results.errors}`);

  if (results.issues.length > 0) {
    console.log('\nIssues Found:');
    results.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  
  if (results.errors === 0 && results.warnings === 0) {
    logSuccess('✨ RBAC system verification passed! No issues found.');
    return 0;
  } else if (results.errors === 0) {
    logWarning('⚠️  RBAC system verification completed with warnings.');
    logInfo('Review the warnings above and address them if needed.');
    return 0;
  } else {
    logError('❌ RBAC system verification failed!');
    logError('Please fix the errors above before proceeding.');
    return 1;
  }
}

/**
 * Main verification function
 */
function main() {
  log('\n🔐 RBAC System Verification Tool', 'cyan');
  log('Checking RBAC implementation for conflicts and issues...\n', 'blue');

  try {
    checkBackendFiles();
    checkFrontendFiles();
    checkRoutesRegistration();
    checkMiddlewareConsistency();
    checkRouteProtection();
    checkPermissionNaming();
    checkPermissionConsistency();
    checkAPIClient();

    const exitCode = generateSummary();
    process.exit(exitCode);
  } catch (error) {
    logError(`Verification failed with error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run verification
main();
