const express = require('express');
const donorController = require('../controllers/donorController');
const { authenticate, authorize } = require('../middleware/auth');
const RBACMiddleware = require('../middleware/rbacMiddleware');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// CRUD Routes
/**
 * @swagger
 * /api/donors:
 *   get:
 *     summary: Get all donors with pagination and filtering
 *     tags: [Donors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of donors per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name, email, or phone
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, blocked, pending_verification]
 *         description: Filter by status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [individual, corporate, foundation, trust, ngo]
 *         description: Filter by donor type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [regular, patron, major, corporate]
 *         description: Filter by donor category
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Donors retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/', 
  RBACMiddleware.hasPermission('donors.read.regional'),
  donorController.getDonors
);

/**
 * @swagger
 * /api/donors/{id}:
 *   get:
 *     summary: Get single donor by ID
 *     tags: [Donors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Donor ID
 *     responses:
 *       200:
 *         description: Donor retrieved successfully
 *       404:
 *         description: Donor not found
 *       401:
 *         description: Authentication required
 */
router.get('/:id', 
  RBACMiddleware.hasPermission('donors.read.regional'),
  donorController.getDonor
);

/**
 * @swagger
 * /api/donors:
 *   post:
 *     summary: Create new donor
 *     tags: [Donors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [individual, corporate, foundation, trust, ngo]
 *               address:
 *                 type: object
 *               preferredPrograms:
 *                 type: array
 *                 items:
 *                   type: string
 *               donationPreferences:
 *                 type: object
 *               taxDetails:
 *                 type: object
 *     responses:
 *       201:
 *         description: Donor created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 */
router.post('/', 
  RBACMiddleware.hasPermission('donors.create'),
  RBACMiddleware.auditLog('donor_creation'),
  donorController.createDonor
);

/**
 * @swagger
 * /api/donors/{id}:
 *   put:
 *     summary: Update donor
 *     tags: [Donors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Donor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Donor updated successfully
 *       404:
 *         description: Donor not found
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 */
router.put('/:id', 
  RBACMiddleware.hasPermission('donors.update.regional'),
  RBACMiddleware.auditLog('donor_update'),
  donorController.updateDonor
);

/**
 * @swagger
 * /api/donors/{id}:
 *   delete:
 *     summary: Delete donor
 *     tags: [Donors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Donor ID
 *     responses:
 *       200:
 *         description: Donor deleted successfully
 *       404:
 *         description: Donor not found
 *       400:
 *         description: Cannot delete donor with existing donations
 *       401:
 *         description: Authentication required
 */
router.delete('/:id', 
  RBACMiddleware.hasPermission('donors.delete'),
  RBACMiddleware.auditLog('donor_deletion'),
  donorController.deleteDonor
);

// Status Management Routes
/**
 * @swagger
 * /api/donors/{id}/status:
 *   patch:
 *     summary: Update donor status
 *     tags: [Donors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Donor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, blocked, pending_verification]
 *     responses:
 *       200:
 *         description: Donor status updated successfully
 *       404:
 *         description: Donor not found
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Authentication required
 */
router.patch('/:id/status', 
  RBACMiddleware.hasPermission('donors.update.regional'),
  RBACMiddleware.auditLog('donor_status_update'),
  donorController.updateDonorStatus
);

/**
 * @swagger
 * /api/donors/{id}/verify:
 *   patch:
 *     summary: Verify donor
 *     tags: [Donors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Donor ID
 *     responses:
 *       200:
 *         description: Donor verified successfully
 *       404:
 *         description: Donor not found
 *       401:
 *         description: Authentication required
 */
router.patch('/:id/verify', 
  RBACMiddleware.hasPermission('donors.verify'),
  RBACMiddleware.auditLog('donor_verification'),
  donorController.verifyDonor
);

// Dropdown Data Routes
/**
 * @swagger
 * /api/donors/projects:
 *   get:
 *     summary: Get projects for dropdown
 *     tags: [Donors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/dropdown/projects', donorController.getProjectsForDropdown);

/**
 * @swagger
 * /api/donors/schemes:
 *   get:
 *     summary: Get schemes for dropdown
 *     tags: [Donors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter schemes by project ID
 *     responses:
 *       200:
 *         description: Schemes retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/dropdown/schemes', donorController.getSchemesForDropdown);

// Statistics and Analytics Routes
/**
 * @swagger
 * /api/donors/stats:
 *   get:
 *     summary: Get donor statistics
 *     tags: [Donors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Donor statistics retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/analytics/stats', 
  RBACMiddleware.hasPermission('donors.read.regional'),
  donorController.getDonorStats
);

/**
 * @swagger
 * /api/donors/top:
 *   get:
 *     summary: Get top donors
 *     tags: [Donors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of top donors to retrieve
 *     responses:
 *       200:
 *         description: Top donors retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/analytics/top', 
  RBACMiddleware.hasPermission('donors.read.regional'),
  donorController.getTopDonors
);

/**
 * @swagger
 * /api/donors/recent-donations:
 *   get:
 *     summary: Get recent donations
 *     tags: [Donors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of recent donations to retrieve
 *     responses:
 *       200:
 *         description: Recent donations retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/analytics/recent-donations', 
  RBACMiddleware.hasPermission('donors.read.regional'),
  donorController.getRecentDonations
);

/**
 * @swagger
 * /api/donors/trends:
 *   get:
 *     summary: Get donation trends
 *     tags: [Donors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Number of months to include in trends
 *     responses:
 *       200:
 *         description: Donation trends retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/analytics/trends', 
  RBACMiddleware.hasPermission('donors.read.regional'),
  donorController.getDonationTrends
);

module.exports = router;