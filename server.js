const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de la conexión
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'anatomia_db'
});

// Endpoint Dinámico: /api/:sistema/:id
// Ejemplo: /api/sistema_oseo/femur_01
app.get('/api/:sistema/:id', (req, res) => {
    const { sistema, id } = req.params;

    // Nombres exactos de las tablas en tu anatomia_db.sql
    const tablasPermitidas = ['sistema_digestivo', 'sistema_respiratorio'];

    if (!tablasPermitidas.includes(sistema)) {
        return res.status(400).send("Sistema no válido");
    }

    // Usamos id_svg porque es la columna UNIQUE en tu SQL
    const query = `SELECT nombre, descripcion FROM ${sistema} WHERE id_svg = ?`;
    
    db.execute(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length === 0) {
            return res.status(404).json({ error: "No encontrado" });
        }
        res.json(results[0]);
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Rutas disponibles: /api/sistema_digestivo/:id, /api/sistema_oseo/:id, etc.`);
});