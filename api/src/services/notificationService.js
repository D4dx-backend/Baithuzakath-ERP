const { Notification, User, Beneficiary } = require('../models');
const dxingSmsService = require('./dxingSmsService');
// const emailService = require('./emailService'); // Disabled for development
const config = require('../config/environment');

class NotificationService {
  constructor() {
    this.dxingService = dxingSmsService;
    // this.emailService = emailService; // Disabled for development
  }

  /**
   * Send notification to single recipient
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Send result
   */
  async sendNotification(notificationData) {
    try {
      const {
        type,
        recipient,
        title,
        message,
        category = 'general',
        priority = 'medium',
        relatedEntities = {},
        variables = {},
        templateId = null
      } = notificationData;

      // Create notification record
      const notification = new Notification({
        title,
        message,
        type,
        category,
        priority,
        relatedEntities,
        delivery: {
          status: 'sending',
          totalRecipients: 1
        },
        createdBy: notificationData.createdBy
      });

      // Add recipient
      const recipientData = await this.prepareRecipient(recipient, type);
      notification.recipients.push(recipientData);

      await notification.save();

      // Send based on type
      let sendResult;
      switch (type) {
        case 'sms':
          sendResult = await this.sendDXingSMS(recipientData, message, variables, templateId);
          break;
        case 'email':
          sendResult = await this.sendEmail(recipientData, title, message, variables);
          break;
        case 'in_app':
          sendResult = await this.createInAppNotification(recipientData, title, message, relatedEntities);
          break;
        default:
          throw new Error(`Unsupported notification type: ${type}`);
      }

      // Update notification status
      await notification.updateRecipientStatus(
        notification.recipients[0]._id,
        sendResult.success ? 'sent' : 'failed',
        sendResult
      );

      return {
        success: sendResult.success,
        notificationId: notification._id,
        messageId: sendResult.messageId,
        message: sendResult.success ? 'Notification sent successfully' : sendResult.error
      };
    } catch (error) {
      console.error('❌ Send Notification Error:', error);
      throw error;
    }
  }

  /**
   * Send bulk notifications
   * @param {Object} bulkData - Bulk notification data
   * @returns {Promise<Object>} Bulk send result
   */
  async sendBulkNotification(bulkData) {
    try {
      const {
        type,
        recipients,
        title,
        message,
        category = 'general',
        priority = 'medium',
        targeting = {},
        variables = {},
        templateId = null
      } = bulkData;

      // Create notification record
      const notification = new Notification({
        title,
        message,
        type,
        category,
        priority,
        targeting,
        delivery: {
          status: 'sending',
          totalRecipients: recipients.length
        },
        createdBy: bulkData.createdBy
      });

      // Prepare all recipients
      const preparedRecipients = await Promise.all(
        recipients.map(recipient => this.prepareRecipient(recipient, type))
      );

      notification.recipients = preparedRecipients;
      await notification.save();

      // Send based on type
      let sendResults;
      switch (type) {
        case 'sms':
          sendResults = await this.sendBulkSMS(preparedRecipients, message, variables, templateId);
          break;
        case 'email':
          sendResults = await this.sendBulkEmail(preparedRecipients, title, message, variables);
          break;
        case 'push':
          sendResults = await this.sendBulkPushNotification(preparedRecipients, title, message, variables);
          break;
        default:
          throw new Error(`Bulk ${type} notifications not supported`);
      }

      // Update recipient statuses
      for (let i = 0; i < sendResults.length; i++) {
        await notification.updateRecipientStatus(
          notification.recipients[i]._id,
          sendResults[i].success ? 'sent' : 'failed',
          sendResults[i]
        );
      }

      const successCount = sendResults.filter(r => r.success).length;
      const failureCount = sendResults.length - successCount;

      return {
        success: successCount > 0,
        notificationId: notification._id,
        totalRecipients: recipients.length,
        successCount,
        failureCount,
        message: `Bulk notification completed: ${successCount} sent, ${failureCount} failed`
      };
    } catch (error) {
      console.error('❌ Send Bulk Notification Error:', error);
      throw error;
    }
  }

  /**
   * Send targeted notifications based on criteria
   * @param {Object} targetingData - Targeting criteria
   * @returns {Promise<Object>} Targeting result
   */
  async sendTargetedNotification(targetingData) {
    try {
      const {
        type,
        title,
        message,
        targeting,
        category = 'general',
        priority = 'medium',
        variables = {}
      } = targetingData;

      // Find recipients based on targeting criteria
      const recipients = await this.findTargetedRecipients(targeting);

      if (recipients.length === 0) {
        return {
          success: false,
          message: 'No recipients found matching the targeting criteria'
        };
      }

      // Send bulk notification
      return await this.sendBulkNotification({
        type,
        recipients,
        title,
        message,
        category,
        priority,
        targeting,
        variables,
        createdBy: targetingData.createdBy
      });
    } catch (error) {
      console.error('❌ Send Targeted Notification Error:', error);
      throw error;
    }
  }

  /**
   * Send DXing SMS notification
   * @param {Object} recipient - Recipient data
   * @param {string} message - SMS message
   * @param {Object} variables - Template variables
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>} SMS result
   */
  async sendDXingSMS(recipient, message, variables = {}, templateId = null) {
    try {
      if (!recipient.phone) {
        throw new Error('Phone number is required for DXing SMS');
      }

      // Use template if provided, otherwise use message
      const smsMessage = templateId 
        ? this.dxingService.createTemplate(templateId, variables)
        : message;

      const result = await this.dxingService.sendNotification(
        recipient.phone,
        smsMessage,
        variables
      );

      return {
        success: result.success,
        messageId: result.messageId,
        provider: 'DXing',
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'DXing'
      };
    }
  }

  /**
   * Send bulk SMS notifications
   * @param {Array} recipients - Recipients array
   * @param {string} message - SMS message
   * @param {Object} variables - Template variables
   * @param {string} templateId - Template ID
   * @returns {Promise<Array>} SMS results
   */
  async sendBulkSMS(recipients, message, variables = {}, templateId = null) {
    try {
      const smsRecipients = recipients
        .filter(r => r.phone)
        .map(recipient => ({
          phone: recipient.phone,
          message: templateId 
            ? dxingSmsService.createTemplate(templateId, { ...variables, name: recipient.name })
            : message,
          variables: { ...variables, name: recipient.name }
        }));

      if (smsRecipients.length === 0) {
        return recipients.map(() => ({
          success: false,
          error: 'No valid phone numbers found'
        }));
      }

      const bulkResult = await dxingSmsService.sendBulkSMS(smsRecipients);

      // Return individual results (simplified - in production, track each message)
      return recipients.map((recipient, index) => ({
        success: recipient.phone ? bulkResult.success : false,
        messageId: bulkResult.batchId,
        provider: 'DXing',
        error: recipient.phone ? bulkResult.error : 'No phone number'
      }));
    } catch (error) {
      return recipients.map(() => ({
        success: false,
        error: error.message,
        provider: 'DXing'
      }));
    }
  }

  /**
   * Send email notification
   * @param {Object} recipient - Recipient data
   * @param {string} subject - Email subject
   * @param {string} message - Email message
   * @param {Object} variables - Template variables
   * @returns {Promise<Object>} Email result
   */
  async sendEmail(recipient, subject, message, variables = {}) {
    try {
      if (!recipient.email) {
        throw new Error('Email address is required');
      }

      // This would integrate with your email service
      // For now, return a mock result
      return {
        success: true,
        messageId: `email_${Date.now()}`,
        provider: 'SMTP'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'SMTP'
      };
    }
  }

  /**
   * Send bulk email notifications
   * @param {Array} recipients - Recipients array
   * @param {string} subject - Email subject
   * @param {string} message - Email message
   * @param {Object} variables - Template variables
   * @returns {Promise<Array>} Email results
   */
  async sendBulkEmail(recipients, subject, message, variables = {}) {
    // Implementation for bulk email sending
    return recipients.map(recipient => ({
      success: !!recipient.email,
      messageId: recipient.email ? `email_${Date.now()}` : null,
      provider: 'SMTP',
      error: recipient.email ? null : 'No email address'
    }));
  }

  /**
   * Send push notification
   * @param {Object} recipient - Recipient data
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} variables - Template variables
   * @returns {Promise<Object>} Push result
   */
  async sendPushNotification(recipient, title, message, variables = {}) {
    try {
      if (!recipient.fcmToken) {
        throw new Error('FCM token is required for push notifications');
      }

      // This would integrate with Firebase Cloud Messaging
      // For now, return a mock result
      return {
        success: true,
        messageId: `push_${Date.now()}`,
        provider: 'Firebase'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'Firebase'
      };
    }
  }

  /**
   * Send bulk push notifications
   * @param {Array} recipients - Recipients array
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} variables - Template variables
   * @returns {Promise<Array>} Push results
   */
  async sendBulkPushNotification(recipients, title, message, variables = {}) {
    // Implementation for bulk push notifications
    return recipients.map(recipient => ({
      success: !!recipient.fcmToken,
      messageId: recipient.fcmToken ? `push_${Date.now()}` : null,
      provider: 'Firebase',
      error: recipient.fcmToken ? null : 'No FCM token'
    }));
  }

  /**
   * Create in-app notification
   * @param {Object} recipient - Recipient data
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} relatedEntities - Related entities
   * @returns {Promise<Object>} In-app result
   */
  async createInAppNotification(recipient, title, message, relatedEntities = {}) {
    try {
      // In-app notifications are stored in database and retrieved by client
      return {
        success: true,
        messageId: `inapp_${Date.now()}`,
        provider: 'Database'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'Database'
      };
    }
  }

  /**
   * Prepare recipient data for notification
   * @param {Object} recipient - Raw recipient data
   * @param {string} type - Notification type
   * @returns {Promise<Object>} Prepared recipient
   */
  async prepareRecipient(recipient, type) {
    let recipientData = {
      status: 'pending',
      attempts: 0
    };

    // If recipient is a user ID, fetch user data
    if (typeof recipient === 'string' && recipient.match(/^[0-9a-fA-F]{24}$/)) {
      const user = await User.findById(recipient);
      if (user) {
        recipientData.user = user._id;
        recipientData.phone = user.phone;
        recipientData.email = user.email;
        recipientData.name = user.name;
        
        // Get FCM token from user's devices
        if (user.devices && user.devices.length > 0) {
          recipientData.fcmToken = user.devices[0].fcmToken;
        }
      }
    } else if (typeof recipient === 'object') {
      // Direct recipient data
      Object.assign(recipientData, recipient);
    }

    return recipientData;
  }

  /**
   * Find recipients based on targeting criteria
   * @param {Object} targeting - Targeting criteria
   * @returns {Promise<Array>} Recipients array
   */
  async findTargetedRecipients(targeting) {
    try {
      let query = { isActive: true };

      // Filter by user roles
      if (targeting.userRoles && targeting.userRoles.length > 0) {
        query.role = { $in: targeting.userRoles };
      }

      // Filter by regions
      if (targeting.regions && targeting.regions.length > 0) {
        query['adminScope.regions'] = { $in: targeting.regions };
      }

      // Filter by projects
      if (targeting.projects && targeting.projects.length > 0) {
        query['adminScope.projects'] = { $in: targeting.projects };
      }

      // Filter by schemes
      if (targeting.schemes && targeting.schemes.length > 0) {
        query['adminScope.schemes'] = { $in: targeting.schemes };
      }

      // Apply custom filters
      if (targeting.customFilters) {
        Object.assign(query, targeting.customFilters);
      }

      const users = await User.find(query).select('name email phone devices');

      return users.map(user => ({
        user: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        fcmToken: user.devices && user.devices.length > 0 ? user.devices[0].fcmToken : null
      }));
    } catch (error) {
      console.error('❌ Find Targeted Recipients Error:', error);
      return [];
    }
  }

  /**
   * Get notification templates
   * @param {string} category - Template category
   * @returns {Object} Templates
   */
  getTemplates(category = null) {
    const templates = {
      application_status: {
        submitted: {
          sms: 'application_submitted',
          email: 'Application Submitted Successfully',
          push: 'Application Submitted'
        },
        approved: {
          sms: 'application_approved',
          email: 'Application Approved',
          push: 'Great News! Application Approved'
        },
        rejected: {
          sms: 'application_rejected',
          email: 'Application Status Update',
          push: 'Application Status Update'
        }
      },
      payment: {
        processed: {
          sms: 'payment_processed',
          email: 'Payment Processed Successfully',
          push: 'Payment Processed'
        }
      },
      reminder: {
        document_required: {
          sms: 'document_required',
          email: 'Documents Required',
          push: 'Action Required: Upload Documents'
        },
        interview_scheduled: {
          sms: 'interview_scheduled',
          email: 'Interview Scheduled',
          push: 'Interview Scheduled'
        }
      }
    };

    return category ? templates[category] : templates;
  }

  /**
   * Get user notifications
   * @param {string} userId - User ID
   * @param {Object} filters - Filters
   * @returns {Promise<Array>} Notifications
   */
  async getUserNotifications(userId, filters = {}) {
    try {
      const {
        type = null,
        unreadOnly = false,
        limit = 50,
        offset = 0
      } = filters;

      return await Notification.getByUser(userId, type, unreadOnly)
        .limit(limit)
        .skip(offset);
    } catch (error) {
      console.error('❌ Get User Notifications Error:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Mark result
   */
  async markAsRead(notificationId, userId) {
    try {
      await Notification.markAsRead(notificationId, userId);
      
      return {
        success: true,
        message: 'Notification marked as read'
      };
    } catch (error) {
      console.error('❌ Mark As Read Error:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   * @param {Object} filters - Filters
   * @returns {Promise<Object>} Statistics
   */
  async getNotificationStatistics(filters = {}) {
    try {
      const stats = await Notification.aggregate([
        { $match: filters },
        {
          $group: {
            _id: '$type',
            total: { $sum: 1 },
            sent: { $sum: '$delivery.sentCount' },
            delivered: { $sum: '$delivery.deliveredCount' },
            failed: { $sum: '$delivery.failedCount' }
          }
        }
      ]);

      return {
        success: true,
        statistics: stats
      };
    } catch (error) {
      console.error('❌ Get Notification Statistics Error:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();