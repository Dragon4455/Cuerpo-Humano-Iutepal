const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configura tus credenciales (Obtenlas en el dashboard de Cloudinary)
cloudinary.config({
  cloud_name: 'dbdeldijt',
  api_key: '131155335887578',
  api_secret: 'eAuuf8tu6QfUZu6nIlAej0aqI2Q'
});

// Configuración de almacenamiento
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'anatomia_web',
      resource_type: 'auto', // Permite imágenes y videos
      public_id: file.fieldname + '-' + Date.now(),
    };
  },
});

const upload = multer({ storage: storage });
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
    const tablasPermitidas = ['sistema_digestivo', 'sistema_respiratorio', 'sistema_oseo', 'sistema_tegumentario'];

    if (!tablasPermitidas.includes(sistema)) {
        return res.status(400).send("Sistema no válido");
    }

    try {
        // 1. Obtener datos básicos del órgano
        const [organo] = await db.promise().execute(
            `SELECT nombre, descripcion FROM ${sistema} WHERE id_svg = ?`, 
            [id]
        );

        if (organo.length === 0) return res.status(404).json({ error: "No encontrado" });

        // 2. Obtener TODAS las imágenes relacionadas
        const [imagenes] = await db.promise().execute(
            `SELECT id, url_imagen, descripcion_imagen FROM organos_imagenes WHERE id_svg = ?`, 
            [id]
        );

        res.json({
            ...organo[0],
            imagenes: imagenes 
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Crear o actualizar un órgano y su imagen
// server.js (Añadir esta ruta)
// Asegúrate de tener configurado multer y cloudinary arriba
app.post('/api/admin/organo', upload.single('archivo'), async (req, res) => {
    const { sistema, id_svg, nombre, descripcion } = req.body;
    const url_media = req.file ? req.file.path : null;

    try {
        // 1. Actualizamos los datos del órgano (Nombre y descripción principal)
        const sqlOrgano = `
            INSERT INTO ${sistema} (id_svg, nombre, descripcion) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), descripcion = VALUES(descripcion)`;
        
        await db.promise().execute(sqlOrgano, [id_svg, nombre, descripcion]);

        // 2. Si hay un archivo nuevo, lo AGREGAMOS a la tabla de imágenes
        // No borramos las anteriores, permitiendo así tener múltiples archivos
        if (url_media) {
            await db.promise().execute(
                `INSERT INTO organos_imagenes (id_svg, url_imagen, descripcion_imagen) VALUES (?, ?, ?)`,
                [id_svg, url_media, `Galería de ${nombre}`]
            );
        }

        res.json({ success: true, message: "Contenido actualizado y multimedia añadida" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al procesar la solicitud" });
    }
});

// Endpoint para eliminar una imagen/video específico

app.delete('/api/eliminar-recurso/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.promise().execute(
            'DELETE FROM organos_imagenes WHERE id = ?', 
            [id]
        );

        if (result.affectedRows > 0) {
            res.status(200).send("Imagen eliminada");
        } else {
            res.status(404).send("No se encontró el archivo");
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Rutas disponibles: /api/sistema_digestivo/:id, /api/sistema_respiratorio/:id, etc.`);
});
//SQL para la tabla
// //CREATE TABLE IF NOT EXISTS sistema_oseo (
//     id INT(11) NOT NULL AUTO_INCREMENT,
//     id_svg VARCHAR(50) NOT NULL,
//     nombre VARCHAR(100) NOT NULL,
//     descripcion TEXT NULL DEFAULT NULL,
//     fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
//     PRIMARY KEY (id),
//     UNIQUE KEY (id_svg) -- ESTO ES LO IMPORTANTE: Evita duplicados por código SVG
// ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

// -- Ejemplo para otra tabla (Sistema Muscular)
// CREATE TABLE IF NOT EXISTS sistema_muscular (
//     id INT(11) NOT NULL AUTO_INCREMENT,
//     id_svg VARCHAR(50) NOT NULL,
//     nombre VARCHAR(100) NOT NULL,
//     descripcion TEXT NULL DEFAULT NULL,
//     fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
//     PRIMARY KEY (id),
//     UNIQUE KEY (id_svg)
// ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;