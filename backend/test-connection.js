// Simple test script to verify backend is working
const http = require('http');

const testEndpoint = (path, description) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`\n${description}:`);
        console.log(`  Status: ${res.statusCode}`);
        console.log(`  Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.error(`\n${description} - ERROR:`);
      console.error(`  ${error.message}`);
      reject(error);
    });

    req.end();
  });
};

async function runTests() {
  console.log('Testing backend connection...\n');
  
  try {
    await testEndpoint('/api', 'Health Check');
    await testEndpoint('/games/', 'Get All Games');
    await testEndpoint('/games/1', 'Get Game by ID');
  } catch (error) {
    console.error('\nConnection test failed. Make sure the backend server is running on port 5000.');
    process.exit(1);
  }
}

runTests();

