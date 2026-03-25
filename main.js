
const { app, BrowserWindow } = require('electron');
let server; // cargar una vez se hayan inicializado datos persistentes
const menuManager = require('./menu_manager');
const fs = require('fs');
const path = require('path');

const dbName = 'anatomia_local.db';
const userDataPath = app.getPath('userData');

// Destinos (donde la app leerá/escribirá siempre)
const userDbPath = path.join(userDataPath, dbName);
const userImagesPath = path.join(userDataPath, 'upload_images');

// Orígenes (donde el instalador dejó los archivos)
const rootPath = app.isPackaged 
  ? process.resourcesPath 
  : __dirname;

const srcDbPath = path.join(rootPath, 'assets', 'db', dbName);
const srcImagesPath = path.join(rootPath, 'assets', 'upload_images');

function initializePersistentData() {
  // Crear carpeta de imágenes si no existe
  if (!fs.existsSync(userImagesPath)) {
    fs.mkdirSync(userImagesPath, { recursive: true });
    // Opcional: Copiar imágenes iniciales si existen en src
    if (fs.existsSync(srcImagesPath)) {
      copyFolderSync(srcImagesPath, userImagesPath);
    }
  }

  // Copiar DB si no existe
  if (!fs.existsSync(userDbPath)) {
    if (fs.existsSync(srcDbPath)) {
      fs.copyFileSync(srcDbPath, userDbPath);
      console.log('DB copiada a:', userDbPath);
    }
  }
}

// Función auxiliar para copiar carpetas
function copyFolderSync(from, to) {
  fs.readdirSync(from).forEach(element => {
    const stat = fs.lstatSync(path.join(from, element));
    if (stat.isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    }
  });
}

let mainWindow;
let serverInstance;

function createMenu() {
  // ahora delegamos al menu_manager para crear el menú nativo
  menuManager.buildMenu(false);
}

function initializeApp() {
  initializePersistentData();
  server = require('./server'); // ahora que DB ya está asegurada en userData
  createMenu();
  createWindow();
}

app.whenReady().then(initializeApp);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'static', 'logo.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true, // Habilitar devtools
    },
  });
  mainWindow.maximize();

  // inicializar menú nativo con referencia a la ventana
  menuManager.init(mainWindow);

  // Pasar la ruta de usuario de Electron al backend
  if (server.setUserDataPath) {
    server.setUserDataPath(app.getPath('userData'));
  }

  // Iniciar el servidor Express en un puerto libre y cargar la URL cuando esté listo
  serverInstance = server.listen(0, () => {
    const port = serverInstance.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log('Servidor iniciado en Electron en', baseUrl);
    try { menuManager.setBaseUrl(baseUrl); } catch (e) {}
    mainWindow.loadURL(`${baseUrl}/login.html`);
  });

  serverInstance.on('error', (err) => {
    console.error('Error iniciando servidor:', err);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (serverInstance) {
      serverInstance.close();
    }
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});