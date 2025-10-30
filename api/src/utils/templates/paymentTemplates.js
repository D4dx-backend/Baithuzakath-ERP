/**
 * Payment SMS Templates
 */
class PaymentTemplates {
  static getTemplates() {
    return {
      payment_initiated: {
        template: 'Dear {name}, payment of Rs.{amount} for application {applicationNumber} has been initiated. Payment ID: {paymentId}. - BZKRLA',
        variables: ['name', 'amount', 'applicationNumber', 'paymentId'],
        category: 'transactional',
        dltTemplateId: 'DLT_TEMPLATE_PAYMENT_INITIATED'
      },
      
      payment_processed: {
        template: 'Dear {name}, payment of Rs.{amount} for application {applicationNumber} has been processed to account ending {accountNumber}. - BZKRLA',
        variables: ['name', 'amount', 'applicationNumber', 'accountNumber'],
        category: 'transactional',
        dltTemplateId: 'DLT_TEMPLATE_PAYMENT_PROCESSED'
      },
      
      payment_failed: {
        template: 'Dear {name}, payment of Rs.{amount} for application {applicationNumber} failed. Reason: {reason}. We will retry soon. - BZKRLA',
        variables: ['name', 'amount', 'applicationNumber', 'reason'],
        category: 'transactional',
        dltTemplateId: 'DLT_TEMPLATE_PAYMENT_FAILED'
      },
      
      installment_due: {
        template: 'Dear {name}, installment {installmentNumber} of Rs.{amount} for application {applicationNumber} is due on {dueDate}. - BZKRLA',
        variables: ['name', 'installmentNumber', 'amount', 'applicationNumber', 'dueDate'],
        category: 'transactional',
        dltTemplateId: 'DLT_TEMPLATE_INSTALLMENT_DUE'
      },
      
      installment_processed: {
        template: 'Dear {name}, installment {installmentNumber} of Rs.{amount} has been processed for application {applicationNumber}. - BZKRLA',
        variables: ['name', 'installmentNumber', 'amount', 'applicationNumber'],
        category: 'transactional',
        dltTemplateId: 'DLT_TEMPLATE_INSTALLMENT_PROCESSED'
      }
    };
  }
}

module.exports = PaymentTemplates;