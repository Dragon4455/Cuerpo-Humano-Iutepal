const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'anatomia_local.db');
const db = new sqlite3.Database(dbPath);

// Crear tabla sistema_nerviosocentral si no existe
const createTable = `CREATE TABLE IF NOT EXISTS sistema_nerviosocentral (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_svg TEXT NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

db.serialize(() => {
  db.run(createTable, (err) => {
    if (err) return console.error('Error creando tabla:', err.message);
    console.log('Tabla sistema_nerviosocentral lista.');
    // Insertar datos de prueba
    const insert = db.prepare(`INSERT INTO sistema_nerviosocentral (id_svg, nombre, descripcion) VALUES (?, ?, ?)`);
    insert.run('NC_Encefalo', 'Encéfalo', 'Órgano principal del sistema nervioso central, encargado de procesar la información sensorial y coordinar funciones corporales.');
    insert.run('NC_MedulaEspinal', 'Médula Espinal', 'Estructura larga y delgada que transmite señales entre el encéfalo y el resto del cuerpo.');
    insert.finalize(() => {
      console.log('Datos de prueba insertados.');
      db.close();
    });
  });
});
