const authService = require('../services/authService');
const { User, Location } = require('../models');
const ResponseHelper = require('../utils/responseHelper');
const staticOTPConfig = require('../config/staticOTP');
const whatsappOTPService = require('../utils/whatsappOtpService');

class BeneficiaryAuthController {
  /**
   * Test login for beneficiary (testing purposes only)
   * Uses static phone number and OTP for quick testing
   * POST /api/beneficiary/auth/test-login
   * 
   * NOTE: This endpoint should be disabled in production for security.
   * Set ENABLE_TEST_LOGIN=true in environment variables to enable in production.
   */
  async testLogin(req, res) {
    try {
      // Check if test login is enabled (development or explicitly enabled)
      const isDevelopment = process.env.NODE_ENV === 'development';
      const isTestLoginEnabled = process.env.ENABLE_TEST_LOGIN === 'true';
      
      if (!isDevelopment && !isTestLoginEnabled) {
        console.log('❌ Test login disabled in production');
        return ResponseHelper.error(res, 'Test login is disabled in production environment', 403);
      }

      // Static test credentials
      const TEST_PHONE = '9999999999';
      const TEST_OTP = '123456';

      console.log('🧪 TEST LOGIN: Using static credentials');
      console.log('- Test Phone:', TEST_PHONE);
      console.log('- Test OTP:', TEST_OTP);

      // Find or create test beneficiary user (must have beneficiary role)
      let user = await User.findOne({ 
        phone: TEST_PHONE, 
        role: 'beneficiary',
        isActive: true 
      });
      
      if (!user) {
        // Check if a user with this phone exists but different role
        const existingUser = await User.findOne({ phone: TEST_PHONE, isActive: true });
        
        if (existingUser) {
          // Update existing user to beneficiary role for testing
          console.log('⚠️ User exists with different role, updating to beneficiary for test login');
          existingUser.role = 'beneficiary';
          existingUser.name = existingUser.name || 'Test Beneficiary';
          await existingUser.save();
          user = existingUser;
          console.log('✅ Updated existing user to beneficiary role');
        } else {
          // Create new test beneficiary user
          user = new User({
            phone: TEST_PHONE,
            role: 'beneficiary',
            name: 'Test Beneficiary',
            isVerified: false,
            isActive: true
          });
          await user.save();
          console.log('✅ Created new test beneficiary user');
        }
      }

      // Generate JWT token
      console.log('🔑 Generating token for test beneficiary:');
      console.log('- User ID:', user._id);
      console.log('- User role:', user.role);
      console.log('- User phone:', user.phone);
      
      const token = authService.generateToken(user);
      console.log('- Token generated (first 50 chars):', token.substring(0, 50) + '...');

      // Update last login
      user.lastLogin = new Date();
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

      console.log('✅ Test login successful');
      console.log('- Returning user data:', userData);

      return ResponseHelper.success(res, {
        user: userData,
        token,
        message: 'Test login successful',
        note: 'This is a test login route using static credentials'
      }, 'Test login successful');

    } catch (error) {
      console.error('❌ Test Login Error:', error);
      return ResponseHelper.error(res, error.message, 500);
    }
  }

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
        : whatsappOTPService.generateOTP(6);
      
      // Send OTP based on configuration
      let sendResult = { success: true, messageId: 'dev-test-message-id' };
      
      if (staticOTPConfig.USE_STATIC_OTP) {
        // Static OTP mode for testing (no external service)
        console.log(`🔑 STATIC OTP MODE: OTP for ${phone} is: ${otp}`);
        sendResult = { success: true, messageId: 'static-otp-mode' };
      } else if (staticOTPConfig.USE_WHATSAPP_OTP && staticOTPConfig.WHATSAPP_ENABLED) {
        // WhatsApp OTP service
        console.log(`📱 Sending OTP via WhatsApp to ${phone}...`);
        sendResult = await whatsappOTPService.sendOTP(phone, otp, {
          name: user.name || 'Beneficiary',
          purpose: 'beneficiary-login',
          priority: 1
        });
        
        if (!sendResult.success) {
          console.error('❌ WhatsApp OTP failed:', sendResult.error);
          throw new Error(`Failed to send OTP via WhatsApp: ${sendResult.error}`);
        }
        
        console.log(`✅ WhatsApp OTP sent - MessageID: ${sendResult.messageId}`);
      } else {
        // Development mode - no service enabled
        console.log(`⚠️  No OTP service enabled. OTP: ${otp}`);
        sendResult = { success: true, messageId: 'no-service-mode' };
      }
      
      // Set OTP in user model
      user.otp = {
        code: otp,
        expiresAt: new Date(Date.now() + staticOTPConfig.OTP_EXPIRY_MINUTES * 60 * 1000),
        attempts: (user.otp?.attempts || 0) + 1,
        lastSentAt: new Date(),
        purpose: 'beneficiary-login',
        verified: false
      };
      await user.save();

      const response = {
        message: staticOTPConfig.USE_WHATSAPP_OTP 
          ? 'OTP sent successfully to your WhatsApp number' 
          : 'OTP sent successfully',
        phone: phone,
        expiresIn: staticOTPConfig.OTP_EXPIRY_MINUTES,
        messageId: sendResult.messageId,
        deliveryMethod: staticOTPConfig.USE_STATIC_OTP 
          ? 'static' 
          : staticOTPConfig.USE_WHATSAPP_OTP 
            ? 'whatsapp' 
            : 'development'
      };

      // Include OTP in response if static mode is enabled (for development)
      if (staticOTPConfig.USE_STATIC_OTP) {
        response.staticOTP = otp;
        response.note = 'Static OTP enabled for testing';
      } else if (!staticOTPConfig.USE_WHATSAPP_OTP && !staticOTPConfig.SMS_ENABLED) {
        // Development mode - include OTP in response
        response.developmentOTP = otp;
        response.note = 'Development mode - OTP included in response';
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
      const otpVerification = user.verifyOTP(otp, 'beneficiary-login');
      if (!otpVerification.success) {
        return ResponseHelper.error(res, otpVerification.message, 400);
      }

      // Generate JWT token
      console.log('🔑 Generating token for beneficiary:');
      console.log('- User ID:', user._id);
      console.log('- User role:', user.role);
      console.log('- User phone:', user.phone);
      
      const token = authService.generateToken(user);
      console.log('- Token generated (first 50 chars):', token.substring(0, 50) + '...');

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

      console.log('✅ Beneficiary login successful');
      console.log('- Returning user data:', userData);

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
      const { name, profile } = req.body;

      // Build update object
      const updateData = {
        updatedBy: userId,
        isVerified: true // Mark as verified after profile completion
      };

      // Update name if provided
      if (name) {
        updateData.name = name.trim();
      }

      // Update profile fields if provided
      if (profile) {
        if (profile.dateOfBirth) {
          updateData['profile.dateOfBirth'] = profile.dateOfBirth;
        }
        if (profile.gender) {
          updateData['profile.gender'] = profile.gender;
        }
        if (profile.address) {
          updateData['profile.address'] = profile.address;
        }
        if (profile.emergencyContact) {
          updateData['profile.emergencyContact'] = profile.emergencyContact;
        }
        // Update location references
        if (profile.location) {
          if (profile.location.district) {
            updateData['profile.location.district'] = profile.location.district;
          }
          if (profile.location.area) {
            updateData['profile.location.area'] = profile.location.area;
          }
          if (profile.location.unit) {
            updateData['profile.location.unit'] = profile.location.unit;
          }
        }
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .select('-password -otp')
        .populate('profile.location.district', 'name code type')
        .populate('profile.location.area', 'name code type')
        .populate('profile.location.unit', 'name code type');

      if (!user) {
        return ResponseHelper.error(res, 'User not found', 404);
      }

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
      const user = await User.findById(req.user._id)
        .select('-password -otp')
        .populate('profile.location.district', 'name code type')
        .populate('profile.location.area', 'name code type')
        .populate('profile.location.unit', 'name code type');

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
        : user.generateOTP('beneficiary-login');
      
      // Set OTP in user model
      user.otp = {
        code: otp,
        expiresAt: new Date(Date.now() + staticOTPConfig.OTP_EXPIRY_MINUTES * 60 * 1000),
        attempts: (user.otp?.attempts || 0) + 1,
        lastSentAt: new Date(),
        purpose: 'beneficiary-login',
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

  /**
   * Get locations for beneficiary signup
   * GET /api/beneficiary/auth/locations
   */
  async getLocations(req, res) {
    try {
      const { type, parent } = req.query;

      const query = { isActive: true };
      
      if (type) {
        query.type = type;
      }
      
      if (parent) {
        query.parent = parent;
      }

      const locations = await Location.find(query)
        .select('_id name code type parent')
        .sort({ name: 1 });

      return ResponseHelper.success(res, { locations }, 'Locations retrieved successfully');

    } catch (error) {
      console.error('❌ Get Locations Error:', error);
      return ResponseHelper.error(res, 'Failed to retrieve locations', 500);
    }
  }
}

module.exports = new BeneficiaryAuthController();