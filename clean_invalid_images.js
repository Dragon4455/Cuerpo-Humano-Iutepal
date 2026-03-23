const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./anatomia_local.db');

db.serialize(() => {
    // Obtener todas las tablas
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'sistema_%'", [], (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        const tables = rows.map(r => r.name);
        console.log('Sistema tables:', tables);
        
        if (tables.length === 0) {
            console.log('No sistema tables found');
            db.close();
            return;
        }
        
        let unionQuery = tables.map(t => `SELECT id_svg FROM ${t}`).join(' UNION ');
        
        db.all(unionQuery, [], (err, rows) => {
            if (err) {
                console.error(err);
                return;
            }
            const validIds = new Set(rows.map(r => r.id_svg));
            console.log('Valid id_svg count:', validIds.size);
            
            // Obtener organos_imagenes con id_svg inválidos
            db.all('SELECT id, id_svg, url_imagen FROM organos_imagenes', [], (err, imgs) => {
                if (err) {
                    console.error(err);
                    return;
                }
                const invalid = imgs.filter(img => !validIds.has(img.id_svg));
                console.log('Invalid entries count:', invalid.length);
                console.log('Invalid entries:', invalid.slice(0, 5)); // first 5
                
                // Borrar los inválidos
                if (invalid.length > 0) {
                    const ids = invalid.map(i => i.id);
                    db.run(`DELETE FROM organos_imagenes WHERE id IN (${ids.join(',')})`, [], (err) => {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log('Deleted', invalid.length, 'invalid entries');
                        }
                        db.close();
                    });
                } else {
                    console.log('No invalid entries');
                    db.close();
                }
            });
        });
    });
});