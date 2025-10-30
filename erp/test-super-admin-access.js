/**
 * Test script to verify super admin can access projects and schemes
 * Run this after logging in as super admin
 */

const axios = require('axios');

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

// Get token from command line argument
const token = process.argv[2];

if (!token) {
  console.error('❌ Please provide JWT token as argument');
  console.log('Usage: node test-super-admin-access.js <JWT_TOKEN>');
  process.exit(1);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

async function testSuperAdminAccess() {
  console.log('🔍 Testing Super Admin Access to Projects and Schemes\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Get all projects
    console.log('\n📋 Test 1: Fetching all projects...');
    const projectsResponse = await api.get('/projects');
    
    if (projectsResponse.data.success) {
      const projectCount = projectsResponse.data.data.projects.length;
      const totalProjects = projectsResponse.data.data.pagination.total;
      
      console.log(`✅ SUCCESS: Retrieved ${projectCount} projects (Total: ${totalProjects})`);
      
      if (projectCount > 0) {
        console.log('\n   Sample Project:');
        const sample = projectsResponse.data.data.projects[0];
        console.log(`   - Name: ${sample.name}`);
        console.log(`   - Code: ${sample.code}`);
        console.log(`   - Status: ${sample.status}`);
        console.log(`   - Category: ${sample.category}`);
      } else {
        console.log('⚠️  No projects found in database');
      }
    } else {
      console.log('❌ FAILED: API returned success=false');
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error.response?.data?.message || error.message}`);
  }

  try {
    // Test 2: Get all schemes
    console.log('\n📋 Test 2: Fetching all schemes...');
    const schemesResponse = await api.get('/schemes');
    
    if (schemesResponse.data.success) {
      const schemeCount = schemesResponse.data.data.schemes.length;
      const totalSchemes = schemesResponse.data.data.pagination.total;
      
      console.log(`✅ SUCCESS: Retrieved ${schemeCount} schemes (Total: ${totalSchemes})`);
      
      if (schemeCount > 0) {
        console.log('\n   Sample Scheme:');
        const sample = schemesResponse.data.data.schemes[0];
        console.log(`   - Name: ${sample.name}`);
        console.log(`   - Code: ${sample.code}`);
        console.log(`   - Status: ${sample.status}`);
        console.log(`   - Category: ${sample.category}`);
      } else {
        console.log('⚠️  No schemes found in database');
      }
    } else {
      console.log('❌ FAILED: API returned success=false');
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error.response?.data?.message || error.message}`);
  }

  try {
    // Test 3: Get project statistics
    console.log('\n📊 Test 3: Fetching project statistics...');
    const statsResponse = await api.get('/projects/stats');
    
    if (statsResponse.data.success) {
      const stats = statsResponse.data.data.overview;
      console.log('✅ SUCCESS: Retrieved project statistics');
      console.log(`   - Total Projects: ${stats.totalProjects || 0}`);
      console.log(`   - Active Projects: ${stats.activeProjects || 0}`);
      console.log(`   - Total Budget: ₹${((stats.totalBudget || 0) / 100000).toFixed(1)}L`);
    } else {
      console.log('❌ FAILED: API returned success=false');
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error.response?.data?.message || error.message}`);
  }

  try {
    // Test 4: Get scheme statistics
    console.log('\n📊 Test 4: Fetching scheme statistics...');
    const statsResponse = await api.get('/schemes/stats');
    
    if (statsResponse.data.success) {
      const stats = statsResponse.data.data.overview;
      console.log('✅ SUCCESS: Retrieved scheme statistics');
      console.log(`   - Total Schemes: ${stats.totalSchemes || 0}`);
      console.log(`   - Active Schemes: ${stats.activeSchemes || 0}`);
      console.log(`   - Total Budget: ₹${((stats.totalBudget || 0) / 100000).toFixed(1)}L`);
    } else {
      console.log('❌ FAILED: API returned success=false');
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error.response?.data?.message || error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Testing Complete!\n');
}

// Run tests
testSuperAdminAccess().catch(error => {
  console.error('\n❌ Unexpected error:', error.message);
  process.exit(1);
});
