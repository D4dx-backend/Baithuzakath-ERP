const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { User, Role, Permission, UserRole } = require('../models');
const rbacService = require('../services/rbacService');

describe('RBAC System', () => {
  let superAdminToken, stateAdminToken, districtAdminToken, beneficiaryToken;
  let superAdmin, stateAdmin, districtAdmin, beneficiary;
  let testRole, testPermission;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/baithuzzakath_test');
    
    // Initialize RBAC system
    await rbacService.initializeRBAC();
    
    // Create test users
    await createTestUsers();
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Role.deleteMany({ type: 'custom' });
    await Permission.deleteMany({ type: 'custom' });
    await UserRole.deleteMany({});
    
    await mongoose.disconnect();
  });

  const createTestUsers = async () => {
    // Create super admin
    superAdmin = new User({
      name: 'Test Super Admin',
      email: 'superadmin@test.com',
      phone: '9999999991',
      role: 'super_admin',
      isVerified: true,
      isActive: true
    });
    await superAdmin.save();
    superAdminToken = generateTestToken(superAdmin);

    // Create state admin
    stateAdmin = new User({
      name: 'Test State Admin',
      email: 'stateadmin@test.com',
      phone: '9999999992',
      role: 'state_admin',
      isVerified: true,
      isActive: true
    });
    await stateAdmin.save();
    stateAdminToken = generateTestToken(stateAdmin);

    // Create district admin
    districtAdmin = new User({
      name: 'Test District Admin',
      email: 'districtadmin@test.com',
      phone: '9999999993',
      role: 'district_admin',
      isVerified: true,
      isActive: true
    });
    await districtAdmin.save();
    districtAdminToken = generateTestToken(districtAdmin);

    // Create beneficiary
    beneficiary = new User({
      name: 'Test Beneficiary',
      email: 'beneficiary@test.com',
      phone: '9999999994',
      role: 'beneficiary',
      isVerified: true,
      isActive: true
    });
    await beneficiary.save();
    beneficiaryToken = generateTestToken(beneficiary);
  };

  const generateTestToken = (user) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      {
        userId: user._id,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  };

  describe('Role Management', () => {
    test('Super admin should be able to view all roles', async () => {
      const response = await request(app)
        .get('/api/rbac/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('State admin should be able to view roles', async () => {
      const response = await request(app)
        .get('/api/rbac/roles')
        .set('Authorization', `Bearer ${stateAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('Beneficiary should not be able to view roles', async () => {
      await request(app)
        .get('/api/rbac/roles')
        .set('Authorization', `Bearer ${beneficiaryToken}`)
        .expect(403);
    });

    test('Super admin should be able to create custom role', async () => {
      const roleData = {
        name: 'test_coordinator',
        displayName: 'Test Coordinator',
        description: 'Test role for coordination tasks',
        level: 5,
        category: 'coordinator',
        permissions: []
      };

      const response = await request(app)
        .post('/api/rbac/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(roleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(roleData.name);
      testRole = response.body.data;
    });

    test('District admin should not be able to create roles', async () => {
      const roleData = {
        name: 'unauthorized_role',
        displayName: 'Unauthorized Role',
        description: 'This should not be created',
        level: 5,
        category: 'staff'
      };

      await request(app)
        .post('/api/rbac/roles')
        .set('Authorization', `Bearer ${districtAdminToken}`)
        .send(roleData)
        .expect(403);
    });

    test('Should be able to get role by ID', async () => {
      if (!testRole) return;

      const response = await request(app)
        .get(`/api/rbac/roles/${testRole._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testRole._id);
    });

    test('Should be able to update custom role', async () => {
      if (!testRole) return;

      const updateData = {
        displayName: 'Updated Test Coordinator',
        description: 'Updated description for test role'
      };

      const response = await request(app)
        .put(`/api/rbac/roles/${testRole._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.displayName).toBe(updateData.displayName);
    });
  });

  describe('Permission Management', () => {
    test('Should be able to view permissions', async () => {
      const response = await request(app)
        .get('/api/rbac/permissions')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.permissions)).toBe(true);
      expect(response.body.data.permissions.length).toBeGreaterThan(0);
    });

    test('Should be able to filter permissions by module', async () => {
      const response = await request(app)
        .get('/api/rbac/permissions?module=users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.permissions.forEach(permission => {
        expect(permission.module).toBe('users');
      });
    });

    test('Should be able to get permission by ID', async () => {
      // First get a permission
      const permissionsResponse = await request(app)
        .get('/api/rbac/permissions')
        .set('Authorization', `Bearer ${superAdminToken}`);

      const permission = permissionsResponse.body.data.permissions[0];

      const response = await request(app)
        .get(`/api/rbac/permissions/${permission._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(permission._id);
    });
  });

  describe('User Role Assignment', () => {
    test('Super admin should be able to assign role to user', async () => {
      if (!testRole) return;

      const assignmentData = {
        roleId: testRole._id,
        reason: 'Test role assignment',
        isPrimary: false
      };

      const response = await request(app)
        .post(`/api/rbac/users/${districtAdmin._id}/roles`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(assignmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role.toString()).toBe(testRole._id);
    });

    test('Should be able to get user roles', async () => {
      const response = await request(app)
        .get(`/api/rbac/users/${districtAdmin._id}/roles`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('Should be able to get user permissions', async () => {
      const response = await request(app)
        .get(`/api/rbac/users/${stateAdmin._id}/permissions`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.permissions)).toBe(true);
    });

    test('User should be able to view own permissions', async () => {
      const response = await request(app)
        .get(`/api/rbac/users/${stateAdmin._id}/permissions`)
        .set('Authorization', `Bearer ${stateAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('User should not be able to view other user permissions without permission', async () => {
      await request(app)
        .get(`/api/rbac/users/${stateAdmin._id}/permissions`)
        .set('Authorization', `Bearer ${beneficiaryToken}`)
        .expect(403);
    });

    test('Should be able to check specific permission', async () => {
      const checkData = {
        permission: 'users.read.regional'
      };

      const response = await request(app)
        .post(`/api/rbac/users/${stateAdmin._id}/check-permission`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(checkData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.data.hasPermission).toBe('boolean');
    });
  });

  describe('RBAC Service', () => {
    test('Should correctly check user permissions', async () => {
      const hasPermission = await rbacService.hasPermission(
        stateAdmin._id,
        'users.read.regional'
      );
      expect(typeof hasPermission).toBe('boolean');
    });

    test('Should get user permissions', async () => {
      const permissions = await rbacService.getUserPermissions(stateAdmin._id);
      expect(Array.isArray(permissions)).toBe(true);
    });

    test('Should assign role correctly', async () => {
      if (!testRole) return;

      const userRole = await rbacService.assignRole(
        beneficiary._id,
        testRole._id,
        superAdmin._id,
        { reason: 'Test assignment' }
      );

      expect(userRole).toBeDefined();
      expect(userRole.user.toString()).toBe(beneficiary._id.toString());
      expect(userRole.role.toString()).toBe(testRole._id);
    });

    test('Should remove role correctly', async () => {
      if (!testRole) return;

      const result = await rbacService.removeRole(
        beneficiary._id,
        testRole._id,
        superAdmin._id,
        'Test removal'
      );

      expect(result).toBeDefined();
      expect(result.isActive).toBe(false);
    });
  });

  describe('System Management', () => {
    test('Should get RBAC statistics', async () => {
      const response = await request(app)
        .get('/api/rbac/stats')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.roles).toBeDefined();
      expect(response.body.data.permissions).toBeDefined();
      expect(response.body.data.assignments).toBeDefined();
    });

    test('Should cleanup expired assignments', async () => {
      const response = await request(app)
        .post('/api/rbac/cleanup')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.data.cleanedCount).toBe('number');
    });

    test('Non-admin should not be able to cleanup', async () => {
      await request(app)
        .post('/api/rbac/cleanup')
        .set('Authorization', `Bearer ${beneficiaryToken}`)
        .expect(403);
    });
  });

  describe('Permission Validation', () => {
    test('Should validate permission conditions', async () => {
      // Create a permission with time restrictions
      const permission = new Permission({
        name: 'test.time.restricted',
        displayName: 'Time Restricted Test',
        description: 'Test permission with time restrictions',
        module: 'test',
        category: 'read',
        resource: 'test',
        action: 'read',
        scope: 'own',
        conditions: {
          timeRestrictions: {
            allowedHours: { start: 9, end: 17 },
            allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
          }
        }
      });
      await permission.save();

      // Test during business hours
      const businessHourContext = {
        user: stateAdmin,
        timestamp: new Date('2023-10-10T10:00:00Z') // Tuesday 10 AM
      };

      const validation = permission.validateConditions(businessHourContext);
      expect(validation.valid).toBe(true);

      // Test outside business hours
      const afterHourContext = {
        user: stateAdmin,
        timestamp: new Date('2023-10-10T20:00:00Z') // Tuesday 8 PM
      };

      const afterHourValidation = permission.validateConditions(afterHourContext);
      expect(afterHourValidation.valid).toBe(false);

      await Permission.findByIdAndDelete(permission._id);
    });

    test('Should handle permission dependencies', async () => {
      // Create dependent permissions
      const basePermission = new Permission({
        name: 'test.base.permission',
        displayName: 'Base Test Permission',
        description: 'Base permission for testing',
        module: 'test',
        category: 'read',
        resource: 'test',
        action: 'read',
        scope: 'own'
      });
      await basePermission.save();

      const dependentPermission = new Permission({
        name: 'test.dependent.permission',
        displayName: 'Dependent Test Permission',
        description: 'Permission that depends on base permission',
        module: 'test',
        category: 'update',
        resource: 'test',
        action: 'update',
        scope: 'own',
        dependencies: {
          requires: [basePermission._id]
        }
      });
      await dependentPermission.save();

      // Test dependency validation
      expect(dependentPermission.dependencies.requires).toContain(basePermission._id);

      await Permission.findByIdAndDelete(basePermission._id);
      await Permission.findByIdAndDelete(dependentPermission._id);
    });
  });

  describe('Role Hierarchy', () => {
    test('Should respect role hierarchy in permissions', async () => {
      // Super admin should have more permissions than state admin
      const superAdminPermissions = await rbacService.getUserPermissions(superAdmin._id);
      const stateAdminPermissions = await rbacService.getUserPermissions(stateAdmin._id);

      expect(superAdminPermissions.length).toBeGreaterThanOrEqual(stateAdminPermissions.length);
    });

    test('Should get role hierarchy', async () => {
      const response = await request(app)
        .get('/api/rbac/roles/hierarchy')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.data).toBe('object');
    });
  });

  describe('Error Handling', () => {
    test('Should handle invalid role ID', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      
      await request(app)
        .get(`/api/rbac/roles/${invalidId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(404);
    });

    test('Should handle invalid permission ID', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      
      await request(app)
        .get(`/api/rbac/permissions/${invalidId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(404);
    });

    test('Should handle duplicate role assignment', async () => {
      if (!testRole) return;

      // First assignment should succeed
      await rbacService.assignRole(
        districtAdmin._id,
        testRole._id,
        superAdmin._id
      );

      // Second assignment should fail
      try {
        await rbacService.assignRole(
          districtAdmin._id,
          testRole._id,
          superAdmin._id
        );
        fail('Should have thrown an error for duplicate assignment');
      } catch (error) {
        expect(error.message).toContain('already has this role');
      }
    });
  });

  describe('Cleanup', () => {
    test('Should delete test role', async () => {
      if (!testRole) return;

      const response = await request(app)
        .delete(`/api/rbac/roles/${testRole._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});