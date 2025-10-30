const DXingOperations = require('./dxing/dxingOperations');
const DXingAnalytics = require('./dxing/dxingAnalytics');
const DXingValidators = require('./dxing/dxingValidators');
const DXingTemplates = require('./dxing/dxingTemplates');

/**
 * Main DXing SMS Service
 * Combines all DXing operations into a single interface
 */
class DXingSMSService {
  constructor() {
    this.operations = new DXingOperations();
    this.analytics = new DXingAnalytics();
  }

  // SMS Operations
  async sendOTP(phone, otp, name = '') {
    return await this.operations.sendOTP(phone, otp, name);
  }

  async sendNotification(phone, message, variables = {}) {
    return await this.operations.sendNotification(phone, message, variables);
  }

  async sendBulkSMS(recipients) {
    return await this.operations.sendBulkSMS(recipients);
  }

  async getDeliveryStatus(messageId) {
    return await this.operations.getDeliveryStatus(messageId);
  }

  // Analytics Operations
  async getAccountBalance() {
    return await this.analytics.getAccountBalance();
  }

  async getUsageStatistics(startDate, endDate) {
    return await this.analytics.getUsageStatistics(startDate, endDate);
  }

  async testConnection() {
    return await this.analytics.testConnection();
  }

  // Validation Methods
  validatePhoneNumber(phone) {
    return DXingValidators.validatePhoneNumber(phone);
  }

  formatPhoneNumber(phone) {
    return DXingValidators.formatPhoneNumber(phone);
  }

  // Template Methods
  generateOTP(length = 6) {
    return DXingTemplates.generateOTP(length);
  }

  createTemplate(type, variables = {}) {
    return DXingTemplates.createTemplate(type, variables);
  }
}

module.exports = new DXingSMSService();