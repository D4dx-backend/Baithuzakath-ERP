/**
 * DXing SMS Validation Utilities
 */
class DXingValidators {
  /**
   * Validate Indian mobile number
   * @param {string} phone - Phone number to validate
   * @returns {boolean} Is valid
   */
  static validatePhoneNumber(phone) {
    if (!phone) return false;
    
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it's a valid Indian mobile number (10 digits starting with 6-9)
    const indianMobileRegex = /^[6-9]\d{9}$/;
    return indianMobileRegex.test(cleanPhone);
  }

  /**
   * Format phone number for API
   * @param {string} phone - Phone number
   * @returns {string} Formatted phone number
   */
  static formatPhoneNumber(phone) {
    if (!phone) return '';
    
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleanPhone.length === 10 && cleanPhone.match(/^[6-9]/)) {
      return `91${cleanPhone}`;
    }
    
    return cleanPhone;
  }

  /**
   * Validate bulk SMS recipients
   * @param {Array} recipients - Array of recipients
   * @returns {Object} Validation result
   */
  static validateBulkRecipients(recipients) {
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return {
        valid: false,
        error: 'Recipients array is required and cannot be empty'
      };
    }

    const invalidNumbers = recipients.filter(r => !this.validatePhoneNumber(r.phone));
    if (invalidNumbers.length > 0) {
      return {
        valid: false,
        error: `Invalid phone numbers: ${invalidNumbers.map(r => r.phone).join(', ')}`,
        invalidNumbers
      };
    }

    return { valid: true };
  }

  /**
   * Validate message content
   * @param {string} message - SMS message
   * @returns {Object} Validation result
   */
  static validateMessage(message) {
    if (!message || typeof message !== 'string') {
      return {
        valid: false,
        error: 'Message is required and must be a string'
      };
    }

    if (message.length > 1000) {
      return {
        valid: false,
        error: 'Message cannot exceed 1000 characters'
      };
    }

    return { valid: true };
  }

  /**
   * Validate template variables
   * @param {Object} variables - Template variables
   * @param {Array} requiredVars - Required variable names
   * @returns {Object} Validation result
   */
  static validateTemplateVariables(variables, requiredVars = []) {
    const missing = requiredVars.filter(varName => 
      !variables.hasOwnProperty(varName) || 
      variables[varName] === undefined || 
      variables[varName] === null
    );

    if (missing.length > 0) {
      return {
        valid: false,
        error: `Missing required variables: ${missing.join(', ')}`,
        missingVariables: missing
      };
    }

    return { valid: true };
  }
}

module.exports = DXingValidators;