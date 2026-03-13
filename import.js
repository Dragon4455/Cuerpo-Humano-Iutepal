const fs = require('fs');
const path = require('path');
const db = require('./db');

const sqlFile = path.join(__dirname, 'anatomia_db(3).sql');
const sqlContent = fs.readFileSync(sqlFile, 'utf8');

// Extraer inserts de sistema_oseo
const oseos = sqlContent.match(/INSERT INTO `sistema_oseo`.*?VALUES\s*\((.*?)\);/gs);
if (oseos) {
    oseos.forEach(insert => {
        const values = insert.match(/VALUES\s*\((.*?)\);/s)[1];
        const parts = values.split(',').map(v => v.trim().replace(/^'|'$/g, ''));
        const id_svg = parts[1];
        const nombre = parts[2];
        const descripcion = parts[3] || '';
        db.run(`INSERT OR IGNORE INTO sistema_oseo (id_svg, nombre, descripcion) VALUES (?, ?, ?)`, [id_svg, nombre, descripcion], (err) => {
            if (err) console.error(err);
        });
    });
}

// Extraer inserts de sistema_digestivo
const digestivos = sqlContent.match(/INSERT INTO `sistema_digestivo`.*?VALUES\s*\((.*?)\);/gs);
if (digestivos) {
    digestivos.forEach(insert => {
        const values = insert.match(/VALUES\s*\((.*?)\);/s)[1];
        const parts = values.split(',').map(v => v.trim().replace(/^'|'$/g, ''));
        const id_svg = parts[1];
        const nombre = parts[2];
        const descripcion = parts[3] || '';
        db.run(`INSERT OR IGNORE INTO sistema_digestivo (id_svg, nombre, descripcion) VALUES (?, ?, ?)`, [id_svg, nombre, descripcion], (err) => {
            if (err) console.error(err);
        });
    });
}

// Extraer inserts de organos_imagenes
const imagenes = sqlContent.match(/INSERT INTO `organos_imagenes`.*?VALUES\s*\((.*?)\);/gs);
if (imagenes) {
    imagenes.forEach(insert => {
        const values = insert.match(/VALUES\s*\((.*?)\);/s)[1];
        const parts = values.split(',').map(v => v.trim().replace(/^'|'$/g, ''));
        const id_svg = parts[1];
        const url_imagen = parts[2];
        const descripcion_imagen = parts[3] || '';
        db.run(`INSERT OR IGNORE INTO organos_imagenes (id_svg, url_imagen, descripcion_imagen) VALUES (?, ?, ?)`, [id_svg, url_imagen, descripcion_imagen], (err) => {
            if (err) console.error(err);
        });
    });
}

console.log('Importación completada');