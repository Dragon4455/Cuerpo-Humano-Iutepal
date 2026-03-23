import sqlite3
from pathlib import Path

project = Path(r"c:\Users\USUARIO\Documents\Elias\GitHub\Cuerpo-Humano-Iutepal")
conn = sqlite3.connect(project / 'anatomia_local.db')
cur = conn.cursor()

# Contar entradas con 1774
cur.execute("SELECT COUNT(*) FROM organos_imagenes WHERE url_imagen LIKE '/upload_images/%' AND url_imagen LIKE '%1774%'")
count_1774 = cur.fetchone()[0]
print('entries still with 1774 prefix:', count_1774)

# Muestra sample
cur.execute("SELECT id, url_imagen FROM organos_imagenes WHERE id IN (38,39,40,41,42)")
sample = cur.fetchall()
print('sample:', sample)

conn.close()