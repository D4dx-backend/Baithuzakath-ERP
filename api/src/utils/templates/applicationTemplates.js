/**
 * Application SMS Templates
 */
class ApplicationTemplates {
  static getTemplates() {
    return {
      application_submitted: {
        template: 'Dear {name}, your application {applicationNumber} for {schemeName} has been submitted successfully. Track status online. - BZKRLA',
        variables: ['name', 'applicationNumber', 'schemeName'],
        category: 'transactional',
        dltTemplateId: 'DLT_TEMPLATE_APP_SUBMITTED'
      },
      
      application_approved: {
        template: 'Congratulations {name}! Your application {applicationNumber} has been approved for Rs.{amount}. Payment will be processed soon. - BZKRLA',
        variables: ['name', 'applicationNumber', 'amount'],
        category: 'transactional',
        dltTemplateId: 'DLT_TEMPLATE_APP_APPROVED'
      },
      
      application_rejected: {
        template: 'Dear {name}, your application {applicationNumber} has been rejected. Reason: {reason}. You can reapply after addressing the issues. - BZKRLA',
        variables: ['name', 'applicationNumber', 'reason'],
        category: 'transactional',
        dltTemplateId: 'DLT_TEMPLATE_APP_REJECTED'
      },
      
      application_on_hold: {
        template: 'Dear {name}, your application {applicationNumber} is on hold. Reason: {reason}. We will update you soon. - BZKRLA',
        variables: ['name', 'applicationNumber', 'reason'],
        category: 'transactional',
        dltTemplateId: 'DLT_TEMPLATE_APP_HOLD'
      },
      
      application_returned: {
        template: 'Dear {name}, your application {applicationNumber} has been returned for corrections. Please check your account for details. - BZKRLA',
        variables: ['name', 'applicationNumber'],
        category: 'transactional',
        dltTemplateId: 'DLT_TEMPLATE_APP_RETURNED'
      },
      
      application_forwarded: {
        template: 'Dear {name}, your application {applicationNumber} has been forwarded to {nextLevel} for review. - BZKRLA',
        variables: ['name', 'applicationNumber', 'nextLevel'],
        category: 'transactional',
        dltTemplateId: 'DLT_TEMPLATE_APP_FORWARDED'
      }
    };
  }
}

module.exports = ApplicationTemplates;