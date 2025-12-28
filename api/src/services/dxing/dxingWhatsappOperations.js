const DXingClient = require('./dxingClient');
const DXingValidators = require('./dxingValidators');
const config = require('../../config/environment');

/**
 * DXing WhatsApp Operations (optional; requires DXing WhatsApp credentials/product)
 */
class DXingWhatsappOperations {
  constructor() {
    this.client = new DXingClient();
  }

  /**
   * Send WhatsApp message
   *
   * NOTE: DXing WhatsApp API shape can vary by account/product.
   * We keep payload flexible and drive endpoint via env.
   */
  async sendWhatsApp(phone, message, variables = {}, templateId = null) {
    try {
      if (!config.DXING_WHATSAPP_ENABLED) {
        throw new Error('DXing WhatsApp is not enabled (set DXING_WHATSAPP_ENABLED=true)');
      }

      if (!DXingValidators.validatePhoneNumber(phone)) {
        throw new Error('Invalid phone number format');
      }

      const path = config.DXING_WHATSAPP_SEND_PATH || '/whatsapp/send';

      const payload = {
        sender_id: this.client.getSenderId(),
        mobile: phone,
        message,
        variables: variables || {}
      };

      const finalTemplateId = templateId || config.DXING_WHATSAPP_TEMPLATE_ID;
      if (finalTemplateId) {
        payload.template_id = finalTemplateId;
      }

      const response = await this.client.getClient().post(path, payload);

      return {
        success: true,
        messageId: response.data?.message_id || response.data?.id || `wa_${Date.now()}`,
        status: response.data?.status,
        message: 'WhatsApp message sent successfully'
      };
    } catch (error) {
      console.error('❌ Failed to send WhatsApp:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        errorCode: error.response?.data?.error_code || 'WHATSAPP_SEND_FAILED'
      };
    }
  }
}

module.exports = DXingWhatsappOperations;
