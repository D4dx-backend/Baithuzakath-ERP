const DXingClient = require('./dxingClient');
const DXingValidators = require('./dxingValidators');

/**
 * DXing SMS Operations
 */
class DXingOperations {
    constructor() {
        this.client = new DXingClient();
    }

    /**
     * Send OTP SMS
     * @param {string} phone - Mobile number (10 digits)
     * @param {string} otp - OTP code
     * @param {string} name - Recipient name (optional)
     * @returns {Promise<Object>} SMS response
     */
    async sendOTP(phone, otp, name = '') {
        try {
            // Validate phone number
            if (!DXingValidators.validatePhoneNumber(phone)) {
                throw new Error('Invalid phone number format');
            }

            const payload = {
                sender_id: this.client.getSenderId(),
                template_id: this.client.getOTPTemplateId(),
                mobile: phone,
                variables: {
                    name: name || 'User',
                    otp: otp,
                    validity: '10 minutes'
                }
            };

            const response = await this.client.getClient().post('/sms/send', payload);

            return {
                success: true,
                messageId: response.data.message_id,
                status: response.data.status,
                credits: response.data.credits_used,
                message: 'OTP sent successfully'
            };
        } catch (error) {
            console.error('❌ Failed to send OTP:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                errorCode: error.response?.data?.error_code || 'SMS_SEND_FAILED'
            };
        }
    }

    /**
     * Send notification SMS
     * @param {string} phone - Mobile number
     * @param {string} message - SMS message
     * @param {Object} variables - Template variables
     * @returns {Promise<Object>} SMS response
     */
    async sendNotification(phone, message, variables = {}) {
        try {
            if (!DXingValidators.validatePhoneNumber(phone)) {
                throw new Error('Invalid phone number format');
            }

            const messageValidation = DXingValidators.validateMessage(message);
            if (!messageValidation.valid) {
                throw new Error(messageValidation.error);
            }

            const payload = {
                sender_id: this.client.getSenderId(),
                template_id: this.client.getNotificationTemplateId(),
                mobile: phone,
                message: message,
                variables: variables
            };

            const response = await this.client.getClient().post('/sms/send', payload);

            return {
                success: true,
                messageId: response.data.message_id,
                status: response.data.status,
                credits: response.data.credits_used,
                message: 'Notification sent successfully'
            };
        } catch (error) {
            console.error('❌ Failed to send notification:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                errorCode: error.response?.data?.error_code || 'SMS_SEND_FAILED'
            };
        }
    }

    /**
     * Send bulk SMS
     * @param {Array} recipients - Array of {phone, message, variables}
     * @returns {Promise<Object>} Bulk SMS response
     */
    async sendBulkSMS(recipients) {
        try {
            const validation = DXingValidators.validateBulkRecipients(recipients);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            const payload = {
                sender_id: this.client.getSenderId(),
                template_id: this.client.getNotificationTemplateId(),
                messages: recipients.map(recipient => ({
                    mobile: recipient.phone,
                    message: recipient.message,
                    variables: recipient.variables || {}
                }))
            };

            const response = await this.client.getClient().post('/sms/bulk', payload);

            return {
                success: true,
                batchId: response.data.batch_id,
                totalMessages: recipients.length,
                acceptedMessages: response.data.accepted_count,
                rejectedMessages: response.data.rejected_count,
                totalCredits: response.data.total_credits_used,
                message: 'Bulk SMS sent successfully'
            };
        } catch (error) {
            console.error('❌ Failed to send bulk SMS:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                errorCode: error.response?.data?.error_code || 'BULK_SMS_FAILED'
            };
        }
    }

    /**
     * Get SMS delivery status
     * @param {string} messageId - Message ID from send response
     * @returns {Promise<Object>} Delivery status
     */
    async getDeliveryStatus(messageId) {
        try {
            const response = await this.client.getClient().get(`/sms/status/${messageId}`);

            return {
                success: true,
                messageId: messageId,
                status: response.data.status,
                deliveredAt: response.data.delivered_at,
                failureReason: response.data.failure_reason,
                operatorResponse: response.data.operator_response
            };
        } catch (error) {
            console.error('❌ Failed to get delivery status:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                errorCode: error.response?.data?.error_code || 'STATUS_CHECK_FAILED'
            };
        }
    }
}

module.exports = DXingOperations;