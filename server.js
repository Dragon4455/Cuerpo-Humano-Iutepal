const express = require('express');
const os = require('os');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const { db, syncWithOnline, hasUnsyncedChanges } = require('./db'); // Importar la BD local y utilidades

// Permitir que main.js pase la ruta de usuario
let userDataPath = null;
function setUserDataPath(p) { userDataPath = p; }

const app = express();
app.use(cors());
app.use(express.json());

// Tablas que representan los sistemas anatómicos (coinciden con archivos SVG en /assets)
const tablasPermitidas = [
    'sistema_digestivo',
    'sistema_respiratorio',
    'sistema_oseo',
    'sistema_tegumentario',
    'sistema_circulatorio',
    'sistema_endocrino',
    'sistema_linfatico',
    'sistema_muscular',
    'sistema_reproductivo',
    'sistema_urinario',
    'sistema_nervioso',
    'sistema_nerviosocentral'
];

// Helper para obtener ruta real de uploads y asegurar que existe
function getUploadsDir() {
    const dir = userDataPath ? path.join(userDataPath, 'upload_images') : path.join(__dirname, 'upload_images');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

function ensureUploadSync() {
    const mainDir = getUploadsDir();
    const fallbackDir = path.join(__dirname, 'upload_images');
    if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true });
    }

    // copiar sin sobrescribir
    for (const f of fs.readdirSync(fallbackDir)) {
        const src = path.join(fallbackDir, f);
        const dest = path.join(mainDir, f);
        if (fs.statSync(src).isFile() && !fs.existsSync(dest)) {
            fs.copyFileSync(src, dest);
        }
    }
    for (const f of fs.readdirSync(mainDir)) {
        const src = path.join(mainDir, f);
        const dest = path.join(fallbackDir, f);
        if (fs.statSync(src).isFile() && !fs.existsSync(dest)) {
            fs.copyFileSync(src, dest);
        }
    }
}

// Inicializar sincronización una vez
ensureUploadSync();

// Servir archivos estáticos
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/', express.static(path.join(__dirname)));
app.use('/templates', express.static(path.join(__dirname, 'templates')));
app.use('/local_images', express.static(path.join(__dirname, 'local_images')));
app.use('/upload_images', (req, res) => {
    try {
        const rawPath = req.path.replace(/^\/+/, '');
        const decodedPath = decodeURIComponent(rawPath);
        if (!decodedPath) return res.status(400).send('Archivo no especificado');

        const cleanName = decodedPath.includes('-') ? decodedPath.split('-').slice(1).join('-') : decodedPath;

        const dirUserData = getUploadsDir();
        const dirProyecto = path.join(__dirname, 'upload_images');

        const posiblesRutas = [
            path.join(dirUserData, decodedPath),
            path.join(dirProyecto, decodedPath),
            path.join(dirUserData, cleanName),
            path.join(dirProyecto, cleanName)
        ];

        console.log(`\n🔍 Buscando imagen: ${decodedPath} (clean: ${cleanName})`);
        posiblesRutas.forEach((p, i) => console.log(` -> Intento ${i + 1}: ${p}`));

        for (const p of posiblesRutas) {
            if (fs.existsSync(p)) {
                console.log(`✅ ¡Encontrada en: ${p}`);
                return res.sendFile(p);
            }
        }

        console.log(`❌ FRACASO: La imagen no existe físicamente en ninguna de las rutas posibles.`);
        return res.status(404).send('Not found');
    } catch (err) {
        console.error('Error en /upload_images:', err);
        return res.status(500).send('Server error');
    }
});


const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const archiver = require('archiver');
const unzipper = require('unzipper');

// Configura tus credenciales (Obtenlas en el dashboard de Cloudinary)
cloudinary.config({
  cloud_name: 'dbdeldijt',
  api_key: '131155335887578',
  api_secret: 'eAuuf8tu6QfUZu6nIlAej0aqI2Q'
});

// Helper para proteger rutas de administrador
function requireAdmin(req, res, next) {
    const role = req.headers['x-role'];
    if (role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado: se requiere rol de administrador' });
    }
    next();
}

// Menu manager: permite al servidor notificar al proceso principal si hay admin
try{
    const menuManager = require('./menu_manager');
    app.post('/api/menu/set-role', async (req, res) => {
        const { role } = req.body || {};
        menuManager.setAdminMode(role === 'admin');
        menuManager.setSecretMode(false); // reset secret each time role changes
        res.json({ success: true });
    });

    app.post('/api/menu/set-secret', async (req, res) => {
        const { enabled } = req.body || {};
        menuManager.setSecretMode(!!enabled);
        res.json({ success: true });
    });
}catch(e){ console.warn('menu_manager not available in server context'); }

// Configuración de almacenamiento local
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, getUploadsDir());
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

// Validación de tipos permitidos: jpg, jpeg, png, gif, mp4, svg, webp, jfif
const allowedExt = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.svg', '.webp', '.jfif'];
const allowedMime = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'image/svg+xml', 'image/webp', 'image/jpg'];

function fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExt.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Formato no válido'), false);
    }
}

const upload = multer({ storage: storage, fileFilter });

// Multer para recibir backups (zip)
const backupStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, getUploadsDir()),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const uploadBackup = multer({ storage: backupStorage });

// Endpoint Dinámico: /api/:sistema/:id
// Ejemplo: /api/sistema_oseo/femur_01
app.get('/api/:sistema/:id', async (req, res) => {
    const { sistema, id } = req.params;
    if (!tablasPermitidas.includes(sistema)) {
        return res.status(400).json({ error: 'Sistema no válido' });
    }

    try {
        // 1. Obtener datos básicos del órgano
        const organo = await db.getAsync(`SELECT nombre, descripcion FROM ${sistema} WHERE id_svg = ?`, id);

        // Si no existe en la tabla aún, devolvemos algo por defecto para que el frontend no rompa.
        const organoData = organo || { id_svg: id, nombre: id, descripcion: '' };

        // 2. Obtener solo imágenes locales (no Cloudinary)
        let imagenes = await db.allAsync(`SELECT id, url_imagen, descripcion_imagen FROM organos_imagenes WHERE id_svg = ? AND (url_imagen LIKE '/local_images/%' OR url_imagen LIKE '/upload_images/%')`, id);

        // 3. Resolver imagenes en el FS (local o fallback)
        const resolveImage = (url) => {
            if (!url) return null;

            // Normalizar las barras y quitar slash inicial
            const cleanUrl = url.replace(/\\/g, '/');
            const strip = cleanUrl.replace(/^\//, ''); // 'upload_images/foo.png'
            const rel = strip.replace(/^upload_images\//, '').replace(/^local_images\//, '');

            // Decodificar %20, etc.
            let decodedRel = rel;
            try { decodedRel = decodeURIComponent(rel); } catch (e) {
                // si no se puede decodificar, usar la ruta original
            }

            const p1 = path.join(getUploadsDir(), decodedRel);
            const p2 = path.join(__dirname, 'upload_images', decodedRel);
            const pLocal = path.join(__dirname, 'local_images', decodedRel);

            if (fs.existsSync(p1)) return `/upload_images/${encodeURI(decodedRel)}`;
            if (fs.existsSync(p2)) return `/upload_images/${encodeURI(decodedRel)}`;
            if (fs.existsSync(pLocal)) return `/local_images/${encodeURI(decodedRel)}`;

            // Reintentar con nombre sin timestamp-style prefix ('1234-foo.jpg' -> 'foo.jpg')
            const cleanRel = decodedRel.includes('-') ? decodedRel.split('-').slice(1).join('-') : decodedRel;
            if (cleanRel !== decodedRel) {
                const p1c = path.join(getUploadsDir(), cleanRel);
                const p2c = path.join(__dirname, 'upload_images', cleanRel);
                const pLocalc = path.join(__dirname, 'local_images', cleanRel);

                if (fs.existsSync(p1c)) return `/upload_images/${encodeURI(cleanRel)}`;
                if (fs.existsSync(p2c)) return `/upload_images/${encodeURI(cleanRel)}`;
                if (fs.existsSync(pLocalc)) return `/local_images/${encodeURI(cleanRel)}`;
            }

            // Evitar devolver null, para que el frontend pueda intentar renderizar la URL y gestionar el placeholder.
            const fallbackUrl = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
            return fallbackUrl;
        };

        const imagenesExisten = [];
        for (const img of imagenes) {
            const resolvedUrl = resolveImage(img.url_imagen);
            if (resolvedUrl) {
                imagenesExisten.push({ ...img, url_imagen: resolvedUrl });
            }
        }

        res.json({
            ...organoData,
            imagenes: imagenesExisten
        });


    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Autenticación (login)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });

    try {
        console.log('Login attempt for user:', username);
        const user = await db.getAsync('SELECT * FROM users WHERE username = ?', [username]);
        console.log('User record:', !!user);
        if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

        const bcrypt = require('bcryptjs');
        const valid = bcrypt.compareSync(password, user.password_hash);
        console.log('Password valid:', valid);
        if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

        res.json({ success: true, username: user.username, role: user.role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/is-online', async (req, res) => {
    try {
        const online = await require('is-online')();
        res.json({ online });
    } catch (err) {
        res.json({ online: false });
    }
});

app.get('/api/has-local-changes', async (req, res) => {
    try {
        const hasChanges = await hasUnsyncedChanges();
        res.json({ hasChanges });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Crear o actualizar un órgano y su imagen
app.post('/api/admin/organo', requireAdmin, async (req, res) => {
    // Usamos multer manualmente para interceptar errores de tipo de archivo
    upload.single('archivo')(req, res, async function (err) {
        if (err) {
            console.error("Error de Multer/Sistema:", err);
            return res.status(400).json({ error: err.message || 'Error al guardar el archivo' });
        }

        const { sistema, id_svg, nombre, descripcion } = req.body;

        if (!tablasPermitidas.includes(sistema)) {
            return res.status(400).json({ error: 'Sistema no válido' });
        }

        // Guardar siempre en /upload_images/
        const url_media = req.file ? `/upload_images/${req.file.filename}` : null;

        try {
            // 1. Actualizamos los datos del órgano (Nombre y descripción principal)
            // Usar id_svg como clave primaria para sistema_nerviosocentral
            let existing;
            if (sistema === 'sistema_nerviosocentral') {
                existing = await db.getAsync(`SELECT id_svg FROM sistema_nerviosocentral WHERE id_svg = ?`, id_svg);
            } else {
                existing = await db.getAsync(`SELECT id FROM ${sistema} WHERE id_svg = ?`, id_svg);
            }
            if (existing) {
                await db.runAsync(`UPDATE ${sistema} SET nombre = ?, descripcion = ? WHERE id_svg = ?`, nombre, descripcion, id_svg);
                // Registrar cambio para sync
                await db.runAsync(`INSERT INTO sync_changes (table_name, operation, data) VALUES (?, 'UPDATE', ?)`, sistema, JSON.stringify({ id_svg, nombre, descripcion }));
            } else {
                await db.runAsync(`INSERT INTO ${sistema} (id_svg, nombre, descripcion) VALUES (?, ?, ?)`, id_svg, nombre, descripcion);
                // Registrar cambio
                await db.runAsync(`INSERT INTO sync_changes (table_name, operation, data) VALUES (?, 'INSERT', ?)`, sistema, JSON.stringify({ id_svg, nombre, descripcion }));
            }

            // 2. Si hay un archivo nuevo, lo AGREGAMOS a la tabla de imágenes
            if (url_media) {
                await db.runAsync(`INSERT INTO organos_imagenes (id_svg, url_imagen, descripcion_imagen) VALUES (?, ?, ?)`, id_svg, url_media, `Galería de ${nombre}`);
                // Registrar cambio
                await db.runAsync(`INSERT INTO sync_changes (table_name, operation, data) VALUES ('organos_imagenes', 'INSERT', ?)`, JSON.stringify({ id_svg, url_imagen: url_media, descripcion_imagen: `Galería de ${nombre}` }));
            }

            res.json({ success: true, message: "Contenido actualizado y multimedia añadida" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Error al procesar la solicitud" });
        }
    });
});

// Endpoint para eliminar una imagen/video específico
app.delete('/api/eliminar-recurso/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        // Buscar la URL de la imagen antes de borrar
        const img = await db.getAsync('SELECT url_imagen FROM organos_imagenes WHERE id = ?', id);
        const result = await db.runAsync('DELETE FROM organos_imagenes WHERE id = ?', id);
        const changes = result && typeof result.changes === 'number' ? result.changes : 0;

        if (changes > 0) {
            // Si es local, borrar el archivo físico
            if (img && (img.url_imagen.startsWith('/local_images/') || img.url_imagen.startsWith('/upload_images/'))) {
                const fs = require('fs');
                const filePath = path.join(__dirname, img.url_imagen);
                fs.access(filePath, fs.constants.F_OK, (err) => {
                    if (!err) {
                        fs.unlink(filePath, (errUnlink) => {
                            if (errUnlink) {
                                console.error('No se pudo borrar el archivo físico:', filePath, errUnlink);
                            }
                        });
                    } else {
                        console.warn('Archivo físico no encontrado para borrar:', filePath);
                    }
                });
            }
            // Registrar cambio
            await db.runAsync(`INSERT INTO sync_changes (table_name, operation, data) VALUES ('organos_imagenes', 'DELETE', ?)`, JSON.stringify({ id }));
            res.status(200).json({ success: true, message: "Imagen eliminada" });
        } else {
            res.status(404).json({ success: false, error: "No se encontró el archivo" });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Endpoint para exportar la BD local a JSON
app.get('/api/export-db', requireAdmin, async (req, res) => {
    try {
        const tables = [
            'sistema_digestivo',
            'sistema_respiratorio',
            'sistema_oseo',
            'sistema_tegumentario',
            'sistema_circulatorio',
            'sistema_endocrino',
            'sistema_linfatico',
            'sistema_muscular',
            'sistema_reproductivo',
            'sistema_urinario',
            'organos_imagenes',
            'sync_changes'
        ];
        const exportData = {};

        for (const table of tables) {
            const rows = await db.allAsync(`SELECT * FROM ${table}`);
            exportData[table] = rows;
        }

        res.json(exportData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para importar BD desde JSON
app.post('/api/import-db', requireAdmin, express.json({ limit: '50mb' }), async (req, res) => {
    const importData = req.body;

    try {
        const tables = [
            'sistema_digestivo',
            'sistema_respiratorio',
            'sistema_oseo',
            'sistema_tegumentario',
            'sistema_circulatorio',
            'sistema_endocrino',
            'sistema_linfatico',
            'sistema_muscular',
            'sistema_reproductivo',
            'sistema_urinario',
            'organos_imagenes',
            'sync_changes'
        ];

        for (const table of tables) {
            if (importData[table]) {
                await db.runAsync(`DELETE FROM ${table}`);

                const tableColumnsInfo = await db.allAsync(`PRAGMA table_info(${table})`);
                const tableColumns = tableColumnsInfo.map(col => col.name);

                for (const row of importData[table]) {
                    const keys = Object.keys(row).filter(k => tableColumns.includes(k));
                    if (keys.length === 0) continue;

                    const values = keys.map(k => row[k]);
                    const placeholders = keys.map(() => '?').join(', ');
                    await db.runAsync(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`, values);
                }
            }
        }

        res.json({ success: true, message: 'BD importada correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para exportar BD y archivos locales a ZIP
app.get('/api/export-db-zip', requireAdmin, async (req, res) => {
    try {
        const tables = [
            'sistema_digestivo',
            'sistema_respiratorio',
            'sistema_oseo',
            'sistema_tegumentario',
            'sistema_circulatorio',
            'sistema_endocrino',
            'sistema_linfatico',
            'sistema_muscular',
            'sistema_reproductivo',
            'sistema_urinario',
            'organos_imagenes',
            'sync_changes'
        ];

        const exportData = {};
        for (const table of tables) {
            const rows = await db.allAsync(`SELECT * FROM ${table}`);
            exportData[table] = rows;
        }

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="backup.zip"');

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => { throw err; });
        archive.pipe(res);

        // Añadir JSON
        archive.append(JSON.stringify(exportData, null, 2), { name: 'backup.json' });

        // Añadir toda la carpeta upload_images al ZIP (mantener estructura)
        const uploadDir = path.join(__dirname, 'upload_images');
        if (require('fs').existsSync(uploadDir)) {
            archive.directory(uploadDir, 'upload_images');
        }

        await archive.finalize();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para importar BD y archivos desde ZIP
app.post('/api/import-db-zip', requireAdmin, uploadBackup.single('backup'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Archivo de backup no enviado' });

    const tmpPath = req.file.path;
    try {
        const directory = await unzipper.Open.file(tmpPath);
        const backupEntry = directory.files.find(f => f.path === 'backup.json');
        if (!backupEntry) return res.status(400).json({ error: 'backup.json no encontrado en el ZIP' });

        const content = await backupEntry.buffer();
        const importData = JSON.parse(content.toString('utf8'));

        const tables = [
            'sistema_digestivo',
            'sistema_respiratorio',
            'sistema_oseo',
            'sistema_tegumentario',
            'sistema_circulatorio',
            'sistema_endocrino',
            'sistema_linfatico',
            'sistema_muscular',
            'sistema_reproductivo',
            'sistema_urinario',
            'sistema_nervioso',
            'sistema_nerviosocentral',
            'organos_imagenes',
            'sync_changes'
        ];

        // Limpiar tablas y reinsertar
        for (const table of tables) {
            if (importData[table]) {
                await db.runAsync(`DELETE FROM ${table}`);
                for (const row of importData[table]) {
                    const keys = Object.keys(row);
                    const values = Object.values(row);
                    const placeholders = keys.map(() => '?').join(', ');
                    await db.runAsync(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`, values);
                }
            }
        }

        // Eliminar todo el contenido actual de upload_images
        const uploadDir = path.join(__dirname, 'upload_images');
        if (require('fs').existsSync(uploadDir)) {
            for (const f of require('fs').readdirSync(uploadDir)) {
                const fp = path.join(uploadDir, f);
                if (require('fs').statSync(fp).isFile()) require('fs').unlinkSync(fp);
            }
        } else {
            require('fs').mkdirSync(uploadDir, { recursive: true });
        }
        // Extraer todos los archivos de upload_images/ del ZIP
        const filesInZip = directory.files.filter(f => f.path.startsWith('upload_images/'));
        for (const f of filesInZip) {
            const rel = f.path.replace(/^upload_images[\/]/, '');
            if (!rel) continue;
            const destPath = path.join(uploadDir, rel);
            const writeStream = require('fs').createWriteStream(destPath);
            await new Promise((resolve, reject) => {
                f.stream().pipe(writeStream).on('finish', resolve).on('error', reject);
            });
        }

        // Borrar archivo temporal
        require('fs').unlink(tmpPath, () => {});

        res.json({ success: true, message: 'Importación desde ZIP completada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para cambiar credenciales de usuario (admin)
app.post('/api/admin/change-credentials', requireAdmin, async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
        const bcrypt = require('bcryptjs');
        const hash = bcrypt.hashSync(password, 10);
        await db.runAsync(`UPDATE users SET password_hash = ? WHERE username = ?`, hash, username);
        res.json({ success: true, message: 'Credenciales actualizadas' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para detectar y reportar imágenes locales en upload_images
app.post('/api/admin/scan-upload-images', requireAdmin, async (req, res) => {
    try {
        const uploads = getUploadsDir();
        const files = fs.existsSync(uploads) ? fs.readdirSync(uploads).filter(f => fs.statSync(path.join(uploads, f)).isFile()) : [];
        const dbRows = await db.allAsync("SELECT id, id_svg, url_imagen FROM organos_imagenes WHERE url_imagen LIKE '/upload_images/%'");
        const dbUrls = new Set(dbRows.map(r => r.url_imagen));

        let notRegistered = [];
        for (const file of files) {
            const url = `/upload_images/${encodeURIComponent(file)}`;
            if (!dbUrls.has(url)) {
                notRegistered.push(file);
            }
        }

        const missingFromFS = [];
        const allPossibleFileNames = new Set(files.map(f => f));
        for (const row of dbRows) {
            const asFile = decodeURIComponent(row.url_imagen.replace('/upload_images/', ''));
            if (!allPossibleFileNames.has(asFile)) {
                missingFromFS.push(row.url_imagen);
            }
        }

        res.json({ success: true, notRegistered, missingFromFS });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para sincronizar manualmente desde online
app.post('/api/sync-from-online', async (req, res) => {
    try {
        const { syncWithOnline } = require('./db');
        await syncWithOnline();
        res.json({ success: true, message: 'Sincronización completada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para descargar imágenes de online y hacerlas locales
app.post('/api/download-images-local', async (req, res) => {
    try {
        const axios = require('axios');
        const fs = require('fs');
        const path = require('path');

        const images = await db.allAsync(`SELECT * FROM organos_imagenes WHERE url_imagen NOT LIKE '/local_images/%'`);
        for (const img of images) {
            if (img.url_imagen.startsWith('http')) {
                const response = await axios.get(img.url_imagen, { responseType: 'stream' });
                const filename = `${Date.now()}-${img.id}.jpg`; // Asumir jpg, ajustar si necesario
                const localPath = path.join(__dirname, 'upload_images', filename);
                const writer = fs.createWriteStream(localPath);
                response.data.pipe(writer);
                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
                const localUrl = `/upload_images/${filename}`;
                await db.runAsync(`UPDATE organos_imagenes SET url_imagen = ? WHERE id = ?`, localUrl, img.id);
            }
        }

        res.json({ success: true, message: 'Imágenes descargadas y convertidas a locales' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;

// Exportar el app y la función para setear la ruta de usuario
module.exports = app;
module.exports.setUserDataPath = setUserDataPath;

// Solo escuchar si se ejecuta directamente (para desarrollo)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
        console.log(`Rutas disponibles: /api/sistema_digestivo/:id, /api/sistema_respiratorio/:id, etc.`);
    });
}