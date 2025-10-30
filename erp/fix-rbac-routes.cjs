#!/usr/bin/env node

/**
 * RBAC Route Protection Fix Script
 * 
 * This script identifies routes that need RBAC protection
 * and suggests fixes for common issues.
 */

const fs = require('fs');
const path = require('path');

const routesNeedingFix = {
  'budgetRoutes.js': {
    routes: [
      { path: '/overview', permission: 'finances.read.regional' },
      { path: '/projects', permission: 'finances.read.regional' },
      { path: '/schemes', permission: 'finances.read.regional' },
      { path: '/transactions', permission: 'finances.read.regional' },
      { path: '/monthly-summary', permission: 'finances.read.regional' },
      { path: '/by-category', permission: 'finances.read.regional' }
    ]
  },
  'dashboardRoutes.js': {
    routes: [
      { path: '/overview', permission: 'dashboard.read' },
      { path: '/recent-applications', permission: 'applications.read.regional' },
      { path: '/recent-payments', permission: 'finances.read.regional' },
      { path: '/monthly-trends', permission: 'reports.read.regional' },
      { path: '/project-performance', permission: 'projects.read.assigned' }
    ]
  }
};

console.log('🔧 RBAC Route Protection Fix Suggestions\n');
console.log('=' .repeat(60));

Object.entries(routesNeedingFix).forEach(([file, config]) => {
  console.log(`\n📄 File: baithuzkath-api/src/routes/${file}`);
  console.log('-'.repeat(60));
  
  config.routes.forEach(route => {
    console.log(`\nRoute: ${route.path}`);
    console.log(`Suggested permission: ${route.permission}`);
    console.log('\nAdd this middleware:');
    console.log(`  RBACMiddleware.hasPermission('${route.permission}'),`);
    console.log('\nOr use:');
    console.log(`  hasPermission('${route.permission}'),`);
  });
  
  console.log('\n' + '-'.repeat(60));
});

console.log('\n\n📋 Example Fix for budgetRoutes.js:\n');
console.log(`
// Add at the top
const RBACMiddleware = require('../middleware/rbacMiddleware');

// Update route
router.get('/overview', 
  authenticate,
  RBACMiddleware.hasPermission('finances.read.regional'),
  budgetController.getBudgetOverview
);
`);

console.log('\n📋 Example Fix for dashboardRoutes.js:\n');
console.log(`
// Add at the top
const { hasPermission } = require('../middleware/auth');

// Update route
router.get('/overview',
  authenticate,
  hasPermission('dashboard.read'),
  dashboardController.getOverview
);
`);

console.log('\n✅ After making changes, run: node verify-rbac-system.js\n');
