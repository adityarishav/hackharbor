from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, database, auth, schemas

router = APIRouter()

# --- Announcements ---

@router.get("/announcements/", response_model=list[schemas.Announcement])
def read_announcements(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    announcements = db.query(models.Announcement).order_by(models.Announcement.created_at.desc()).offset(skip).limit(limit).all()
    return announcements

@router.post("/admin/announcements/", response_model=schemas.Announcement)
def create_announcement(announcement: schemas.AnnouncementCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_announcement = models.Announcement(**announcement.dict())
    db.add(db_announcement)
    db.commit()
    db.refresh(db_announcement)
    return db_announcement

@router.delete("/admin/announcements/{announcement_id}", status_code=200)
def delete_announcement(announcement_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_announcement = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if not db_announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    db.delete(db_announcement)
    db.commit()
    return {"message": "Announcement deleted successfully"}

# --- Events ---

@router.get("/events/", response_model=list[schemas.Event])
def read_events(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    events = db.query(models.Event).order_by(models.Event.start_date.asc()).offset(skip).limit(limit).all()
    return events

@router.post("/admin/events/", response_model=schemas.Event)
def create_event(event: schemas.EventCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_event = models.Event(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.delete("/admin/events/{event_id}", status_code=200)
def delete_event(event_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(db_event)
    db.commit()
    return {"message": "Event deleted successfully"}
