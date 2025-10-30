/**
 * DXing SMS Template Generator
 */
class DXingTemplates {
  /**
   * Generate OTP
   * @param {number} length - OTP length (default: 6)
   * @returns {string} Generated OTP
   */
  static generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    
    return otp;
  }

  /**
   * Create SMS template for different scenarios
   * @param {string} type - Template type
   * @param {Object} variables - Template variables
   * @returns {string} Formatted message
   */
  static createTemplate(type, variables = {}) {
    const templates = {
      otp: `Dear ${variables.name || 'User'}, your OTP for Baithuzzakath Kerala is ${variables.otp}. Valid for ${variables.validity || '10 minutes'}. Do not share with anyone.`,
      
      welcome: `Welcome to Baithuzzakath Kerala, ${variables.name}! Your account has been created successfully. Login with your registered mobile number.`,
      
      application_submitted: `Dear ${variables.name}, your application ${variables.applicationNumber} has been submitted successfully. You will be notified about the status updates.`,
      
      application_approved: `Congratulations ${variables.name}! Your application ${variables.applicationNumber} has been approved for ₹${variables.amount}. Payment will be processed soon.`,
      
      application_rejected: `Dear ${variables.name}, your application ${variables.applicationNumber} has been rejected. Reason: ${variables.reason}. You can reapply after addressing the issues.`,
      
      payment_processed: `Dear ${variables.name}, payment of ₹${variables.amount} for application ${variables.applicationNumber} has been processed to your account ending with ${variables.accountNumber}.`,
      
      interview_scheduled: `Dear ${variables.name}, interview for your application ${variables.applicationNumber} is scheduled on ${variables.date} at ${variables.time}. Venue: ${variables.venue}.`,
      
      document_required: `Dear ${variables.name}, additional documents are required for your application ${variables.applicationNumber}. Please upload: ${variables.documents}.`,
      
      reminder: `Dear ${variables.name}, this is a reminder for ${variables.subject}. Please take necessary action before ${variables.deadline}.`
    };
    
    return templates[type] || variables.message || '';
  }

  /**
   * Get available template types
   * @returns {Array} Template types
   */
  static getTemplateTypes() {
    return [
      'otp',
      'welcome', 
      'application_submitted',
      'application_approved',
      'application_rejected',
      'payment_processed',
      'interview_scheduled',
      'document_required',
      'reminder'
    ];
  }

  /**
   * Validate template type
   * @param {string} type - Template type
   * @returns {boolean} Is valid template type
   */
  static isValidTemplateType(type) {
    return this.getTemplateTypes().includes(type);
  }
}

module.exports = DXingTemplates;