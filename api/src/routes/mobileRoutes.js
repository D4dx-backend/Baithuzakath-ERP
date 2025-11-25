const express = require('express');
const router = express.Router();
const mobileController = require('../controllers/mobileController');
const { authenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { query } = require('express-validator');

/**
 * Mobile API Routes
 * 
 * These routes are optimized for mobile applications with:
 * - Large default limits for full lists
 * - Simplified response structures
 * - Filtering capabilities
 */

// Get all districts
router.get('/districts',
  authenticate,
  [
    query('search').optional().trim(),
    query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 10000 }).withMessage('Limit must be between 1 and 10000'),
    query('sort').optional().isIn(['name', 'code', 'createdAt']).withMessage('Invalid sort field'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
    validateRequest
  ],
  mobileController.getDistricts
);

// Get all areas
router.get('/areas',
  authenticate,
  [
    query('district').optional().isMongoId().withMessage('Invalid district ID'),
    query('search').optional().trim(),
    query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 10000 }).withMessage('Limit must be between 1 and 10000'),
    query('sort').optional().isIn(['name', 'code', 'createdAt']).withMessage('Invalid sort field'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
    validateRequest
  ],
  mobileController.getAreas
);

// Get all units
router.get('/units',
  authenticate,
  [
    query('district').optional().isMongoId().withMessage('Invalid district ID'),
    query('area').optional().isMongoId().withMessage('Invalid area ID'),
    query('search').optional().trim(),
    query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 10000 }).withMessage('Limit must be between 1 and 10000'),
    query('sort').optional().isIn(['name', 'code', 'createdAt']).withMessage('Invalid sort field'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
    validateRequest
  ],
  mobileController.getUnits
);

module.exports = router;

