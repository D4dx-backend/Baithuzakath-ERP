const notificationService = require('../services/notificationService');
const ResponseHelper = require('../utils/responseHelper');

class NotificationController {
  /**
   * Get current user's notifications
   * GET /api/notifications/me
   */
  async getMyNotifications(req, res) {
    try {
      const { type, unreadOnly, limit, offset } = req.query;

      const notifications = await notificationService.getUserNotifications(req.user._id, {
        type: type || null,
        unreadOnly: unreadOnly === 'true' || unreadOnly === true,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0
      });

      return ResponseHelper.success(res, { notifications }, 'Notifications retrieved successfully');
    } catch (error) {
      return ResponseHelper.error(res, error.message || 'Failed to fetch notifications', 500);
    }
  }

  /**
   * Mark a notification as read
   * PATCH /api/notifications/:id/read
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const result = await notificationService.markAsRead(id, req.user._id);
      return ResponseHelper.success(res, result, 'Notification marked as read');
    } catch (error) {
      return ResponseHelper.error(res, error.message || 'Failed to mark notification as read', 500);
    }
  }
}

module.exports = new NotificationController();
