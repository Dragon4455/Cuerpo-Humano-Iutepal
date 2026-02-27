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
app.get('/api/:sistema/:id', async (req, res) => {
    const { sistema, id } = req.params;
    const tablasPermitidas = ['sistema_digestivo', 'sistema_respiratorio'];

    if (!tablasPermitidas.includes(sistema)) {
        return res.status(400).send("Sistema no válido");
    }

    try {
        // 1. Obtener datos básicos del órgano
        const [organo] = await db.promise().execute(
            `SELECT nombre, descripcion, iframe_url FROM ${sistema} WHERE id_svg = ?`, 
            [id]
        );

        if (organo.length === 0) return res.status(404).json({ error: "No encontrado" });

        // 2. Obtener TODAS las imágenes relacionadas
        const [imagenes] = await db.promise().execute(
            `SELECT url_imagen, descripcion_imagen FROM organos_imagenes WHERE id_svg = ?`, 
            [id]
        );

        // Enviamos todo junto
        res.json({
            ...organo[0],
            imagenes: imagenes // Esto será un array []
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Rutas disponibles: /api/sistema_digestivo/:id, /api/sistema_respiratorio/:id, etc.`);
});