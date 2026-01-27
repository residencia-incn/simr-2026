from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional

from database import get_db
from models import User, RoleProfile
from routers.users import UserListResponse

router = APIRouter()

@router.get("/", response_model=List[UserListResponse])
def get_speakers(db: Session = Depends(get_db)):
    """
    Obtiene todos los usuarios que tienen el rol de 'ponente' ó 'speaker'.
    """
    # Usamos la misma lógica que en users.py pero forzando el rol
    role = "ponente"
    
    # query = db.query(User).filter(User.status != "deleted")
    # filter_expression = text(f"roles @> '[\"{role}\"]'")
    # query = query.filter(
    #     (User.eventRole == role) | 
    #     (filter_expression)
    # )
    
    # Or to be safe and include English/Spanish variations if needed
    # But sticking to 'ponente' as per architecture
    
    query = db.query(User).filter(User.status != "deleted")
    
    # Check for both 'ponente' and 'speaker' just in case
    filter_expr = text("roles @> '[\"ponente\"]' OR roles @> '[\"speaker\"]'")
    
    query = query.filter(
        (User.eventRole == "ponente") | 
        (User.eventRole == "speaker") |
        (filter_expr)
    )
    
    users = query.order_by(User.name).all()
    
    # Reuse UserListResponse logic (simplified mapping)
    results = []
    for u in users:
        roles_list = u.roles if (u.roles and len(u.roles) > 0) else ([u.eventRole] if u.eventRole else ["participante"])
        
        user_dict = {
            "id": u.id,
            "email": u.email,
            "dni": u.dni,
            "name": u.name,
            "firstName": u.firstName,
            "lastName": u.lastName,
            "eventRole": u.eventRole,
            "isActive": u.status != 'inactive', 
            "organizerFunction": u.organizerFunction,
            "hasPaid": u.hasPaid,
            "created_at": u.registrationDate,
            "registrationDate": u.registrationDate,
            "specialty": u.specialty,
            "occupation": u.occupation,
            "phone": u.phone,
            "eventRoles": roles_list,
            "roles": u.roles or [],
            "modalityName": u.registrationType or "Presencial" # Simplified
        }
        results.append(user_dict)
        
    return results
