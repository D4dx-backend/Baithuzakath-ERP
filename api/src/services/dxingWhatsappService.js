const DXingWhatsappOperations = require('./dxing/dxingWhatsappOperations');

/**
 * Main DXing WhatsApp Service
 */
class DXingWhatsappService {
  constructor() {
    this.operations = new DXingWhatsappOperations();
  }

  async sendWhatsApp(phone, message, variables = {}, templateId = null) {
    return await this.operations.sendWhatsApp(phone, message, variables, templateId);
  }
}

module.exports = new DXingWhatsappService();
