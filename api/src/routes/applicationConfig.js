const express = require('express');
const router = express.Router();
const applicationConfigController = require('../controllers/applicationConfigController');
const { authenticate } = require('../middleware/auth');
const { hasAnyPermission } = require('../middleware/rbacMiddleware');

/**
 * Test route to verify public routes work
 */
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Public route works!' });
});

/**
 * Public route - Get public configurations
 * No authentication required
 */
router.get('/public', applicationConfigController.getPublicConfigs);

/**
 * Protected routes - Require authentication and permissions
 */

// Get all configurations (Admin only)
router.get(
  '/',
  authenticate,
  hasAnyPermission(['config.read', 'settings.read']),
  applicationConfigController.getAllConfigs
);

// Get single configuration by ID (Admin only)
router.get(
  '/:id',
  authenticate,
  hasAnyPermission(['config.read', 'settings.read']),
  applicationConfigController.getConfigById
);

// Create new configuration (Admin only)
router.post(
  '/',
  authenticate,
  hasAnyPermission(['config.write', 'settings.write']),
  applicationConfigController.createConfig
);

// Update single configuration (Admin only)
router.put(
  '/:id',
  authenticate,
  hasAnyPermission(['config.write', 'settings.write']),
  applicationConfigController.updateConfig
);

// Bulk update configurations (Admin only)
router.put(
  '/bulk/update',
  authenticate,
  hasAnyPermission(['config.write', 'settings.write']),
  applicationConfigController.bulkUpdateConfigs
);

// Delete configuration (Admin only)
router.delete(
  '/:id',
  authenticate,
  hasAnyPermission(['config.write', 'settings.write']),
  applicationConfigController.deleteConfig
);

module.exports = router;
