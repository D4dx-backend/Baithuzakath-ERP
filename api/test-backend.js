#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:5001';
let authToken = '';

async function testBackend() {
  console.log('🚀 Testing Baithuzzakath Backend API\n');

  try {
    // 1. Health Check
    console.log('1️⃣ Testing Health Check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', health.data.message);
    console.log('   Environment:', health.data.environment);
    console.log('   Version:', health.data.version);
    console.log();

    // 2. Request OTP
    console.log('2️⃣ Testing OTP Request...');
    const otpRequest = await axios.post(`${BASE_URL}/api/auth/request-otp`, {
      phone: '9876543210',
      purpose: 'login'
    });
    console.log('✅ OTP Request:', otpRequest.data.message);
    console.log('   Expires At:', otpRequest.data.data.expiresAt);
    console.log('   Attempts Remaining:', otpRequest.data.data.attemptsRemaining);
    console.log();

    // 3. Verify OTP and Login
    console.log('3️⃣ Testing OTP Verification & Login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
      phone: '9876543210',
      otp: '123456',
      purpose: 'login'
    });
    
    authToken = loginResponse.data.data.accessToken;
    const user = loginResponse.data.data.user;
    
    console.log('✅ Login Successful!');
    console.log('   User:', user.name);
    console.log('   Role:', user.role);
    console.log('   Email:', user.email);
    console.log('   Admin Level:', user.adminScope.level);
    console.log();

    // 4. Test Authenticated Endpoint
    console.log('4️⃣ Testing Authenticated Endpoint...');
    const profileResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Profile Retrieved:', profileResponse.data.data.user.name);
    console.log('   Verified:', profileResponse.data.data.user.isVerified);
    console.log('   Active:', profileResponse.data.data.user.isActive);
    console.log();

    // 5. Test User Management
    console.log('5️⃣ Testing User Management...');
    const usersResponse = await axios.get(`${BASE_URL}/api/users?limit=3`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Users Retrieved:', usersResponse.data.data.users.length);
    console.log('   Total Users:', usersResponse.data.data.pagination.total);
    console.log('   Sample Users:');
    usersResponse.data.data.users.forEach((user, index) => {
      console.log(`     ${index + 1}. ${user.name} (${user.role})`);
    });
    console.log();

    // 6. Test Permissions
    console.log('6️⃣ Testing User Permissions...');
    const permissionsResponse = await axios.get(`${BASE_URL}/api/auth/permissions`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Permissions Retrieved');
    const permissions = permissionsResponse.data.data.permissions || {};
    console.log('   Role:', permissionsResponse.data.data.role);
    console.log('   Can Manage Users:', permissions.users?.includes('create'));
    console.log('   Can View Reports:', permissions.reports?.includes('read'));
    console.log();

    console.log('🎉 All Backend Tests Passed Successfully!');
    console.log('\n📋 Backend Summary:');
    console.log('   ✅ Authentication System Working');
    console.log('   ✅ OTP System Working (Test Mode)');
    console.log('   ✅ User Management Working');
    console.log('   ✅ Authorization Working');
    console.log('   ✅ Database Connected');
    console.log('   ✅ API Endpoints Functional');
    
    console.log('\n🔑 Test Credentials:');
    console.log('   Phone: 9876543210');
    console.log('   OTP: 123456 (Test Mode)');
    console.log('   Role: State Administrator');

  } catch (error) {
    console.error('❌ Test Failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run tests
testBackend();