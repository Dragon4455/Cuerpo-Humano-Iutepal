const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/upload_images/esofago.png',
  method: 'HEAD'
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
});

req.end();