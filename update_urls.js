const db = require('./db');

db.run(`UPDATE organos_imagenes SET url_imagen = REPLACE(url_imagen, '/img/', '/assets/img/') WHERE url_imagen LIKE '/img/%'`, (err) => {
    if (err) console.error(err);
    else console.log('URLs actualizadas');
});