const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./anatomia_local.db');
db.all("SELECT COUNT(*) as count FROM sistema_nervioso", [], (err, rows) => {
    if (err) console.error(err);
    else console.log('Nervous system records:', rows[0].count);
    db.close();
});