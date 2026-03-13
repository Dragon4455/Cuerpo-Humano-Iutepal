const fs = require('fs');
const db = require('./db');

// Exportar BD a archivo JSON
function exportDB(filename = 'backup.json') {
    const tables = ['sistema_digestivo', 'sistema_respiratorio', 'sistema_oseo', 'sistema_tegumentario', 'organos_imagenes', 'sync_changes'];
    const exportData = {};

    tables.forEach(table => {
        exportData[table] = db.prepare(`SELECT * FROM ${table}`).all();
    });

    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    console.log(`BD exportada a ${filename}`);
}

// Importar BD desde archivo JSON
function importDB(filename = 'backup.json') {
    const importData = JSON.parse(fs.readFileSync(filename, 'utf8'));
    const tables = ['sistema_digestivo', 'sistema_respiratorio', 'sistema_oseo', 'sistema_tegumentario', 'organos_imagenes', 'sync_changes'];

    tables.forEach(table => {
        if (importData[table]) {
            db.prepare(`DELETE FROM ${table}`).run();
            const insert = db.prepare(`INSERT INTO ${table} (${Object.keys(importData[table][0] || {}).join(', ')}) VALUES (${Object.keys(importData[table][0] || {}).map(() => '?').join(', ')})`);
            importData[table].forEach(row => {
                insert.run(Object.values(row));
            });
        }
    });

    console.log(`BD importada desde ${filename}`);
}

// Uso desde línea de comandos
if (process.argv[2] === 'export') {
    exportDB(process.argv[3]);
} else if (process.argv[2] === 'import') {
    importDB(process.argv[3]);
} else {
    console.log('Uso: node db_tools.js export [filename.json]');
    console.log('     node db_tools.js import [filename.json]');
}

module.exports = { exportDB, importDB };