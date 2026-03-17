const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, syncWithOnline, hasUnsyncedChanges } = require('./db'); // Importar la BD local y utilidades

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
    'sistema_urinario'
];

// Servir archivos estáticos
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/', express.static(path.join(__dirname)));
app.use('/templates', express.static(path.join(__dirname, 'templates')));
app.use('/local_images', express.static(path.join(__dirname, 'local_images')));
app.use('/upload_images', express.static(path.join(__dirname, 'upload_images')));

const cloudinary = require('cloudinary').v2;
const multer = require('multer');

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

// Configuración de almacenamiento local
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'upload_images'));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

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
        const imagenes = await db.allAsync(`SELECT id, url_imagen, descripcion_imagen FROM organos_imagenes WHERE id_svg = ? AND (url_imagen LIKE '/local_images/%' OR url_imagen LIKE '/upload_images/%')`, id);

        res.json({
            ...organo,
            imagenes: imagenes
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
        const user = await db.getAsync('SELECT * FROM users WHERE username = ?', username);
        if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

        const bcrypt = require('bcryptjs');
        const valid = bcrypt.compareSync(password, user.password_hash);
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
app.post('/api/admin/organo', requireAdmin, upload.single('archivo'), async (req, res) => {
    const { sistema, id_svg, nombre, descripcion } = req.body;

    if (!tablasPermitidas.includes(sistema)) {
        return res.status(400).json({ error: 'Sistema no válido' });
    }

    // Guardar siempre en /upload_images/
    const url_media = req.file ? `/upload_images/${req.file.filename}` : null;

    try {
        // 1. Actualizamos los datos del órgano (Nombre y descripción principal)
        const existing = await db.getAsync(`SELECT id FROM ${sistema} WHERE id_svg = ?`, id_svg);
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
                for (const row of importData[table]) {
                    const keys = Object.keys(row);
                    const values = Object.values(row);
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

// Exportar el app para que Electron lo use
module.exports = app;

// Solo escuchar si se ejecuta directamente (para desarrollo)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
        console.log(`Rutas disponibles: /api/sistema_digestivo/:id, /api/sistema_respiratorio/:id, etc.`);
    });
}