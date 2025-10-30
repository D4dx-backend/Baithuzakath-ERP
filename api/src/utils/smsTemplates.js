const AuthTemplates = require('./templates/authTemplates');
const ApplicationTemplates = require('./templates/applicationTemplates');
const PaymentTemplates = require('./templates/paymentTemplates');
const SystemTemplates = require('./templates/systemTemplates');

/**
 * SMS Templates for different notification types
 * All templates are DLT compliant and follow Indian telecom regulations
 */
class SMSTemplates {
  /**
   * Get all available templates
   * @returns {Object} All templates organized by category
   */
  static getAllTemplates() {
    return {
      authentication: AuthTemplates.getTemplates(),
      application: ApplicationTemplates.getTemplates(),
      payment: PaymentTemplates.getTemplates(),
      system: SystemTemplates.getTemplates()
    };
  }

  /**
   * Get authentication templates
   */
  static getAuthTemplates() {
    return AuthTemplates.getTemplates();
  }

  /**
   * Get application templates
   */
  static getApplicationTemplates() {
    return ApplicationTemplates.getTemplates();
  }

  /**
   * Get payment templates
   */
  static getPaymentTemplates() {
    return PaymentTemplates.getTemplates();
  }

  /**
   * Get system templates
   */
  static getSystemTemplates() {
    return SystemTemplates.getTemplates();
  }

  /**
   * Get template by key
   * @param {string} templateKey - Template key (category.template_name)
   * @returns {Object|null} Template object or null if not found
   */
  static getTemplate(templateKey) {
    const [category, templateName] = templateKey.split('.');
    const templates = this.getAllTemplates();
    
    if (templates[category] && templates[category][templateName]) {
      return templates[category][templateName];
    }
    
    return null;
  }

  /**
   * Format template with variables
   * @param {string} templateKey - Template key
   * @param {Object} variables - Variables to replace
   * @returns {string} Formatted message
   */
  static formatTemplate(templateKey, variables = {}) {
    const template = this.getTemplate(templateKey);
    
    if (!template) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    let message = template.template;
    
    // Replace variables in template
    template.variables.forEach(variable => {
      const value = variables[variable] || `{${variable}}`;
      const regex = new RegExp(`\\{${variable}\\}`, 'g');
      message = message.replace(regex, value);
    });

    return message;
  }

  /**
   * Validate template variables
   * @param {string} templateKey - Template key
   * @param {Object} variables - Variables to validate
   * @returns {Object} Validation result
   */
  static validateTemplateVariables(templateKey, variables = {}) {
    const template = this.getTemplate(templateKey);
    
    if (!template) {
      return {
        valid: false,
        error: `Template not found: ${templateKey}`
      };
    }

    const missingVariables = template.variables.filter(variable => 
      !variables.hasOwnProperty(variable) || variables[variable] === undefined || variables[variable] === null
    );

    if (missingVariables.length > 0) {
      return {
        valid: false,
        error: `Missing required variables: ${missingVariables.join(', ')}`,
        missingVariables
      };
    }

    return {
      valid: true,
      template,
      formattedMessage: this.formatTemplate(templateKey, variables)
    };
  }

  /**
   * Get templates by category
   * @param {string} category - Template category
   * @returns {Object} Templates in category
   */
  static getTemplatesByCategory(category) {
    const templates = this.getAllTemplates();
    return templates[category] || {};
  }

  /**
   * Search templates by keyword
   * @param {string} keyword - Search keyword
   * @returns {Array} Matching templates
   */
  static searchTemplates(keyword) {
    const allTemplates = this.getAllTemplates();
    const results = [];
    
    Object.keys(allTemplates).forEach(category => {
      Object.keys(allTemplates[category]).forEach(templateName => {
        const template = allTemplates[category][templateName];
        const templateKey = `${category}.${templateName}`;
        
        if (
          templateName.includes(keyword.toLowerCase()) ||
          template.template.toLowerCase().includes(keyword.toLowerCase())
        ) {
          results.push({
            key: templateKey,
            category,
            name: templateName,
            ...template
          });
        }
      });
    });
    
    return results;
  }

  /**
   * Get template statistics
   * @returns {Object} Template statistics
   */
  static getTemplateStats() {
    const allTemplates = this.getAllTemplates();
    const stats = {
      totalTemplates: 0,
      categoryCounts: {},
      typeCounts: {
        transactional: 0,
        promotional: 0
      }
    };

    Object.keys(allTemplates).forEach(category => {
      const categoryTemplates = allTemplates[category];
      const count = Object.keys(categoryTemplates).length;
      
      stats.categoryCounts[category] = count;
      stats.totalTemplates += count;
      
      Object.values(categoryTemplates).forEach(template => {
        stats.typeCounts[template.category]++;
      });
    });

    return stats;
  }
}

module.exports = SMSTemplates;