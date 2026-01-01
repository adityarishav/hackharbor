from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import models, schemas, database, auth
import os
import shutil
import uuid

router = APIRouter(
    tags=["academy"]
)

UPLOAD_DIR = "uploads"

# checking for the upload directory exist or not
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.get("/academy/modules", response_model=list[schemas.Module])
def read_modules(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    modules = db.query(models.Module).order_by(models.Module.order).offset(skip).limit(limit).all()
    return modules

@router.get("/academy/modules/{module_id}", response_model=schemas.Module)
def read_module(module_id: int, db: Session = Depends(database.get_db)):
    module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    return module

@router.post("/admin/academy/modules", response_model=schemas.Module)
def create_module(module: schemas.ModuleCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_module = models.Module(**module.dict())
    db.add(db_module)
    db.commit()
    db.refresh(db_module)
    return db_module

@router.get("/academy/lessons/{lesson_id}", response_model=schemas.Lesson)
def read_lesson(lesson_id: int, db: Session = Depends(database.get_db)):
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

@router.post("/admin/academy/modules/{module_id}/lessons", response_model=schemas.Lesson)
def create_lesson(module_id: int, lesson: schemas.LessonCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):

    module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    db_lesson = models.Lesson(**lesson.dict(), module_id=module_id)
    db.add(db_lesson)
    db.commit()
    db.refresh(db_lesson)
    return db_lesson

@router.delete("/admin/academy/modules/{module_id}", status_code=200)
def delete_module(module_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    db.delete(module)
    db.commit()
    return {"message": "Module deleted successfully"}

@router.delete("/admin/academy/lessons/{lesson_id}", status_code=200)
def delete_lesson(lesson_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    db.delete(lesson)
    db.commit()
    return {"message": "Lesson deleted successfully"}

@router.put("/admin/academy/lessons/{lesson_id}", response_model=schemas.Lesson)
def update_lesson(lesson_id: int, lesson_update: schemas.LessonCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not db_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    for key, value in lesson_update.dict().items():
        setattr(db_lesson, key, value)
    
    db.commit()
    db.refresh(db_lesson)
    return db_lesson

@router.post("/admin/academy/upload", response_model=dict)
def upload_file(file: UploadFile = File(...), current_user: models.User = Depends(auth.get_current_admin_user)):
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)

    # unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"url": f"/uploads/{unique_filename}"}

@router.get("/admin/academy/uploads", response_model=list[str])
def list_uploaded_files(current_user: models.User = Depends(auth.get_current_admin_user)):
    if not os.path.exists(UPLOAD_DIR):
        return []
    
    files = []
    for filename in os.listdir(UPLOAD_DIR):
        if os.path.isfile(os.path.join(UPLOAD_DIR, filename)):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
                files.append(f"/uploads/{filename}")
    
    files.sort(key=lambda x: os.path.getmtime(os.path.join(UPLOAD_DIR, os.path.basename(x))), reverse=True)
    return files

@router.delete("/admin/academy/uploads", status_code=200)
def delete_uploaded_file(filename: str, current_user: models.User = Depends(auth.get_current_admin_user)):
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    try:
        os.remove(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {e}")
        
    return {"message": "File deleted successfully"}
