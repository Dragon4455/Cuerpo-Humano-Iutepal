import sqlite3

db = sqlite3.connect('anatomia_local.db')
cur = db.cursor()
needle = '1774107596911-esofago.png'
cur.execute("SELECT id, id_svg, url_imagen FROM organos_imagenes WHERE url_imagen LIKE ?", ('%'+needle+'%',))
rows = cur.fetchall()
print('rows with needle', len(rows))
for r in rows:
    print(r)
cur.execute("SELECT count(*) FROM organos_imagenes WHERE url_imagen LIKE '/upload_images/%'")
print('upload images count', cur.fetchone()[0])
db.close()