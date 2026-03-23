import json
import sqlite3
import zipfile
import os
from pathlib import Path

workspace = Path(__file__).resolve().parent

candidate_json = [
    workspace / 'backup.json',
    workspace / 'backup 2.json',
    Path(os.path.expandvars(r'%TEMP%')) / r'Rar$DIa11964.34240.rartemp' / 'backup.json',
    Path(os.path.expandvars(r'%TEMP%')) / r'Rar$DIa11964.34240.rartemp' / 'backup 2.json'
]

candidate_zips = [
    workspace / 'imagenes.zip',
    workspace / 'backup.zip',
    Path(os.path.expandvars(r'%TEMP%')) / r'Rar$DIa11964.34240.rartemp' / 'imagenes.zip',
    Path(os.path.expandvars(r'%TEMP%')) / r'Rar$DIa11964.34240.rartemp' / 'backup.zip'
]

existing_json = [p for p in candidate_json if p.exists()]
existing_zips = [p for p in candidate_zips if p.exists()]

if not existing_json:
    raise SystemExit('No se halló backup.json. Coloca el JSON en el directorio del proyecto o en la carpeta TEMP.')

print('JSON a procesar:')
for p in existing_json:
    print(' -', p)

print('ZIPs a extraer:')
for z in existing_zips:
    print(' -', z)

upload_dir = workspace / 'upload_images'
upload_dir.mkdir(parents=True, exist_ok=True)
print('upload_images path:', upload_dir)

for z in existing_zips:
    print('Extrayendo', z)
    with zipfile.ZipFile(z, 'r') as archive:
        for info in archive.infolist():
            if info.is_dir():
                continue
            name = Path(info.filename).name
            if not name:
                continue
            dest = upload_dir / name
            with archive.open(info) as src, open(dest, 'wb') as out:
                out.write(src.read())
            print('  archivo guardado ->', dest.name)

# Conectar DB

db_path = workspace / 'anatomia_local.db'
if not db_path.exists():
    raise SystemExit('No se encontró anatomia_local.db en el directorio del proyecto.')

conn = sqlite3.connect(str(db_path))
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# helper cols

def get_columns(table_name):
    cur.execute(f"PRAGMA table_info({table_name})")
    return [r['name'] for r in cur.fetchall()]

for jsonfile in existing_json:
    print('Procesando', jsonfile)
    with open(jsonfile, 'r', encoding='utf-8') as f:
        payload = json.load(f)

    if not isinstance(payload, dict):
        print('  JSON raíz no es objeto, se omite', jsonfile)
        continue

    for table, records in payload.items():
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
        if not cur.fetchone():
            print('  Tabla no existe en DB (se omite):', table)
            continue

        if not isinstance(records, list):
            continue

        cols = get_columns(table)
        for rec in records:
            if not isinstance(rec, dict):
                continue
            fields = [c for c in cols if c in rec]
            if not fields:
                continue
            values = [rec[f] for f in fields]
            placeholders = ','.join('?' for _ in fields)
            sql = f"INSERT OR REPLACE INTO {table} ({','.join(fields)}) VALUES ({placeholders})"
            cur.execute(sql, values)

        conn.commit()
        print(f'  Insertadas {len(records)} filas en {table}')

# Agregar referencias a organos_imagenes desde archivos físicos, si existe tabla
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='organos_imagenes'")
if cur.fetchone():
    exist_urls = {row['url_imagen'] for row in cur.execute('SELECT url_imagen FROM organos_imagenes').fetchall()}
    added = 0
    for f in upload_dir.iterdir():
        if f.is_file():
            url = f'/upload_images/{f.name}'
            if url in exist_urls:
                continue
            id_svg = f.stem
            cur.execute('INSERT INTO organos_imagenes (id_svg, url_imagen, descripcion_imagen) VALUES (?, ?, ?)', (id_svg, url, 'Importado automáticamente'))
            added += 1
    conn.commit()
    print(f'Agregadas {added} filas en organos_imagenes con imágenes subidas')

print('Resumen final:')
for table in ['sistema_digestivo', 'sistema_respiratorio', 'organos_imagenes']:
    cur.execute(f"SELECT COUNT(*) as c FROM {table}")
    print(f' {table} ->', cur.fetchone()['c'])

conn.close()
print('Importación completada.')
