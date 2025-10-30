/**
 * Authentication SMS Templates
 */
class AuthTemplates {
  static getTemplates() {
    return {
      otp_login: {
        template: 'Dear {name}, your OTP for Baithuzzakath Kerala login is {otp}. Valid for {validity}. Do not share with anyone. - BZKRLA',
        variables: ['name', 'otp', 'validity'],
        category: 'transactional',
        dltTemplateId: 'DLT_TEMPLATE_OTP_LOGIN'
      },
      
      otp_registration: {
        template: 'Dear {name}, your OTP for Baithuzzakath Kerala registration is {otp}. Valid for {validity}. Do not share with anyone. - BZKRLA',
        variables: ['name', 'otp', 'validity'],
        category: 'transactional',
        dltTemplateId: 'DLT_TEMPLATE_OTP_REG'
      },
      
      otp_password_reset: {
        template: 'Dear {name}, your OTP for password reset is {otp}. Valid for {validity}. Do not share with anyone. - BZKRLA',
        variables: ['name', 'otp', 'validity'],
        category: 'transactional',
        dltTemplateId: 'DLT_TEMPLATE_OTP_RESET'
      },
      
      welcome_user: {
        template: 'Welcome to Baithuzzakath Kerala, {name}! Your account has been created successfully. Login with your registered mobile number. - BZKRLA',
        variables: ['name'],
        category: 'promotional',
        dltTemplateId: 'DLT_TEMPLATE_WELCOME'
      },
      
      account_activated: {
        template: 'Dear {name}, your Baithuzzakath Kerala account has been activated successfully. You can now access all services. - BZKRLA',
        variables: ['name'],
        category: 'transactional',
        dltTemplateId: 'DLT_TEMPLATE_ACTIVATED'
      },
      
      account_deactivated: {
        template: 'Dear {name}, your Baithuzzakath Kerala account has been deactivated. Reason: {reason}. Contact support for assistance. - BZKRLA',
        variables: ['name', 'reason'],
        category: 'transactional',
        dltTemplateId: 'DLT_TEMPLATE_DEACTIVATED'
      }
    };
  }
}

module.exports = AuthTemplates;