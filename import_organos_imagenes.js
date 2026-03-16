const fs = require('fs');
const path = require('path');
const { db } = require('./db');

const sqlFile = path.join(__dirname, 'organos_imagenes.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

const insertRegex = /INSERT INTO `organos_imagenes` \(`id`, `id_svg`, `url_imagen`, `descripcion_imagen`\) VALUES\s*(\(.*?\));/gs;
let match;
let count = 0;

while ((match = insertRegex.exec(sql)) !== null) {
  const valuesText = match[1];
  // Support multiple value sets in one INSERT
  const tuples = valuesText.split(/\),\s*\(/).map(t => t.replace(/^\(?|\)?$/g, ''));

  for (const tuple of tuples) {
    const parts = tuple.split(',').map(p => p.trim()).map(p => {
      if (p === 'NULL') return null;
      return p.replace(/^'(.*)'$/s, '$1').replace(/\\'/g, "'");
    });
    const [id, id_svg, url_imagen, descripcion_imagen] = parts;

    db.run(`INSERT OR IGNORE INTO organos_imagenes (id, id_svg, url_imagen, descripcion_imagen) VALUES (?, ?, ?, ?)`,
      [id, id_svg, url_imagen, descripcion_imagen], (err) => {
        if (err) console.error('Error insertando:', err);
      });
    count++;
  }
}

console.log(`Se procesaron ${count} registros de organos_imagenes.`);
