import sqlite3
import unicodedata

def remove_accents(s):
    return unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode('ascii')

# Connect to DB
conn = sqlite3.connect('anatomia_local.db')
cur = conn.cursor()

# Get all url_imagen with upload_images
rows = cur.execute("SELECT id, url_imagen FROM organos_imagenes WHERE url_imagen LIKE '/upload_images/%'").fetchall()

updated = 0
for row in rows:
    id_, url = row
    original_url = url
    # Remove accents from filename
    parts = url.split('/')
    filename = parts[-1]
    fixed_filename = remove_accents(filename)
    if fixed_filename != filename:
        parts[-1] = fixed_filename
        new_url = '/'.join(parts)
        cur.execute("UPDATE organos_imagenes SET url_imagen = ? WHERE id = ?", (new_url, id_))
        print(f"Fixed {id_}: {repr(filename)} -> {repr(fixed_filename)}")
        updated += 1

conn.commit()
print(f"Updated {updated} records")
conn.close()