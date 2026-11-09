import sqlite3
import os
from pathlib import Path
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.staticfiles import StaticFiles
import schemas
from database import crear_tablas, get_connection

# crear_tablas()

app = FastAPI()

# Dependencia: abre una conexión por petición y la cierra al terminar
def get_db():
    db = get_connection()
    try:
        yield db
    finally:
        db.close()

#region Post

@app.post("/nueva/tarea", response_model=schemas.TareaLeer, status_code=201)
def crear_tarea(datos: schemas.TareaCrear, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.execute("INSERT INTO tareas (titulo, descripcion) VALUES (?, ?)", (datos.titulo, datos.descripcion))
    db.commit()

    fila = db.execute("SELECT * FROM tareas WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return dict(fila)

#endregion


#region Get

@app.get("/tareas", response_model=list[schemas.TareaLeer])
def listar_tareas(db: sqlite3.Connection = Depends(get_db)):
    filas = db.execute("SELECT * FROM tareas").fetchall()
    return [dict(f) for f in filas]

@app.get("/tareas/filtradas", response_model=list[schemas.TareaLeer])
def buscar_tarea_filtrada(estado: bool | None = None, db: sqlite3.Connection = Depends(get_db)):
    if estado is None:
        filas = db.execute("SELECT * FROM tareas").fetchall()
    else:
        search = 0 
        
        if estado:
            search = 1

        filas = db.execute("SELECT * FROM tareas WHERE completada = ?", (search,)).fetchall()

    return [dict(f) for f in filas]

@app.get("/tareas/{tarea_id}", response_model=schemas.TareaLeer)
def buscar_tarea(tarea_id: int, db: sqlite3.Connection = Depends(get_db)):
    fila = db.execute("SELECT * FROM tareas WHERE id = ?", (tarea_id,)).fetchone()
    
    if fila is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada")
    
    return dict(fila)


#endregion

#region Put

@app.put("/tareas/{tarea_id}/completar", response_model=schemas.TareaLeer)
def completar_tarea(tarea_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.execute("UPDATE tareas SET completada = 1 WHERE id = ?", (tarea_id,))
    db.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    fila = db.execute("SELECT * FROM tareas WHERE id = ?", (tarea_id,)).fetchone()
    return dict(fila)

#endregion

#region Delete

@app.delete("/tareas/borrar/{tarea_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_tarea(tarea_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.execute("DELETE FROM tareas WHERE id = ?", (tarea_id,))
    db.commit()

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    
#endregion

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")







