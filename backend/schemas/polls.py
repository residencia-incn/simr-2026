from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from models import PollType, PollStatus

class PollOptionBase(BaseModel):
    text: str
    color: Optional[str] = "blue"

class PollOptionCreate(PollOptionBase):
    pass

class PollOptionOut(PollOptionBase):
    id: int
    poll_id: int

    class Config:
        from_attributes = True

class PollBase(BaseModel):
    title: str
    poll_type: PollType = PollType.MULTIPLE_CHOICE

class PollCreate(PollBase):
    options: List[PollOptionCreate]

class PollOut(PollBase):
    id: int
    meeting_id: int
    status: PollStatus
    created_at: datetime
    launched_at: Optional[datetime] = None
    options: List[PollOptionOut]

    class Config:
        from_attributes = True

# Para resultados en tiempo real
class PollOptionResult(PollOptionOut):
    vote_count: int = 0
    percentage: float = 0.0

class PollResult(BaseModel):
    id: int
    title: str
    status: PollStatus
    total_votes: int = 0
    options: List[PollOptionResult]
    my_vote_option_id: Optional[int] = None
    launched_at: Optional[datetime] = None
