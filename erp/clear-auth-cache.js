// Run this in browser console to clear cached authentication data

console.log('🧹 Clearing authentication cache...');

// Clear localStorage
localStorage.removeItem('auth_token');
localStorage.removeItem('user');

// Clear sessionStorage
sessionStorage.clear();

// Clear any other auth-related items
Object.keys(localStorage).forEach(key => {
  if (key.includes('auth') || key.includes('user') || key.includes('token')) {
    localStorage.removeItem(key);
    console.log('Removed:', key);
  }
});

console.log('✅ Authentication cache cleared!');
console.log('🔄 Please refresh the page and login again with 9876543210');

// Optionally reload the page
// window.location.reload();