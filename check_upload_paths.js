const path = require('path');
const fs = require('fs');

// path relative this project
const projectPath = path.resolve(__dirname, 'upload_images', '1774107596911-esofago.png');
console.log('projectPath', projectPath, fs.existsSync(projectPath));

// userData path likely from electron
const os = require('os');
const userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'YourAppName', 'upload_images', '1774107596911-esofago.png');
console.log('userDataPath', userDataPath, fs.existsSync(userDataPath));
