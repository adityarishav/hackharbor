from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from urllib.parse import quote
import models, schemas, database, auth
import os
import shutil
import uuid
import zipfile
import re

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




@router.post("/admin/academy/modules/{module_id}/lessons/upload-zip", response_model=list[schemas.Lesson])
def upload_lesson_zip(
    module_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    # 1. Verify Module Exists
    module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    # 2. Setup Bundle Directory
    # use a shared bundle directory for this upload to avoid duplicating files for multiple lessons
    bundle_id = str(uuid.uuid4())
    bundle_path = f"static/academy_content/bundles/{bundle_id}"
    
    if not os.path.exists(bundle_path):
        os.makedirs(bundle_path)
    
    zip_path = os.path.join(bundle_path, "upload.zip")
    
    created_lessons = []

    try:
        # Save Zip
        with open(zip_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Extract Zip
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(bundle_path)
        
        os.remove(zip_path) # Remove zip after extraction

        # 3. Find All Markdown Files
        md_files = []
        for root, dirs, files in os.walk(bundle_path):
            for filename in files:
                if filename.lower().endswith('.md'):
                    md_files.append(os.path.join(root, filename))
        
        if not md_files:
            # Cleanup bundle if empty
            shutil.rmtree(bundle_path, ignore_errors=True)
            raise HTTPException(status_code=400, detail="No .md files found in the zip archive.")
        
        # 4. Process Each Markdown File as a Lesson

        for md_path in md_files:
            # Create Lesson in DB
            filename = os.path.basename(md_path)
            lesson_title = os.path.splitext(filename)[0].replace('-', ' ').title()
            
            # Determine order: Append to end
            last_lesson = db.query(models.Lesson).filter(models.Lesson.module_id == module_id).order_by(models.Lesson.order.desc()).first()
            new_order = (last_lesson.order + 1) if last_lesson else 0

            new_lesson = models.Lesson(
                module_id=module_id,
                title=lesson_title,
                content="Processing...",
                order=new_order
            )
            db.add(new_lesson)
            db.commit()
            db.refresh(new_lesson)

            # Read MD Content
            with open(md_path, 'r', encoding='utf-8') as f:
                md_content = f.read()

            # 5. Rewrite Image Paths & Fix Obsidian Links
            
            # Logic to resolve relative path from the MD file to the Bundle Root
            # md_path: static/academy_content/bundles/{id}/subfolder/lesson.md
            # bundle_path: static/academy_content/bundles/{id}
            # relative_dir: subfolder/
            
            rel_dir = os.path.dirname(os.path.relpath(md_path, bundle_path))
            if rel_dir == ".":
                rel_dir = ""
            
            # Helper: Resolve path relative to bundle root
            def get_bundle_relative_url(image_path):
                # Normalize slashes
                image_path = image_path.replace('\\', '/')
                
                # If image path is like "images/pic.png" and markdown is in "sub/", 
                # Real path is "sub/images/pic.png" presumably (relative to MD)
                # OR is it relative to root? Markdown usually implies relative to file.
                
                # Combine relative dir of MD file with image path
                full_rel_path = os.path.join(rel_dir, image_path).replace('\\', '/')
                
                # Encode parts to handle spaces
                # We split by / and quote each part to avoid quoting the separators
                parts = full_rel_path.split('/')
                encoded_path = "/".join(quote(part) for part in parts)
                
                return f"/static/academy_content/bundles/{bundle_id}/{encoded_path}"

            def replace_image_path(match):
                alt_text = match.group(1)
                image_path = match.group(2)
                
                # Ignore absolute URLs
                if image_path.startswith(('http://', 'https://', '/')):
                    return match.group(0)
                
                new_url = get_bundle_relative_url(image_path)
                return f"![{alt_text}]({new_url})"
            
            def replace_obsidian_link(match):
                filename = match.group(1)
                
                if '|' in filename:
                    filename, alias = filename.split('|', 1)
                else:
                    alias = filename

                filename = filename.strip()
                # Obsidian links are often filename only, assuming flat search or relative
                # We'll treat as relative to MD file for now
                new_url = get_bundle_relative_url(filename)
                
                return f"![{alias}]({new_url})"

            # Standard Markdown: ![alt](url)
            processed_content = re.sub(r'!\[(.*?)\]\((.*?)\)', replace_image_path, md_content)
            
            # Obsidian Syntax: ![[filename]]
            processed_content = re.sub(r'!\[\[(.*?)\]\]', replace_obsidian_link, processed_content)

            # Update Lesson
            new_lesson.content = processed_content
            db.commit()
            created_lessons.append(new_lesson)

    except Exception as e:
        # Cleanup Bundle on failure
        shutil.rmtree(bundle_path, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Failed to process zip: {str(e)}")
    
    return created_lessons
