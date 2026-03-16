const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const isOnline = require('is-online');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const cloudinary = require('cloudinary').v2;

// Configurar Cloudinary
cloudinary.config({
  cloud_name: 'dbdeldijt',
  api_key: '131155335887578',
  api_secret: 'eAuuf8tu6QfUZu6nIlAej0aqI2Q'
});

// Conexión a SQLite local
const dbPath = path.join(__dirname, 'anatomia_local.db');
const db = new sqlite3.Database(dbPath);

// Promisificar métodos
db.runAsync = promisify(db.run.bind(db));
db.getAsync = promisify(db.get.bind(db));
db.allAsync = promisify(db.all.bind(db));

// Configuración de MySQL online
const mysqlConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'anatomia_db'
};

// Crear tablas si no existen
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS sistema_digestivo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_svg TEXT UNIQUE,
            nombre TEXT,
            descripcion TEXT,
            fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS sistema_respiratorio (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_svg TEXT UNIQUE,
            nombre TEXT,
            descripcion TEXT,
            fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS sistema_oseo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_svg TEXT UNIQUE,
            nombre TEXT,
            descripcion TEXT,
            fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS sistema_tegumentario (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_svg TEXT UNIQUE,
            nombre TEXT,
            descripcion TEXT,
            fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS organos_imagenes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_svg TEXT,
            url_imagen TEXT,
            descripcion_imagen TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS sync_changes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name TEXT,
            operation TEXT,
            data TEXT,
            synced INTEGER DEFAULT 0
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password_hash TEXT,
            role TEXT
        )
    `);

    // Crear un usuario administrador por defecto si no existe
    const adminExists = db.prepare(`SELECT id FROM users WHERE username = ?`).get('admin');
    if (!adminExists) {
        const hash = bcrypt.hashSync('123', 10);
        db.prepare(`INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)`)
          .run('admin', hash, 'admin');
    }
});

// Función para sincronizar con MySQL cuando esté online
async function syncWithOnline() {
    const online = await isOnline();
    if (!online) return;

    try {
        const connection = await mysql.createConnection(mysqlConfig);

        // Subir imágenes locales a Cloudinary y actualizar URLs
        const localImages = await db.allAsync(`SELECT * FROM organos_imagenes WHERE url_imagen LIKE '/upload_images/%'`);
        for (const img of localImages) {
            const localPath = path.join(__dirname, img.url_imagen.replace('/upload_images/', 'upload_images/'));
            if (fs.existsSync(localPath)) {
                const result = await cloudinary.uploader.upload(localPath, { folder: 'anatomia_web' });
                await db.runAsync(`UPDATE organos_imagenes SET url_imagen = ? WHERE id = ?`, result.secure_url, img.id);
                // Registrar cambio para sync
                await db.runAsync(`INSERT INTO sync_changes (table_name, operation, data) VALUES ('organos_imagenes', 'UPDATE', ?)`, JSON.stringify({ id: img.id, url_imagen: result.secure_url }));
            }
        }

        // Enviar cambios locales a online
        const changes = await db.allAsync('SELECT * FROM sync_changes WHERE synced = 0');
        for (const change of changes) {
            const data = JSON.parse(change.data);
            if (change.operation === 'INSERT') {
                await connection.execute(`INSERT INTO ${change.table_name} SET ?`, data);
            } else if (change.operation === 'UPDATE') {
                await connection.execute(`UPDATE ${change.table_name} SET ? WHERE id_svg = ?`, [data, data.id_svg]);
            } else if (change.operation === 'DELETE') {
                await connection.execute(`DELETE FROM ${change.table_name} WHERE id = ?`, [data.id]);
            }
            await db.runAsync('UPDATE sync_changes SET synced = 1 WHERE id = ?', change.id);
        }

        // Descargar actualizaciones de online a local (simplificado)
        const tables = ['sistema_digestivo', 'sistema_respiratorio', 'sistema_oseo', 'sistema_tegumentario', 'organos_imagenes'];
        for (const table of tables) {
            const [rows] = await connection.execute(`SELECT * FROM ${table}`);
            await db.runAsync(`DELETE FROM ${table}`);
            for (const row of rows) {
                const keys = Object.keys(row);
                const values = Object.values(row);
                const placeholders = keys.map(() => '?').join(', ');
                await db.runAsync(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`, values);
            }
        }

        await connection.end();
        console.log('Sincronización completada');
    } catch (err) {
        console.error('Error en sincronización:', err);
    }
}

// Ejecutar sync cada cierto tiempo
setInterval(syncWithOnline, 60000);

async function hasUnsyncedChanges() {
    const rows = await db.allAsync('SELECT COUNT(1) AS c FROM sync_changes WHERE synced = 0');
    return rows[0].c > 0;
}

module.exports = {
    db,
    syncWithOnline,
    hasUnsyncedChanges
};