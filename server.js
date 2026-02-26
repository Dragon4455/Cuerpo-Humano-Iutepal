const express = require('express');
const mysql = require('mysql2');
const cors = require('cors'); // 1. Importar cors
const app = express();

// 2. Habilitar CORS para todas las rutas
// Esto añade la cabecera 'Access-Control-Allow-Origin' automáticamente
app.use(cors()); 

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'anatomia_db'
});

app.get('/api/organo/:id', (req, res) => {
    const idSvg = req.params.id;
    const query = 'SELECT nombre, descripcion FROM sistema_digestivo WHERE id_svg = ?';
    
    db.execute(query, [idSvg], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // Si no hay resultados, enviamos un objeto vacío o un error 404
        if (results.length === 0) {
            return res.status(404).json({ error: "No encontrado en la BD" });
        }
        res.json(results[0]);
    });
});

app.listen(3000, () => console.log('Servidor API listo en puerto 3000'));