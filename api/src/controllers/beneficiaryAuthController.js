const authService = require('../services/authService');
const { User } = require('../models');
const ResponseHelper = require('../utils/responseHelper');
const staticOTPConfig = require('../config/staticOTP');

class BeneficiaryAuthController {
  /**
   * Send OTP for beneficiary login/registration
   * POST /api/beneficiary/auth/send-otp
   */
  async sendOTP(req, res) {
    try {
      const { phone } = req.body;

      // Validate input
      if (!phone) {
        return ResponseHelper.error(res, 'Phone number is required', 400);
      }

      // Validate phone number format (10-digit Indian mobile number)
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return ResponseHelper.error(res, 'Invalid phone number format', 400);
      }

      // Check if user exists, if not create a beneficiary account
      let user = await User.findOne({ phone, isActive: true });
      
      if (!user) {
        // Create new beneficiary user
        user = new User({
          phone,
          role: 'beneficiary',
          name: `Beneficiary ${phone.slice(-4)}`, // Temporary name
          isVerified: false,
          isActive: true
        });
        await user.save();
      }

      // Generate OTP based on configuration
      const otp = staticOTPConfig.USE_STATIC_OTP 
        ? staticOTPConfig.STATIC_OTP 
        : user.generateOTP('login');
      
      // Set OTP in user model
      user.otp = {
        code: otp,
        expiresAt: new Date(Date.now() + staticOTPConfig.OTP_EXPIRY_MINUTES * 60 * 1000),
        attempts: (user.otp?.attempts || 0) + 1,
        lastSentAt: new Date(),
        purpose: 'login',
        verified: false
      };
      await user.save();

      // Always use static OTP mode for testing (no SMS service)
      console.log(`🔑 STATIC OTP MODE: OTP for ${phone} is: ${otp}`);
      const smsResult = { success: true, messageId: 'static-otp-mode' };

      const response = {
        message: 'OTP sent successfully',
        phone: phone,
        expiresIn: staticOTPConfig.OTP_EXPIRY_MINUTES
      };

      // Include OTP in response if static mode is enabled
      if (staticOTPConfig.USE_STATIC_OTP) {
        response.staticOTP = otp;
        response.note = 'Static OTP enabled for all logins';
      }

      return ResponseHelper.success(res, response, 'OTP sent successfully');

    } catch (error) {
      console.error('❌ Beneficiary Send OTP Error:', error);
      return ResponseHelper.error(res, error.message, 500);
    }
  }

  /**
   * Verify OTP and login beneficiary
   * POST /api/beneficiary/auth/verify-otp
   */
  async verifyOTP(req, res) {
    try {
      const { phone, otp } = req.body;

      // Validate input
      if (!phone || !otp) {
        return ResponseHelper.error(res, 'Phone number and OTP are required', 400);
      }

      // Find user
      const user = await User.findOne({ phone, isActive: true });
      if (!user) {
        return ResponseHelper.error(res, 'User not found', 404);
      }

      // Verify OTP
      const otpVerification = user.verifyOTP(otp, 'login');
      if (!otpVerification.success) {
        return ResponseHelper.error(res, otpVerification.message, 400);
      }

      // Generate JWT token
      const token = authService.generateToken(user);

      // Update last login and clear OTP
      user.lastLogin = new Date();
      user.clearOTP();
      await user.save();

      // Return user data and token
      const userData = {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        profile: user.profile
      };

      return ResponseHelper.success(res, {
        user: userData,
        token,
        message: 'Login successful'
      }, 'Login successful');

    } catch (error) {
      console.error('❌ Beneficiary Verify OTP Error:', error);
      return ResponseHelper.error(res, error.message, 500);
    }
  }

  /**
   * Update beneficiary profile
   * PUT /api/beneficiary/auth/profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user._id;
      const updates = req.body;

      // Only allow specific fields to be updated
      const allowedFields = [
        'name', 
        'profile.dateOfBirth', 
        'profile.gender', 
        'profile.address',
        'profile.emergencyContact'
      ];

      const filteredUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key) || key.startsWith('profile.')) {
          filteredUpdates[key] = updates[key];
        }
      });

      const user = await User.findByIdAndUpdate(
        userId,
        { 
          ...filteredUpdates,
          updatedBy: userId,
          isVerified: true // Mark as verified after profile completion
        },
        { new: true, runValidators: true }
      ).select('-password -otp');

      return ResponseHelper.success(res, { user }, 'Profile updated successfully');

    } catch (error) {
      console.error('❌ Update Beneficiary Profile Error:', error);
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  /**
   * Get beneficiary profile
   * GET /api/beneficiary/auth/profile
   */
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user._id).select('-password -otp');

      if (!user) {
        return ResponseHelper.error(res, 'User not found', 404);
      }

      return ResponseHelper.success(res, { user }, 'Profile retrieved successfully');

    } catch (error) {
      console.error('❌ Get Beneficiary Profile Error:', error);
      return ResponseHelper.error(res, 'Failed to retrieve profile', 500);
    }
  }

  /**
   * Resend OTP
   * POST /api/beneficiary/auth/resend-otp
   */
  async resendOTP(req, res) {
    try {
      const { phone } = req.body;

      if (!phone) {
        return ResponseHelper.error(res, 'Phone number is required', 400);
      }

      const user = await User.findOne({ phone, isActive: true });
      if (!user) {
        return ResponseHelper.error(res, 'User not found', 404);
      }

      // Check if enough time has passed since last OTP
      if (user.otp.lastSentAt) {
        const timeSinceLastOTP = Date.now() - user.otp.lastSentAt.getTime();
        const minInterval = 60 * 1000; // 1 minute

        if (timeSinceLastOTP < minInterval) {
          const remainingTime = Math.ceil((minInterval - timeSinceLastOTP) / 1000);
          return ResponseHelper.error(res, `Please wait ${remainingTime} seconds before requesting a new OTP`, 429);
        }
      }

      // Generate OTP based on configuration
      const otp = staticOTPConfig.USE_STATIC_OTP 
        ? staticOTPConfig.STATIC_OTP 
        : user.generateOTP('login');
      
      // Set OTP in user model
      user.otp = {
        code: otp,
        expiresAt: new Date(Date.now() + staticOTPConfig.OTP_EXPIRY_MINUTES * 60 * 1000),
        attempts: (user.otp?.attempts || 0) + 1,
        lastSentAt: new Date(),
        purpose: 'login',
        verified: false
      };
      await user.save();

      // Always use static OTP mode for testing (no SMS service)
      console.log(`🔑 STATIC OTP MODE: Resent OTP for ${phone} is: ${otp}`);
      const smsResult = { success: true, messageId: 'static-otp-mode' };

      const response = {
        message: 'OTP resent successfully',
        expiresIn: staticOTPConfig.OTP_EXPIRY_MINUTES
      };

      // Include OTP in response if static mode is enabled
      if (staticOTPConfig.USE_STATIC_OTP) {
        response.staticOTP = otp;
        response.note = 'Static OTP enabled for all logins';
      }

      return ResponseHelper.success(res, response, 'OTP resent successfully');

    } catch (error) {
      console.error('❌ Resend OTP Error:', error);
      return ResponseHelper.error(res, error.message, 500);
    }
  }
}

module.exports = new BeneficiaryAuthController();