const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Leer el archivo SQL
const sqlFile = path.join(__dirname, 'anatomia_db(4).sql');
const sqlContent = fs.readFileSync(sqlFile, 'utf8');

// Conectar a la base de datos local. Si se ejecuta dentro de Electron empaquetado,
// guardamos la BD fuera del asar en la carpeta `userData`.
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

console.log('=== IMPORTANDO DESCRIPCIONES Y SISTEMAS ===');

// Función para ejecutar SQL de forma promisificada
function runAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

// Crear tablas si no existen
async function createTables() {
    console.log('Creando tablas...');

    // Dropear tablas existentes para recrearlas con la estructura correcta
    const tables = ['organos_imagenes', 'sistema_digestivo', 'sistema_oseo', 'sistema_respiratorio', 'sistema_tegumentario'];
    for (const table of tables) {
        try {
            await runAsync(`DROP TABLE IF EXISTS ${table}`);
        } catch (err) {
            console.log(`Tabla ${table} no existía o error al dropear:`, err.message);
        }
    }

    // Crear tabla organos_imagenes primero
    await runAsync(`
        CREATE TABLE organos_imagenes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_svg TEXT NOT NULL,
            url_imagen TEXT NOT NULL,
            descripcion_imagen TEXT
        )
    `);

    // Crear las tablas de sistemas con las columnas exactas del SQL original
    await runAsync(`
        CREATE TABLE sistema_digestivo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_svg TEXT NOT NULL,
            nombre TEXT NOT NULL,
            descripcion TEXT,
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            iframe_url TEXT
        )
    `);

    await runAsync(`
        CREATE TABLE sistema_oseo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_svg TEXT NOT NULL,
            nombre TEXT NOT NULL,
            descripcion TEXT,
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await runAsync(`
        CREATE TABLE sistema_respiratorio (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_svg TEXT NOT NULL,
            nombre TEXT NOT NULL,
            descripcion TEXT,
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            iframe_url TEXT
        )
    `);

    await runAsync(`
        CREATE TABLE sistema_tegumentario (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_svg TEXT NOT NULL,
            nombre TEXT NOT NULL,
            descripcion TEXT,
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('Tablas creadas.');
}

// Extraer y ejecutar las inserciones
async function importData() {
    console.log('Importando datos...');

    // Buscar todas las líneas INSERT INTO
    const lines = sqlContent.split('\n');
    let currentInsert = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('INSERT INTO')) {
            currentInsert = line;
            // Continuar leyendo líneas hasta encontrar el punto y coma
            for (let j = i + 1; j < lines.length; j++) {
                currentInsert += ' ' + lines[j].trim();
                if (lines[j].trim().endsWith(';')) {
                    break;
                }
            }

            // Extraer el nombre de la tabla
            const tableMatch = currentInsert.match(/INSERT INTO `(\w+)`/);
            if (tableMatch) {
                const tableName = tableMatch[1];

                // Solo procesar las tablas que nos interesan
                if (['organos_imagenes', 'sistema_digestivo', 'sistema_respiratorio', 'sistema_oseo', 'sistema_tegumentario'].includes(tableName)) {
                    try {
                        // Convertir el INSERT de MySQL a SQLite
                        let sqliteInsert = currentInsert
                            .replace(/INSERT INTO `(\w+)`/g, 'INSERT OR REPLACE INTO $1')
                            .replace(/`([^`]+)`/g, '$1'); // Quitar backticks

                        await runAsync(sqliteInsert);
                        console.log(`✓ Importado ${tableName}`);
                    } catch (err) {
                        console.error(`✗ Error en ${tableName}:`, err.message);
                        console.error('SQL problemático:', currentInsert.substring(0, 150) + '...');
                    }
                }
            }

            currentInsert = null;
        }
    }

    console.log('Importación completada.');
}

// Función principal
async function main() {
    try {
        await createTables();
        await importData();
        console.log('✅ Proceso completado exitosamente.');
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        db.close();
    }
}

main();