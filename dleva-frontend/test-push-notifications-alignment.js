#!/usr/bin/env node
/**
 * Push Notifications Frontend Alignment Tester
 * 
 * Verifies that Firebase push notifications are properly integrated on the frontend:
 * 1. Firebase environment variables configured
 * 2. Push notification services initialized for all roles
 * 3. Service worker properly registered
 * 4. FCM tokens are being registered with backend
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n' + '='.repeat(80));
console.log('FIREBASE PUSH NOTIFICATIONS - FRONTEND ALIGNMENT CHECK');
console.log('='.repeat(80) + '\n');

const results = {
  passed: [],
  failed: [],
  warnings: [],
};

// Check 1: Environment variables
console.log('📋 Checking Firebase environment variables...');
const envExamplePath = path.join(__dirname, '../.env.example');
if (fs.existsSync(envExamplePath)) {
  const envContent = fs.readFileSync(envExamplePath, 'utf-8');
  const firebaseVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_VAPID_KEY',
  ];
  
  firebaseVars.forEach(varName => {
    if (envContent.includes(varName)) {
      results.passed.push(`✅ ${varName} configured in .env.example`);
    } else {
      results.failed.push(`❌ ${varName} NOT found in .env.example`);
    }
  });
} else {
  results.failed.push('❌ .env.example file not found');
}

// Check 2: Push notification services
console.log('\n📋 Checking push notification services...');
const servicesPath = path.join(__dirname, '../src');

const pushServices = [
  { file: 'services/pushNotifications.js', name: 'Base Push Notifications Service' },
  { file: 'modules/buyer/services/buyerPushNotifications.js', name: 'Buyer Push Notifications' },
  { file: 'modules/seller/services/sellerPushNotifications.js', name: 'Seller Push Notifications' },
  { file: 'modules/rider/services/riderPushNotifications.js', name: 'Rider Push Notifications' },
];

pushServices.forEach(({ file, name }) => {
  const filePath = path.join(servicesPath, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes('createPushNotificationsService') || content.includes('firebaseConfig')) {
      results.passed.push(`✅ ${name} service implemented`);
    } else {
      results.warnings.push(`⚠️ ${name} exists but may not be fully implemented`);
    }
  } else {
    results.failed.push(`❌ ${name} service NOT found at ${file}`);
  }
});

// Check 3: Initialization hooks
console.log('\n📋 Checking initialization hooks...');
const hooks = [
  { file: 'modules/buyer/hooks/useBuyerPushNotifications.js', name: 'Buyer Push Notifications Hook' },
  { file: 'modules/seller/hooks/useSellerPushNotifications.js', name: 'Seller Push Notifications Hook' },
  { file: 'modules/rider/hooks/useRealtimeInitializer.js', name: 'Rider Push Notifications Hook' },
];

hooks.forEach(({ file, name }) => {
  const filePath = path.join(servicesPath, file);
  if (fs.existsSync(filePath)) {
    results.passed.push(`✅ ${name} implemented`);
  } else {
    results.failed.push(`❌ ${name} NOT found`);
  }
});

// Check 4: Layout components using hooks
console.log('\n📋 Checking layout components...');
const layouts = [
  { file: '../layouts/BuyerLayout.jsx', name: 'BuyerLayout', hook: 'useBuyerPushNotifications' },
  { file: '../layouts/SellerLayout.jsx', name: 'SellerLayout', hook: 'useSellerPushNotifications' },
  { file: '../modules/rider/layouts/RiderLayout.jsx', name: 'RiderLayout', hook: 'useRealtimeInitializer' },
];

layouts.forEach(({ file, name, hook }) => {
  const filePath = path.join(servicesPath, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes(hook)) {
      results.passed.push(`✅ ${name} uses ${hook}`);
    } else {
      results.failed.push(`❌ ${name} does NOT use ${hook}`);
    }
  } else {
    results.warnings.push(`⚠️ ${name} not found at ${file}`);
  }
});

// Check 5: Service worker configuration
console.log('\n📋 Checking service worker...');
const swPath = path.join(__dirname, '../public/sw.js');
if (fs.existsSync(swPath)) {
  const swContent = fs.readFileSync(swPath, 'utf-8');
  
  const checks = [
    { pattern: "self.addEventListener('push'", desc: 'Push event handler' },
    { pattern: "showNotification", desc: 'Show notification method' },
    { pattern: "self.addEventListener('notificationclick'", desc: 'Notification click handler' },
    { pattern: "clients.openWindow", desc: 'Window opening on click' },
  ];
  
  checks.forEach(({ pattern, desc }) => {
    if (swContent.includes(pattern)) {
      results.passed.push(`✅ Service worker has ${desc}`);
    } else {
      results.failed.push(`❌ Service worker missing ${desc}`);
    }
  });
} else {
  results.failed.push('❌ Service worker (sw.js) NOT found');
}

// Check 6: API endpoints configured
console.log('\n📋 Checking API endpoints...');
const apiConfigPath = path.join(servicesPath, 'constants/apiConfig.js');
if (fs.existsSync(apiConfigPath)) {
  const apiContent = fs.readFileSync(apiConfigPath, 'utf-8');
  
  const endpoints = [
    { pattern: 'PUSH_TOKEN', roles: ['BUYER', 'SELLER'] },
    { pattern: '/buyer/push-token/', roles: ['BUYER'] },
    { pattern: '/seller/update-fcm-token/', roles: ['SELLER'] },
    { pattern: 'REGISTER_FCM_TOKEN', roles: ['RIDER'] },
    { pattern: '/rider/fcm-token/register/', roles: ['RIDER'] },
  ];
  
  endpoints.forEach(({ pattern, roles }) => {
    if (apiContent.includes(pattern)) {
      results.passed.push(`✅ API endpoint configured: ${pattern} (${roles.join(', ')})`);
    } else {
      results.failed.push(`❌ API endpoint NOT configured: ${pattern}`);
    }
  });
} else {
  results.failed.push('❌ apiConfig.js NOT found');
}

// Print results
console.log('\n' + '='.repeat(80));
console.log('RESULTS SUMMARY');
console.log('='.repeat(80) + '\n');

console.log(`✅ PASSED (${results.passed.length}):`);
results.passed.forEach(item => console.log('  ' + item));

if (results.warnings.length > 0) {
  console.log(`\n⚠️ WARNINGS (${results.warnings.length}):`);
  results.warnings.forEach(item => console.log('  ' + item));
}

if (results.failed.length > 0) {
  console.log(`\n❌ FAILED (${results.failed.length}):`);
  results.failed.forEach(item => console.log('  ' + item));
}

console.log('\n' + '='.repeat(80));

// Final verdict
const totalTests = results.passed.length + results.failed.length + results.warnings.length;
const passRate = ((results.passed.length / totalTests) * 100).toFixed(1);

console.log(`\n📊 Overall Status: ${passRate}% (${results.passed.length}/${totalTests} checks passed)`);

if (results.failed.length === 0) {
  console.log('\n🎉 FRONTEND IS PROPERLY ALIGNED WITH FIREBASE PUSH NOTIFICATIONS!\n');
  console.log('✨ Next steps:');
  console.log('  1. Set Firebase environment variables in .env');
  console.log('  2. Install dependencies: npm install');
  console.log('  3. Test in development: npm run dev');
  console.log('  4. Check browser console for Firebase initialization logs');
  console.log('  5. Grant notification permissions when prompted');
  process.exit(0);
} else {
  console.log('\n⚠️ ISSUES FOUND - Please fix the failed checks above\n');
  process.exit(1);
}
