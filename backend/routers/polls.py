from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db, SessionLocal
import models, oauth2
from schemas import polls as schemas_polls
from socket_manager import manager
from datetime import datetime
from typing import List
import asyncio

router = APIRouter(prefix="/polls", tags=["Encuestas Real-Time"])

@router.post("/meetings/{meeting_id}", response_model=schemas_polls.PollOut)
def create_poll(meeting_id: int, payload: schemas_polls.PollCreate, db: Session = Depends(get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    # Verificar que la reunión existe
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Reunión no encontrada")

    new_poll = models.Poll(
        meeting_id=meeting_id,
        title=payload.title,
        poll_type=payload.poll_type,
        status=models.PollStatus.DRAFT
    )
    db.add(new_poll)
    db.commit()
    db.refresh(new_poll)

    # Crear opciones
    for opt in payload.options:
        new_opt = models.PollOption(
            poll_id=new_poll.id,
            text=opt.text,
            color=opt.color
        )
        db.add(new_opt)
    
    db.commit()
    db.refresh(new_poll)
    return new_poll

@router.get("/meetings/{meeting_id}", response_model=List[schemas_polls.PollOut])
def list_polls(meeting_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    return db.query(models.Poll).filter(models.Poll.meeting_id == meeting_id).all()

@router.delete("/{poll_id}")
def delete_poll(poll_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    poll = db.query(models.Poll).filter(models.Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")
    db.delete(poll)
    db.commit()
    return {"msg": "Encuesta eliminada"}


def _get_poll_results_data(poll, db: Session):
    # Contar votos totales
    total_votes = db.query(func.count(models.PollVote.id)).filter(models.PollVote.poll_id == poll.id).scalar()

    # Obtener conteo por opción
    options_with_votes = []
    for opt in poll.options:
        vote_count = db.query(func.count(models.PollVote.id)).filter(models.PollVote.option_id == opt.id).scalar()
        percentage = (vote_count / total_votes * 100) if total_votes > 0 else 0
        options_with_votes.append({
            "id": opt.id,
            "text": opt.text,
            "color": opt.color,
            "poll_id": opt.poll_id,
            "vote_count": vote_count,
            "percentage": round(percentage, 1)
        })
    
    return {
        "id": poll.id,
        "title": poll.title,
        "status": poll.status,
        "total_votes": total_votes,
        "options": options_with_votes,
        "launched_at": poll.launched_at.isoformat() if poll.launched_at else None
    }

@router.get("/{poll_id}/results", response_model=schemas_polls.PollResult)
def get_poll_results(poll_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    poll = db.query(models.Poll).filter(models.Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    data = _get_poll_results_data(poll, db)
    
    # Saber si el usuario actual ya votó
    my_vote = db.query(models.PollVote).filter(
        models.PollVote.poll_id == poll_id, 
        models.PollVote.user_id == current_user.id
    ).first()

    data["my_vote_option_id"] = my_vote.option_id if my_vote else None
    return data

@router.put("/{poll_id}/launch")
async def launch_poll(
    poll_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(oauth2.get_current_user)
):
    poll = db.query(models.Poll).filter(models.Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")
    
    poll.status = models.PollStatus.ACTIVE
    poll.launched_at = datetime.now()
    db.commit()

    # 🔥 WebSocket Broadcast para notificación inmediata
    await manager.broadcast_to_meeting(poll.meeting_id, {
        "type": "POLL_LAUNCHED",
        "poll_id": poll.id,
        "title": poll.title,
        "options": [{"id": o.id, "text": o.text, "color": o.color} for o in poll.options]
    })

    return {"msg": "Encuesta lanzada correctamente"}

@router.put("/{poll_id}/close")
async def close_poll(poll_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    poll = db.query(models.Poll).filter(models.Poll.id == poll_id).first()
    if not poll or poll.status != models.PollStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="La encuesta no está activa")
    
    poll.status = models.PollStatus.CLOSED
    db.commit()

    # 🔥 WebSocket Broadcast
    await manager.broadcast_to_meeting(poll.meeting_id, {
        "type": "POLL_CLOSED",
        "poll_id": poll.id
    })

    return {"msg": "Encuesta cerrada"}

class VoteCreate(BaseModel):
    option_id: int

@router.post("/{poll_id}/vote")
async def cast_vote(
    poll_id: int, 
    payload: VoteCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(oauth2.get_current_user)
):
    poll = db.query(models.Poll).filter(models.Poll.id == poll_id).first()
    if not poll or poll.status != models.PollStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="La encuesta no está activa")

    # Verificar si la opción pertenece a la encuesta
    option = db.query(models.PollOption).filter(
        models.PollOption.id == payload.option_id, 
        models.PollOption.poll_id == poll_id
    ).first()
    if not option:
        raise HTTPException(status_code=404, detail="Opción no válida")

    # Verificar voto duplicado
    existing_vote = db.query(models.PollVote).filter(
        models.PollVote.poll_id == poll_id,
        models.PollVote.user_id == current_user.id
    ).first()
    if existing_vote:
        raise HTTPException(status_code=400, detail="Ya has votado en esta encuesta")

    new_vote = models.PollVote(
        poll_id=poll_id,
        option_id=option.id,
        user_id=current_user.id
    )
    db.add(new_vote)
    db.flush() # Empujar cambios a la DB sin cerrar transacción aún
    db.commit()
    db.refresh(poll) # Asegurar que tenemos la info más reciente
    db.refresh(new_vote)
    
    # [NUEVO] Forzar recarga de relaciones para evitar caché de SQLAlchemy
    db.expire_all() 

    # [NUEVO] Obtener resultados actualizados para el broadcast
    results_data = _get_poll_results_data(poll, db)
    print(f"📣 Broadcasting VOTE_UPDATE for Poll {poll.id}: {results_data['total_votes']} total votes")

    # 🔥 WebSocket: Notificar cambio de resultados con datos reales
    await manager.broadcast_to_meeting(poll.meeting_id, {
        "type": "VOTE_UPDATE",
        "poll_id": poll.id,
        "results": results_data
    })

    return {"msg": "Voto registrado con éxito"}

# --- WEBSOCKET ENDPOINT ---
# --- WEBSOCKET ENDPOINT ---
@router.websocket("/ws/{meeting_id}")
async def websocket_endpoint(websocket: WebSocket, meeting_id: int):
    # Autenticación por token en query param (ws://.../ws/123?token=xyz)
    token = websocket.query_params.get("token")
    
    # Manejo manual de DB dentro del WS usando SessionLocal para controlar el ciclo de vida
    db = SessionLocal()
    user = None
    
    try:
        if not token:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        user = oauth2.get_current_user_by_token(token, db)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
            
    finally:
        # IMPORTANTE: Cerrar la sesión SIEMPRE después de la validación
        # No necesitamos la DB abierta durante todo el ciclo de vida del WebSocket
        db.close()

    if user:
        await manager.connect(websocket, meeting_id)
        try:
            while True:
                # Mantener conexión abierta y responder a PINGS si el cliente envía algo
                data = await websocket.receive_text()
                if data == "PONG":
                    continue # Latido recibido
        except WebSocketDisconnect:
            print(f"🔌 Cliente WS desconectado (Normal) - Meeting {meeting_id}")
            manager.disconnect(websocket, meeting_id)
        except Exception as e:
            print(f"❌ Error WS inesperado en {meeting_id}: {e}")
            manager.disconnect(websocket, meeting_id)
