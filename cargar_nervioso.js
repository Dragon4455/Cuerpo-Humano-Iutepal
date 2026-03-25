// Script para cargar datos a sistema_nervioso y sistema_nerviosocentral desde un archivo JSON
// Guarda tu archivo como data_nervioso.json con el formato:
// {
//   "sistema_nervioso": [ { "id_svg": "...", "nombre": "...", "descripcion": "..." }, ... ],
//   "sistema_nerviosocentral": [ { "id_svg": "...", "nombre": "...", "descripcion": "..." }, ... ]
// }

const fs = require('fs');
const path = require('path');
const { db } = require('./db');

async function cargarDatos(filename = 'data_nervioso.json') {
    if (!fs.existsSync(filename)) {
        console.error('Archivo no encontrado:', filename);
        process.exit(1);
    }
    const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
    const tablas = ['sistema_nervioso', 'sistema_nerviosocentral'];
    for (const tabla of tablas) {
        if (data[tabla]) {
            await new Promise((resolve, reject) => {
                db.run(`DELETE FROM ${tabla}`, err => err ? reject(err) : resolve());
            });
            for (const row of data[tabla]) {
                const keys = Object.keys(row);
                const values = Object.values(row);
                const placeholders = keys.map(() => '?').join(', ');
                await new Promise((resolve, reject) => {
                    db.run(`INSERT INTO ${tabla} (${keys.join(', ')}) VALUES (${placeholders})`, values, err => err ? reject(err) : resolve());
                });
            }
            console.log(`Datos cargados en ${tabla}`);
        }
    }
    process.exit(0);
}

if (require.main === module) {
    const file = process.argv[2] || 'data_nervioso.json';
    cargarDatos(file);
}
