from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import CommitteeMember, Committee, User
from schemas import (
    CommitteeMemberCreate, CommitteeMemberUpdate, CommitteeMemberPublic,
    CommitteeCreate, CommitteeUpdate, CommitteeOut
)

router = APIRouter()

# -----------------------------------------------------------------------------
# 0. GESTIÓN DE GRUPOS (COMITÉS) - NUEVO
# -----------------------------------------------------------------------------

@router.get("/groups", response_model=List[CommitteeOut])
def get_groups(db: Session = Depends(get_db)):
    return db.query(Committee).order_by(Committee.order.asc()).all()

@router.post("/groups", response_model=CommitteeOut)
def create_group(group: CommitteeCreate, db: Session = Depends(get_db)):
    new_group = Committee(**group.model_dump())
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    return new_group

@router.put("/groups/{id}", response_model=CommitteeOut)
def update_group(id: int, group: CommitteeUpdate, db: Session = Depends(get_db)):
    db_group = db.query(Committee).filter(Committee.id == id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    
    update_data = group.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_group, key, value)
    
    db.commit()
    db.refresh(db_group)
    return db_group

@router.delete("/groups/{id}")
def delete_group(id: int, db: Session = Depends(get_db)):
    db_group = db.query(Committee).filter(Committee.id == id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    
    db.delete(db_group)
    db.commit()
    return {"message": "Grupo eliminado"}

# -----------------------------------------------------------------------------
# 1. VISTA PÚBLICA (GET /)
# -----------------------------------------------------------------------------
@router.get("/", response_model=List[CommitteeMemberPublic])
def get_committee_public(db: Session = Depends(get_db)):
    """
    Obtiene lista ordenada por prioridad para la web pública.
    Ahora incluye la relación con 'committee'.
    """
    # Unirse con Committee para ordenar primero por orden de grupo, luego por prioridad de miembro
    members = db.query(CommitteeMember).join(Committee)\
                .filter(CommitteeMember.isActive == True)\
                .order_by(Committee.order.asc(), CommitteeMember.priority.asc())\
                .all()
    
    result = []
    for m in members:
        if not m.user:
            continue
            
        # Inyectar atributos computados para Pydantic
        m.fullName = f"{m.user.firstName or ''} {m.user.lastName or ''}".strip() or m.user.name or "Usuario"
        m.photoUrl = m.user.image
        
        result.append(m)
        
    return result

# -----------------------------------------------------------------------------
# 2. LISTA DE CANDIDATOS (Para el Select del Admin)
# -----------------------------------------------------------------------------
@router.get("/candidates")
def get_candidates(db: Session = Depends(get_db)):
    """
    Retorna TODOS los usuarios activos que NO están ya en el comité.
    Se relajó el filtro de rol 'organizador' para permitir cualquier usuario.
    """
    occupied_ids = [m.user_id for m in db.query(CommitteeMember).all()]
    
    # Filtrar solo usuarios no eliminados y limitar resultados para seguridad
    all_users = db.query(User).filter(User.status != "deleted").limit(2000).all() 
    
    candidates = []
    for user in all_users:
        if user.id not in occupied_ids:
            candidates.append({
                "id": user.id,
                "name": f"{user.firstName or ''} {user.lastName or ''} ({user.dni or 'S/D'})".strip() or user.name,
                "role": user.eventRole or "Usuario"
            })
            
    return candidates

# -----------------------------------------------------------------------------
# 3. GESTIÓN ADMIN (Crear, Borrar)
# -----------------------------------------------------------------------------
@router.post("/", response_model=CommitteeMemberPublic) 
def add_member(payload: CommitteeMemberCreate, db: Session = Depends(get_db)):
    existing = db.query(CommitteeMember).filter(CommitteeMember.user_id == payload.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Este usuario ya es miembro del comité.")

    new_member = CommitteeMember(**payload.model_dump())
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    
    # Inyectar helpers para respuesta inmediata
    if new_member.user:
        new_member.fullName = f"{new_member.user.firstName or ''} {new_member.user.lastName or ''}".strip()
        new_member.photoUrl = new_member.user.image
    
    return new_member

@router.delete("/{id}")
def remove_member(id: int, db: Session = Depends(get_db)):
    member = db.query(CommitteeMember).filter(CommitteeMember.id == id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    
    db.delete(member)
    db.commit()
    return {"message": "Miembro eliminado"}
