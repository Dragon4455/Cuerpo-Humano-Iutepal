const http = require('http');

const url = 'http://localhost:3000/upload_images/1774107596911-esofago.png';

http.get(url, (res) => {
  console.log('statusCode', res.statusCode);
  console.log('headers', res.headers['content-type']);
  res.resume();
}).on('error', (err) => {
  console.error('error', err.message);
});
