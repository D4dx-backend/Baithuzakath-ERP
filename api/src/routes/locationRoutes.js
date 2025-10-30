const express = require('express');
const locationController = require('../controllers/locationController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { commonSchemas } = require('../middleware/validation');
const Joi = require('joi');

const router = express.Router();

// Location validation schemas
const locationSchemas = {
  create: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    type: Joi.string().valid('state', 'district', 'area', 'unit').required(),
    code: Joi.string().trim().uppercase().pattern(/^[A-Z0-9_-]+$/).when('type', {
      is: 'district',
      then: Joi.optional(), // Code is auto-generated for districts
      otherwise: Joi.required()
    }),
    parent: commonSchemas.objectId.when('type', {
      is: Joi.valid('state', 'district'),
      then: Joi.forbidden(),
      otherwise: Joi.required()
    })
  }),

  update: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    code: Joi.string().trim().uppercase().pattern(/^[A-Z0-9_-]+$/),
    parent: commonSchemas.objectId,
    isActive: Joi.boolean()
  }).min(1),

  query: Joi.object({
    type: Joi.string().valid('state', 'district', 'area', 'unit'),
    parent: commonSchemas.objectId,
    search: Joi.string().trim().min(2).max(100),
    isActive: Joi.boolean(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().default('name'),
    order: Joi.string().valid('asc', 'desc').default('asc')
  })
};

/**
 * @route   GET /api/locations
 * @desc    Get all locations with filtering and pagination
 * @access  Private (Admin roles)
 */
router.get('/',
  authenticate,
  authorize('super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin'),
  validate(locationSchemas.query, 'query'),
  locationController.getLocations
);

/**
 * @route   GET /api/locations/hierarchy
 * @desc    Get location hierarchy tree
 * @access  Private (Admin roles)
 */
router.get('/hierarchy',
  authenticate,
  authorize('super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin'),
  locationController.getHierarchy
);

/**
 * @route   GET /api/locations/statistics
 * @desc    Get location statistics
 * @access  Private (Admin roles)
 */
router.get('/statistics',
  authenticate,
  authorize('super_admin', 'state_admin', 'district_admin'),
  locationController.getLocationStatistics
);

/**
 * @route   GET /api/locations/by-type/:type
 * @desc    Get locations by type
 * @access  Private (Admin roles)
 */
router.get('/by-type/:type',
  authenticate,
  authorize('super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin'),
  locationController.getLocationsByType
);

/**
 * @route   POST /api/locations
 * @desc    Create new location
 * @access  Private (Super Admin, State Admin, District Admin)
 */
router.post('/',
  authenticate,
  authorize('super_admin', 'state_admin', 'district_admin'),
  validate(locationSchemas.create),
  locationController.createLocation
);

/**
 * @route   GET /api/locations/:id
 * @desc    Get location by ID
 * @access  Private (Admin roles)
 */
router.get('/:id',
  authenticate,
  authorize('super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin'),
  validate({ id: commonSchemas.objectId }, 'params'),
  locationController.getLocationById
);

/**
 * @route   PUT /api/locations/:id
 * @desc    Update location
 * @access  Private (Super Admin, State Admin, District Admin)
 */
router.put('/:id',
  authenticate,
  authorize('super_admin', 'state_admin', 'district_admin'),
  validate({ id: commonSchemas.objectId }, 'params'),
  validate(locationSchemas.update),
  locationController.updateLocation
);

/**
 * @route   DELETE /api/locations/:id
 * @desc    Delete location (soft delete)
 * @access  Private (Super Admin, State Admin)
 */
router.delete('/:id',
  authenticate,
  authorize('super_admin', 'state_admin'),
  validate({ id: commonSchemas.objectId }, 'params'),
  locationController.deleteLocation
);

module.exports = router;