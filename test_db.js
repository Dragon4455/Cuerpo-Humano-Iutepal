const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./anatomia_local.db');
db.serialize(() => {
    db.run("INSERT OR REPLACE INTO sistema_nervioso (id_svg, nombre, descripcion) VALUES (?, ?, ?)",
           ['test_nervioso', 'Prueba Nervioso', 'Descripción de prueba'], (err) => {
        if (err) console.error('Error insertando:', err);
        else console.log('Registro insertado correctamente');

        db.get('SELECT COUNT(*) as count FROM sistema_nervioso', (err, row) => {
            if (err) console.error('Error consultando:', err);
            else console.log('Total registros en sistema_nervioso:', row.count);
            db.close();
        });
    });
});