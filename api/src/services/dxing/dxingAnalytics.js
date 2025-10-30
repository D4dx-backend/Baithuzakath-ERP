const DXingClient = require('./dxingClient');

/**
 * DXing Analytics and Monitoring
 */
class DXingAnalytics {
  constructor() {
    this.client = new DXingClient();
  }

  /**
   * Get account balance and credits
   * @returns {Promise<Object>} Account balance
   */
  async getAccountBalance() {
    try {
      const response = await this.client.getClient().get('/account/balance');
      
      return {
        success: true,
        balance: response.data.balance,
        credits: response.data.credits,
        currency: response.data.currency,
        lastUpdated: response.data.last_updated
      };
    } catch (error) {
      console.error('❌ Failed to get account balance:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        errorCode: error.response?.data?.error_code || 'BALANCE_CHECK_FAILED'
      };
    }
  }

  /**
   * Get SMS usage statistics
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Object>} Usage statistics
   */
  async getUsageStatistics(startDate, endDate) {
    try {
      const response = await this.client.getClient().get('/sms/statistics', {
        params: {
          start_date: startDate,
          end_date: endDate
        }
      });
      
      return {
        success: true,
        totalSent: response.data.total_sent,
        totalDelivered: response.data.total_delivered,
        totalFailed: response.data.total_failed,
        deliveryRate: response.data.delivery_rate,
        creditsUsed: response.data.credits_used,
        dailyStats: response.data.daily_statistics
      };
    } catch (error) {
      console.error('❌ Failed to get usage statistics:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        errorCode: error.response?.data?.error_code || 'STATS_FETCH_FAILED'
      };
    }
  }

  /**
   * Test SMS service connectivity
   * @returns {Promise<Object>} Test result
   */
  async testConnection() {
    try {
      const balance = await this.getAccountBalance();
      
      if (balance.success) {
        return {
          success: true,
          message: 'DXing SMS service is connected successfully',
          balance: balance.credits,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          success: false,
          message: 'Failed to connect to DXing SMS service',
          error: balance.error
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'DXing SMS service connection test failed',
        error: error.message
      };
    }
  }
}

module.exports = DXingAnalytics;