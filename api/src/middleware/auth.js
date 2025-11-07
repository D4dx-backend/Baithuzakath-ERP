const jwt = require('jsonwebtoken');
const { User } = require('../models');
const authService = require('../services/authService');
const config = require('../config/environment');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    console.log('🔍 AUTHENTICATION DEBUG:');
    console.log('- Path:', req.path);
    console.log('- Auth header exists:', !!authHeader);
    
    if (!authHeader) {
      console.log('❌ No auth header provided');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      console.log('❌ Invalid token format');
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.'
      });
    }

    console.log('- Token (first 20 chars):', token.substring(0, 20) + '...');

    // Verify token
    const decoded = authService.verifyToken(token);
    console.log('- Decoded userId:', decoded.userId);
    console.log('- Decoded role:', decoded.role);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    console.log('- User found in DB:', !!user);
    console.log('- User role from DB:', user?.role);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Attach user to request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('❌ Authentication Error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

/**
 * Authorization middleware
 * Checks if user has required role(s)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('🔍 AUTHORIZATION DEBUG:');
    console.log('- Required roles:', roles);
    console.log('- User exists:', !!req.user);
    console.log('- User role:', req.user?.role);
    console.log('- Role check result:', roles.includes(req.user?.role));
    
    if (!req.user) {
      console.log('❌ No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      console.log('❌ Role check failed');
      console.log('- User role:', req.user.role);
      console.log('- Required roles:', roles);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    console.log('✅ Authorization successful');
    next();
  };
};

/**
 * Regional access middleware
 * Checks if user has access to specific region
 */
const checkRegionalAccess = (req, res, next) => {
  try {
    const { regionId } = req.params;
    const user = req.user;

    // State admin has access to all regions
    if (user.role === 'state_admin') {
      return next();
    }

    // Check if user has access to the region
    if (!user.hasRegionAccess(regionId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to access this region.'
      });
    }

    next();
  } catch (error) {
    console.error('❌ Regional Access Check Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify regional access.'
    });
  }
};

/**
 * Project access middleware
 * Checks if user has access to specific project
 */
const checkProjectAccess = (req, res, next) => {
  try {
    const { projectId } = req.params;
    const user = req.user;

    // State admin has access to all projects
    if (user.role === 'state_admin') {
      return next();
    }

    // Project coordinator can access assigned projects
    if (user.role === 'project_coordinator') {
      if (!user.hasProjectAccess(projectId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to access this project.'
        });
      }
    }

    next();
  } catch (error) {
    console.error('❌ Project Access Check Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify project access.'
    });
  }
};

/**
 * Resource ownership middleware
 * Checks if user owns the resource or has admin access
 */
const checkResourceOwnership = (resourceField = 'userId') => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const resourceId = req.params.id;

      // Admin roles can access all resources
      const adminRoles = ['state_admin', 'district_admin', 'area_admin', 'unit_admin'];
      if (adminRoles.includes(user.role)) {
        return next();
      }

      // For beneficiaries, check ownership
      if (user.role === 'beneficiary') {
        // This would need to be implemented based on the specific resource
        // For now, allow access if the resource belongs to the user
        const resourceUserId = req.params[resourceField] || req.body[resourceField];
        
        if (resourceUserId && resourceUserId.toString() !== user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You can only access your own resources.'
          });
        }
      }

      next();
    } catch (error) {
      console.error('❌ Resource Ownership Check Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify resource ownership.'
      });
    }
  };
};

/**
 * Permission-based authorization middleware
 * Checks specific permissions for actions using RBAC service
 */
const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const rbacService = require('../services/rbacService');

      // Construct permission name based on resource and action
      const permissionName = `${resource}.${action}`;
      
      const context = {
        user,
        ip: req.ip,
        timestamp: new Date()
      };

      const hasPermission = await rbacService.hasPermission(user._id, permissionName, context);

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Access denied. You do not have permission to ${action} ${resource}.`,
          requiredPermission: permissionName
        });
      }

      // Add permission info to request for logging
      req.checkedPermission = permissionName;
      next();
    } catch (error) {
      console.error('❌ Permission Check Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify permissions.'
      });
    }
  };
};

/**
 * Direct permission check middleware
 * Checks if user has specific permission by name
 */
const hasPermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const rbacService = require('../services/rbacService');
      
      const context = {
        user,
        ip: req.ip,
        timestamp: new Date()
      };

      const hasPermissionResult = await rbacService.hasPermission(user._id, permissionName, context);

      if (!hasPermissionResult) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required permission: ${permissionName}`,
          requiredPermission: permissionName
        });
      }

      // Add permission info to request for logging
      req.checkedPermission = permissionName;
      next();
    } catch (error) {
      console.error('❌ Permission Check Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify permissions.'
      });
    }
  };
};

/**
 * Optional authentication middleware
 * Attaches user if token is provided, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return next();
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return next();
    }

    try {
      const decoded = authService.verifyToken(token);
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
        req.token = token;
      }
    } catch (error) {
      // Ignore token errors for optional auth
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

/**
 * Rate limiting middleware for authentication endpoints
 */
const authRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip + (req.body.phone || req.body.email || '');
    const now = Date.now();
    
    // Clean old entries
    for (const [k, v] of attempts.entries()) {
      if (now - v.firstAttempt > windowMs) {
        attempts.delete(k);
      }
    }

    const userAttempts = attempts.get(key);
    
    if (!userAttempts) {
      attempts.set(key, { count: 1, firstAttempt: now });
      return next();
    }

    if (userAttempts.count >= maxAttempts) {
      const timeLeft = Math.ceil((windowMs - (now - userAttempts.firstAttempt)) / 1000 / 60);
      return res.status(429).json({
        success: false,
        message: `Too many authentication attempts. Please try again in ${timeLeft} minutes.`
      });
    }

    userAttempts.count++;
    next();
  };
};

/**
 * Device registration middleware
 * Registers device for push notifications
 */
const registerDevice = async (req, res, next) => {
  try {
    const { deviceId, fcmToken, platform } = req.body;
    
    if (req.user && deviceId && fcmToken) {
      await authService.registerDevice(req.user._id, {
        deviceId,
        fcmToken,
        platform: platform || 'web'
      });
    }

    next();
  } catch (error) {
    // Don't fail the request if device registration fails
    console.error('❌ Device Registration Error:', error);
    next();
  }
};

/**
 * Admin hierarchy middleware
 * Ensures admin can only access subordinate levels
 */
const checkAdminHierarchy = (req, res, next) => {
  try {
    const user = req.user;
    const targetLevel = req.params.level || req.body.level;

    if (!targetLevel) {
      return next();
    }

    const hierarchy = {
      state_admin: ['state', 'district', 'area', 'unit'],
      district_admin: ['district', 'area', 'unit'],
      area_admin: ['area', 'unit'],
      unit_admin: ['unit']
    };

    const allowedLevels = hierarchy[user.role] || [];
    
    if (!allowedLevels.includes(targetLevel)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot access this administrative level.'
      });
    }

    next();
  } catch (error) {
    console.error('❌ Admin Hierarchy Check Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify admin hierarchy.'
    });
  }
};

const RBACMiddleware = require('./rbacMiddleware');

module.exports = {
  authenticate,
  authorize,
  checkRegionalAccess,
  checkProjectAccess,
  checkResourceOwnership,
  checkPermission,
  hasPermission,
  optionalAuth,
  authRateLimit,
  registerDevice,
  checkAdminHierarchy,
  // RBAC Middleware
  ...RBACMiddleware
};