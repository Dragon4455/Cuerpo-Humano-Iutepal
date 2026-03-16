const { db } = require('./db');
const bcrypt = require('bcryptjs');

// Cambiar contraseña del usuario admin
const nuevaPassword = '123'; // Cambia esto por la nueva contraseña
const hash = bcrypt.hashSync(nuevaPassword, 10);

db.prepare(`UPDATE users SET password_hash = ? WHERE username = ?`)
  .run(hash, 'admin');

console.log('Contraseña del usuario admin actualizada exitosamente.');