from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import EventRoadmap
from schemas.roadmap import Roadmap, RoadmapCreate, RoadmapUpdate
import uuid

router = APIRouter(
    prefix="/roadmap",
    tags=["Roadmap"]
)

@router.get("/", response_model=List[Roadmap])
def get_roadmap(db: Session = Depends(get_db)):
    # Filtrar por isActive y ordenar por el campo 'order'
    return db.query(EventRoadmap).filter(EventRoadmap.isActive == True).order_by(EventRoadmap.order.asc()).all()

@router.post("/", response_model=Roadmap)
def create_event(event: RoadmapCreate, db: Session = Depends(get_db)):
    new_id = f"ev-{uuid.uuid4().hex[:6]}"
    # Usamos model_dump() (Pydantic v2)
    db_event = EventRoadmap(
        id=new_id,
        **event.model_dump()
    )
    # Por compatibilidad con campos antiguos si no vienen
    if not db_event.date:
        db_event.date = db_event.sort_date
        
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.put("/{event_id}", response_model=Roadmap)
def update_event(event_id: str, event: RoadmapUpdate, db: Session = Depends(get_db)):
    db_event = db.query(EventRoadmap).filter(EventRoadmap.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    update_data = event.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_event, key, value)
    
    # Sincronizar date antiguo si cambia sort_date
    if 'sort_date' in update_data:
        db_event.date = db_event.sort_date
        
    db.commit()
    db.refresh(db_event)
    return db_event

@router.delete("/{event_id}")
def delete_event(event_id: str, db: Session = Depends(get_db)):
    db_event = db.query(EventRoadmap).filter(EventRoadmap.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Soft Delete como fue solicitado
    db_event.isActive = False
    db.commit()
    return {"status": "success", "message": "Item eliminado (Soft Delete)"}
