const axios = require('axios');

async function testAPI() {
  try {
    // Test health endpoint
    const health = await axios.get('https://api.growwithpraxis.com/health');
    console.log('✅ Health check:', health.data);
    
    // Test periods endpoint (should fail with 401)
    try {
      await axios.get('https://api.growwithpraxis.com/api/periods');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Auth middleware working (got expected 401)');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testAPI();
