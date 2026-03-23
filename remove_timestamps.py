import sqlite3
import re

# Connect to DB
conn = sqlite3.connect('anatomia_local.db')
cur = conn.cursor()

# Get all url_imagen with upload_images
rows = cur.execute("SELECT id, url_imagen FROM organos_imagenes WHERE url_imagen LIKE '/upload_images/%'").fetchall()

updated = 0
for row in rows:
    id_, url = row
    original_url = url
    # Remove timestamp prefix like 1774114225166-
    filename = url.split('/')[-1]
    if re.match(r'^\d+-.+', filename):
        clean_filename = re.sub(r'^\d+-', '', filename)
        new_url = url.replace(filename, clean_filename)
        cur.execute("UPDATE organos_imagenes SET url_imagen = ? WHERE id = ?", (new_url, id_))
        print(f"Fixed {id_}: {repr(filename)} -> {repr(clean_filename)}")
        updated += 1

conn.commit()
print(f"Updated {updated} records")
conn.close()