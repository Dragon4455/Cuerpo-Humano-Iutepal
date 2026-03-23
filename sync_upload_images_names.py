import sqlite3
import os
import unicodedata
from pathlib import Path

def normalize_name(name):
    return unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode('ascii').lower()

project = Path(r"c:\Users\USUARIO\Documents\Elias\GitHub\Cuerpo-Humano-Iutepal")
upload_dir = project / 'upload_images'

if not upload_dir.exists():
    raise SystemExit('upload_images no existe, crea la carpeta y copia imagenes.')

files = [f for f in os.listdir(upload_dir) if os.path.isfile(upload_dir / f)]
files_lower = {normalize_name(f): f for f in files}

# agregar mapping con sufijo:
suffix_map = {}
for f in files:
    key = normalize_name(f)
    suffix_map[key] = f
    if '-' in key:
        suf = key.split('-', 1)[1]
        suffix_map[suf] = f

print(f'Total files en upload_images: {len(files)}')

conn = sqlite3.connect(project / 'anatomia_local.db')
conn.row_factory = sqlite3.Row
cur = conn.cursor()

rows = cur.execute("SELECT id, id_svg, url_imagen FROM organos_imagenes WHERE url_imagen LIKE '/upload_images/%'").fetchall()
print('Total organos_imagenes URLs /upload_images:', len(rows))

updated = 0
for r in rows:
    id_ = r['id']
    url = r['url_imagen']
    basename = os.path.basename(url)
    basename_lower = normalize_name(basename)

    if basename_lower in files_lower:
        # ya coincide
        continue

    if basename_lower in suffix_map:
        match = suffix_map[basename_lower]
        new_url = f'/upload_images/{match}'
        if new_url != url:
            cur.execute('UPDATE organos_imagenes SET url_imagen = ? WHERE id = ?', (new_url, id_))
            updated += 1
            print(f'Actualizo id={id_} {url} -> {new_url}')
        continue

    # fallback: buscar por sufijo parcial como 'esofago.png'
    if '-' in basename_lower:
        candidate = basename_lower.split('-',1)[1]
        if candidate in suffix_map:
            match = suffix_map[candidate]
            new_url = f'/upload_images/{match}'
            cur.execute('UPDATE organos_imagenes SET url_imagen = ? WHERE id = ?', (new_url, id_))
            updated += 1
            print(f'Actualizo (suffix) id={id_} {url} -> {new_url}')
            continue

    # busqueda general endswith, solo si un único match
    matches = [f for f in files if normalize_name(f).endswith(basename_lower)]
    if len(matches) == 1:
        match = matches[0]
        new_url = f'/upload_images/{match}'
        if new_url != url:
            cur.execute('UPDATE organos_imagenes SET url_imagen = ? WHERE id = ?', (new_url, id_))
            updated += 1
            print(f'Actualizo (endswith) id={id_} {url} -> {new_url}')
        continue

    # si no se encuentra, ojo
    print(f'No se encuentra archivo para id={id_} : {url}')

conn.commit()
print('Actualizaciones totales:', updated)
conn.close()
