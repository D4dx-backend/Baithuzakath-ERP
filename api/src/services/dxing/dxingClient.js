const axios = require('axios');
const config = require('../../config/environment');

/**
 * DXing API Client Configuration
 */
class DXingClient {
  constructor() {
    this.apiKey = config.DXING_API_KEY;
    this.senderId = config.DXING_SENDER_ID;
    this.otpTemplateId = config.DXING_OTP_TEMPLATE_ID;
    this.notificationTemplateId = config.DXING_NOTIFICATION_TEMPLATE_ID;
    
    // Base URL must come from environment - no fallback
    if (!config.DXING_BASE_URL) {
      throw new Error('DXING_BASE_URL environment variable is required for DXing SMS service');
    }
    this.baseURL = config.DXING_BASE_URL;
    
    this.client = this.createAxiosClient();
  }

  /**
   * Create configured axios client
   * @returns {Object} Axios instance
   */
  createAxiosClient() {
    const client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    // Add request interceptor for logging
    client.interceptors.request.use(
      (config) => {
        console.log(`📤 DXing Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ DXing Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    client.interceptors.response.use(
      (response) => {
        console.log(`📥 DXing Response: ${response.status} - ${response.data?.message || 'Success'}`);
        return response;
      },
      (error) => {
        console.error('❌ DXing Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );

    return client;
  }

  /**
   * Get axios client instance
   * @returns {Object} Axios client
   */
  getClient() {
    return this.client;
  }

  /**
   * Get sender ID
   * @returns {string} Sender ID
   */
  getSenderId() {
    return this.senderId;
  }

  /**
   * Get OTP template ID
   * @returns {string} OTP template ID
   */
  getOTPTemplateId() {
    return this.otpTemplateId;
  }

  /**
   * Get notification template ID
   * @returns {string} Notification template ID
   */
  getNotificationTemplateId() {
    return this.notificationTemplateId;
  }
}

module.exports = DXingClient;