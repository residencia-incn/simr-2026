from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class RubricCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = None
    work_types: List[str]
    max_score: float = Field(20.0, ge=0, le=100)

class RubricResponse(RubricCreate):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True

class JuryAssignRequest(BaseModel):
    work_id: str
    jury_user_id: str

class EvaluationItem(BaseModel):
    rubric_id: int
    score: float

class EvaluationBulkCreate(BaseModel):
    scores: List[EvaluationItem]
    comment: Optional[str] = None

class SpeakerCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    dni: str
    specialty: Optional[str] = None
    occupation: Optional[str] = None
    institution: Optional[str] = None
    cmp: Optional[str] = None
    rne: Optional[str] = None
    residency_year: Optional[str] = None
    country: Optional[str] = "Perú"
    is_international: bool = False

class SpeakerLectureBase(BaseModel):
    title: str = Field(..., min_length=3)
    specialty: Optional[str] = None

class SpeakerLectureCreate(SpeakerLectureBase):
    pass

class SpeakerLectureResponse(SpeakerLectureBase):
    id: int
    speaker_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class AcademicSettingBase(BaseModel):
    key: str
    value: str

class AcademicSettingResponse(AcademicSettingBase):
    class Config:
        from_attributes = True
