const dxingSmsService = require('../services/dxingSmsService');
const SMSTemplates = require('../utils/smsTemplates');
const ResponseHelper = require('../utils/responseHelper');
const logger = require('../utils/logger');

class SMSController {
  /**
   * Send single SMS
   * POST /api/sms/send
   */
  async sendSMS(req, res) {
    try {
      const { phone, message, templateKey, variables, priority } = req.body;
      const currentUser = req.user;

      let finalMessage = message;

      // Use template if provided
      if (templateKey) {
        const validation = SMSTemplates.validateTemplateVariables(templateKey, variables);
        if (!validation.valid) {
          return ResponseHelper.validationError(res, [{ 
            field: 'template', 
            message: validation.error 
          }]);
        }
        finalMessage = validation.formattedMessage;
      }

      // Send SMS directly via DXing
      const result = await dxingSmsService.sendNotification(phone, finalMessage, variables);

      logger.info(`SMS sent by user ${currentUser._id}`, {
        recipient: phone,
        templateKey,
        success: result.success,
        messageId: result.messageId
      });

      if (result.success) {
        return ResponseHelper.success(res, {
          messageId: result.messageId,
          status: result.status,
          credits: result.credits,
          message: result.message
        });
      } else {
        return ResponseHelper.error(res, result.error, 400);
      }
    } catch (error) {
      logger.error('Send SMS Error:', error);
      return ResponseHelper.error(res, 'Failed to send SMS', 500);
    }
  }

  /**
   * Send bulk SMS
   * POST /api/sms/send-bulk
   */
  async sendBulkSMS(req, res) {
    try {
      const { recipients, message, templateKey, variables, priority } = req.body;
      const currentUser = req.user;

      if (!Array.isArray(recipients) || recipients.length === 0) {
        return ResponseHelper.validationError(res, [{
          field: 'recipients',
          message: 'Recipients array is required and cannot be empty'
        }]);
      }

      let finalMessage = message;

      // Use template if provided
      if (templateKey) {
        const validation = SMSTemplates.validateTemplateVariables(templateKey, variables);
        if (!validation.valid) {
          return ResponseHelper.validationError(res, [{ 
            field: 'template', 
            message: validation.error 
          }]);
        }
        finalMessage = validation.formattedMessage;
      }

      // Send bulk SMS directly via DXing
      const bulkRecipients = recipients.map(recipient => ({
        phone: recipient.phone,
        message: finalMessage,
        variables: { ...variables, name: recipient.name }
      }));

      const result = await dxingSmsService.sendBulkSMS(bulkRecipients);

      logger.info(`Bulk SMS sent by user ${currentUser._id}`, {
        recipientCount: recipients.length,
        templateKey,
        success: result.success,
        batchId: result.batchId
      });

      if (result.success) {
        return ResponseHelper.success(res, {
          batchId: result.batchId,
          totalMessages: result.totalMessages,
          acceptedMessages: result.acceptedMessages,
          rejectedMessages: result.rejectedMessages,
          totalCredits: result.totalCredits,
          message: result.message
        });
      } else {
        return ResponseHelper.error(res, result.error, 400);
      }
    } catch (error) {
      logger.error('Send Bulk SMS Error:', error);
      return ResponseHelper.error(res, 'Failed to send bulk SMS', 500);
    }
  }

  /**
   * Get SMS templates
   * GET /api/sms/templates
   */
  async getTemplates(req, res) {
    try {
      const { category, search } = req.query;

      let templates;

      if (search) {
        templates = SMSTemplates.searchTemplates(search);
      } else if (category) {
        const categoryTemplates = SMSTemplates.getTemplatesByCategory(category);
        templates = Object.keys(categoryTemplates).map(key => ({
          key: `${category}.${key}`,
          category,
          name: key,
          ...categoryTemplates[key]
        }));
      } else {
        const allTemplates = SMSTemplates.getAllTemplates();
        templates = [];
        
        Object.keys(allTemplates).forEach(cat => {
          Object.keys(allTemplates[cat]).forEach(name => {
            templates.push({
              key: `${cat}.${name}`,
              category: cat,
              name,
              ...allTemplates[cat][name]
            });
          });
        });
      }

      return ResponseHelper.success(res, {
        templates,
        stats: SMSTemplates.getTemplateStats()
      });
    } catch (error) {
      logger.error('Get Templates Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch templates', 500);
    }
  }

  /**
   * Get specific template
   * GET /api/sms/templates/:templateKey
   */
  async getTemplate(req, res) {
    try {
      const { templateKey } = req.params;
      
      const template = SMSTemplates.getTemplate(templateKey);
      
      if (!template) {
        return ResponseHelper.notFound(res, 'Template not found');
      }

      return ResponseHelper.success(res, {
        key: templateKey,
        ...template
      });
    } catch (error) {
      logger.error('Get Template Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch template', 500);
    }
  }

  /**
   * Preview template with variables
   * POST /api/sms/templates/:templateKey/preview
   */
  async previewTemplate(req, res) {
    try {
      const { templateKey } = req.params;
      const { variables } = req.body;

      const validation = SMSTemplates.validateTemplateVariables(templateKey, variables);
      
      if (!validation.valid) {
        return ResponseHelper.validationError(res, [{
          field: 'template',
          message: validation.error,
          missingVariables: validation.missingVariables
        }]);
      }

      return ResponseHelper.success(res, {
        templateKey,
        variables,
        preview: validation.formattedMessage,
        template: validation.template
      });
    } catch (error) {
      logger.error('Preview Template Error:', error);
      return ResponseHelper.error(res, 'Failed to preview template', 500);
    }
  }

  /**
   * Get SMS delivery status
   * GET /api/sms/status/:messageId
   */
  async getDeliveryStatus(req, res) {
    try {
      const { messageId } = req.params;

      const status = await dxingSmsService.getDeliveryStatus(messageId);

      if (!status.success) {
        return ResponseHelper.error(res, status.error, 400);
      }

      return ResponseHelper.success(res, status);
    } catch (error) {
      logger.error('Get Delivery Status Error:', error);
      return ResponseHelper.error(res, 'Failed to get delivery status', 500);
    }
  }





  /**
   * Get DXing account balance
   * GET /api/sms/account/balance
   */
  async getAccountBalance(req, res) {
    try {
      const balance = await dxingSmsService.getAccountBalance();

      if (balance.success) {
        return ResponseHelper.success(res, balance);
      } else {
        return ResponseHelper.error(res, balance.error, 400);
      }
    } catch (error) {
      logger.error('Get Account Balance Error:', error);
      return ResponseHelper.error(res, 'Failed to get account balance', 500);
    }
  }

  /**
   * Test SMS service connection
   * POST /api/sms/test-connection
   */
  async testConnection(req, res) {
    try {
      const testResult = await dxingSmsService.testConnection();

      if (testResult.success) {
        return ResponseHelper.success(res, testResult);
      } else {
        return ResponseHelper.error(res, testResult.message, 503);
      }
    } catch (error) {
      logger.error('Test Connection Error:', error);
      return ResponseHelper.error(res, 'Failed to test connection', 500);
    }
  }



  /**
   * Get SMS usage statistics for DXing API
   * GET /api/sms/usage-stats
   */
  async getUsageStatistics(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return ResponseHelper.validationError(res, [{
          field: 'dateRange',
          message: 'Start date and end date are required'
        }]);
      }

      const stats = await dxingSmsService.getUsageStatistics(startDate, endDate);

      if (!stats.success) {
        return ResponseHelper.error(res, stats.error, 400);
      }

      return ResponseHelper.success(res, stats);
    } catch (error) {
      logger.error('Get Usage Statistics Error:', error);
      return ResponseHelper.error(res, 'Failed to get usage statistics', 500);
    }
  }
}

module.exports = new SMSController();