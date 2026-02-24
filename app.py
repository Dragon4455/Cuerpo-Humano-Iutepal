import os
from flask import Flask, render_template, request, jsonify
import mysql.connector
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Configuración de carpetas
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Conexión a DB
def get_db_connection():
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='',
        database='proyecta_jp'
    )

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/peliculas', methods=['GET'])
def obtener_peliculas():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM pelicula")
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(data)

@app.route('/api/peliculas', methods=['POST'])
def agregar_pelicula():
    try:
        # Recibir datos del formulario
        titulo = request.form.get('titulo')
        autor = request.form.get('autor')
        cine = request.form.get('cine')
        descripcion = request.form.get('descripcion') # Crucial para evitar error 1048

        path_trailer = ""
        path_poster = ""

        # Procesar archivos
        if 'trailer' in request.files:
            f = request.files['trailer']
            if f.filename != '':
                name = secure_filename(f.filename)
                f.save(os.path.join(app.config['UPLOAD_FOLDER'], name))
                path_trailer = f"static/uploads/{name}"

        if 'poster' in request.files:
            f = request.files['poster']
            if f.filename != '':
                name = secure_filename(f.filename)
                f.save(os.path.join(app.config['UPLOAD_FOLDER'], name))
                path_poster = f"static/uploads/{name}"

        # Insertar usando los nombres exactos de tu tabla
        conn = get_db_connection()
        cursor = conn.cursor()
        query = """INSERT INTO pelicula 
                   (Titulo, Autor, Cine_Venezuela, Link_trailer, Link_poster, descripcion) 
                   VALUES (%s, %s, %s, %s, %s, %s)"""
        cursor.execute(query, (titulo, autor, cine, path_trailer, path_poster, descripcion))
        conn.commit()
        return jsonify({"status": "success"}), 201
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 400
    finally:
        if 'conn' in locals():
            cursor.close()
            conn.close()

if __name__ == '__main__':
    app.run(debug=True)