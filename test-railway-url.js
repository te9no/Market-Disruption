// Railway URL テストスクリプト
// Node.js で実行: node test-railway-url.js

const https = require('https');

const testUrls = [
  'https://web-production-8b6a.up.railway.app',
  'https://market-disruption-production.up.railway.app',
  // 他の可能性のあるURL
];

console.log('🔍 Testing Railway URLs...\n');

testUrls.forEach((url, index) => {
  console.log(`${index + 1}. Testing: ${url}`);
  
  const request = https.get(`${url}/health`, (res) => {
    console.log(`   ✅ Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log(`   📊 Response:`, json);
        console.log(`   🎯 This URL is working! Use: ${url}\n`);
      } catch (e) {
        console.log(`   📄 Response:`, data.substring(0, 100));
      }
    });
  });
  
  request.on('error', (error) => {
    console.log(`   ❌ Error: ${error.message}\n`);
  });
  
  request.setTimeout(5000, () => {
    console.log(`   ⏰ Timeout\n`);
    request.destroy();
  });
});

console.log('💡 Instructions:');
console.log('1. Check Railway Dashboard → Settings → Environment → Domains');
console.log('2. Use the working URL in Netlify environment variables');
console.log('3. URL format: https://[app-name]-[hash].up.railway.app');
console.log('4. NOT: *.railway.internal (internal only!)');