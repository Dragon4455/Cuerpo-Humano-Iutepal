const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'anatomia_local.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // 1. Renombrar la tabla vieja si existe
  db.run('ALTER TABLE sistema_nerviosocentral RENAME TO sistema_nerviosocentral_old', (err) => {
    if (err) {
      console.error('No se pudo renombrar la tabla (quizá no existe):', err.message);
    } else {
      console.log('Tabla renombrada a sistema_nerviosocentral_old');
    }
    // 2. Crear la tabla nueva con id_svg como PRIMARY KEY
    db.run(`CREATE TABLE IF NOT EXISTS sistema_nerviosocentral (
      id_svg TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err2) => {
      if (err2) return console.error('Error creando tabla nueva:', err2.message);
      console.log('Tabla sistema_nerviosocentral creada correctamente.');
      // 3. Copiar los datos de la tabla vieja
      db.run(`INSERT INTO sistema_nerviosocentral (id_svg, nombre, descripcion, fecha_actualizacion)
        SELECT id_svg, nombre, descripcion, fecha_actualizacion FROM sistema_nerviosocentral_old`, (err3) => {
        if (err3) {
          console.error('Error migrando datos:', err3.message);
        } else {
          console.log('Datos migrados correctamente.');
        }
        // 4. Eliminar la tabla vieja
        db.run('DROP TABLE IF EXISTS sistema_nerviosocentral_old', (err4) => {
          if (err4) {
            console.error('No se pudo eliminar la tabla vieja:', err4.message);
          } else {
            console.log('Tabla vieja eliminada.');
          }
          db.close();
        });
      });
    });
  });
});
