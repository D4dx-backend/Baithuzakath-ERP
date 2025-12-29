const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/me', authenticate, (req, res) => notificationController.getMyNotifications(req, res));
router.patch('/:id/read', authenticate, (req, res) => notificationController.markAsRead(req, res));

module.exports = router;
