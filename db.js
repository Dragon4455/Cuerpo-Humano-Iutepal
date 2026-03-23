const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const isOnline = require('is-online').default || require('is-online');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

// Conexión a SQLite local. Cuando la app está empaquetada con Electron
// no es válido crear/abrir la BD dentro de la asar (__dirname). En ese caso
// usamos la carpeta `userData` de Electron (fuera del asar).
let dataDir = __dirname;
try {
    if (process.versions && process.versions.electron) {
        const { app } = require('electron');
        dataDir = app.getPath('userData') || __dirname;
    }
} catch (err) {
    dataDir = __dirname;
}

if (!fs.existsSync(dataDir)) {
    try { fs.mkdirSync(dataDir, { recursive: true }); } catch (e) { /* ignore */ }
}

const dbPath = path.join(dataDir, 'anatomia_local.db');
const db = new sqlite3.Database(dbPath);
console.log('DB path:', dbPath);

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


// Crear tablas si no existen y migrar columnas si faltan
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

    // Migración: agregar columna 'sincronizado' si no existe
    db.all("PRAGMA table_info(sistema_digestivo)", (err, columns) => {
        if (!err && columns && !columns.some(col => col.name === 'sincronizado')) {
            db.run("ALTER TABLE sistema_digestivo ADD COLUMN sincronizado INTEGER DEFAULT 0");
        }
    });

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
        CREATE TABLE IF NOT EXISTS sistema_circulatorio (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_svg TEXT UNIQUE,
            nombre TEXT,
            descripcion TEXT,
            fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS sistema_endocrino (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_svg TEXT UNIQUE,
            nombre TEXT,
            descripcion TEXT,
            fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS sistema_linfatico (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_svg TEXT UNIQUE,
            nombre TEXT,
            descripcion TEXT,
            fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS sistema_muscular (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_svg TEXT UNIQUE,
            nombre TEXT,
            descripcion TEXT,
            fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS sistema_reproductivo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_svg TEXT UNIQUE,
            nombre TEXT,
            descripcion TEXT,
            fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS sistema_urinario (
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

    // Si se abre una BD antigua, asegurarse de que las tablas incluyan la columna fecha_actualizacion
    function addColumnIfMissing(tableName, columnDef) {
        db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnDef}`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error(`Error agregando columna en ${tableName}:`, err.message);
            }
        });
    }

    const fechaCol = 'fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP';
    addColumnIfMissing('sistema_digestivo', fechaCol);
    addColumnIfMissing('sistema_respiratorio', fechaCol);
    addColumnIfMissing('sistema_oseo', fechaCol);
    addColumnIfMissing('sistema_tegumentario', fechaCol);
    addColumnIfMissing('sistema_circulatorio', fechaCol);
    addColumnIfMissing('sistema_endocrino', fechaCol);
    addColumnIfMissing('sistema_linfatico', fechaCol);
    addColumnIfMissing('sistema_muscular', fechaCol);
    addColumnIfMissing('sistema_reproductivo', fechaCol);
    addColumnIfMissing('sistema_urinario', fechaCol);

    // Crear un usuario administrador por defecto si no existe
    db.get('SELECT id FROM users WHERE username = ?', ['admin'], (err, row) => {
        if (err) {
            console.error('Error comprobando usuario admin:', err);
            return;
        }
        if (!row) {
            const hash = bcrypt.hashSync('123', 10);
            db.run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['admin', hash, 'admin'], (err2) => {
                if (err2) console.error('Error creando usuario admin por defecto:', err2);
                else console.log('Usuario admin creado con contraseña por defecto (123)');
            });
        }
    });
});

// Función para sincronizar con MySQL cuando esté online
async function syncWithOnline() {
    const online = await isOnline();
    if (!online) return;

    try {
        const connection = await mysql.createConnection(mysqlConfig);


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
            'organos_imagenes'
        ];
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